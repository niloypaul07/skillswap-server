import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, Db, ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

dotenv.config();

const app = express();
const MONGODB_URI = process.env.MONGODB_URI || "";
const JWT_SECRET = process.env.JWT_SECRET || "skillswap_secret_key";

// ─── MongoDB Connection (cached for serverless) ───────────────────────────────
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

async function connectDB(): Promise<Db> {
  if (cachedDb) return cachedDb;
  if (!MONGODB_URI) throw new Error("MONGODB_URI environment variable is not set");
  const client = new MongoClient(MONGODB_URI, {
    connectTimeoutMS: 5000,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 8000,
  });
  await client.connect();
  cachedClient = client;
  cachedDb = client.db("skillswapDB");
  return cachedDb;
}

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], allowedHeaders: ["Content-Type", "Authorization"] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (_req: any, res: any) => res.json({ status: "OK", timestamp: new Date() }));

app.get("/api/debug", (_req: any, res: any) => res.json({
  MONGODB_URI_set: !!process.env.MONGODB_URI,
  JWT_SECRET_set: !!process.env.JWT_SECRET,
  NODE_ENV: process.env.NODE_ENV,
  uri_prefix: process.env.MONGODB_URI?.substring(0, 25) || "NOT SET",
}));

// DB injection middleware
app.use(async (req: any, res: any, next: any) => {
  try {
    req.db = await connectDB();
    next();
  } catch (err: any) {
    res.status(500).json({ message: "Database connection failed", error: err.message, uri_set: !!process.env.MONGODB_URI });
  }
});

// Auth middleware
function auth(req: any, res: any, next: any) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ message: "No token" });
  try {
    req.user = jwt.verify(header.split(" ")[1], JWT_SECRET) as any;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}

// Register
app.post("/api/auth/register", async (req: any, res: any) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "All fields required" });
    const db: Db = req.db;
    const existing = await db.collection("users").findOne({ email });
    if (existing) return res.status(409).json({ message: "Email already registered" });
    const hashed = await bcrypt.hash(password, 10);
    const result = await db.collection("users").insertOne({ name, email, password: hashed, createdAt: new Date() });
    const user = { id: result.insertedId.toString(), name, email };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ token, user });
  } catch (err: any) {
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
});

// Login
app.post("/api/auth/login", async (req: any, res: any) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });
    const db: Db = req.db;
    const dbUser = await db.collection("users").findOne({ email });
    if (!dbUser) return res.status(401).json({ message: "Invalid credentials" });
    const isMatch = await bcrypt.compare(password, dbUser.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });
    const user = { id: dbUser._id.toString(), name: dbUser.name, email: dbUser.email };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user });
  } catch (err: any) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
});

// Me
app.get("/api/auth/me", auth, async (req: any, res: any) => {
  try {
    const db: Db = req.db;
    const user = await db.collection("users").findOne({ _id: new ObjectId(req.user.id) });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ id: user._id.toString(), name: user.name, email: user.email });
  } catch (err: any) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});

// Get skills
app.get("/api/skills", async (req: any, res: any) => {
  try {
    const db: Db = req.db;
    const { search, category, level, location, sortBy = "createdAt", order = "desc", page = "1", limit = "8" } = req.query;
    const query: any = {};
    if (search) query.$or = [{ title: { $regex: search, $options: "i" } }, { shortDescription: { $regex: search, $options: "i" } }];
    if (category) query.category = category;
    if (level) query.level = level;
    if (location) query.location = location;
    const sortDir = order === "asc" ? 1 : -1;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;
    const total = await db.collection("skills").countDocuments(query);
    const skills = await db.collection("skills").find(query).sort({ [sortBy as string]: sortDir }).skip(skip).limit(limitNum).toArray();
    res.json({ skills, pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum) } });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to fetch skills", error: err.message });
  }
});

// My skills
app.get("/api/skills/my-skills", auth, async (req: any, res: any) => {
  try {
    const db: Db = req.db;
    const skills = await db.collection("skills").find({ ownerId: req.user.id }).sort({ createdAt: -1 }).toArray();
    res.json(skills);
  } catch (err: any) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});

// Get single skill
app.get("/api/skills/:id", async (req: any, res: any) => {
  try {
    const db: Db = req.db;
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid ID" });
    const skill = await db.collection("skills").findOne({ _id: new ObjectId(req.params.id) });
    if (!skill) return res.status(404).json({ message: "Skill not found" });
    res.json(skill);
  } catch (err: any) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});

// Create skill
app.post("/api/skills", auth, async (req: any, res: any) => {
  try {
    const db: Db = req.db;
    const { title, shortDescription, description, category, price, level, location, imageUrl, specs } = req.body;
    if (!title || !shortDescription || !description || !price) return res.status(400).json({ message: "Required fields missing" });
    const skill = {
      title, shortDescription, description, category,
      price: parseFloat(price),
      level: level || "Beginner",
      location: location || "Online",
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600",
      specs: specs || {},
      ownerId: req.user.id,
      ownerName: req.user.name,
      rating: 4.5, reviewsCount: 0,
      createdAt: new Date(), updatedAt: new Date(),
    };
    const result = await db.collection("skills").insertOne(skill);
    res.status(201).json({ message: "Skill created", skill: { _id: result.insertedId, ...skill } });
  } catch (err: any) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});

// Update skill
app.put("/api/skills/:id", auth, async (req: any, res: any) => {
  try {
    const db: Db = req.db;
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid ID" });
    const existing = await db.collection("skills").findOne({ _id: new ObjectId(req.params.id) });
    if (!existing) return res.status(404).json({ message: "Skill not found" });
    if (existing.ownerId !== req.user.id) return res.status(403).json({ message: "Not authorized" });
    const { title, shortDescription, description, category, price, level, location, imageUrl, specs } = req.body;
    const updated = { title, shortDescription, description, category, price: parseFloat(price), level, location, imageUrl: imageUrl || existing.imageUrl, specs: specs || existing.specs, updatedAt: new Date() };
    await db.collection("skills").updateOne({ _id: new ObjectId(req.params.id) }, { $set: updated });
    const { _id: _eid, ...rest } = existing;
    res.json({ message: "Skill updated", skill: { _id: req.params.id, ...rest, ...updated } });
  } catch (err: any) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});

// Delete skill
app.delete("/api/skills/:id", auth, async (req: any, res: any) => {
  try {
    const db: Db = req.db;
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid ID" });
    const existing = await db.collection("skills").findOne({ _id: new ObjectId(req.params.id) });
    if (!existing) return res.status(404).json({ message: "Skill not found" });
    if (existing.ownerId !== req.user.id) return res.status(403).json({ message: "Not authorized" });
    await db.collection("skills").deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: "Skill deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});

// ─── Debug Catch-all ──────────────────────────────────────────────────────
app.all("*", (req, res) => {
  res.status(404).json({ message: "Express Catch-All", requestedUrl: req.url, originalUrl: req.originalUrl, method: req.method });
});

// ─── Export for Vercel ────────────────────────────────────────────────────────
export default app;

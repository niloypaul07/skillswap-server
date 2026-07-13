import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, Db } from "mongodb";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "";
const JWT_SECRET = process.env.JWT_SECRET || "skillswap_secret_key";

// ─── MongoDB Connection (cached for serverless) ──────────────────────────────
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

async function connectDB(): Promise<Db> {
  if (cachedDb) return cachedDb;
  if (!MONGODB_URI) throw new Error("MONGODB_URI environment variable is not set");
  const client = new MongoClient(MONGODB_URI, {
    connectTimeoutMS: 15000,
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 30000,
  });
  await client.connect();
  cachedClient = client;
  cachedDb = client.db("skillswap");
  console.log("MongoDB connected successfully");
  return cachedDb;
}

// ─── Express Middleware ───────────────────────────────────────────────────────
app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], allowedHeaders: ["Content-Type", "Authorization"] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inject DB into every request
app.use(async (req: any, res, next) => {
  try {
    req.db = await connectDB();
    next();
  } catch (err: any) {
    console.error("DB Error:", err.message);
    res.status(500).json({ message: "Database connection failed", error: err.message });
  }
});

// ─── Auth Middleware ──────────────────────────────────────────────────────────
function authMiddleware(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ message: "No token provided" });
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; name: string };
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => res.json({ status: "OK", timestamp: new Date() }));

// ─── AUTH ROUTES ──────────────────────────────────────────────────────────────
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
    console.error("Register error:", err);
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
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed", error: err.message });
  }
});

// Get current user
app.get("/api/auth/me", authMiddleware, async (req: any, res: any) => {
  try {
    const db: Db = req.db;
    const user = await db.collection("users").findOne({ _id: new ObjectId(req.user.id) });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ id: user._id.toString(), name: user.name, email: user.email });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to fetch user", error: err.message });
  }
});

// ─── SKILLS ROUTES ────────────────────────────────────────────────────────────
// Get all skills (search, filter, sort, paginate)
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
    const sortField = sortBy as string;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await db.collection("skills").countDocuments(query);
    const skills = await db.collection("skills").find(query).sort({ [sortField]: sortDir }).skip(skip).limit(limitNum).toArray();

    res.json({ skills, pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum) } });
  } catch (err: any) {
    console.error("Get skills error:", err);
    res.status(500).json({ message: "Failed to fetch skills", error: err.message });
  }
});

// Get my skills
app.get("/api/skills/my-skills", authMiddleware, async (req: any, res: any) => {
  try {
    const db: Db = req.db;
    const skills = await db.collection("skills").find({ ownerId: req.user.id }).sort({ createdAt: -1 }).toArray();
    res.json(skills);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to fetch your skills", error: err.message });
  }
});

// Get single skill
app.get("/api/skills/:id", async (req: any, res: any) => {
  try {
    const db: Db = req.db;
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid skill ID" });
    const skill = await db.collection("skills").findOne({ _id: new ObjectId(req.params.id) });
    if (!skill) return res.status(404).json({ message: "Skill not found" });
    res.json(skill);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to fetch skill", error: err.message });
  }
});

// Create skill
app.post("/api/skills", authMiddleware, async (req: any, res: any) => {
  try {
    const db: Db = req.db;
    const { title, shortDescription, description, category, price, level, location, imageUrl, specs } = req.body;
    if (!title || !shortDescription || !description || !price) return res.status(400).json({ message: "Required fields missing" });

    const skill = {
      title, shortDescription, description, category, price: parseFloat(price),
      level: level || "Beginner", location: location || "Online",
      imageUrl: imageUrl || `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600`,
      specs: specs || {}, ownerId: req.user.id, ownerName: req.user.name,
      rating: 4.5, reviewsCount: 0, createdAt: new Date(), updatedAt: new Date(),
    };

    const result = await db.collection("skills").insertOne(skill);
    res.status(201).json({ message: "Skill created", skill: { _id: result.insertedId, ...skill } });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to create skill", error: err.message });
  }
});

// Update skill
app.put("/api/skills/:id", authMiddleware, async (req: any, res: any) => {
  try {
    const db: Db = req.db;
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid ID" });
    const existing = await db.collection("skills").findOne({ _id: new ObjectId(req.params.id) });
    if (!existing) return res.status(404).json({ message: "Skill not found" });
    if (existing.ownerId !== req.user.id) return res.status(403).json({ message: "Not authorized" });

    const { title, shortDescription, description, category, price, level, location, imageUrl, specs } = req.body;
    const updated = { title, shortDescription, description, category, price: parseFloat(price), level, location, imageUrl: imageUrl || existing.imageUrl, specs: specs || existing.specs, updatedAt: new Date() };

    await db.collection("skills").updateOne({ _id: new ObjectId(req.params.id) }, { $set: updated });
    const { _id: _eid, ...existingRest } = existing;
    res.json({ message: "Skill updated", skill: { _id: req.params.id, ...existingRest, ...updated } });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to update skill", error: err.message });
  }
});

// Delete skill
app.delete("/api/skills/:id", authMiddleware, async (req: any, res: any) => {
  try {
    const db: Db = req.db;
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid ID" });
    const existing = await db.collection("skills").findOne({ _id: new ObjectId(req.params.id) });
    if (!existing) return res.status(404).json({ message: "Skill not found" });
    if (existing.ownerId !== req.user.id) return res.status(403).json({ message: "Not authorized" });

    await db.collection("skills").deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: "Skill deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to delete skill", error: err.message });
  }
});

// ─── Start Server (local dev only) ───────────────────────────────────────────
if (process.env.VERCEL !== "1") {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;

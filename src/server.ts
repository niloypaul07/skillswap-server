import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import authRoutes from "./routes/auth";
import skillsRoutes from "./routes/skills";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to DB immediately
connectDB().catch(err => console.error("Database connection failed:", err));

// Middleware
app.use(cors({
  origin: "*", // In production, replace with specific origins
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check API
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date() });
});

// Register Routes
app.use("/api/auth", authRoutes);
app.use("/api/skills", skillsRoutes);

// Only listen if not running on Vercel serverless environment
if (process.env.VERCEL !== "1") {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;

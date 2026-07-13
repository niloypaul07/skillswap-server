import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";

const app = express();

app.get("/api/health", (_req, res) => {
  res.json({ status: "OK", express: "loaded", timestamp: new Date() });
});

app.get("/api/debug", (_req, res) => {
  res.json({
    MONGODB_URI_set: !!process.env.MONGODB_URI,
    JWT_SECRET_set: !!process.env.JWT_SECRET,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
  });
});

export default app;

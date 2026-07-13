import dns from "dns";
import { MongoClient, Db, ServerApiVersion } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

// Windows/router DNS often fails SRV lookups for mongodb+srv:// — use public DNS
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/skillswap";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  family: 4,
  connectTimeoutMS: 30000,
  serverSelectionTimeoutMS: 30000,
});

let db: Db;

export async function connectDB(): Promise<Db> {
  if (db) return db;
  try {
    await client.connect();
    console.log("Connected to MongoDB successfully!");
    db = client.db();
    return db;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
}

export function getDB(): Db {
  if (!db) {
    throw new Error("Database not initialized. Call connectDB first.");
  }
  return db;
}

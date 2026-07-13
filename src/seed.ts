import { connectDB } from "./config/db";
import bcrypt from "bcryptjs";

const sampleSkills = [
  {
    title: "Mastering Next.js & TypeScript",
    shortDescription: "Learn to build high-performance, SEO-friendly React apps with Next.js App Router and TypeScript.",
    description: "Go from beginner to advanced with Next.js 15. We will cover server components, client components, API routes, Server Actions, middleware, state management, and deploying to Vercel. Ideal for web developers wanting to upgrade their skills.",
    category: "Programming",
    price: 45.0,
    level: "Expert",
    location: "Online",
    imageUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=60",
    specs: {
      duration: "12 Hours",
      language: "English",
      format: "1-on-1 Mentorship",
      prerequisites: "Basic React and JavaScript knowledge"
    },
    rating: 4.9,
    reviewsCount: 24,
    ownerId: "seed_owner_1",
    ownerName: "Sarah Jenkins",
    ownerEmail: "sarah.j@example.com",
    createdAt: new Date()
  },
  {
    title: "Conversational Spanish Fluency",
    shortDescription: "Interactive Spanish speaking and pronunciation practice for beginners to intermediate learners.",
    description: "Accelerate your Spanish speaking capabilities. We focus on real-world conversations, practical vocabulary, pronunciation drills, and confidence building. Sessions are highly conversational and tailored to your goals.",
    category: "Languages",
    price: 25.0,
    level: "Beginner",
    location: "Online",
    imageUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=60",
    specs: {
      duration: "8 Hours",
      language: "Spanish / English",
      format: "Interactive Speaking Sessions",
      prerequisites: "None"
    },
    rating: 4.8,
    reviewsCount: 15,
    ownerId: "seed_owner_2",
    ownerName: "Carlos Ramirez",
    ownerEmail: "carlos.r@example.com",
    createdAt: new Date()
  },
  {
    title: "Classical Guitar for Beginners",
    shortDescription: "Learn basic chords, fingerpicking, and classical music notation from scratch.",
    description: "Unlock your musical potential. This course covers guitar tuning, basic hand positions, fingerstyle techniques, reading music notation, and playing simple classical pieces. By the end, you'll be comfortable playing 5 full songs.",
    category: "Music",
    price: 35.0,
    level: "Beginner",
    location: "In-Person",
    imageUrl: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&auto=format&fit=crop&q=60",
    specs: {
      duration: "10 Hours",
      language: "English",
      format: "In-Person Private Studio",
      prerequisites: "Must have your own acoustic/classical guitar"
    },
    rating: 4.7,
    reviewsCount: 18,
    ownerId: "seed_owner_3",
    ownerName: "David Miller",
    ownerEmail: "david.m@example.com",
    createdAt: new Date()
  },
  {
    title: "Hatha Yoga & Mindfulness Practice",
    shortDescription: "Improve flexibility, strength, and inner peace with structured Hatha yoga sessions.",
    description: "A restorative yoga class combining physical postures (asanas), breathing techniques (pranayama), and meditation. Perfect for stress reduction, developing core strength, and cultivating mindfulness in everyday life.",
    category: "Fitness",
    price: 30.0,
    level: "Intermediate",
    location: "In-Person",
    imageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=60",
    specs: {
      duration: "6 Hours",
      language: "English",
      format: "Outdoor / Studio Group Session",
      prerequisites: "Yoga mat and comfortable clothing"
    },
    rating: 4.9,
    reviewsCount: 32,
    ownerId: "seed_owner_4",
    ownerName: "Emily Watson",
    ownerEmail: "emily.w@example.com",
    createdAt: new Date()
  },
  {
    title: "Financial Planning & Investing 101",
    shortDescription: "Build a personalized wealth-building plan, understand index funds, and budget effectively.",
    description: "Take control of your personal finances. Learn about budgeting frameworks, high-yield savings accounts, compound interest, tax-advantaged retirement accounts, index fund investing, and risk mitigation strategies.",
    category: "Business",
    price: 50.0,
    level: "Intermediate",
    location: "Online",
    imageUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&auto=format&fit=crop&q=60",
    specs: {
      duration: "5 Hours",
      language: "English",
      format: "Interactive Workshops",
      prerequisites: "Basic math and interest in personal finance"
    },
    rating: 4.9,
    reviewsCount: 41,
    ownerId: "seed_owner_5",
    ownerName: "Marcus Vance",
    ownerEmail: "marcus.v@example.com",
    createdAt: new Date()
  },
  {
    title: "UI/UX Design in Figma",
    shortDescription: "Create modern, responsive interfaces, wireframes, and interactive prototypes.",
    description: "Learn Figma from scratch. We cover vector grids, layout constraints, auto-layout, component libraries, typography, design systems, interactive prototypes, and developer handoff guidelines. Includes 3 hands-on UI projects.",
    category: "Design",
    price: 40.0,
    level: "Intermediate",
    location: "Online",
    imageUrl: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&auto=format&fit=crop&q=60",
    specs: {
      duration: "10 Hours",
      language: "English",
      format: "Figma Live Sharing Sessions",
      prerequisites: "Figma Free Account installed"
    },
    rating: 4.8,
    reviewsCount: 29,
    ownerId: "seed_owner_6",
    ownerName: "Jessica Lin",
    ownerEmail: "jessica.l@example.com",
    createdAt: new Date()
  },
  {
    title: "Gourmet French Pastry & Baking",
    shortDescription: "Master the art of croissants, macarons, and choux pastry in an interactive kitchen class.",
    description: "Learn professional French pastry techniques. This hands-on cooking class teaches you how to laminate dough for flaky croissants, make stable meringue for perfect macarons, and bake classic eclairs with creme patissiere.",
    category: "Cooking",
    price: 60.0,
    level: "Expert",
    location: "In-Person",
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=60",
    specs: {
      duration: "4 Hours",
      language: "English / French",
      format: "Kitchen Workshop",
      prerequisites: "Basic kitchen safety skills"
    },
    rating: 5.0,
    reviewsCount: 12,
    ownerId: "seed_owner_7",
    ownerName: "Pierre Dubois",
    ownerEmail: "pierre.d@example.com",
    createdAt: new Date()
  },
  {
    title: "Introduction to Python Programming",
    shortDescription: "Master Python fundamentals: syntax, data structures, loops, and file operations.",
    description: "Get started with coding. Python is the most versatile language for data science, automation, and web development. This course teaches basic variables, lists, dictionaries, conditionals, loops, functions, and working with CSV files.",
    category: "Programming",
    price: 30.0,
    level: "Beginner",
    location: "Online",
    imageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=60",
    specs: {
      duration: "8 Hours",
      language: "English",
      format: "1-on-1 Interactive Coding",
      prerequisites: "No coding background required"
    },
    rating: 4.7,
    reviewsCount: 22,
    ownerId: "seed_owner_1",
    ownerName: "Sarah Jenkins",
    ownerEmail: "sarah.j@example.com",
    createdAt: new Date()
  }
];

async function seed() {
  try {
    const db = await connectDB();
    console.log("Seeding started...");

    // Clear existing skills
    await db.collection("skills").deleteMany({});
    console.log("Cleared existing skills.");

    // Insert sample skills
    const result = await db.collection("skills").insertMany(sampleSkills);
    console.log(`Successfully seeded ${result.insertedCount} skills!`);

    // Create a default test user
    await db.collection("users").deleteMany({ email: "demo@skillswap.com" });
    const demoPasswordHash = await bcrypt.hash("demo1234", 10);
    await db.collection("users").insertOne({
      name: "Demo User",
      email: "demo@skillswap.com",
      password: demoPasswordHash,
      createdAt: new Date()
    });
    console.log("Seeded demo user: demo@skillswap.com / demo1234");

    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
}

seed();

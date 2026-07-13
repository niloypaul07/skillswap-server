import { Router, Response } from "express";
import { ObjectId } from "mongodb";
import { getDB } from "../config/db";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

// GET all skills with filters, sorting, search, and pagination
router.get("/", async (req, res): Promise<void> => {
  try {
    const db = getDB();
    const {
      search,
      category,
      location,
      level,
      minPrice,
      maxPrice,
      sortBy,
      order,
      page = "1",
      limit = "8",
    } = req.query;

    const query: any = {};

    // Text Search (title / description)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { shortDescription: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Filters
    if (category) {
      query.category = category;
    }
    if (location) {
      query.location = location; // e.g. "Online" or "In-Person"
    }
    if (level) {
      query.level = level; // e.g. "Beginner", "Intermediate", "Expert"
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice as string);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice as string);
    }

    // Pagination
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 8;
    const skipNum = (pageNum - 1) * limitNum;

    // Sorting
    let sortOptions: any = { createdAt: -1 }; // default sorting
    if (sortBy) {
      const sortField = sortBy as string;
      const sortOrder = order === "asc" ? 1 : -1;
      sortOptions = { [sortField]: sortOrder };
    }

    const cursor = db.collection("skills").find(query);
    const total = await db.collection("skills").countDocuments(query);

    const skills = await cursor
      .sort(sortOptions)
      .skip(skipNum)
      .limit(limitNum)
      .toArray();

    res.json({
      skills,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Fetch skills error:", error);
    res.status(500).json({ message: "Server error fetching skills" });
  }
});

// GET user's own skills (Protected)
router.get("/my-skills", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const db = getDB();
    const skills = await db
      .collection("skills")
      .find({ ownerId: req.user.id })
      .sort({ createdAt: -1 })
      .toArray();

    res.json(skills);
  } catch (error) {
    console.error("Fetch my skills error:", error);
    res.status(500).json({ message: "Server error fetching your skills" });
  }
});

// GET skill by ID
router.get("/:id", async (req, res): Promise<void> => {
  try {
    const db = getDB();
    const id = req.params.id as string;

    if (!ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid skill ID format" });
      return;
    }

    const skill = await db.collection("skills").findOne({ _id: new ObjectId(id) });

    if (!skill) {
      res.status(404).json({ message: "Skill not found" });
      return;
    }

    res.json(skill);
  } catch (error) {
    console.error("Fetch skill details error:", error);
    res.status(500).json({ message: "Server error fetching skill details" });
  }
});

// POST create skill (Protected)
router.post("/", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const {
      title,
      shortDescription,
      description,
      category,
      price,
      level,
      location,
      imageUrl,
      specs,
    } = req.body;

    if (!title || !shortDescription || !description || !category || price === undefined || !level || !location) {
      res.status(400).json({ message: "All required fields must be provided" });
      return;
    }

    const db = getDB();
    const newSkill = {
      title,
      shortDescription,
      description,
      category,
      price: parseFloat(price),
      level,
      location,
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&auto=format&fit=crop",
      specs: specs || {},
      rating: 4.8, // Initial dummy rating for aesthetic purpose
      reviewsCount: 1, // Initial reviews
      ownerId: req.user.id,
      ownerName: req.user.name,
      ownerEmail: req.user.email,
      createdAt: new Date(),
    };

    const result = await db.collection("skills").insertOne(newSkill);
    res.status(201).json({
      message: "Skill created successfully",
      skill: {
        _id: result.insertedId,
        ...newSkill,
      },
    });
  } catch (error) {
    console.error("Create skill error:", error);
    res.status(500).json({ message: "Server error creating skill" });
  }
});

// PUT update skill (Protected)
router.put("/:id", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const id = req.params.id as string;

    if (!ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid skill ID format" });
      return;
    }

    const db = getDB();
    const existingSkill = await db.collection("skills").findOne({ _id: new ObjectId(id) });

    if (!existingSkill) {
      res.status(404).json({ message: "Skill not found" });
      return;
    }

    if (existingSkill.ownerId !== req.user.id) {
      res.status(403).json({ message: "You are not authorized to edit this skill" });
      return;
    }

    const {
      title,
      shortDescription,
      description,
      category,
      price,
      level,
      location,
      imageUrl,
      specs,
    } = req.body;

    if (!title || !shortDescription || !description || !category || price === undefined || !level || !location) {
      res.status(400).json({ message: "All required fields must be provided" });
      return;
    }

    const updatedData = {
      title,
      shortDescription,
      description,
      category,
      price: parseFloat(price),
      level,
      location,
      imageUrl: imageUrl || existingSkill.imageUrl,
      specs: specs || existingSkill.specs,
      updatedAt: new Date(),
    };

    await db.collection("skills").updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedData }
    );

    const { _id: _existingId, ...existingRest } = existingSkill;
    res.json({ message: "Skill updated successfully", skill: { _id: new ObjectId(id), ...existingRest, ...updatedData } });
  } catch (error) {
    console.error("Update skill error:", error);
    res.status(500).json({ message: "Server error updating skill" });
  }
});

// DELETE skill (Protected)
router.delete("/:id", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const id = req.params.id as string;

    if (!ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid skill ID format" });
      return;
    }

    const db = getDB();
    const skill = await db.collection("skills").findOne({ _id: new ObjectId(id) });

    if (!skill) {
      res.status(404).json({ message: "Skill not found" });
      return;
    }

    if (skill.ownerId !== req.user.id) {
      res.status(403).json({ message: "You are not authorized to delete this skill" });
      return;
    }

    await db.collection("skills").deleteOne({ _id: new ObjectId(id) });

    res.json({ message: "Skill deleted successfully" });
  } catch (error) {
    console.error("Delete skill error:", error);
    res.status(500).json({ message: "Server error deleting skill" });
  }
});

export default router;

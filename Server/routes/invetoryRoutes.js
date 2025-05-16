import express from "express";
import { connectToDatabase } from "../lib/db.js";

const router = express.Router();

// GET /inventory - Get all inventory items
router.get("/", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const [items] = await db.query(`
      SELECT id, item_name, category, quantity, status 
      FROM inventory_items
      ORDER BY item_name ASC
    `);
    res.json(items);
  } catch (err) {
    res.status(500).json({ 
      error: "Failed to fetch inventory",
      details: err.message 
    });
  }
});

// POST /inventory/add - Add new item to inventory
router.post("/add", async (req, res) => {
  const { item_name, category, quantity } = req.body;
  
  if (!item_name || !category || quantity === undefined) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const db = await connectToDatabase();
    const [result] = await db.query(
      `INSERT INTO inventory_items 
       (item_name, category, quantity) 
       VALUES (?, ?, ?)`,
      [item_name, category, quantity]
    );
    res.status(201).json({ 
      id: result.insertId,
      message: "Item added successfully" 
    });
  } catch (err) {
    res.status(500).json({ 
      error: "Inventory addition failed",
      details: err.message 
    });
  }
});

export default router;
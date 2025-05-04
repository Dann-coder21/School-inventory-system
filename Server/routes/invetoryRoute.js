import express from "express";
import { connectToDatabase } from "../lib/db.js";

const router = express.Router();

// Get all items
router.get("/", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const [items] = await db.query("SELECT * FROM inventory");
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add new item
router.post("/", async (req, res) => {
  const { itemName, category, quantity } = req.body;
  try {
    const db = await connectToDatabase();
    const status = quantity === 0 ? "Out of Stock" : quantity < 5 ? "Low Stock" : "Available";
    await db.query(
      "INSERT INTO inventory (itemName, category, quantity, status) VALUES (?, ?, ?, ?)",
      [itemName, category, quantity, status]
    );
    res.status(201).json({ message: "Item added successfully!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete an item
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const db = await connectToDatabase();
    await db.query("DELETE FROM inventory WHERE id = ?", [id]);
    res.json({ message: "Item deleted successfully!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Withdraw quantity
router.put("/withdraw/:id", async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  try {
    const db = await connectToDatabase();
    const [items] = await db.query("SELECT quantity FROM inventory WHERE id = ?", [id]);
    if (items.length === 0) {
      return res.status(404).json({ message: "Item not found" });
    }
    const currentQuantity = items[0].quantity;
    if (quantity > currentQuantity) {
      return res.status(400).json({ message: "Not enough stock" });
    }
    const newQuantity = currentQuantity - quantity;
    const status = newQuantity === 0 ? "Out of Stock" : newQuantity < 5 ? "Low Stock" : "Available";

    await db.query("UPDATE inventory SET quantity = ?, status = ? WHERE id = ?", [newQuantity, status, id]);
    res.json({ message: "Item withdrawn successfully!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add stock
router.put("/add-stock/:id", async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  try {
    const db = await connectToDatabase();
    const [items] = await db.query("SELECT quantity FROM inventory WHERE id = ?", [id]);
    if (items.length === 0) {
      return res.status(404).json({ message: "Item not found" });
    }
    const currentQuantity = items[0].quantity;
    const newQuantity = currentQuantity + quantity;
    const status = newQuantity === 0 ? "Out of Stock" : newQuantity < 5 ? "Low Stock" : "Available";

    await db.query("UPDATE inventory SET quantity = ?, status = ? WHERE id = ?", [newQuantity, status, id]);
    res.json({ message: "Stock added successfully!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

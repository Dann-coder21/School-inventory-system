import express from "express";
import { connectToDatabase } from "../lib/db.js";
import jwt from "jsonwebtoken";

const addStockRouter = express.Router();



const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
      return res.status(403).json({ message: "No Token Provided" });
    }
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    req.userId = decoded.id;
    next();
  } catch (err) {
    console.log(err);
    return res.status(401).json({ message: "Invalid Token" });
  }
};

// PUT endpoint to add stock
addStockRouter.put("/:id/add-stock", verifyToken, async (req, res) => {
  try {
    const db = await connectToDatabase();
    
    // 1. Verify item exists and belongs to user
    const [rows] = await db.query(
      "SELECT quantity FROM inventory_items WHERE id = ?",
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }
    
    // 2. Calculate new quantity and status
    const currentQuantity = rows[0].quantity;
    const newQuantity = currentQuantity + req.body.quantity;
    
    let newStatus;
    if (newQuantity === 0) {
      newStatus = "Out of Stock";
    } else if (newQuantity < 5) {
      newStatus = "Low Stock";
    } else {
      newStatus = "Available";
    }
    
    // 3. Update database
    await db.query(
      "UPDATE inventory_items SET quantity = ?, status = ? WHERE id = ?",
      [newQuantity, newStatus, req.params.id]
    );
    
    // 4. Return updated item
    const [updatedItem] = await db.query(
      "SELECT * FROM inventory_items WHERE id = ?",
      [req.params.id]
    );
    
    res.status(200).json({ updatedItem: updatedItem[0] });
    
  } catch (err) {
    console.error("Add stock error:", err);
    res.status(400).json({ error: err.message });
  }
});

export default addStockRouter;
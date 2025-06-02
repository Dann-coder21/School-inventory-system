import express from "express";
import { connectToDatabase } from "../lib/db.js";
import jwt from "jsonwebtoken";

const addStockRouter = express.Router();



const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
      return res.status(403).json({ message: "No Token Provided" }); // Correct status for no token
    }
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    // Assuming your token payload (set during login) now includes id AND role
    req.userId = decoded.id;
    req.userRole = decoded.role; // <<< ADD THIS
    // You could add other fields if needed: req.userFullname = decoded.fullname;

    next();
  } catch (err) {
    console.error("Token verification error:", err.message);
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: "Token expired" });
    }
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: "Invalid token (e.g., malformed, bad signature)" });
    }
    // Fallback for other unexpected jwt errors
    return res.status(401).json({ message: "Token authentication failed" });
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
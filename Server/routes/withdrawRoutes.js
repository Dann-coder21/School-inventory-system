import express from "express";
import { connectToDatabase } from "../lib/db.js";
import jwt from "jsonwebtoken";

const withdrawRouter = express.Router();

// Verify Token Middleware (consistent with itemsRouter)
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
      return res.status(403).json({ message: "No Token Provided" });
    }
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    req.userId = decoded.id; // Store user ID from token
    next();
  } catch (err) {
    console.log(err);
    return res.status(401).json({ message: "Invalid Token" });
  }
};

withdrawRouter.post("/withdraw", verifyToken, async (req, res) => {
  console.log("\n=== NEW WITHDRAWAL REQUEST ===");
  console.log("Authenticated User ID:", req.userId);
  console.log("Request body:", req.body);

  const { item_id, quantity, withdrawn_by } = req.body;

  // Validation
  if (!item_id || !quantity || !withdrawn_by) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (quantity <= 0) {
    return res.status(400).json({ error: "Quantity must be positive" });
  }

  let conn;
  try {
    conn = await connectToDatabase();
    await conn.beginTransaction();

    // 1. Get item details (including name)
    const [itemRows] = await conn.query(
      "SELECT id, item_name, quantity FROM inventory_items WHERE id = ? FOR UPDATE",
      [item_id]
    );
    
    if (itemRows.length === 0) {
      throw new Error("Item not found");
    }

    const item = itemRows[0];
    if (quantity > item.quantity) {
      throw new Error("Insufficient stock");
    }

    // 2. Record withdrawal with item name
    await conn.query(
      "INSERT INTO withdrawals (item_id, item_name, withdrawn_by, quantity) VALUES (?, ?, ?, ?)",
      [item_id, item.item_name, withdrawn_by, quantity]
    );
    
    // 3. Update inventory
    await conn.query(
      "UPDATE inventory_items SET quantity = quantity - ? WHERE id = ?",
      [quantity, item_id]
    );

    // 4. Get updated item
    const [updatedItem] = await conn.query(
      "SELECT * FROM inventory_items WHERE id = ?", 
      [item_id]
    );

    await conn.commit();
    
    res.status(200).json({ 
  success: true, // ✅ Add this
  message: "Withdrawal successful",
  updatedItem: updatedItem[0],
  withdrawalDetails: {
    itemId: item_id,
    itemName: item.item_name,
    quantity,
    withdrawnBy: withdrawn_by,
    timestamp: new Date().toISOString()
  }
});


  } catch (error) {
    console.error("Withdrawal error:", error);
    if (conn) await conn.rollback();
    res.status(500).json({ 
      error: error.message,
      details: "Failed to process withdrawal" 
    });
  } finally {
    if (conn) await conn.end();
  }
});

export default withdrawRouter;
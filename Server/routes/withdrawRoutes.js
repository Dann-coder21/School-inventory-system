// withdrawRouter.js - Manages item withdrawal operations

import express from "express";
// Import getDbConnection for manual connection management (transactions)
import { getDbConnection } from "../lib/db.js";
import jwt from "jsonwebtoken";

const withdrawRouter = express.Router();

// Middleware: Verify JWT Token (ensure this is consistent across your routers)
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Authorization header is missing or malformed" });
    }
    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_KEY);
    req.userId = decoded.id; // ID of the user performing the action
    req.userRole = decoded.role;
    // req.userFullname = decoded.fullname; // If needed
    next();
  } catch (err) {
    console.error("Token verification error:", err.name, err.message);
    if (err.name === 'TokenExpiredError') return res.status(401).json({ message: "Token expired" });
    if (err.name === 'JsonWebTokenError') return res.status(401).json({ message: "Invalid token" });
    return res.status(500).json({ message: "Token authentication failed" });
  }
};

// Route: Process an item withdrawal
withdrawRouter.post("/withdraw", verifyToken, async (req, res) => {
  console.log("\n=== NEW WITHDRAWAL REQUEST ===");
  console.log("Authenticated User ID (performing withdrawal):", req.userId);
  console.log("Request body:", req.body);

  const { item_id, quantity, withdrawn_by } = req.body;

  // --- Input Validation ---
  if (!item_id || quantity === undefined || !withdrawn_by) {
    return res.status(400).json({ success: false, error: "Missing required fields: item_id, quantity, and withdrawn_by are all required." });
  }
  if (typeof quantity !== 'number' || quantity <= 0) {
    return res.status(400).json({ success: false, error: "Quantity must be a positive number." });
  }

  let connection; // Declare connection here to be accessible in finally
  try {
    connection = await getDbConnection(); // Get a dedicated connection from the pool
    await connection.beginTransaction();  // Start a transaction

    // 1. Get item details and lock the row for update to prevent race conditions
    const [itemRows] = await connection.query(
      "SELECT id, item_name, quantity FROM inventory_items WHERE id = ? FOR UPDATE",
      [item_id]
    );
    
    if (itemRows.length === 0) {
      await connection.rollback(); // No need to proceed if item not found
      return res.status(404).json({ success: false, error: "Item not found in inventory." });
    }

    const item = itemRows[0];
    if (quantity > item.quantity) {
      await connection.rollback();
      return res.status(400).json({ 
        success: false, 
        error: "Insufficient stock for withdrawal.",
        currentStock: item.quantity 
      });
    }

    // 2. Record the withdrawal, including the item_name for historical record
    await connection.query(
      "INSERT INTO withdrawals (item_id, item_name, withdrawn_by, quantity, user_id) VALUES (?, ?, ?, ?, ?)",
      [item_id, item.item_name, withdrawn_by, quantity, req.userId] // Added user_id of who initiated
    );
    
    // 3. Update inventory quantity
    const newQuantity = item.quantity - quantity;
    // Optionally, update status based on newQuantity here if needed
    // let newStatus = item.status; 
    // if (newQuantity <= 0) newStatus = "Out of Stock";
    // else if (newQuantity < SOME_LOW_STOCK_THRESHOLD) newStatus = "Low Stock";
    // else newStatus = "Available";
    // Then include status in the UPDATE query. For now, just quantity.

    await connection.query(
      "UPDATE inventory_items SET quantity = ? WHERE id = ?",
      [newQuantity, item_id]
    );

    // 4. Get the fully updated item to return
    const [updatedItemRows] = await connection.query( // Renamed variable
      "SELECT * FROM inventory_items WHERE id = ?", 
      [item_id]
    );

    await connection.commit(); // Commit all changes if everything was successful
    
    console.log("Withdrawal successful for item ID:", item_id);
    res.status(200).json({ 
      success: true,
      message: "Withdrawal processed successfully.",
      updatedItem: updatedItemRows[0],
      withdrawalDetails: {
        itemId: item_id,
        itemName: item.item_name, // Name at the time of withdrawal
        quantityWithdrawn: quantity,
        withdrawnBy: withdrawn_by,
        processedByUserId: req.userId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("Withdrawal processing error:", error.message, error.stack);
    if (connection) {
      try {
        await connection.rollback(); // Attempt to rollback if an error occurred
        console.log("Transaction rolled back due to error.");
      } catch (rollbackError) {
        console.error("Error during rollback:", rollbackError);
      }
    }
    // Provide a generic error message to the client
    res.status(500).json({ 
      success: false,
      error: "Failed to process withdrawal due to a server error. Please try again."
      // details: process.env.NODE_ENV === 'development' ? error.message : undefined // Optionally send more details in dev
    });
  } finally {
    if (connection) {
      try {
        connection.release(); // <<<< CRITICAL: Release the connection back to the pool
        console.log("DB Connection released after withdrawal operation.");
      } catch (releaseError) {
        console.error("Error releasing DB connection:", releaseError);
      }
    }
  }
});

export default withdrawRouter;
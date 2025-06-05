// deleteItemRouter.js - Updated to handle foreign key constraint

import express from "express";
import { connectToDatabase, getDbConnection } from "../lib/db.js";
import jwt from "jsonwebtoken";

const deleteItemRouter = express.Router();

// Middleware: Verify JWT Token (unchanged)
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Authorization header is missing or malformed" });
    }
    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_KEY);
    req.userId = decoded.id;
    req.userRole = decoded.role;
    req.userFullname = decoded.fullname || `User ID ${decoded.id}`;
    next();
  } catch (err) {
    console.error("Token verification error during deletion:", err.name, err.message);
    if (err.name === 'TokenExpiredError') return res.status(401).json({ message: "Token expired" });
    if (err.name === 'JsonWebTokenError') return res.status(401).json({ message: "Invalid token" });
    return res.status(500).json({ message: "Token authentication failed" });
  }
};

// Middleware: Check if User is Admin (unchanged)
const isAdmin = async (req, res, next) => {
  if (req.userRole === 'Admin') {
    return next();
  }

  let pool;
  try {
    pool = await connectToDatabase();
    const [rows] = await pool.query(
      "SELECT role FROM users WHERE id = ?",
      [req.userId]
    );

    if (rows.length === 0 || rows[0].role !== 'Admin') {
      return res.status(403).json({ message: "Forbidden: Admin access required." });
    }
    next();
  } catch (err) {
    console.error("isAdmin Middleware Error in deleteItemRouter:", err.message, err.stack);
    return res.status(500).json({ message: "Server error during admin check." });
  }
};

// Route: DELETE an inventory item (Admin only, with logging and dependent record handling)
deleteItemRouter.delete("/items/:id", verifyToken, isAdmin, async (req, res) => {
  const itemId = req.params.id;
  const userId = req.userId;
  const userName = req.userFullname;

  console.log(`--- New Request to DELETE /items/${itemId} by Admin User ID: ${userId} (${userName}) ---`);

  let connection;

  try {
    connection = await getDbConnection();
    await connection.beginTransaction();

    // 1. Fetch item details to be logged BEFORE deletion
    const [itemRows] = await connection.query(
      "SELECT item_name, quantity FROM inventory_items WHERE id = ?",
      [itemId]
    );

    if (itemRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Item not found." });
    }

    const itemToDelete = itemRows[0];

    // 2. Insert record into `deleted_items` table
    await connection.query(
      "INSERT INTO deleted_items (item_id, item_name, deleted_quantity, deleted_by) VALUES (?, ?, ?, ?)",
      [itemId, itemToDelete.item_name, itemToDelete.quantity, userName]
    );

    // --- NEW STEP: Delete dependent records from child tables ---
    // This is crucial to resolve the foreign key constraint.
    // Delete all withdrawal history records associated with this item_id.
    // If you have other tables (e.g., 'item_photos', 'stock_adjustments') that
    // also have foreign keys referencing 'inventory_items.id', you MUST
    // delete from them here as well, before deleting from 'inventory_items'.
    const [withdrawalsDeleteResult] = await connection.query(
      "DELETE FROM withdrawals WHERE item_id = ?",
      [itemId]
    );
    console.log(`Deleted ${withdrawalsDeleteResult.affectedRows} withdrawal records for item ${itemId}.`);
    // --- END NEW STEP ---


    // 3. Delete the item from `inventory_items` table
    const [deleteResult] = await connection.query(
      "DELETE FROM inventory_items WHERE id = ?",
      [itemId]
    );

    if (deleteResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(500).json({ error: "Failed to delete item from main inventory after logging." });
    }

    // Commit the transaction if all operations were successful
    await connection.commit();

    console.log(`Item ${itemId} (${itemToDelete.item_name}) deleted and logged successfully by Admin ${userName}.`);
    res.status(200).json({ message: "Item deleted and recorded successfully." });

  } catch (err) {
    if (connection) {
      await connection.rollback();
      console.error(`Transaction rolled back for deletion of item ${itemId}`);
    }
    console.error(`Database error during deletion of item ${itemId}:`, err.message, err.stack);
    res.status(500).json({ error: "Deletion failed due to a server error." });
  } finally {
    if (connection) {
      connection.release();
      console.log(`DB Connection released after DELETE /items/${itemId}`);
    }
  }
});

export default deleteItemRouter;
// addStockRouter.js - Manages adding stock to inventory items

import express from "express";
// Import getDbConnection for manual connection management (transactions)
import { getDbConnection } from "../lib/db.js";
import jwt from "jsonwebtoken";

const addStockRouter = express.Router();

// Middleware: Verify JWT Token (ensure this is consistent)
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
    // req.userFullname = decoded.fullname;
    next();
  } catch (err) {
    console.error("Token verification error:", err.name, err.message);
    if (err.name === 'TokenExpiredError') return res.status(401).json({ message: "Token expired" });
    if (err.name === 'JsonWebTokenError') return res.status(401).json({ message: "Invalid token" });
    return res.status(500).json({ message: "Token authentication failed" });
  }
};

// PUT endpoint to add stock to an existing item
addStockRouter.put("/:id/add-stock", verifyToken, async (req, res) => {
  const itemId = req.params.id;
  const { quantity: quantityToAdd } = req.body; // Assuming quantity to add is in req.body.quantity

  console.log(`\n=== ADD STOCK REQUEST for item ID: ${itemId} ===`);
  console.log("Authenticated User ID (adding stock):", req.userId);
  console.log("Quantity to add:", quantityToAdd);

  // --- Input Validation ---
  if (quantityToAdd === undefined || typeof quantityToAdd !== 'number' || quantityToAdd <= 0) {
    return res.status(400).json({ success: false, error: "Invalid or missing quantity. Quantity must be a positive number." });
  }

  let connection; // Declare connection here to be accessible in finally
  try {
    connection = await getDbConnection(); // Get a dedicated connection from the pool
    await connection.beginTransaction();  // Start a transaction

    // 1. Get current item details and lock the row for update
    const [itemRows] = await connection.query(
      "SELECT quantity, status FROM inventory_items WHERE id = ? FOR UPDATE", // Added FOR UPDATE
      [itemId]
    );
    
    if (itemRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, error: "Item not found in inventory." });
    }
    
    const currentItem = itemRows[0];
    const currentQuantity = currentItem.quantity;

    // 2. Calculate new quantity and determine new status
    const newQuantity = currentQuantity + quantityToAdd;
    
    let newStatus;
    // Define your stock status logic (this is an example)
    if (newQuantity <= 0) { // Should not happen if quantityToAdd is positive, but good check
      newStatus = "Out of Stock";
    } else if (newQuantity < 5) { // Example low stock threshold
      newStatus = "Low Stock";
    } else {
      newStatus = "Available";
    }
    
    // 3. Update the database with the new quantity and status
    const [updateResult] = await connection.query(
      "UPDATE inventory_items SET quantity = ?, status = ? WHERE id = ?",
      [newQuantity, newStatus, itemId]
    );

    if (updateResult.affectedRows === 0) {
        // This would mean the item ID suddenly didn't match, which is unlikely if selected 'FOR UPDATE'
        await connection.rollback();
        return res.status(404).json({ success: false, error: "Item not found during update (or no changes made)." });
    }
    
    // 4. Fetch the fully updated item to return in the response
    const [updatedItemRows] = await connection.query( // Renamed variable
      "SELECT * FROM inventory_items WHERE id = ?",
      [itemId]
    );

    await connection.commit(); // Commit all changes if everything was successful
    
    console.log("Stock added successfully for item ID:", itemId);
    res.status(200).json({ 
      success: true, 
      message: "Stock added successfully.",
      updatedItem: updatedItemRows[0] 
    });
    
  } catch (err) {
    console.error("Add stock processing error:", err.message, err.stack);
    if (connection) {
      try {
        await connection.rollback();
        console.log("Transaction rolled back due to error in add-stock.");
      } catch (rollbackError) {
        console.error("Error during rollback in add-stock:", rollbackError);
      }
    }
    res.status(500).json({ 
      success: false, 
      error: "Failed to add stock due to a server error. Please try again."
      // details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  } finally {
    if (connection) {
      try {
        connection.release(); // <<<< CRITICAL: Release the connection back to the pool
        console.log("DB Connection released after add-stock operation.");
      } catch (releaseError) {
        console.error("Error releasing DB connection after add-stock:", releaseError);
      }
    }
  }
});

export default addStockRouter;
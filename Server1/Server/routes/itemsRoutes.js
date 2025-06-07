// itemsRouter.js - Manages routing for inventory items

import express from "express";
import { connectToDatabase, getDbConnection } from "../lib/db.js";
import jwt from "jsonwebtoken";
import addItemController from "../controllers/itemController.js"; // REMINDER: You MUST update itemController.js to handle 'location' and 'cost_price' instead of 'price'/'reorderPoint' for POST /inventory

const itemsRouter = express(); // Using express() to make it a sub-app, though express.Router() also works. Router is typical.
// Let's stick to express.Router() as per previous context for consistency.
// const itemsRouter = express.Router(); // Correct line for creating a router

// Middleware: Verify JWT (unchanged)
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
    req.userFullname = decoded.fullname;
    next();
  } catch (err) {
    console.error("Token verification error:", err.name, err.message);
    if (err.name === 'TokenExpiredError') return res.status(401).json({ message: "Token expired" });
    if (err.name === 'JsonWebTokenError') return res.status(401).json({ message: "Invalid token" });
    return res.status(500).json({ message: "Token authentication failed" });
  }
};

// Middleware: Check if User can Modify Inventory (unchanged)
const canModifyInventory = async (req, res, next) => {
  const allowedRoles = ['Admin', 'DepartmentHead', 'StockManager'];
  if (allowedRoles.includes(req.userRole)) {
    return next();
  }

  let pool;
  try {
    pool = await connectToDatabase();
    const [rows] = await pool.query(
      "SELECT role FROM users WHERE id = ?",
      [req.userId]
    );

    if (rows.length === 0 || !allowedRoles.includes(rows[0].role)) {
      return res.status(403).json({ message: "Forbidden: Insufficient permissions to modify inventory." });
    }
    next();
  } catch (err) {
    console.error("canModifyInventory Middleware Error:", err.message, err.stack);
    return res.status(500).json({ message: "Server error during permission check." });
  }
};


// Route: Add a new inventory item (only users with modify permission)
itemsRouter.post("/inventory", verifyToken, canModifyInventory, addItemController);

// Route: Get all inventory items for all users - UPDATED SELECT
itemsRouter.get("/inventory", verifyToken, async (req, res) => {
  console.log("GET /inventory - Fetching all items for all users");
  try {
    const pool = await connectToDatabase();

    // UPDATED: Select 'location' and 'cost_price', removed 'price' and 'reorderPoint'
    const [items] = await pool.query(
      "SELECT id, item_name, category, quantity, location, cost_price, date_added, created_by, updated_at, updated_by FROM inventory_items"
    );

    // Sanitize date_added, updated_at if needed for consistent format
    const sanitizedItems = items.map(item => ({
      ...item,
      date_added: item.date_added ? new Date(item.date_added).toISOString().split('T')[0] : null,
      updated_at: item.updated_at ? new Date(item.updated_at).toISOString() : null, // ISO string for precise timestamp
    }));

    res.status(200).json(sanitizedItems);
  } catch (err) {
    console.error("GET /inventory - Error:", err.message, err.stack);
    res.status(500).json({
      error: "Failed to fetch inventory items",
      details: err.message
    });
  }
});

// Route: Update an inventory item (only users with modify permission) - UPDATED ROUTE PATH
itemsRouter.put("/:id", verifyToken, canModifyInventory, async (req, res) => { // <--- CHANGED FROM "/items/:id" to "/:id"
  const itemId = req.params.id;
  const { item_name, category, quantity, location, cost_price } = req.body;
  const userId = req.userId;

  console.log(`--- PUT /items/${itemId} by User ID: ${userId} ---`);
  console.log("Request Body:", req.body);

  try {
    const pool = await connectToDatabase();

    const [currentItemRows] = await pool.query(
      "SELECT item_name, category, quantity, location, cost_price FROM inventory_items WHERE id = ?",
      [itemId]
    );

    if (currentItemRows.length === 0) {
      return res.status(404).json({ message: "Item not found." });
    }
    const currentItem = currentItemRows[0];

    let querySetters = [];
    let queryValues = [];

    // Validation and checking for changes
    if (item_name !== undefined && item_name.trim() !== currentItem.item_name) {
      if (!item_name.trim()) return res.status(400).json({ message: "Item name cannot be empty." });
      querySetters.push("item_name = ?");
      queryValues.push(item_name.trim());
    }
    if (category !== undefined && category.trim() !== currentItem.category) {
      if (!category.trim()) return res.status(400).json({ message: "Category cannot be empty." });
      querySetters.push("category = ?");
      queryValues.push(category.trim());
    }
    if (quantity !== undefined && Number(quantity) !== currentItem.quantity) {
      const parsedQuantity = Number(quantity);
      if (isNaN(parsedQuantity) || parsedQuantity < 0) return res.status(400).json({ message: "Quantity must be a non-negative number." });
      querySetters.push("quantity = ?");
      queryValues.push(parsedQuantity);
    }
    if (location !== undefined && location.trim() !== currentItem.location) {
        if (!location.trim()) return res.status(400).json({ message: "Location cannot be empty." });
        querySetters.push("location = ?");
        queryValues.push(location.trim());
    }
    if (cost_price !== undefined && Number(cost_price) !== currentItem.cost_price) {
        const parsedCostPrice = Number(cost_price);
        if (isNaN(parsedCostPrice) || parsedCostPrice < 0) return res.status(400).json({ message: "Cost Price must be a non-negative number." });
        querySetters.push("cost_price = ?");
        queryValues.push(parsedCostPrice);
    }

    if (querySetters.length === 0) {
      return res.status(200).json({ message: "No changes detected for item.", updatedItem: currentItem });
    }

    querySetters.push("updated_at = NOW()");
    querySetters.push("updated_by = ?");
    queryValues.push(userId);
    queryValues.push(itemId);

    const [updateResult] = await pool.query(
      `UPDATE inventory_items SET ${querySetters.join(", ")} WHERE id = ?`,
      queryValues
    );

    if (updateResult.affectedRows === 0) {
      return res.status(500).json({ message: "Failed to update item, no rows affected." });
    }

    const [updatedItemRows] = await pool.query(
      "SELECT id, item_name, category, quantity, location, cost_price, date_added, created_by, updated_at, updated_by FROM inventory_items WHERE id = ?",
      [itemId]
    );

    console.log(`Item ${itemId} updated successfully by user ${userId}.`);
    res.status(200).json({ message: "Item updated successfully", updatedItem: updatedItemRows[0] });

  } catch (err) {
    console.error(`Error updating item ${itemId}:`, err.message, err.stack);
    res.status(500).json({ message: err.message || "Failed to update item due to a server error." });
  }
});

export default itemsRouter;
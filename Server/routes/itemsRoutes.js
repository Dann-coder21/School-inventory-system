// itemsRouter.js - Manages routing for inventory items
import express from "express";
import { connectToDatabase } from "../lib/db.js";
import jwt from "jsonwebtoken";
import addItemController from "../controllers/itemController.js";

const itemsRouter = express.Router();

// Middleware: Verify JWT
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
    next();
  } catch (err) {
    console.error("Token verification error:", err.name, err.message);
    if (err.name === 'TokenExpiredError') return res.status(401).json({ message: "Token expired" });
    if (err.name === 'JsonWebTokenError') return res.status(401).json({ message: "Invalid token" });
    return res.status(500).json({ message: "Token authentication failed" });
  }
};

// Route: Add a new inventory item
itemsRouter.post("/inventory", verifyToken, addItemController);

// Route: Get all inventory items for all users
itemsRouter.get("/inventory", verifyToken, async (req, res) => {
  console.log("GET /inventory - Fetching all items for all users");
  try {
    const pool = await connectToDatabase();
    
    // Removed user filtering - now fetches all items
    const [items] = await pool.query(
      "SELECT * FROM inventory_items"
    );
    
    res.status(200).json(items);
  } catch (err) {
    console.error("GET /inventory - Error:", err.message, err.stack);
    res.status(500).json({ 
      error: "Failed to fetch inventory items",
      details: err.message
    });
  }
});

export default itemsRouter;
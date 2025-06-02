import express from "express";
import { connectToDatabase } from "../lib/db.js";
import jwt from "jsonwebtoken";
import addItem from "../controllers/itemController.js";

const itemsRouter = express.Router();

// VerifyToken middleware (existing)
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

// Existing routes
itemsRouter.post("/inventory", verifyToken, addItem);

itemsRouter.get("/inventory", verifyToken, async (req, res) => {
  console.log("User ID from token:", req.userId);
  try {
    const db = await connectToDatabase();
    const [items] = await db.query(
      "SELECT * FROM inventory_items WHERE user_id = ?",
      [req.userId]
    );
   // console.log("Fetched items:", items);
    res.status(200).json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




export default itemsRouter;
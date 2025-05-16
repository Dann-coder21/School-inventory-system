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
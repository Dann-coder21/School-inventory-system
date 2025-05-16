import express from "express";
import { connectToDatabase } from "../lib/db.js";
import jwt from "jsonwebtoken";

const deleteItemRouter = express.Router();
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




deleteItemRouter.delete("/items/:id", verifyToken, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const [result] = await db.query(
      "DELETE FROM inventory_items WHERE id = ? AND user_id = ?",
      [req.params.id, req.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

// Return 200 OK with JSON on success
res.status(200).json({ message: "Item deleted successfully" });
// ...existing code...

  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Deletion failed" });
  }
});

export default deleteItemRouter;

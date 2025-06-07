// _helpers/auth-middleware.js
import { connectToDatabase } from "../lib/db.js"; // Adjust this path if lib/db.js is not ../lib/db.js from _helpers
import jwt from "jsonwebtoken";

// Middleware: Verify JWT Token
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
    req.userFullname = decoded.fullname; // Assuming these are in your JWT payload
    req.userEmail = decoded.email;
    req.userDepartmentId = decoded.department_id; // Assuming these are in your JWT payload
    req.userDepartmentName = decoded.department_name; // Assuming these are in your JWT payload
    next();
  } catch (err) {
    console.error("Token verification error (auth-middleware):", err.name, err.message);
    if (err.name === 'TokenExpiredError') return res.status(401).json({ message: "Token expired. Please log in again." });
    if (err.name === 'JsonWebTokenError') return res.status(401).json({ message: "Invalid token. Please log in again." });
    return res.status(500).json({ message: "Token authentication failed." });
  }
};

// Middleware: Check if User is Admin
const isAdmin = async (req, res, next) => {
  if (req.userRole === 'Admin') {
    return next();
  }
  // Fallback to DB check if req.userRole isn't 'Admin' or for extra security
  try {
    const pool = await connectToDatabase();
    const [rows] = await pool.query(
      "SELECT role FROM users WHERE id = ?",
      [req.userId]
    );
    
    if (rows.length === 0 || rows[0].role !== 'Admin') {
      return res.status(403).json({ message: "Forbidden: Admin access required." });
    }
    next();
  } catch (err) {
    console.error("isAdmin Middleware Error (auth-middleware):", err.message, err.stack);
    return res.status(500).json({ message: "Server error during admin check." });
  }
};

// Export the middlewares
export { verifyToken, isAdmin };
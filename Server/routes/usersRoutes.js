import express from "express";
import { connectToDatabase } from "../lib/db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const userRouter = express.Router();

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

const isAdmin = async (req, res, next) => {
  try {
    const db = await connectToDatabase();
    const [rows] = await db.query(
      "SELECT role FROM users WHERE id = ?",
      [req.userId]
    );
    
    if (rows.length === 0 || rows[0].role !== 'Admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get all users
userRouter.get("/users", verifyToken, isAdmin, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const [users] = await db.query(
      "SELECT id, fullname, email, role, phone, dob FROM users"
    );

    const sanitizedUsers = users.map(user => ({
      ...user,
      dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : null,
      phone: user.phoneNumber // Maintain consistency
    }));
    
    res.status(200).json(sanitizedUsers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching users" });
  }
});

// Create new user
userRouter.post("/adduser", verifyToken, isAdmin, async (req, res) => {
  // ------------------ DEBUGGING START ------------------
  console.log("--- New Request to /adduser ---");
  console.log("Timestamp:", new Date().toISOString());

  // 1. Log the entire request body
  console.log("Request Body (req.body):", req.body);

  // 2. Log specific headers if needed (e.g., Content-Type, Authorization)
  console.log("Content-Type Header:", req.headers['content-type']);
  console.log("Authorization Header:", req.headers['authorization']); // To see the token being sent

  // 3. Log information attached by previous middleware (verifyToken)
  console.log("User ID from token (req.userId):", req.userId);
  console.log("User Role from token (req.userRole):", req.userRole);

  // 4. Log request parameters (if any, though not for this POST route with body)
  // console.log("Request Params (req.params):", req.params);

  // 5. Log query string parameters (if any, though not typical for this POST route)
  // console.log("Request Query (req.query):", req.query);
  console.log("--- End of Request Debug Info ---");
  // ------------------- DEBUGGING END -------------------

  try {
    // Destructure expected fields from req.body
    const { fullname, email, password, role, phone, dob } = req.body;

    // Validate required fields (adjust based on your actual requirements)
    // For example, 'phone' might be optional, 'dob' too.
    if (!fullname || !email || !password || !role) { // Removed phone from mandatory check for example
      console.log("Validation Error: Missing required fields. Received:", { fullname, email, password, role, phone });
      return res.status(400).json({ message: "Missing required fields: fullname, email, password, and role are mandatory." });
    }
    
    const db = await connectToDatabase();
    
    const [existing] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );
    
    if (existing.length > 0) {
      console.log(`Attempt to create user with existing email: ${email}`);
      return res.status(409).json({ message: "Email already in use" }); // 409 Conflict is often better for "already exists"
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Ensure 'phone' and 'dob' are handled correctly if they can be null/undefined
    const phoneValue = phone || null;
    const dobValue = dob || null; // Ensure DOB is in a format your DB accepts (e.g., 'YYYY-MM-DD') or null

    console.log("Data to be inserted:", { fullname, email, role, phone: phoneValue, dob: dobValue, hashedPassword: '***' });


    await db.query(
      "INSERT INTO users (fullname, email, password, role, phone, dob) VALUES (?, ?, ?, ?, ?, ?)",
      [fullname, email, hashedPassword, role, phoneValue, dobValue]
    );
    
    console.log(`User created successfully: ${email}`);
    res.status(201).json({ message: "User created successfully" });

  } catch (err) {
    console.error("--- ERROR in /adduser ---");
    console.error("Error Message:", err.message);
    console.error("Error Stack:", err.stack);
    // If err has more properties like err.code (for DB errors), log them too
    if (err.code) {
        console.error("Error Code:", err.code);
    }
    console.error("Request Body that caused error:", req.body); // Log the body again on error
    console.error("--- End of Error Info ---");
    res.status(500).json({ message: "Error creating user. Please check server logs." });
  }
});


// Update user
userRouter.put("/users/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { fullname, email, role, phone_number, dob } = req.body;
    
    if (!fullname || !email || !role) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    
    const db = await connectToDatabase();
    
    const [existing] = await db.query(
      "SELECT id FROM users WHERE id = ?",
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const [emailCheck] = await db.query(
      "SELECT id FROM users WHERE email = ? AND id != ?",
      [email, id]
    );
    
    if (emailCheck.length > 0) {
      return res.status(400).json({ message: "Email already in use" });
    }
    
    await db.query(
      "UPDATE users SET fullname = ?, email = ?, role = ?, phone = ?, dob = ? WHERE id = ?",
      [fullname, email, role, phone || null, dob || null, id]
    );
    
    res.status(200).json({ message: "User updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating user" });
  }
});

// Delete user
userRouter.delete("/users/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await connectToDatabase();
    
    if (id === req.userId) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }
    
    const [existing] = await db.query(
      "SELECT id, role FROM users WHERE id = ?",
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (existing[0].role === 'Admin') {
      return res.status(403).json({ message: "Cannot delete admin users" });
    }
    
    await db.query("DELETE FROM users WHERE id = ?", [id]);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting user" });
  }
});


export default userRouter;
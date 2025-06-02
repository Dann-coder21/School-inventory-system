// userRouter.js - Manages user administration routes (CRUD)

import express from "express";
// Assuming connectToDatabase returns the pool, getDbConnection for manual needs
import { connectToDatabase, getDbConnection } from "../lib/db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs"; // Ensure this is what you're using (or 'bcrypt')

const userRouter = express.Router();

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
    // req.userFullname = decoded.fullname; // If you add this to token and need it
    next();
  } catch (err) {
    console.error("Token verification error:", err.name, err.message);
    if (err.name === 'TokenExpiredError') return res.status(401).json({ message: "Token expired" });
    if (err.name === 'JsonWebTokenError') return res.status(401).json({ message: "Invalid token" });
    return res.status(500).json({ message: "Token authentication failed" });
  }
};

// Middleware: Check if User is Admin (using the pool)
const isAdmin = async (req, res, next) => {
  // req.userRole should be set by verifyToken if role is in JWT
  // This middleware can rely on that or do a fresh DB check if preferred for utmost accuracy.
  // For this example, let's assume role in JWT is sufficient for many cases,
  // but a DB check is more secure if roles can change without issuing a new token.
  if (req.userRole === 'Admin') {
    return next();
  }

  // Fallback to DB check if role wasn't 'Admin' in token or for extra security
  let pool;
  try {
    pool = await connectToDatabase(); // Get the pool
    const [rows] = await pool.query(
      "SELECT role FROM users WHERE id = ?",
      [req.userId] // Check role of the currently authenticated user
    );
    
    if (rows.length === 0 || rows[0].role !== 'Admin') {
      return res.status(403).json({ message: "Forbidden: Admin access required." });
    }
    next();
  } catch (err) {
    console.error("isAdmin Middleware Error:", err.message, err.stack);
    return res.status(500).json({ message: "Server error during admin check." });
  }
};

// Route: Get all users (Admin only)
userRouter.get("/users", verifyToken, isAdmin, async (req, res) => {
  try {
    const pool = await connectToDatabase(); // Get the pool
    // Use pool.query for automatic connection handling
    const [users] = await pool.query(
      "SELECT id, fullname, email, role, phone, dob FROM users"
    );

    // Sanitize DOB for consistent format, ensure phone is correct
    const sanitizedUsers = users.map(user => ({
      ...user,
      dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : null,
      // phone: user.phone // Assuming DB column is 'phone' and you select 'phone'
    }));
    
    res.status(200).json(sanitizedUsers);
  } catch (err) {
    console.error("GET /users Error:", err.message, err.stack);
    res.status(500).json({ message: "Error fetching users." });
  }
});

// Route: Create new user (Admin only)
// Assuming your frontend POSTs to /api/admin/users (if userRouter is mounted at /api/admin)
// or /api/admin/adduser if you kept that path.
// Let's assume path is /users to be RESTful, matching the GET all.
userRouter.post("/users", verifyToken, isAdmin, async (req, res) => {
  // Your existing debug logs are fine here if you still need them
  console.log("--- New Request to POST /users (create user) ---");
  console.log("Request Body (req.body):", req.body);
  console.log("User ID from token (req.userId creating this user):", req.userId);

  try {
    const { fullname, email, password, role, phone, dob } = req.body;

    if (!fullname || !email || !password || !role) {
      return res.status(400).json({ message: "Missing required fields: fullname, email, password, and role are mandatory." });
    }
    
    const pool = await connectToDatabase(); // Get the pool
    
    const [existing] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );
    
    if (existing.length > 0) {
      return res.status(409).json({ message: "Email already in use." });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const phoneValue = phone || null;
    const dobValue = dob || null;

    const [result] = await pool.query(
      "INSERT INTO users (fullname, email, password, role, phone, dob) VALUES (?, ?, ?, ?, ?, ?)",
      [fullname, email, hashedPassword, role, phoneValue, dobValue]
    );

    // Optionally fetch and return the created user
    const [newUserRows] = await pool.query("SELECT id, fullname, email, role, phone, dob FROM users WHERE id = ?", [result.insertId]);
    
    console.log(`User created successfully: ${email}`);
    res.status(201).json({ message: "User created successfully", user: newUserRows[0] });

  } catch (err) {
    console.error("POST /users (create user) Error:", err.message, err.stack);
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: "Email already in use (DB constraint)." });
    }
    res.status(500).json({ message: "Error creating user. Please check server logs." });
  }
});

// Route: Update user (Admin only)
// Here, using a dedicated connection can be slightly better if multiple steps are involved,
// but pool.query for each step is also viable if atomicity isn't strictly needed between checks and update.
// For simplicity, let's stick to pool.query unless a transaction is explicitly required.
userRouter.put("/users/:id", verifyToken, isAdmin, async (req, res) => {
  const targetUserId = req.params.id;
  const { fullname, email, role, phone, dob } = req.body; // Changed phone_number to phone
  // Note: Password changes should typically be a separate, more secure endpoint.
  // This route will not handle password updates for simplicity here.

  console.log(`--- PUT /users/${targetUserId} (update user) ---`);
  console.log("Request Body:", req.body);

  // Basic validation
  if (!fullname && !email && !role && !phone && !dob) {
      return res.status(400).json({ message: "No update data provided." });
  }

  let connection; // For manual connection management if we decide to use transactions
  try {
    // For updates, especially with multiple checks, a transaction can be safer.
    // Let's use a dedicated connection here.
    connection = await getDbConnection();
    await connection.beginTransaction();

    const [userToUpdateRows] = await connection.query(
      "SELECT id, fullname, email, role, phone, dob FROM users WHERE id = ?",
      [targetUserId]
    );

    if (userToUpdateRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "User not found." });
    }
    const currentUserData = userToUpdateRows[0];

    // Check for email conflict if email is being changed
    if (email && email !== currentUserData.email) {
      const [emailCheck] = await connection.query(
        "SELECT id FROM users WHERE email = ? AND id != ?",
        [email, targetUserId]
      );
      if (emailCheck.length > 0) {
        await connection.rollback();
        return res.status(409).json({ message: "Email already in use by another account." });
      }
    }

    // Construct dynamic update query
    let querySetters = [];
    let queryValues = [];

    if (fullname !== undefined && fullname !== currentUserData.fullname) { querySetters.push("fullname = ?"); queryValues.push(fullname); }
    if (email !== undefined && email !== currentUserData.email) { querySetters.push("email = ?"); queryValues.push(email); }
    if (role !== undefined && role !== currentUserData.role) { querySetters.push("role = ?"); queryValues.push(role); }
    if (phone !== undefined && phone !== currentUserData.phone) { querySetters.push("phone = ?"); queryValues.push(phone || null); }
    if (dob !== undefined && dob !== currentUserData.dob) { querySetters.push("dob = ?"); queryValues.push(dob || null); }

    if (querySetters.length === 0) {
        await connection.rollback(); // Or commit if no change is not an error
        return res.status(200).json({ message: "No changes applied to user.", user: currentUserData });
    }

    queryValues.push(targetUserId); // For the WHERE id = ?

    await connection.query(
      `UPDATE users SET ${querySetters.join(", ")} WHERE id = ?`,
      queryValues
    );

    const [updatedUserRows] = await connection.query("SELECT id, fullname, email, role, phone, dob FROM users WHERE id = ?", [targetUserId]);

    await connection.commit();
    
    res.status(200).json({ message: "User updated successfully.", user: updatedUserRows[0] });

  } catch (err) {
    if (connection) await connection.rollback();
    console.error(`PUT /users/${targetUserId} Error:`, err.message, err.stack);
    res.status(500).json({ message: "Error updating user." });
  } finally {
    if (connection) {
        connection.release();
        // console.log(`DB Connection released after PUT /users/${targetUserId}`);
    }
  }
});

// Route: Delete user (Admin only)
userRouter.delete("/users/:id", verifyToken, isAdmin, async (req, res) => {
  const targetUserId = req.params.id;
  const adminUserId = req.userId; // ID of the admin performing the action

  console.log(`--- DELETE /users/${targetUserId} (delete user) by Admin ID: ${adminUserId} ---`);

  if (targetUserId === String(adminUserId)) { // Ensure comparison is correct type (req.params.id is string)
    return res.status(400).json({ message: "Admins cannot delete their own account through this endpoint." });
  }
  
  let connection;
  try {
    connection = await getDbConnection();
    await connection.beginTransaction();
    
    const [userToDeleteRows] = await connection.query(
      "SELECT id, role FROM users WHERE id = ?",
      [targetUserId]
    );
    
    if (userToDeleteRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "User not found." });
    }
    
    // Rule: Prevent deletion of other Admin users by an Admin
    // (Adjust this rule based on your application's specific requirements)
    if (userToDeleteRows[0].role === 'Admin') {
      await connection.rollback();
      return res.status(403).json({ message: "Cannot delete other Admin users." });
    }
    
    await connection.query("DELETE FROM users WHERE id = ?", [targetUserId]);
    await connection.commit();

    res.status(200).json({ message: "User deleted successfully." });

  } catch (err) {
    if (connection) await connection.rollback();
    console.error(`DELETE /users/${targetUserId} Error:`, err.message, err.stack);
    res.status(500).json({ message: "Error deleting user." });
  } finally {
    if (connection) {
        connection.release();
        // console.log(`DB Connection released after DELETE /users/${targetUserId}`);
    }
  }
});

export default userRouter;
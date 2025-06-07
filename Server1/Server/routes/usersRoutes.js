// routes/userRouter.js - Manages user administration routes (CRUD)

import express from "express";
import { getDbConnection } from "../lib/db.js"; // Corrected import
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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
    req.userFullname = decoded.fullname;
    req.userDepartmentId = decoded.department_id; // Added for convenience in other middlewares/routes
    req.userDepartmentName = decoded.department_name; // Added for convenience
    next();
  } catch (err) {
    console.error("Token verification error (userRouter):", err.name, err.message);
    if (err.name === 'TokenExpiredError') return res.status(401).json({ message: "Token expired. Please log in again." });
    if (err.name === 'JsonWebTokenError') return res.status(401).json({ message: "Invalid token. Please log in again." });
    return res.status(500).json({ message: "Token authentication failed." });
  }
};

// Middleware: Check if User is Admin (Strictly for Admin-only actions like CUD)
const requireAdmin = async (req, res, next) => {
  if (req.userRole === 'Admin') {
    return next();
  }
  // Fallback check (though token role should be primary)
  let connection;
  try {
    connection = await getDbConnection();
    const [rows] = await connection.query(
      "SELECT role FROM users WHERE id = ?",
      [req.userId]
    );
    
    if (rows.length === 0 || rows[0].role !== 'Admin') {
      return res.status(403).json({ message: "Forbidden: Admin access required." });
    }
    next();
  } catch (err) {
    console.error("requireAdmin Middleware Error (userRouter):", err.message, err.stack);
    return res.status(500).json({ message: "Server error during admin check." });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// NEW Middleware: Check if User can View All Users (Admin, DepartmentHead, StockManager, Viewer)
const canViewAllUsers = async (req, res, next) => {
  const allowedViewerRoles = ['Admin', 'DepartmentHead', 'StockManager', 'Viewer']; // Viewer is also included if they need to see user lists
  if (allowedViewerRoles.includes(req.userRole)) {
    return next();
  }
  // Optional: Fallback DB check if token role isn't considered authoritative.
  // For most cases, relying on req.userRole from decoded token is sufficient.
  return res.status(403).json({ message: "Forbidden: Insufficient permissions to view users." });
};


const addAdminUser = async (req, res) => { // This function remains used by the POST /adduser route
  const { fullname, email, dob, phone, password, role, department_id } = req.body;

  if (!fullname || !email || !password || !role) {
    return res.status(400).json({ message: "Full name, email, password, and role are required." });
  }

  let departmentIdToInsert = department_id || null;

  if (['Staff', 'DepartmentHead'].includes(role) && !departmentIdToInsert) {
    return res.status(400).json({ message: "Department is required for this role." });
  }

  try {
    const pool = await getDbConnection(); // Use getDbConnection consistent with other routes

    const [existingUsers] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ message: "User with this email already exists." });
    }

    if (departmentIdToInsert) {
      const [departments] = await pool.query(
        "SELECT id FROM departments WHERE id = ?",
        [departmentIdToInsert]
      );
      if (departments.length === 0) {
        return res.status(400).json({ message: "Invalid department ID provided. Department does not exist." });
      }
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const phoneValue = phone || null;
    const dobValue = dob || null;

    const defaultStatus = 1; // Assuming 1 means active

    const [insertResult] = await pool.query(
      "INSERT INTO users (fullname, email, password, role, dob, phone, department_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [fullname, email, hashedPassword, role, dobValue, phoneValue, departmentIdToInsert, defaultStatus]
    );

    if (insertResult.affectedRows === 1) {
      return res.status(201).json({ message: "User created successfully." });
    } else {
      console.error("User creation error: Insert query affected 0 rows.", insertResult);
      return res.status(500).json({ message: "Failed to create user due to an unexpected database issue." });
    }

  } catch (err) {
    console.error("Admin User Creation Error:", err.message, err.stack);
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: "User with this email already exists (database constraint)." });
    }
    if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
        return res.status(400).json({ message: "The provided department does not exist. Please select a valid department." });
    }
    return res.status(500).json({ message: "An unexpected server error occurred during user creation." });
  }
};

// Route: Get all users (Admin, DepartmentHead, StockManager, Viewer) - EXCLUDES SOFT-DELETED USERS
// This route now uses the new 'canViewAllUsers' middleware
userRouter.get("/users", verifyToken, canViewAllUsers, async (req, res) => {
  try {
    const pool = await getDbConnection();
    const [users] = await pool.query( // Use getDbConnection for consistency
      `SELECT
         u.id, u.fullname, u.email, u.role, u.phone, u.dob, u.status, u.department_id,
         d.name AS department_name
       FROM
         users u
       LEFT JOIN
         departments d ON u.department_id = d.id
       WHERE
         u.deleted_at IS NULL
       ORDER BY u.fullname ASC`
    );

    const formattedUsers = users.map(user => ({
      ...user,
      dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : null,
      status: user.status === 1 ? true : false
    }));
    
    res.status(200).json(formattedUsers);
  } catch (err) {
    console.error("GET /users Error (userRouter):", err.message, err.stack);
    res.status(500).json({ message: "Error fetching users." });
  }
});

// Route: Create new user (Admin only)
userRouter.post("/adduser", verifyToken, requireAdmin, addAdminUser); // Uses requireAdmin

// Route: Update user (Admin only)
userRouter.put("/users/:id", verifyToken, requireAdmin, async (req, res) => { // Uses requireAdmin
  const targetUserId = req.params.id;
  const { fullname, email, role, phone, dob, password, status, department_id } = req.body;

  if (!fullname && !email && !role && !phone && !dob && !password && status === undefined && department_id === undefined) {
      return res.status(400).json({ message: "No update data provided." });
  }

  let connection;
  try {
    connection = await getDbConnection(); // Use getDbConnection
    await connection.beginTransaction();

    const [userToUpdateRows] = await connection.query(
      "SELECT id, fullname, email, role, phone, dob, status, department_id FROM users WHERE id = ?",
      [targetUserId]
    );

    if (userToUpdateRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "User not found." });
    }
    const currentUserData = userToUpdateRows[0];

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

    let departmentIdToUpdate = department_id === undefined ? currentUserData.department_id : (department_id || null);
    if (['Staff', 'DepartmentHead'].includes(role) && !departmentIdToUpdate) {
        await connection.rollback();
        return res.status(400).json({ message: "Department is required for this role." });
    }
    if (departmentIdToUpdate) {
      const [departments] = await connection.query(
        "SELECT id FROM departments WHERE id = ?",
        [departmentIdToUpdate]
      );
      if (departments.length === 0) {
        await connection.rollback();
        return res.status(400).json({ message: "Invalid department ID provided. Department does not exist." });
      }
    }

    let querySetters = [];
    let queryValues = [];

    if (fullname !== undefined && fullname !== currentUserData.fullname) { querySetters.push("fullname = ?"); queryValues.push(fullname); }
    if (email !== undefined && email !== currentUserData.email) { querySetters.push("email = ?"); queryValues.push(email); }
    if (role !== undefined && role !== currentUserData.role) { querySetters.push("role = ?"); queryValues.push(role); }
    if (phone !== undefined && phone !== currentUserData.phone) { querySetters.push("phone = ?"); queryValues.push(phone || null); }
    if (dob !== undefined) { querySetters.push("dob = ?"); queryValues.push(dob || null); }
    if (status !== undefined && status !== currentUserData.status) { querySetters.push("status = ?"); queryValues.push(status ? 1 : 0); }
    
    if (department_id !== undefined) {
        querySetters.push("department_id = ?");
        queryValues.push(department_id || null);
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      querySetters.push("password = ?");
      queryValues.push(hashedPassword);
    }

    if (querySetters.length === 0) {
        await connection.rollback();
        return res.status(200).json({ message: "No changes applied to user.", user: currentUserData });
    }

    queryValues.push(targetUserId);

    await connection.query(
      `UPDATE users SET ${querySetters.join(", ")} WHERE id = ?`,
      queryValues
    );

    const [updatedUserRows] = await connection.query(
      `SELECT
         u.id, u.fullname, u.email, u.role, u.phone, u.dob, u.status, u.department_id,
         d.name AS department_name
       FROM
         users u
       LEFT JOIN
         departments d ON u.department_id = d.id
       WHERE u.id = ?`,
      [targetUserId]
    );

    await connection.commit();
    
    const updatedUser = {
      ...updatedUserRows[0],
      status: updatedUserRows[0].status === 1 ? true : false
    };

    res.status(200).json({ message: "User updated successfully.", user: updatedUser });

  } catch (err) {
    if (connection) await connection.rollback();
    console.error(`PUT /users/${targetUserId} Error (userRouter):`, err.message, err.stack);
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: "Email already in use by another account." });
    }
    if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
        return res.status(400).json({ message: "The provided department does not exist (Foreign Key Constraint)." });
    }
    res.status(500).json({ message: "Error updating user." });
  } finally {
    if (connection) {
        connection.release();
    }
  }
});

// Route: Delete user (Admin only) - PERFORMS A SOFT DELETE
userRouter.delete("/users/:id", verifyToken, requireAdmin, async (req, res) => { // Uses requireAdmin
  const targetUserId = req.params.id;
  const adminUserId = req.userId;

  if (targetUserId === String(adminUserId)) {
    return res.status(400).json({ message: "Admins cannot delete their own account." });
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
    
    if (userToDeleteRows[0].role === 'Admin') {
      await connection.rollback();
      return res.status(403).json({ message: "Cannot delete other Admin users." });
    }
    
    await connection.query("UPDATE users SET deleted_at = NOW() WHERE id = ?", [targetUserId]);
    await connection.commit();

    res.status(200).json({ message: "User deleted successfully (soft-deleted)." });

  } catch (err) {
    if (connection) await connection.rollback();
    console.error(`DELETE /users/${targetUserId} Error:`, err.message, err.stack);
    res.status(500).json({ message: "Error deleting user." });
  } finally {
    if (connection) {
        connection.release();
    }
  }
});

// Route: Toggle user status (Admin only)
userRouter.put("/users/:id/status", verifyToken, requireAdmin, async (req, res) => { // Uses requireAdmin
    const targetUserId = req.params.id;
    const { status } = req.body;

    if (status === undefined || typeof status !== 'boolean') {
        return res.status(400).json({ message: "Status (boolean) is required." });
    }

    if (String(req.userId) === targetUserId) {
        return res.status(400).json({ message: "Cannot change your own account status." });
    }

    try {
        const pool = await getDbConnection(); // Use getDbConnection
        const [result] = await pool.query(
            "UPDATE users SET status = ? WHERE id = ?",
            [status ? 1 : 0, targetUserId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User not found or status already matches." });
        }
        res.status(200).json({ message: `User status updated to ${status ? 'active' : 'inactive'}.` });
    } catch (err) {
        console.error("PUT /users/:id/status Error:", err.message, err.stack);
        res.status(500).json({ message: "Error updating user status." });
    }
});

// Route: Reset user password (Admin only)
userRouter.put("/users/:id/reset-password", verifyToken, requireAdmin, async (req, res) => { // Uses requireAdmin
    const targetUserId = req.params.id;

    if (String(req.userId) === targetUserId) {
        return res.status(400).json({ message: "Cannot reset your own password via this endpoint." });
    }

    try {
        const pool = await getDbConnection(); // Use getDbConnection
        const tempPassword = "Kenya2030";
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const [result] = await pool.query(
            "UPDATE users SET password = ? WHERE id = ?",
            [hashedPassword, targetUserId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User not found." });
        }
        res.status(200).json({ message: "Password reset successfully.", tempPassword: tempPassword });
    } catch (err) {
        console.error("PUT /users/:id/reset-password Error:", err.message, err.stack);
        res.status(500).json({ message: "Error resetting password." });
    }
});


export default userRouter;
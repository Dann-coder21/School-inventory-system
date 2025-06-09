// Server/routes/authRoutes.js

import express from "express";
import { connectToDatabase, getDbConnection } from "../lib/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import createAccount from '../controllers/auth.js'; // Adjust path based on your structure

const router = express.Router();

router.get("/test", (req, res) => {
  console.log("Test route hit!");
  res.send("Test route is working!");
});

router.post("/signup", createAccount);
console.log("authRoutes loaded");

// LOGIN ROUTE
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const pool = await connectToDatabase();
    
    const [rows] = await pool.query(
      `SELECT
         u.id, u.fullname, u.email, u.role, u.password, u.department_id, u.status, u.created_at, u.phone, u.dob,
         d.name AS department_name
       FROM
         users u
       LEFT JOIN
         departments d ON u.department_id = d.id
       WHERE u.email = ?`,
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found with this email." });
    }

    const user = rows[0];

    if (user.status === 0) { // If status is 0, it means pending or inactive
        return res.status(403).json({ message: "Your account is pending approval or has been deactivated. Please contact an administrator." });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }

    const jwtPayload = {
      id: user.id,
      fullname: user.fullname,
      email: user.email,
      role: user.role,
      department_id: user.department_id,
      department_name: user.department_name,
      status: user.status
    };

    const token = jwt.sign(jwtPayload, process.env.JWT_KEY, {
      expiresIn: "3h",
    });

    const userResponse = {
      id: user.id,
      fullname: user.fullname,
      email: user.email,
      role: user.role,
      department_id: user.department_id,
      department_name: user.department_name,
      status: user.status === 1 ? true : false
    };

    return res.status(200).json({ token: token, user: userResponse });
  } catch (err) {
    console.error("Backend: Login Error:", err.message, err.stack); // Added backend prefix
    return res.status(500).json({ message: "Server error during login." });
  }
});

// VERIFY TOKEN MIDDLEWARE
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
    req.userEmail = decoded.email;
    req.userDepartmentId = decoded.department_id;
    req.userDepartmentName = decoded.department_name;
    req.userStatus = decoded.status;
    next();
  } catch (err) {
    console.error("Backend: Token verification error:", err.name, err.message); // Added backend prefix
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token expired. Please log in again." });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Invalid token. Please log in again." });
    }
    return res.status(500).json({ message: "Token authentication failed." });
  }
};

// DASHBOARD ROUTE
router.get("/dashboard", verifyToken, async (req, res) => {
  try {
    const pool = await connectToDatabase();
    const [rows] = await pool.query(
      `SELECT
         u.id, u.fullname, u.email, u.role, u.department_id, u.status,
         d.name AS department_name
       FROM
         users u
       LEFT JOIN
         departments d ON u.department_id = d.id
       WHERE u.id = ?`,
      [req.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found in database." });
    }
    
    const user = {
      ...rows[0],
      status: rows[0].status === 1 ? true : false
    };

    if (!user.status) {
        return res.status(403).json({ message: "Account is not active. Access denied." });
    }

    res.status(200).json({ message: "Dashboard access granted.", user: user });
  } catch (err) {
    console.error("Backend: Error fetching current user data for dashboard:", err.message, err.stack); // Added backend prefix
    res.status(500).json({ message: "Server error fetching user data." });
  }
});


// UPDATE PROFILE ROUTE
router.put("/update-profile", verifyToken, async (req, res) => {
  const { newName, newEmail, currentPassword, newPassword } = req.body;
  const userId = req.userId;
  let connection;

  try {
    connection = await getDbConnection();
    await connection.beginTransaction();

    const [userRows] = await connection.query(
      "SELECT id, fullname, email, password, role, department_id FROM users WHERE id = ?",
      [userId]
    );

    if (userRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "User not found." });
    }
    const currentUser = userRows[0];

    let updateFields = [];
    let updateValues = [];

    if (newName && newName !== currentUser.fullname) {
      updateFields.push("fullname = ?");
      updateValues.push(newName);
    }
    if (newEmail && newEmail !== currentUser.email) {
      const [emailCheck] = await connection.query("SELECT id FROM users WHERE email = ? AND id != ?", [newEmail, userId]);
      if (emailCheck.length > 0) {
        await connection.rollback();
        return res.status(409).json({ message: "Email already in use by another user." });
      }
      updateFields.push("email = ?");
      updateValues.push(newEmail);
    }

    if (newPassword) {
      if (!currentPassword) {
        await connection.rollback();
        return res.status(400).json({ message: "Current password is required to set a new password." });
      }
      const validPassword = await bcrypt.compare(currentPassword, currentUser.password);
      if (!validPassword) {
        await connection.rollback();
        return res.status(401).json({ message: "Current password is incorrect." });
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateFields.push("password = ?");
      updateValues.push(hashedPassword);
    }

    if (updateFields.length === 0) {
      await connection.rollback();
      return res.status(200).json({ message: "No changes provided.", user: { fullname: currentUser.fullname, email: currentUser.email }});
    }

    const updateQuery = `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`;
    updateValues.push(userId);

    await connection.query(updateQuery, updateValues);

    const [updatedUserRows] = await connection.query(
      `SELECT
         u.id, u.fullname, u.email, u.role, u.department_id, u.status,
         d.name AS department_name
       FROM
         users u
       LEFT JOIN
         departments d ON u.department_id = d.id
       WHERE u.id = ?`,
      [userId]
    );
    
    await connection.commit();

    const updatedUser = {
      ...updatedUserRows[0],
      status: updatedUserRows[0].status === 1 ? true : false
    };

    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Backend: Update Profile Error:", error.message, error.stack); // Added backend prefix
    res.status(500).json({ message: "Error updating profile." });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// CURRENT-USER ROUTE
router.get("/me", verifyToken, async (req, res) => {
  try {
    const pool = await connectToDatabase();
    const userIdToFetch = req.userId;

    if (!userIdToFetch) {
      return res.status(400).json({ message: "User ID not found in token." });
    }

    const [rows] = await pool.query(
      `SELECT
         u.id, u.fullname, u.email, u.role, u.department_id, u.status, u.phone, u.dob,
         d.name AS department_name
       FROM
         users u
       LEFT JOIN
         departments d ON u.department_id = d.id
       WHERE u.id = ?`,
      [userIdToFetch]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found in database." });
    }
    
    const user = {
      ...rows[0],
      status: rows[0].status === 1 ? true : false
    };

    res.status(200).json(user);
  } catch (err) {
    console.error("Backend: Error fetching current user data (/me):", err.message, err.stack); // Added backend prefix
    res.status(500).json({ message: "Server error fetching user data." });
  }
});


// --- ADMIN ROUTES ---

const isAdmin = (req, res, next) => {
  if (req.userRole !== 'Admin') {
    return res.status(403).json({ message: "Access denied. Admin privileges required." });
  }
  next();
};

// GET PENDING USER REQUESTS (for UserRequestsPage)
router.get('/admin/user-requests', verifyToken, isAdmin, async (req, res) => {
    console.log('Backend: /admin/user-requests endpoint hit.'); // Debug
    try {
        const pool = await connectToDatabase();
        // --- CRITICAL: This query fetches users with status = 0 ---
        const [pendingUsers] = await pool.query(
            `SELECT
                u.id, u.fullname, u.email, u.role, u.phone, u.dob, u.created_at, u.department_id, u.status,
                d.name AS department_name
            FROM
                users u
            LEFT JOIN
                departments d ON u.department_id = d.id
            WHERE u.status = 0` // This is the key condition
        );
        console.log(`Backend: Query successful. Found ${pendingUsers.length} pending user(s).`); // Debug
        console.log('Backend: Pending users data being sent:', pendingUsers); // Debug - inspect this array
        res.status(200).json(pendingUsers);
    } catch (error) {
        console.error("Backend: Error fetching pending user requests:", error.message, error.stack); // Debug
        res.status(500).json({ message: "Failed to fetch pending user requests." });
    }
});

// GET ALL USERS (for UserManagementPage)
router.get('/admin/users', verifyToken, isAdmin, async (req, res) => {
    console.log('Backend: /admin/users endpoint hit.'); // Debug
    try {
        const pool = await connectToDatabase();
        const [allUsers] = await pool.query(
            `SELECT
                u.id, u.fullname, u.email, u.role, u.phone, u.dob, u.status, u.department_id,
                d.name AS department_name
            FROM
                users u
            LEFT JOIN
                departments d ON u.department_id = d.id`
        );
        
        const usersForFrontend = allUsers.map(user => ({
            ...user,
            status: user.status === 1 ? true : false
        }));
        console.log(`Backend: Found ${usersForFrontend.length} total users.`); // Debug
        res.status(200).json(usersForFrontend);
    } catch (error) {
        console.error("Backend: Error fetching all users for admin:", error.message, error.stack); // Debug
        res.status(500).json({ message: "Failed to fetch all users." });
    }
});


// UPDATE USER STATUS (for both UserRequestsPage approve/reject AND UserManagementPage toggle)
router.put('/admin/users/:id/status', verifyToken, isAdmin, async (req, res) => {
    const userId = req.params.id;
    const { status } = req.body; 

    let newDbStatus;
    if (typeof status === 'boolean') { 
        newDbStatus = status ? 1 : 0;
    } else if (typeof status === 'string') {
        if (status === 'active') {
            newDbStatus = 1; 
        } else if (status === 'rejected') {
            newDbStatus = 0; 
        } else {
            return res.status(400).json({ message: "Invalid string status value provided." });
        }
    } else {
        return res.status(400).json({ message: "Invalid status data type provided." });
    }

    try {
        const pool = await connectToDatabase();

        const [targetUserRows] = await pool.query("SELECT id, role FROM users WHERE id = ?", [userId]);
        if (targetUserRows.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }
        const targetUser = targetUserRows[0];

        if (req.userId === targetUser.id) { 
             return res.status(403).json({ message: "You cannot change your own status via this route." });
        }
        if (targetUser.role === 'Admin' && req.userRole === 'Admin' && req.userId !== targetUser.id) {
             return res.status(403).json({ message: "Admins cannot change the status of other Admin accounts." });
        }

        const [updateResult] = await pool.query(
            "UPDATE users SET status = ? WHERE id = ?",
            [newDbStatus, userId]
        );

        if (updateResult.affectedRows === 1) {
            res.status(200).json({ message: "User status updated successfully." });
        } else {
            res.status(400).json({ message: "Failed to update user status (no rows affected)." });
        }

    } catch (error) {
        console.error("Backend: Error updating user status:", error.message, error.stack); // Added backend prefix
        res.status(500).json({ message: "Server error updating user status." });
    }
});


export default router;
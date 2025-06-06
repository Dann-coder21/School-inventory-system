import express from "express";
import { connectToDatabase, getDbConnection } from "../lib/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = express.Router();

// The `createAccount` function (for /signup)
const createAccount = async (req, res) => {
  const { fullname, email, dob, phone, password, role, department_id } = req.body;

  if (!fullname || !email || !password || !role) {
    return res.status(400).json({ message: "Full name, email, password, and role are required." });
  }

  let departmentIdToInsert = department_id || null;

  if (['Staff', 'DepartmentHead'].includes(role) && !departmentIdToInsert) {
    return res.status(400).json({ message: "Department is required for this role." });
  }

  try {
    const pool = await connectToDatabase();

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

    // Default status to active (1) for new users created via signup
    // Adjust if you want new signups to be inactive by default
    const defaultStatus = 1;

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
    console.error("Signup Controller Error:", err.message, err.stack);
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: "User with this email already exists (database constraint)." });
    }
    if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
        return res.status(400).json({ message: "The provided department does not exist. Please select a valid department." });
    }
    return res.status(500).json({ message: "An unexpected server error occurred during user creation. Please try again." });
  }
};


router.get("/test", (req, res) => {
  console.log("Test route hit!");
  res.send("Test route is working!");
});

// Link createAccount to the /signup route
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
    // *** FIX START: Ensure department_id, department_name, and status are selected ***
    const [rows] = await pool.query(
      `SELECT
         u.id, u.fullname, u.email, u.role, u.password, u.department_id, u.status,
         d.name AS department_name
       FROM
         users u
       LEFT JOIN
         departments d ON u.department_id = d.id
       WHERE u.email = ?`,
      [email]
    );
    // *** FIX END ***

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found with this email." });
    }

    const user = rows[0];

    // Check if the user account is active
    if (user.status === 0) { // Assuming 'status' is tinyint(1)
        return res.status(403).json({ message: "Your account is deactivated. Please contact an administrator." });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password." });
    }

    // *** FIX START: Include department_id and department_name in JWT payload ***
    const jwtPayload = {
      id: user.id,
      fullname: user.fullname,
      email: user.email,
      role: user.role,
      department_id: user.department_id,
      department_name: user.department_name,
    };
    // *** FIX END ***

    const token = jwt.sign(jwtPayload, process.env.JWT_KEY, {
      expiresIn: "3h",
    });

    // *** FIX START: Include department_id and department_name in user response ***
    const userResponse = {
      id: user.id,
      fullname: user.fullname,
      email: user.email,
      role: user.role,
      department_id: user.department_id,
      department_name: user.department_name,
    };
    // *** FIX END ***

    return res.status(200).json({ token: token, user: userResponse });
  } catch (err) {
    console.error("Login Error:", err.message, err.stack);
    return res.status(500).json({ message: "Server error during login." });
  }
});

// VERIFY TOKEN MIDDLEWARE
// This middleware now explicitly adds department details to req object from decoded token
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
    req.userDepartmentId = decoded.department_id; // Will be undefined if not in JWT
    req.userDepartmentName = decoded.department_name; // Will be undefined if not in JWT
    next();
  } catch (err) {
    console.error("Token verification error:", err.name, err.message);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token expired. Please log in again." });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Invalid token. Please log in again." });
    }
    return res.status(500).json({ message: "Token authentication failed." });
  }
};

// DASHBOARD ROUTE (Returns basic user info from token)
router.get("/dashboard", verifyToken, async (req, res) => {
  res.status(200).json({ message: "Dashboard access granted.", user: {
    id: req.userId,
    fullname: req.userFullname,
    email: req.userEmail,
    role: req.userRole,
    department_id: req.userDepartmentId,
    department_name: req.userDepartmentName,
  }});
});

// UPDATE PROFILE ROUTE (for user to update their OWN profile)
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

    // Ensure status is boolean for frontend consistency
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
    console.error("Update Profile Error:", error.message, error.stack);
    res.status(500).json({ message: "Error updating profile." });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// CURRENT-USER ROUTE (used by AuthContext to get full user data from token)
router.get("/me", verifyToken, async (req, res) => {
  try {
    const pool = await connectToDatabase();
    const userIdToFetch = req.userId;

    if (!userIdToFetch) {
      return res.status(400).json({ message: "User ID not found in token." });
    }

    // *** FIX START: Ensure department_id, department_name, and status are selected ***
    const [rows] = await pool.query(
      `SELECT
         u.id, u.fullname, u.email, u.role, u.department_id, u.status,
         d.name AS department_name
       FROM
         users u
       LEFT JOIN
         departments d ON u.department_id = d.id
       WHERE u.id = ?`,
      [userIdToFetch]
    );
    // *** FIX END ***

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found in database." });
    }
    
    // Ensure status is boolean for frontend consistency
    const user = {
      ...rows[0],
      status: rows[0].status === 1 ? true : false
    };

    res.status(200).json(user);
  } catch (err) {
    console.error("Error fetching current user data (/me):", err.message, err.stack);
    res.status(500).json({ message: "Server error fetching user data." });
  }
});

export default router;
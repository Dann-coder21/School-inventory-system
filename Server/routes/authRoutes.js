/*import express from "express";
import { connectToDatabase } from "../lib/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import createAccount from "../controllers/auth.js";

const router = express.Router();
router.get("/test", (req, res) => {
  console.log("Test route hit!");
  res.send("Test route is working!");
});

router.post("/signup", createAccount);
console.log("authRoutes loaded now");

// router.post("/signup", async (req, res) => {
//   const { fullname, email, dob, phone, password } = req.body;

//   console.log("req.body", req.body);
//   try {
//     const db = await connectToDatabase();
//     const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
//       email,
//     ]);
//     if (rows.length > 0) {
//       return res.status(409).json({ message: "user already existed" });
//     }
//     const hashPassword = await bcrypt.hash(password, 10);
//     await db.query(
//       "INSERT INTO users (fullname, email, dob, phone,  password) VALUES (?, ?, ?, ?, ?)",
//       [fullname, email, dob, phone, hashPassword]
//     );

//     return res.status(201).json({ message: "user created successfully" });
//   } catch (err) {
//     return res.status(500).json(err.message);
//   }
// });

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const db = await connectToDatabase();
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "user not existed" });
    }
    const isMatch = await bcrypt.compare(password, rows[0].password);
    if (!isMatch) {
      return res.status(401).json({ message: "wrong password" });
    }
    const token = jwt.sign({ id: rows[0].id }, process.env.JWT_KEY, {
      expiresIn: "3h",
    });

    return res.status(201).json({ token: token });
  } catch (err) {
    return res.status(500).json(err.message);
  }
});

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

router.get("/dashboard", verifyToken, async (req, res) => {
  let conn;
  try {
    conn = await connectToDatabase();
    const [rows] = await conn.query(
      "SELECT id, fullname, email FROM users WHERE id = ?", 
      [req.userId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json({ user: rows[0] });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ message: "Database error" });
  }
  // Note: Don't close the connection - we're reusing it
});

// Add this route to your existing authRoutes.js
// In your authRoutes.js (backend)
router.put("/update-profile", verifyToken, async (req, res) => {
  const { newName, email, currentPassword, newPassword } = req.body;

  try {
    const db = await connectToDatabase();
    const [user] = await db.query("SELECT * FROM users WHERE id = ?", [req.userId]);

    // Verify current password if changing password
    if (newPassword) {
      const valid = await bcrypt.compare(currentPassword, user[0].password);
      if (!valid) return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Build update object
    const updates = {
      name: newName || user[0].name,
      email: email || user[0].email
    };

    if (newPassword) {
      updates.password = await bcrypt.hash(newPassword, 10);
    }

    await db.query(
      "UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?",
      [updates.name, updates.email, updates.password, req.userId]
    );

    // Return updated user data (excluding password)
    const { password, ...userData } = updates;
    res.json({ 
      message: "Profile updated successfully",
      user: userData
    });

  } catch (error) {
    res.status(500).json({ message: "Error updating profile" });
  }
});

// In your authRoutes.js
router.get('/current-user', verifyToken, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const [rows] = await db.query(
      "SELECT id, fullname as name, email FROM users WHERE id = ?", 
      [req.userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user: rows[0] });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/me", verifyToken, async (req, res) => {
  try {
    const db = await connectToDatabase();
    // Use the userId from the verified token to fetch the user
    // Ensure your verifyToken sets req.userId or req.user.id
    const userIdToFetch = req.userId || (req.user && req.user.id);

    if (!userIdToFetch) {
      return res.status(400).json({ message: "User ID not found in token." });
    }

    const [rows] = await db.query(
      "SELECT id, fullname, email, role FROM users WHERE id = ?", // Fetch necessary fields
      [userIdToFetch]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found in database." });
    }

    const user = rows[0];
    // Don't send back sensitive info like password hash
    res.status(200).json({
      id: user.id,
      fullname: user.fullname,
      email: user.email,
      role: user.role,
    });

  } catch (err) {
    console.error("Error fetching current user data:", err);
    res.status(500).json({ message: "Server error fetching user data." });
  }
});



export default router;
 */
import express from "express";
import { connectToDatabase, getDbConnection } from "../lib/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import createAccount from "../controllers/auth.js";

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
      "SELECT id, fullname, email, role, password FROM users WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found with this email." });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password." });
    }

    const jwtPayload = {
      id: user.id,
      fullname: user.fullname,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(jwtPayload, process.env.JWT_KEY, {
      expiresIn: "3h",
    });

    const userResponse = {
      id: user.id,
      fullname: user.fullname,
      email: user.email,
      role: user.role,
    };

    return res.status(200).json({ token: token, user: userResponse });
  } catch (err) {
    console.error("Login Error:", err.message, err.stack);
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

// DASHBOARD ROUTE
router.get("/dashboard", verifyToken, async (req, res) => {
  try {
    const pool = await connectToDatabase();
    const [rows] = await pool.query(
      "SELECT id, fullname, email, role FROM users WHERE id = ?",
      [req.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user: rows[0] });
  } catch (err) {
    console.error("Dashboard error:", err.message, err.stack);
    res.status(500).json({ message: "Database error on dashboard." });
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
      "SELECT id, fullname, email, password FROM users WHERE id = ?",
      [userId]
    );

    if (userRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "User not found." });
    }
    const currentUser = userRows[0];

    let updateQuery = "UPDATE users SET ";
    const updateValues = [];
    const updateFields = [];

    if (newName && newName !== currentUser.fullname) {
      updateFields.push("fullname = ?");
      updateValues.push(newName);
    }
    if (newEmail && newEmail !== currentUser.email) {
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

    updateQuery += updateFields.join(", ") + " WHERE id = ?";
    updateValues.push(userId);

    await connection.query(updateQuery, updateValues);

    const [updatedUserRows] = await connection.query(
      "SELECT id, fullname, email, role FROM users WHERE id = ?",
      [userId]
    );
    
    await connection.commit();

    res.json({
      message: "Profile updated successfully",
      user: updatedUserRows[0],
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

// CURRENT-USER ROUTE (using the new implementation)
router.get("/current-user", verifyToken, async (req, res) => {
  try {
    const pool = await connectToDatabase();
    const [rows] = await pool.query(
      "SELECT id, fullname as name, email FROM users WHERE id = ?", 
      [req.userId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({ user: rows[0] });
  } catch (err) {
    console.error("Error fetching current user:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// KEEPING THE EXISTING /me ROUTE FOR COMPATIBILITY
router.get("/me", verifyToken, async (req, res) => {
  try {
    const pool = await connectToDatabase();
    const userIdToFetch = req.userId;

    if (!userIdToFetch) {
      return res.status(400).json({ message: "User ID not found in token." });
    }

    const [rows] = await pool.query(
      "SELECT id, fullname, email, role FROM users WHERE id = ?",
      [userIdToFetch]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found in database." });
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error("Error fetching current user data:", err.message, err.stack);
    res.status(500).json({ message: "Server error fetching user data." });
  }
});

export default router;
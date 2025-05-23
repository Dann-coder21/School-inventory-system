import express from "express";
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
    const token = req.headers["authorization"].split(" ")[1];
    if (!token) {
      return res.status(403).json({ message: "No Token Provided" });
    }
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    req.userId = decoded.id;
    next();
  } catch (err) {
    console.log(err)
    return res.status(500).json({ message: "server error" });
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

export default router;

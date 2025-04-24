import { connectToDatabase } from "../lib/db.js";
import bcrypt from "bcrypt";

const createAccount = async (req, res) => {
  const { fullname, email, dob, phone, password } = req.body;

  console.log("req.body", req.body);
  try {
    const db = await connectToDatabase();
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (rows.length > 0) {
      return res.status(409).json({ message: "user already existed" });
    }
    const hashPassword = await bcrypt.hash(password, 10);
    await db.query(
      "INSERT INTO users (fullname, email, dob, phone,  password) VALUES (?, ?, ?, ?, ?)",
      [fullname, email, dob, phone, hashPassword]
    );

    return res.status(201).json({ message: "user created successfully" });
  } catch (err) {
    console.error("Signup error:", err); // ← Add this
    return res.status(500).json(err.message);
  }
};

export default createAccount;

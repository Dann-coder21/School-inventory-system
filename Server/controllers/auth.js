/*import { connectToDatabase } from "../lib/db.js";
import bcrypt from "bcrypt";

const createAccount = async (req, res) => {
  const { fullname, email, dob, phone, password } = req.body;

 
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
*/


import { connectToDatabase } from "../lib/db.js"; // This should return the pool
import bcrypt from "bcryptjs"; // Using bcryptjs as it's common for Node.js

const createAccount = async (req, res) => {
  const { fullname, email, dob, phone, password, role } = req.body; // Added 'role'

  // Basic Input Validation
  if (!fullname || !email || !password || !role) { // 'role' is now mandatory
    return res.status(400).json({ message: "Full name, email, password, and role are required." });
  }
  // Optional: Add more specific validation (email format, password strength, etc.)

  try {
    const pool = await connectToDatabase(); // Get the pool instance

    // Check if user already exists
    const [existingUsers] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ message: "User with this email already exists." }); // 409 Conflict
    }

    // Hash the password
    const saltRounds = 10; // Standard salt rounds
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Prepare values for insertion, handling potentially optional fields
    const phoneValue = phone || null;
    const dobValue = dob || null; // Ensure dob is in 'YYYY-MM-DD' format if it's a DATE column

    // Insert the new user with a role
    // IMPORTANT: Ensure your 'users' table has a 'role' column.
    const [insertResult] = await pool.query(
      "INSERT INTO users (fullname, email, password, role, dob, phone) VALUES (?, ?, ?, ?, ?, ?)",
      [fullname, email, hashedPassword, role, dobValue, phoneValue]
    );

    if (insertResult.affectedRows === 1) {
      // Optionally, you could fetch the newly created user (without password) to return it
      // const [newUserRows] = await pool.query("SELECT id, fullname, email, role, dob, phone FROM users WHERE id = ?", [insertResult.insertId]);
      return res.status(201).json({
        message: "User created successfully.",
        // user: newUserRows[0] // If you decide to return the user
      });
    } else {
      // This case should ideally not be hit if the query was successful
      console.error("Signup error: User insertion failed, affectedRows was not 1.", insertResult);
      return res.status(500).json({ message: "Failed to create user due to an unexpected error." });
    }

  } catch (err) {
    console.error("Signup Controller Error:", err.message, err.stack);
    // Check for specific database errors if needed (e.g., duplicate entry if unique constraint is on email)
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: "User with this email already exists (DB constraint)." });
    }
    return res.status(500).json({ message: "An error occurred during the signup process. Please try again." });
  }
};

export default createAccount;
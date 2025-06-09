// src/controllers/createAccount.js (or similar path where createAccount is defined)

import { connectToDatabase } from "../lib/db.js";
import bcrypt from "bcryptjs";

const createAccount = async (req, res) => {
  const { fullname, email, dob, phone, password, role, department_id } = req.body;

  // Basic Input Validation
  if (!fullname || !email || !password || !role) {
    return res.status(400).json({ message: "Full name, email, password, and role are required." });
  }

  // Handle optional fields as null if not provided
  const phoneValue = phone || null;
  const dobValue = dob || null; // Ensure dob is in 'YYYY-MM-DD' format if it's a DATE column

  // Department Validation
  let departmentIdToInsert = department_id || null; // Will be null if not provided

  if (['Staff', 'DepartmentHead'].includes(role) && !departmentIdToInsert) {
    return res.status(400).json({ message: "Department is required for this role." });
  }

  try {
    const pool = await connectToDatabase(); // Get the pool instance

    // Check if user with this email already exists
    const [existingUsers] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ message: "User with this email already exists." });
    }

    // Validate department_id exists in the departments table if provided
    if (departmentIdToInsert) {
      const [departments] = await pool.query(
        "SELECT id FROM departments WHERE id = ?",
        [departmentIdToInsert]
      );
      if (departments.length === 0) {
        return res.status(400).json({ message: "Invalid department ID provided. Department does not exist." });
      }
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // --- CRITICAL CHANGE: Set status to 0 (pending/inactive) for new signups ---
    const newAccountStatus = 0; // 0 for pending/inactive, 1 for active

    const [insertResult] = await pool.query(
      "INSERT INTO users (fullname, email, password, role, dob, phone, department_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())", // Added created_at
      [fullname, email, hashedPassword, role, dobValue, phoneValue, departmentIdToInsert, newAccountStatus]
    );

    if (insertResult.affectedRows === 1) {
      return res.status(201).json({
        message: "User account created successfully. Awaiting admin approval." // Informative message
      });
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

export default createAccount;
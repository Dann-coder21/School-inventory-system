import { connectToDatabase } from "../lib/db.js"; // This should return the pool
import bcrypt from "bcryptjs"; // Using bcryptjs as it's common for Node.js

const createAccount = async (req, res) => {
  // NEW: Added 'department_id' to destructuring
  const { fullname, email, dob, phone, password, role, department_id } = req.body;

  // Basic Input Validation
  // 'role' is already mandatory here, adding department_id as mandatory for relevant roles
  if (!fullname || !email || !password || !role) {
    return res.status(400).json({ message: "Full name, email, password, and role are required." });
  }

  // --- NEW: Department Validation ---
  let departmentIdToInsert = department_id || null; // Will be null if not provided

  // If the role is Staff or DepartmentHead, department_id is required
  if (['Staff', 'DepartmentHead'].includes(role) && !departmentIdToInsert) {
    return res.status(400).json({ message: "Department is required for this role." });
  }
  // For other roles (Admin, Viewer, StockManager), department can be optional,
  // but if provided, it should be valid.

  try {
    const pool = await connectToDatabase(); // Get the pool instance

    // Check if user with this email already exists
    const [existingUsers] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ message: "User with this email already exists." }); // 409 Conflict
    }

    // --- NEW: Validate department_id exists in the departments table ---
    if (departmentIdToInsert) { // Only check if a department_id was provided
      const [departments] = await pool.query(
        "SELECT id FROM departments WHERE id = ?",
        [departmentIdToInsert]
      );
      if (departments.length === 0) {
        // If the provided department_id does not exist in the departments table
        return res.status(400).json({ message: "Invalid department ID provided. Department does not exist." });
      }
    }

    // Hash the password
    const saltRounds = 10; // Standard salt rounds
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Prepare values for insertion, handling potentially optional fields
    const phoneValue = phone || null;
    const dobValue = dob || null; // Ensure dob is in 'YYYY-MM-DD' format if it's a DATE column

    // Insert the new user with role AND department_id
    // IMPORTANT: Ensure your 'users' table has a 'department_id' column
    const [insertResult] = await pool.query(
      "INSERT INTO users (fullname, email, password, role, dob, phone, department_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [fullname, email, hashedPassword, role, dobValue, phoneValue, departmentIdToInsert] // NEW: departmentIdToInsert added
    );

    if (insertResult.affectedRows === 1) {
      return res.status(201).json({
        message: "User created successfully."
      });
    } else {
      // This case should ideally not be hit if the query was successful
      console.error("User creation error: Insert query affected 0 rows.", insertResult);
      return res.status(500).json({ message: "Failed to create user due to an unexpected database issue." });
    }

  } catch (err) {
    console.error("Signup Controller Error:", err.message, err.stack);
    // Check for specific database errors:
    // ER_DUP_ENTRY: Happens if a unique constraint (like on email) is violated
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: "User with this email already exists (database constraint)." });
    }
    // ER_NO_REFERENCED_ROW_2 or ER_NO_REFERENCED_ROW: Foreign key constraint violation (if department_id is not NULL and doesn't exist)
    if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
        return res.status(400).json({ message: "The provided department does not exist. Please select a valid department." });
    }
    return res.status(500).json({ message: "An unexpected server error occurred during user creation. Please try again." });
  }
};

export default createAccount;
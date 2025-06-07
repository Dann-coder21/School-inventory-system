import { connectToDatabase } from "../lib/db.js"; // This should return the pool
import bcrypt from "bcryptjs"; // Using bcryptjs as it's common for Node.js

const createAccount = async (req, res) => {
  const { fullname, email, dob, phone, password, role, department_id } = req.body; // department_id from frontend (if any)

  // Initialize role and department_id for insertion
  let finalRole = role; // Default to role from frontend
  let finalDepartmentId = department_id || null; // Default to department_id from frontend or null

  // Initial Input Validation (applies to all users, incl. first)
  if (!fullname || !email || !password || !role) {
    return res.status(400).json({ message: "Full name, email, password, and role are required." });
  }

  let connection; // Declare connection outside try block for finally access
  try {
    const pool = await connectToDatabase();
    connection = await pool.getConnection(); // Get a connection from the pool

    // --- STEP 1: Check if this is the very first user ---
    const [userCountRows] = await connection.execute('SELECT COUNT(*) AS count FROM users');
    const isFirstUser = userCountRows[0].count === 0;

    if (isFirstUser) {
      // Assign Admin role for the first user
      finalRole = 'Admin';

      // Find or create the 'IT' department's ID
      const [itDepartmentRows] = await connection.execute('SELECT id FROM departments WHERE department_name = ?', ['IT']);
      if (itDepartmentRows.length > 0) {
        finalDepartmentId = itDepartmentRows[0].id;
      } else {
        // Option: Create 'IT' department if it doesn't exist. Adapt based on your specific setup.
        console.warn("IT department not found. Creating it for the first admin user.");
        const [newDeptResult] = await connection.execute('INSERT INTO departments (department_name) VALUES (?)', ['IT']);
        finalDepartmentId = newDeptResult.insertId;
      }
    } else {
      // For subsequent users:
      // Prevent non-first users from self-assigning 'Admin' role
      if (role === 'Admin') {
          return res.status(403).json({ message: "Admin role can only be assigned during initial setup or by an existing Admin." });
      }
      // Continue with original validation for 'Staff', 'DepartmentHead' if they require department_id
      if (['Staff', 'DepartmentHead'].includes(finalRole) && !finalDepartmentId) {
        return res.status(400).json({ message: "Department is required for this role." });
      }
      // If department_id is provided, validate it exists
      if (finalDepartmentId) {
        const [departments] = await connection.execute(
          "SELECT id FROM departments WHERE id = ?",
          [finalDepartmentId]
        );
        if (departments.length === 0) {
          return res.status(400).json({ message: "Invalid department ID provided. Department does not exist." });
        }
      }
    }

    // Check if user with this email already exists (after first user logic, to prevent duplicates)
    const [existingUsers] = await connection.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ message: "User with this email already exists." });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Prepare values for insertion
    const phoneValue = phone || null;
    const dobValue = dob || null; // Ensure dob is in 'YYYY-MM-DD' format if it's a DATE column

    // Insert the new user with determined role and department_id
    const [insertResult] = await connection.execute(
      "INSERT INTO users (fullname, email, password, role, dob, phone, department_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'active')",
      [fullname, email, hashedPassword, finalRole, dobValue, phoneValue, finalDepartmentId]
    );

    if (insertResult.affectedRows === 1) {
      return res.status(201).json({
        message: "User created successfully.",
        userId: insertResult.insertId,
        role: finalRole // Return the actual role assigned
      });
    } else {
      console.error("User creation error: Insert query affected 0 rows.", insertResult);
      return res.status(500).json({ message: "Failed to create user due to an unexpected database issue." });
    }

  } catch (err) {
    console.error("Signup Controller Error:", err.message, err.stack);
    // Specific error handling for database constraints
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: "User with this email already exists (database constraint)." });
    }
    if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
        return res.status(400).json({ message: "The provided department does not exist. Please select a valid department." });
    }
    return res.status(500).json({ message: "An unexpected server error occurred during user creation. Please try again." });
  } finally {
    if (connection) connection.release(); // Always release the connection
  }
};

export default createAccount;
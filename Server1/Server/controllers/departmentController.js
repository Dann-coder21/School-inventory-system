// controllers/departmentController.js
import { connectToDatabase } from "../lib/db.js";
import { v4 as uuidv4 } from 'uuid'; // Import uuid for generating unique IDs

// Get All Departments
const getAllDepartments = async (req, res) => {
  try {
    const pool = await connectToDatabase();
    const [departments] = await pool.query("SELECT id, name FROM departments ORDER BY name ASC");

    return res.status(200).json(departments);
  } catch (err) {
    console.error("Get All Departments Controller Error:", err.message, err.stack);
    return res.status(500).json({ message: "An error occurred while fetching departments." });
  }
};

// Add a New Department (Admin only)
const addDepartment = async (req, res) => {
  const { name } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ message: "Department name is required and must be a non-empty string." });
  }

  try {
    const pool = await connectToDatabase();

    // Check if department name already exists (case-insensitive check might be better: LOWER(name))
    const [existingDepartments] = await pool.query(
      "SELECT id FROM departments WHERE LOWER(name) = LOWER(?)",
      [name.trim()]
    );

    if (existingDepartments.length > 0) {
      return res.status(409).json({ message: "Department with this name already exists." });
    }

    // Generate a unique ID for the new department (since your 'id' is VARCHAR PRIMARY KEY)
    const newDepartmentId = uuidv4(); 

    const [insertResult] = await pool.query(
      "INSERT INTO departments (id, name) VALUES (?, ?)",
      [newDepartmentId, name.trim()]
    );

    if (insertResult.affectedRows === 1) {
      // You can return the newly created department's ID and name
      return res.status(201).json({ 
        message: "Department created successfully.", 
        department: { id: newDepartmentId, name: name.trim() }
      });
    } else {
      console.error("Add Department Error: Insert query affected 0 rows.", insertResult);
      return res.status(500).json({ message: "Failed to create department due to an unexpected database issue." });
    }

  } catch (err) {
    console.error("Add Department Controller Error:", err.message, err.stack);
    if (err.code === 'ER_DUP_ENTRY') { // Handles unique constraint violation for name
        return res.status(409).json({ message: "Department name already exists (database constraint)." });
    }
    return res.status(500).json({ message: "An unexpected server error occurred while adding the department." });
  }
};

// Update Department (Admin only)
const updateDepartment = async (req, res) => {
  const departmentId = req.params.id; // ID from URL parameter
  const { name } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ message: "Department name is required and must be a non-empty string." });
  }

  try {
    const pool = await connectToDatabase();

    // Check if department name already exists for another department
    const [existingDepartments] = await pool.query(
      "SELECT id FROM departments WHERE LOWER(name) = LOWER(?) AND id != ?",
      [name.trim(), departmentId]
    );

    if (existingDepartments.length > 0) {
      return res.status(409).json({ message: "Another department with this name already exists." });
    }

    const [updateResult] = await pool.query(
      "UPDATE departments SET name = ? WHERE id = ?",
      [name.trim(), departmentId]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ message: "Department not found or no changes made." });
    }

    return res.status(200).json({ message: "Department updated successfully." });

  } catch (err) {
    console.error("Update Department Controller Error:", err.message, err.stack);
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: "Department name already exists (database constraint)." });
    }
    return res.status(500).json({ message: "An unexpected server error occurred while updating the department." });
  }
};

// Delete Department (Admin only)
const deleteDepartment = async (req, res) => {
  const departmentId = req.params.id;

  try {
    const pool = await connectToDatabase();

    // IMPORTANT: Before deleting a department, consider if any users are linked to it.
    // If your `users.department_id` has `ON DELETE SET NULL`, then linked users will have their department_id set to NULL.
    // If it has `ON DELETE RESTRICT`, the delete will fail if users are linked.
    // You might want to handle this gracefully (e.g., reassign users first) on the frontend.

    const [deleteResult] = await pool.query(
      "DELETE FROM departments WHERE id = ?",
      [departmentId]
    );

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ message: "Department not found." });
    }

    return res.status(200).json({ message: "Department deleted successfully." });

  } catch (err) {
    console.error("Delete Department Controller Error:", err.message, err.stack);
    // Handle foreign key constraint violation if ON DELETE RESTRICT is used and users are linked
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
        return res.status(409).json({ message: "Cannot delete department: Users are still assigned to it." });
    }
    return res.status(500).json({ message: "An unexpected server error occurred while deleting the department." });
  }
};


export {
  getAllDepartments,
  addDepartment,
  updateDepartment,
  deleteDepartment
};
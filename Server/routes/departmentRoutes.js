// routes/departmentRoutes.js
import express from 'express';
import { 
  getAllDepartments,
  addDepartment,
  updateDepartment,
  deleteDepartment
} from '../controllers/departmentController.js';
import { verifyToken, isAdmin } from '../_helpers/auth-middleware.js'; // Adjust path if auth-middleware is elsewhere

const departmentRouter = express.Router();

// Publicly accessible for authenticated users to get departments (e.g., for dropdowns)
// Or you can restrict it to specific roles if not all users should see department list
departmentRouter.get('/', verifyToken, getAllDepartments); 

// Admin-only routes for managing departments
departmentRouter.post('/', verifyToken, isAdmin, addDepartment);
departmentRouter.put('/:id', verifyToken, isAdmin, updateDepartment); // Use :id for specific department
departmentRouter.delete('/:id', verifyToken, isAdmin, deleteDepartment); // Use :id for specific department

export default departmentRouter;
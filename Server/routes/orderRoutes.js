// orderRoutes.js - Manages item request/order routes for staff and admins

import express from "express";
import { getDbConnection } from "../lib/db.js";
import jwt from "jsonwebtoken";

const orderRouter = express.Router();

// Middleware: Verify JWT Token
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
    req.userDepartmentId = decoded.department_id;
    req.userDepartmentName = decoded.department_name;
    next();
  } catch (err) {
    console.error("Token verification error in orderRoutes:", err.name, err.message);
    if (err.name === 'TokenExpiredError') return res.status(401).json({ message: "Token expired" });
    if (err.name === 'JsonWebTokenError') return res.status(401).json({ message: "Invalid token" });
    return res.status(500).json({ message: "Token authentication failed" });
  }
};

// Middleware: Check if User has permission to modify orders (Admin, DeptHead, StockManager)
const canModifyOrders = async (req, res, next) => {
  const allowedGeneralModifyRoles = ['Admin', 'DepartmentHead', 'StockManager'];

  // 1. Allow Admin, DepartmentHead, StockManager to proceed directly
  if (allowedGeneralModifyRoles.includes(req.userRole)) {
    return next();
  }

  // 2. Special case: Allow Staff to cancel THEIR OWN order
  if (req.userRole === 'Staff' && req.body.status === 'Cancelled') {
    let connection;
    try {
      connection = await getDbConnection();
      const [orderRows] = await connection.query(
        "SELECT requester_id, status FROM item_requests WHERE id = ?",
        [req.params.id] // Get the order ID from route parameters
      );

      if (orderRows.length === 0) {
        return res.status(404).json({ message: "Order not found." });
      }

      const order = orderRows[0];
      // Check if the current user is the requester AND the order is in a cancellable state
      // (not yet approved, rejected, fulfilled, or already cancelled by someone else/admin)
      if (order.requester_id === req.userId &&
          !(order.status === 'Approved' || order.status === 'Rejected' || order.status === 'Fulfilled' || order.status === 'Cancelled')) {
        return next(); // Staff can proceed to cancel their own order
      } else {
        // Staff user is trying to cancel someone else's order, or an order that's not cancellable by them
        return res.status(403).json({ message: "Forbidden: You do not have permission to cancel this specific order." });
      }
    } catch (err) {
      console.error("canModifyOrders Middleware Error (Staff cancel logic):", err.message, err.stack);
      return res.status(500).json({ message: "Server error during permission check for cancellation." });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  // 3. If none of the above conditions are met, the user does not have permission
  return res.status(403).json({ message: "Forbidden: Insufficient permissions to modify orders." });
};

// Route: POST a new item request (Staff, Admin, DeptHead, StockManager can request)
orderRouter.post("/request", verifyToken, async (req, res) => {
  let connection;
  const { item_name, requested_quantity, notes } = req.body;
  const requesterId = req.userId;
  const requesterName = req.userFullname;
  const requesterDepartmentId = req.userDepartmentId;
  const requesterDepartmentName = req.userDepartmentName;

  if (!item_name || !requested_quantity || requested_quantity <= 0) {
    return res.status(400).json({ message: "Item name and a positive requested quantity are required." });
  }

  try {
    connection = await getDbConnection();
    await connection.beginTransaction();

    const [itemRows] = await connection.query(
      "SELECT id, quantity FROM inventory_items WHERE item_name = ?",
      [item_name]
    );

    if (itemRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: `Item "${item_name}" not found in inventory.` });
    }
    const itemId = itemRows[0].id;
    const currentStock = itemRows[0].quantity;

    const [result] = await connection.query(
      `INSERT INTO item_requests (
         item_id, item_name, requested_quantity, requester_id, requester_name,
         requester_department_id, requester_department_name, notes, status, request_date
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        itemId,
        item_name,
        requested_quantity,
        requesterId,
        requesterName,
        requesterDepartmentId,
        requesterDepartmentName,
        notes || null,
        'Pending',
        new Date()
      ]
    );

    await connection.commit();

    res.status(201).json({ message: "Item request submitted successfully!", requestId: result.insertId, currentStock: currentStock });
  } catch (err) {
    if (connection) {
      await connection.rollback();
    }
    console.error("Error submitting item request:", err.message, err.stack);
    res.status(500).json({ message: "Failed to submit item request due to a server error." });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});


// Route: GET all item requests (for "All Item Requests" page - /api/orders)
orderRouter.get("/", verifyToken, async (req, res) => {
  let connection;
  const userRole = req.userRole;
  const userId = req.userId;
  const userDepartmentId = req.userDepartmentId;

  let query = `
    SELECT
        ir.*,
        ii.quantity AS current_stock,
        u.department_id AS requester_department_id,
        d.name AS requester_department_name,
        approved_by.fullname AS approved_by_name,
        approved_by.role AS approved_by_role,
        rejected_by.fullname AS rejected_by_name,
        rejected_by.role AS rejected_by_role,
        fulfilled_by.fullname AS fulfilled_by_name,
        fulfilled_by.role AS fulfilled_by_role
    FROM
        item_requests ir
    JOIN
        inventory_items ii ON ir.item_id = ii.id
    JOIN
        users u ON ir.requester_id = u.id
    LEFT JOIN
        departments d ON u.department_id = d.id
    LEFT JOIN
        users approved_by ON ir.approved_by_id = approved_by.id
    LEFT JOIN
        users rejected_by ON ir.rejected_by_id = rejected_by.id
    LEFT JOIN
        users fulfilled_by ON ir.fulfilled_by_id = fulfilled_by.id
  `;
  let conditions = [];
  let params = [];

  if (userRole === 'Admin' || userRole === 'StockManager') {
    // Admins and Stock Managers see ALL orders. No conditions needed.
  } else if (userRole === 'DepartmentHead') {
    // Department Heads see ONLY orders from their department
    if (userDepartmentId) {
      conditions.push("u.department_id = ?");
      params.push(userDepartmentId);
    } else {
      return res.status(200).json([]);
    }
  } else { // Staff, Viewer, etc.
    // Default for Staff, Viewer, etc. - only see their own requests
    conditions.push("ir.requester_id = ?");
    params.push(userId);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  query += " ORDER BY ir.request_date DESC";

  try {
    connection = await getDbConnection();
    const [rows] = await connection.query(query, params);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching item requests for / (order history):", err.message, err.stack);
    res.status(500).json({ message: "Failed to fetch item requests due to a server error." });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Route: GET department-specific item requests (for DepartmentPage)
orderRouter.get("/department-requests", verifyToken, async (req, res) => {
    let connection;
    const userRole = req.userRole;
    const userDepartmentId = req.userDepartmentId;

    const allowedAccessRoles = ['Admin', 'DepartmentHead', 'StockManager'];

    if (!allowedAccessRoles.includes(userRole)) {
        return res.status(403).json({ message: "Forbidden: You do not have permission to view department requests." });
    }

    if (userRole === 'DepartmentHead' && !userDepartmentId) {
        return res.status(403).json({ message: "Forbidden: Department Head is not assigned to a department." });
    }
    
    let query = `
        SELECT
            ir.*,
            ii.quantity AS current_stock,
            u.department_id AS requester_department_id,
            d.name AS requester_department_name,
            approved_by.fullname AS approved_by_name,
            approved_by.role AS approved_by_role,
            rejected_by.fullname AS rejected_by_name,
            rejected_by.role AS rejected_by_role,
            fulfilled_by.fullname AS fulfilled_by_name,
            fulfilled_by.role AS fulfilled_by_role
        FROM
            item_requests ir
        JOIN
            inventory_items ii ON ir.item_id = ii.id
        JOIN
            users u ON ir.requester_id = u.id
        LEFT JOIN
            departments d ON u.department_id = d.id
        LEFT JOIN
            users approved_by ON ir.approved_by_id = approved_by.id
        LEFT JOIN
            users rejected_by ON ir.rejected_by_id = rejected_by.id
        LEFT JOIN
            users fulfilled_by ON ir.fulfilled_by_id = fulfilled_by.id
    `;
    let params = [];

    if (userRole === 'DepartmentHead') {
        query += ` WHERE u.department_id = ?`;
        params.push(userDepartmentId);
    }

    query += ` ORDER BY ir.request_date DESC`;

    try {
        connection = await getDbConnection();
        const [rows] = await connection.query(query, params);
        res.status(200).json(rows);
    } catch (err) {
        console.error("Error fetching department-specific item requests:", err.message, err.stack);
        res.status(500).json({ message: "Failed to fetch department requests due to a server error." });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});


// Route: PUT to update request status (Admin/DeptHead/StockManager and specific Staff for cancel)
orderRouter.put("/:id/status", verifyToken, canModifyOrders, async (req, res) => {
  let connection;
  const requestId = req.params.id;
  const { status, fulfilled_quantity, rejection_reason, admin_notes } = req.body;
  const adminId = req.userId;
  const adminName = req.userFullname;
  const userRole = req.userRole;

  const allowedStatuses = ['Pending', 'DepartmentApproved', 'Approved', 'Rejected', 'Fulfilled', 'Cancelled'];
  if (!status || !allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status provided." });
  }
  if (status === 'Fulfilled' && (typeof fulfilled_quantity !== 'number' || fulfilled_quantity < 0)) {
    return res.status(400).json({ message: "Fulfilled quantity must be a non-negative number for 'Fulfilled' status." });
  }
  if (status === 'Rejected' && (!rejection_reason || rejection_reason.trim() === '')) {
      return res.status(400).json({ message: "Rejection reason is required when status is 'Rejected'." });
  }

  try {
    connection = await getDbConnection();
    await connection.beginTransaction();

    const [requestRows] = await connection.query(
      `SELECT
          ir.item_id, ir.requested_quantity, ir.status, ir.fulfilled_quantity, ir.requester_id,
          ii.quantity AS current_stock
       FROM item_requests ir
       JOIN inventory_items ii ON ir.item_id = ii.id
       WHERE ir.id = ? FOR UPDATE`,
      [requestId]
    );

    if (requestRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Item request not found." });
    }
    const currentRequest = requestRows[0];
    const { item_id, requested_quantity, status: currentStatus, fulfilled_quantity: alreadyFulfilled, requester_id } = currentRequest;
    const currentItemStock = currentRequest.current_stock;


    // Prevent Department Head from approving/rejecting their own request
    if (userRole === 'DepartmentHead' && adminId === requester_id && (status === 'DepartmentApproved' || status === 'Rejected')) {
        await connection.rollback();
        return res.status(403).json({ message: "Forbidden: You cannot approve or reject your own requests." });
    }

    // --- Status Transition Validation ---
    if (currentStatus === 'Fulfilled' || currentStatus === 'Rejected' || currentStatus === 'Cancelled') {
        await connection.rollback();
        return res.status(400).json({ message: `Cannot update request: It is already ${currentStatus}.` });
    }
    if (status === 'DepartmentApproved' && currentStatus !== 'Pending') {
        await connection.rollback();
        return res.status(400).json({ message: `Cannot set status to 'DepartmentApproved': Current status is '${currentStatus}', must be 'Pending'.` });
    }
    if (status === 'Approved' && !(currentStatus === 'Pending' || currentStatus === 'DepartmentApproved')) {
        await connection.rollback();
        return res.status(400).json({ message: `Cannot approve request: Current status is '${currentStatus}', must be 'Pending' or 'DepartmentApproved'.` });
    }
    if (status === 'Rejected' && !(currentStatus === 'Pending' || currentStatus === 'DepartmentApproved')) {
        await connection.rollback();
        return res.status(400).json({ message: `Cannot reject request: Current status is '${currentStatus}', must be 'Pending' or 'DepartmentApproved'.` });
    }
    if (status === 'Fulfilled' && !(currentStatus === 'Approved' || currentStatus === 'DepartmentApproved')) {
        await connection.rollback();
        return res.status(400).json({ message: `Requests must be 'Approved' or 'DepartmentApproved' before they can be fulfilled.` });
    }


    // --- Core Logic for Status Update ---
    if (status === 'Fulfilled') {
        const quantityToDeduct = fulfilled_quantity;

        const remainingToFulfill = requested_quantity - (alreadyFulfilled || 0);

        if (quantityToDeduct > remainingToFulfill) {
            await connection.rollback();
            return res.status(400).json({ message: `Cannot fulfill more than requested. Only ${remainingToFulfill} units remaining to fulfill.` });
        }

        const [lockedItemRows] = await connection.query(
            "SELECT quantity FROM inventory_items WHERE id = ? FOR UPDATE",
            [item_id]
        );
        const currentLockedItemStock = lockedItemRows[0].quantity;

        if (quantityToDeduct > currentLockedItemStock) {
            await connection.rollback();
            return res.status(409).json({ message: `Insufficient stock to fulfill ${quantityToDeduct} units. Only ${currentLockedItemStock} available.` });
        }

        // Deduct from inventory_items
        const [itemUpdateResult] = await connection.query(
            "UPDATE inventory_items SET quantity = quantity - ?, updated_at = NOW(), updated_by_id = ? WHERE id = ?",
            [quantityToDeduct, adminId, item_id]
        );
        if (itemUpdateResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(500).json({ message: "Failed to update inventory quantity during fulfillment." });
        }

        const newTotalFulfilled = (alreadyFulfilled || 0) + quantityToDeduct;
        const finalStatusForRequest = (newTotalFulfilled >= requested_quantity) ? 'Fulfilled' : 'Approved';

        await connection.query(
          `UPDATE item_requests
           SET status = ?, fulfilled_quantity = ?, fulfilled_by_id = ?, fulfilled_by_name = ?, fulfilled_by_role = ?,
               response_date = NOW(), rejection_reason = NULL,
               approved_by_id = NULL, approved_by_name = NULL, approved_by_role = NULL,
               rejected_by_id = NULL, rejected_by_name = NULL, rejected_by_role = NULL,
               admin_notes = ?
           WHERE id = ?`,
          [
            finalStatusForRequest,
            newTotalFulfilled,
            adminId,
            adminName,
            userRole,
            admin_notes || null,
            requestId
          ]
        );

    } else { // For DepartmentApproved, Approved, Rejected, or Cancelled status updates
        let updateFields = `status = ?, response_date = NOW()`;
        let updateValues = [status];

        // Clear all previous action-related fields at the beginning of the update
        updateFields += `, approved_by_id = NULL, approved_by_name = NULL, approved_by_role = NULL,
                         rejected_by_id = NULL, rejected_by_name = NULL, rejected_by_role = NULL,
                         fulfilled_by_id = NULL, fulfilled_by_name = NULL, fulfilled_by_role = NULL,
                         rejection_reason = NULL, fulfilled_quantity = 0`;

        // Conditionally set the relevant fields for the new status
        if (status === 'Approved' || status === 'DepartmentApproved') {
            updateFields += `, approved_by_id = ?, approved_by_name = ?, approved_by_role = ?`;
            updateValues.push(adminId, adminName, userRole);
        } else if (status === 'Rejected') {
            updateFields += `, rejected_by_id = ?, rejected_by_name = ?, rejected_by_role = ?, rejection_reason = ?`;
            updateValues.push(adminId, adminName, userRole, rejection_reason || null);
        } else if (status === 'Cancelled') {
            // No specific fields to set here, as everything is cleared by default logic for Cancelled status
        }
        
        // Add general admin notes (can be present for any status update)
        updateFields += `, admin_notes = ?`;
        updateValues.push(admin_notes || null);

        updateValues.push(requestId); // For WHERE clause

        await connection.query(
          `UPDATE item_requests
           SET ${updateFields}
           WHERE id = ?`,
          updateValues
        );
    }

    await connection.commit();

    const [updatedRequestRows] = await connection.query(
      `SELECT
          ir.*,
          ii.quantity AS current_stock,
          u.department_id AS requester_department_id,
          d.name AS requester_department_name,
          approved_by.fullname AS approved_by_name,
          approved_by.role AS approved_by_role,
          rejected_by.fullname AS rejected_by_name,
          rejected_by.role AS rejected_by_role,
          fulfilled_by.fullname AS fulfilled_by_name,
          fulfilled_by.role AS fulfilled_by_role
       FROM item_requests ir
       JOIN inventory_items ii ON ir.item_id = ii.id
       JOIN users u ON ir.requester_id = u.id
       LEFT JOIN departments d ON u.department_id = d.id
       LEFT JOIN users approved_by ON ir.approved_by_id = approved_by.id
       LEFT JOIN users rejected_by ON ir.rejected_by_id = rejected_by.id
       LEFT JOIN users fulfilled_by ON ir.fulfilled_by_id = fulfilled_by.id
       WHERE ir.id = ?`,
      [requestId]
    );

    res.status(200).json({ message: "Request updated successfully!", request: updatedRequestRows[0] });

  } catch (err) {
    if (connection) {
      await connection.rollback();
    }
    console.error("Error updating item request status:", err.message, err.stack);
    res.status(500).json({ message: err.sqlMessage || err.message || "Failed to update request status due to a server error." });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});


export default orderRouter;
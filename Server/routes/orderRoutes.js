// orderRoutes.js - Manages item request/order routes for staff and admins

import express from "express";
import { connectToDatabase, getDbConnection } from "../lib/db.js"; // Assume connectToDatabase gets the pool, getDbConnection gets a connection from the pool
import jwt from "jsonwebtoken";

const orderRouter = express.Router();

// Middleware: Verify JWT Token (already present and correct)
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
    next();
  } catch (err) {
    console.error("Token verification error in orderRoutes:", err.name, err.message);
    if (err.name === 'TokenExpiredError') return res.status(401).json({ message: "Token expired" });
    if (err.name === 'JsonWebTokenError') return res.status(401).json({ message: "Invalid token" });
    return res.status(500).json({ message: "Token authentication failed" });
  }
};

// NEW: Define canModifyInventory middleware with proper connection handling
const canModifyInventory = async (req, res, next) => {
  const allowedRoles = ['Admin', 'DepartmentHead', 'StockManager'];
  // Fast path: Check user role from decoded token first
  if (allowedRoles.includes(req.userRole)) {
    return next();
  }

  // Fallback to DB check for robust security (if role from token might be stale or tampered with)
  let connection;
  try {
    connection = await getDbConnection(); // Get a connection from the pool
    const [rows] = await connection.query(
      "SELECT role FROM users WHERE id = ?",
      [req.userId]
    );

    if (rows.length === 0 || !allowedRoles.includes(rows[0].role)) {
      return res.status(403).json({ message: "Forbidden: Insufficient permissions to modify inventory." });
    }
    next();
  } catch (err) {
    console.error("canModifyInventory Middleware Error in orderRoutes:", err.message, err.stack);
    return res.status(500).json({ message: "Server error during permission check." });
  } finally {
    if (connection) {
      connection.release(); // IMPORTANT: Release the connection back to the pool
    }
  }
};

// Route: POST a new item request (Staff, Admin, DeptHead, StockManager can request)
orderRouter.post("/request", verifyToken, async (req, res) => {
  let connection;
  const { item_name, requested_quantity, notes } = req.body;
  const requesterId = req.userId;
  const requesterName = req.userFullname;

  if (!item_name || !requested_quantity || requested_quantity <= 0) {
    return res.status(400).json({ message: "Item name and a positive requested quantity are required." });
  }

  try {
    connection = await getDbConnection();
    await connection.beginTransaction();

    // First, verify item existence and get its ID and current quantity
    const [itemRows] = await connection.query(
      "SELECT id, quantity FROM inventory_items WHERE item_name = ? FOR UPDATE",
      [item_name]
    );

    if (itemRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: `Item "${item_name}" not found in inventory.` });
    }
    const itemId = itemRows[0].id;
    const currentStock = itemRows[0].quantity;

    // Check if item is available for immediate fulfillment (optional, depends on workflow)
    // For now, requests are always created, and stock deduction happens on fulfillment.

    // Insert the new request
    const [result] = await connection.query(
      `INSERT INTO item_requests (item_id, item_name, requested_quantity, requester_id, requester_name, notes, status, request_date)
       VALUES (?, ?, ?, ?, ?, ?, 'Pending', NOW())`,
      [itemId, item_name, requested_quantity, requesterId, requesterName, notes || null]
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


// Route: GET all item requests (for Admin/DeptHead/StockManager - or individual staff's requests)
orderRouter.get("/", verifyToken, async (req, res) => {
  let connection;
  const userRole = req.userRole;
  const userId = req.userId;

  let query = "SELECT ir.*, ii.quantity AS current_stock FROM item_requests ir JOIN inventory_items ii ON ir.item_id = ii.id";
  let params = [];

  // Conditional logic for fetching requests based on user role
  const allowedViewAllRoles = ['Admin', 'DepartmentHead', 'StockManager'];
  if (!allowedViewAllRoles.includes(userRole)) {
    // If not an allowed role, only fetch their own requests
    query += " WHERE ir.requester_id = ?";
    params.push(userId);
  }

  query += " ORDER BY ir.request_date DESC"; // Order by most recent first

  try {
    connection = await getDbConnection();
    const [rows] = await connection.query(query, params);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching item requests:", err.message, err.stack);
    res.status(500).json({ message: "Failed to fetch item requests due to a server error." });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Route: PUT to update request status (Admin/DeptHead/StockManager only)
orderRouter.put("/:id/status", verifyToken, canModifyInventory, async (req, res) => {
  let connection;
  const requestId = req.params.id;
  const { status, fulfilled_quantity, admin_notes } = req.body;
  const adminId = req.userId;
  const adminName = req.userFullname;

  // Input Validation
  const allowedStatuses = ['Pending', 'Approved', 'Rejected', 'Fulfilled'];
  if (!status || !allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status provided." });
  }
  if (status === 'Fulfilled' && (typeof fulfilled_quantity !== 'number' || fulfilled_quantity < 0)) {
    return res.status(400).json({ message: "Fulfilled quantity must be a non-negative number for 'Fulfilled' status." });
  }

  try {
    connection = await getDbConnection();
    await connection.beginTransaction();

    // 1. Get current request details
    const [requestRows] = await connection.query(
      "SELECT item_id, requested_quantity, status, fulfilled_quantity FROM item_requests WHERE id = ? FOR UPDATE",
      [requestId]
    );

    if (requestRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Item request not found." });
    }
    const currentRequest = requestRows[0];

    // Check if the current status allows for the transition
    if (status === 'Approved' && currentRequest.status !== 'Pending') {
      await connection.rollback();
      return res.status(400).json({ message: "Only pending requests can be approved." });
    }
    if (status === 'Rejected' && currentRequest.status !== 'Pending') {
      await connection.rollback();
      return res.status(400).json({ message: "Only pending requests can be rejected." });
    }
    if (status === 'Fulfilled' && (currentRequest.status !== 'Approved' && currentRequest.status !== 'Fulfilled')) {
        await connection.rollback();
        return res.status(400).json({ message: "Only approved or partially fulfilled requests can be fulfilled." });
    }


    // Handle fulfillment logic
    if (status === 'Fulfilled') {
        const quantityToDeduct = fulfilled_quantity; // This is the exact amount to deduct for this fulfillment action

        // Get current stock of the item from inventory_items
        const [itemStockRows] = await connection.query(
            "SELECT quantity FROM inventory_items WHERE id = ? FOR UPDATE",
            [currentRequest.item_id]
        );

        if (itemStockRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "Inventory item not found for fulfillment." });
        }

        const currentItemStock = itemStockRows[0].quantity;
        const totalFulfilledBefore = currentRequest.fulfilled_quantity || 0;
        const remainingToFulfill = currentRequest.requested_quantity - totalFulfilledBefore;

        if (quantityToDeduct > remainingToFulfill) {
            await connection.rollback();
            return res.status(400).json({ message: `Cannot fulfill more than requested. Only ${remainingToFulfill} units remaining to fulfill.` });
        }

        if (quantityToDeduct > currentItemStock) {
            await connection.rollback();
            return res.status(409).json({ message: `Insufficient stock to fulfill ${quantityToDeduct} units. Only ${currentItemStock} available.` });
        }

        // Deduct from inventory_items
        const [itemUpdateResult] = await connection.query(
            "UPDATE inventory_items SET quantity = quantity - ?, updated_at = NOW(), updated_by = ? WHERE id = ?",
            [quantityToDeduct, adminId, currentRequest.item_id]
        );
        if (itemUpdateResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(500).json({ message: "Failed to update inventory quantity during fulfillment." });
        }

        // Update item_requests table: increment fulfilled_quantity and set status to 'Fulfilled' if fully fulfilled
        const newFulfilledQuantity = totalFulfilledBefore + quantityToDeduct;
        const newStatusForRequest = (newFulfilledQuantity >= currentRequest.requested_quantity) ? 'Fulfilled' : 'Approved'; // Keep as 'Approved' if partially fulfilled

        await connection.query(
          `UPDATE item_requests
           SET status = ?, fulfilled_quantity = ?, approved_by_id = ?, approved_by_name = ?, response_date = NOW(), admin_notes = ?
           WHERE id = ?`,
          [
            newStatusForRequest,
            newFulfilledQuantity,
            adminId,
            adminName,
            admin_notes || null,
            requestId
          ]
        );

    } else { // For Approved or Rejected status updates (no stock deduction)
        await connection.query(
          `UPDATE item_requests
           SET status = ?, approved_by_id = ?, approved_by_name = ?, response_date = NOW(), admin_notes = ?
           WHERE id = ?`,
          [
            status,
            adminId,
            adminName,
            admin_notes || null,
            requestId
          ]
        );
    }

    await connection.commit();

    // 3. Fetch the updated request to return
    const [updatedRequestRows] = await connection.query(
      "SELECT ir.*, ii.quantity AS current_stock FROM item_requests ir JOIN inventory_items ii ON ir.item_id = ii.id WHERE ir.id = ?",
      [requestId]
    );

    res.status(200).json({ message: "Request updated successfully!", request: updatedRequestRows[0] });

  } catch (err) {
    if (connection) {
      await connection.rollback();
    }
    console.error("Error updating item request status:", err.message, err.stack);
    res.status(500).json({ message: "Failed to update request status due to a server error." });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});


export default orderRouter;
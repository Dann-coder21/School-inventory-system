// itemController.js - Controller logic for inventory item operations

import { connectToDatabase } from "../lib/db.js"; // Expects this to return the DB pool

const addItem = async (req, res) => {
  const { itemName, category, quantity, location, dateAdded, status } = req.body;
  const userId = req.userId; // Extracted by verifyToken middleware

  console.log("addItem Controller - User ID:", userId, "Item Data:", req.body);

  // Basic validation for required fields
  if (!itemName || !category || quantity === undefined) { // Quantity can be 0
    return res.status(400).json({
      success: false,
      message: "Missing required fields: itemName, category, and quantity are mandatory."
    });
  }

  try {
    const pool = await connectToDatabase(); // Get the database pool

    // Case-insensitive duplicate check for the same user
    const [existingItems] = await pool.query(
      `SELECT id FROM inventory_items 
       WHERE LOWER(item_name) = LOWER(?) AND user_id = ?`,
      [itemName.trim(), userId]
    );

    if (existingItems.length > 0) {
      return res.status(409).json({ 
        success: false,
        message: "An item with this name already exists in your inventory.",
        existingId: existingItems[0].id
      });
    }

    // Prepare data for insertion
    const itemNameToInsert = itemName.trim();
    const quantityToInsert = Math.max(0, Number(quantity)); // Ensure non-negative number
    const dateToInsert = dateAdded || new Date().toISOString().slice(0, 10); // Default to today
    const statusToInsert = status || (quantityToInsert > 0 ? 'Available' : 'Out of Stock'); // Default status based on quantity

    // Insert the new item
    const [result] = await pool.query(
      `INSERT INTO inventory_items 
      (item_name, category, quantity, location, date_added, status, user_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        itemNameToInsert,
        category,
        quantityToInsert,
        location || null, // Handle optional location
        dateToInsert,
        statusToInsert,
        userId
      ]
    );

    // Fetch the newly inserted item to return it in the response
    const [newItemRows] = await pool.query(
      `SELECT * FROM inventory_items WHERE id = ?`,
      [result.insertId]
    );
    
    if (newItemRows.length === 0) {
        console.error("addItem Controller - Failed to retrieve newly added item. Insert ID:", result.insertId);
        // This should ideally not happen if insert was successful
        return res.status(500).json({
            success: false,
            message: "Item was added, but there was an issue retrieving it."
        });
    }

    return res.status(201).json({ 
      success: true,
      message: "Item added successfully to your inventory.",
      item: newItemRows[0] 
    });

  } catch (err) {
    console.error("addItem Controller - Database Error:", err.message, err.stack);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to add item due to a server error. Please try again.'
    });
  }
};

export default addItem;
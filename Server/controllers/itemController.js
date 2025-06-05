// itemController.js - Controller logic for inventory item operations

import { connectToDatabase } from "../lib/db.js"; // Expects this to return the DB pool

const addItem = async (req, res) => {
  const userId = req.userId; // Extracted by verifyToken middleware
  // const userFullname = req.userFullname; // If you want to use this for logging purposes

  console.log("addItem Controller - User ID:", userId, "Item Data:", req.body);

  // Destructure item data from request body
  const {
    itemName,
    category,
    quantity,
    location,
    costPrice, // Corrected from 'price'
    dateAdded,
  } = req.body;

  // --- Input Validation (Crucial backend validation) ---
  if (!itemName || itemName.trim() === '') {
    return res.status(400).json({ success: false, message: "Item Name is required." });
  }
  if (!category || category.trim() === '') {
    return res.status(400).json({ success: false, message: "Category is required." });
  }
  if (quantity === undefined || isNaN(Number(quantity)) || Number(quantity) < 0) {
    return res.status(400).json({ success: false, message: "Quantity must be a non-negative number." });
  }
  if (!location || location.trim() === '') { // Assuming location is mandatory
    return res.status(400).json({ success: false, message: "Location is required." });
  }
  if (costPrice === undefined || isNaN(Number(costPrice)) || Number(costPrice) < 0) {
    return res.status(400).json({ success: false, message: "Cost Price must be a non-negative number." });
  }
  if (dateAdded && isNaN(new Date(dateAdded).getTime())) {
    return res.status(400).json({ success: false, message: "Invalid Date Added format." });
  }

  try {
    const pool = await connectToDatabase(); // Get the database pool

    // Case-insensitive duplicate check for the same user
    const [existingItems] = await pool.query(
      `SELECT id FROM inventory_items
       WHERE LOWER(item_name) = LOWER(?) AND category = ? AND location = ?`, // Added category and location to duplicate check
      [itemName.trim(), category.trim(), location.trim()]
    );

    if (existingItems.length > 0) {
      return res.status(409).json({
        success: false,
        message: "An item with this name, category, and location already exists.",
        existingId: existingItems[0].id
      });
    }

    // Prepare data for insertion
    const quantityToInsert = Number(quantity);
    const costPriceToInsert = Number(costPrice);
    const dateToInsert = dateAdded || new Date().toISOString().slice(0, 10); // Default to today if not provided

    // Insert the new item
    const [result] = await pool.query(
      `INSERT INTO inventory_items
      (item_name, category, quantity, location, cost_price, date_added, created_by, updated_at, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)`, // <-- REMOVED THE COMMENT HERE
      [
        itemName.trim(),
        category.trim(),
        quantityToInsert,
        location.trim(),
        costPriceToInsert,
        dateToInsert,
        userId,
        userId
      ]
    );

    // Fetch the newly inserted item to return it in the response
    const [newItemRows] = await pool.query(
      `SELECT id, item_name, category, quantity, location, cost_price, date_added, created_by, updated_at, updated_by FROM inventory_items WHERE id = ?`,
      [result.insertId]
    );

    if (newItemRows.length === 0) {
        console.error("addItem Controller - Failed to retrieve newly added item. Insert ID:", result.insertId);
        return res.status(500).json({
            success: false,
            message: "Item was added, but there was an issue retrieving it."
        });
    }

    return res.status(201).json({
      success: true,
      message: "Item added successfully!",
      item: newItemRows[0]
    });

  } catch (err) {
    console.error("addItem Controller - Database Error:", err.message, err.stack);
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, message: "Duplicate item entry. An item with this name, category, and location might already exist." });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to add item due to a server error. Please try again.'
    });
  }
};

export default addItem;
import { connectToDatabase } from "../lib/db.js";

const addItem = async (req, res) => {
  const { itemName, category, quantity, location, dateAdded, status } = req.body;
  const userId = req.userId; // From verifyToken middleware

  try {
    const db = await connectToDatabase();

    // 1. Case-insensitive duplicate check
    const [existingItems] = await db.query(
      `SELECT id FROM inventory_items 
       WHERE LOWER(item_name) = LOWER(?) AND user_id = ?`,
      [itemName, userId]
    );

    if (existingItems.length > 0) {
      return res.status(409).json({ 
        success: false,
        message: "Item already exists in your inventory",
        existingId: existingItems[0].id // Helpful for frontend
      });
    }

    // 2. Insert with input validation
    const [result] = await db.query(
      `INSERT INTO inventory_items 
      (item_name, category, quantity, location, date_added, status, user_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        itemName.trim(),       // Trim whitespace
        category,
        Math.max(0, quantity), // Ensure non-negative
        location,
        dateAdded || new Date().toISOString().slice(0, 10), // Default to today
        status || 'active',    // Default status
        userId
      ]
    );
    const [newItem] = await db.query(
      `SELECT * FROM inventory_items WHERE id = ?`,
      [result.insertId]
    );
    
    return res.status(201).json({ 
      success: true,
      message: "Item added successfully",
      item: newItem[0] 
    });

  } catch (err) {
    console.error("Database error:", err);
    return res.status(500).json({ 
      success: false,
      message: process.env.NODE_ENV === 'development' 
        ? err.message 
        : 'Failed to add item'
    });
  }
};

export default addItem;
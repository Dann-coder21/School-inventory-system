import React, { createContext, useState, useEffect } from "react";

export const InventoryContext = createContext();

export const InventoryProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch items from backend on load
  const fetchItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get("http://localhost:3000/items/inventory", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems(response.data);
    } catch (err) {
      console.error("Failed to fetch items:", err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchItems();
  }, []);

  // Add item (now syncs with backend)
  const addItem = async (newItem) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        "http://localhost:3000/items/inventory",
        newItem,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update state with the new item from backend
      setItems(prev => [...prev, response.data.item]);
    } catch (err) {
      console.error("Failed to add item:", err);
      throw err; // Let the form handle the error
    }
  };

  return (
    <InventoryContext.Provider value={{ items, loading, addItem, fetchItems }}>
      {children}
    </InventoryContext.Provider>
  );
};
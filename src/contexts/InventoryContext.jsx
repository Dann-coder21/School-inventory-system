import React, { createContext, useState, useEffect } from "react";
import axios from "axios";


export const InventoryContext = createContext();

export const InventoryProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add a function to handle storage events
  const handleStorageChange = (event) => {
    if (event.key === 'inventoryData') {
      try {
        const newData = JSON.parse(event.newValue);
        if (newData && newData.data) {
          setItems(newData.data);
        }
      } catch (err) {
        console.error("Failed to parse updated inventory data", err);
      }
    }
  };

  useEffect(() => {
    // Add storage event listener
    window.addEventListener('storage', handleStorageChange);
    
    // Initial data load
    fetchItems();

    return () => {
      // Clean up the event listener
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      // 1. Fetch from database
      const { data } = await axios.get("http://localhost:3000/items/inventory", {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000
      });

      // 2. Update state and cache
      setItems(data);
      localStorage.setItem('inventoryData', JSON.stringify({
        data,
        lastUpdated: new Date().toISOString()
      }));

    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);
      
      // 3. Fallback to cache if available
      try {
        const cache = localStorage.getItem('inventoryData');
        if (cache) {
          const parsed = JSON.parse(cache);
          if (parsed.data) setItems(parsed.data);
        }
      } catch (cacheError) {
        console.error("Cache read error:", cacheError);
      }
    } finally {
      setLoading(false);
    }
  };

  // Add a function to update local storage and state consistently
  const updateItems = (newItems) => {
    setItems(newItems);
    localStorage.setItem('inventoryData', JSON.stringify({
      data: newItems,
      lastUpdated: new Date().toISOString()
    }));
  };

  const addItem = async (newItem) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      // 1. Send to backend
      const response = await axios.post(
        "http://localhost:3000/items/inventory",
        newItem,
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000
        }
      );

      // 2. Refresh data from server
      await fetchItems();
      
      return response.data.item;

    } catch (err) {
      console.error('Add item error:', err);
      throw err;
    }
  };

  return (
    <InventoryContext.Provider value={{ 
      items, 
      loading, 
      error, 
      addItem, 
      fetchItems,
      updateItems // Expose the update function
    }}>
      {children}
    </InventoryContext.Provider>
  );
};
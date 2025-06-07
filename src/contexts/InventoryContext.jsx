// src/context/InventoryContext.js

import React, { createContext, useState, useEffect, useCallback } from "react";
import axios from "axios";


// --- RECTIFIED CODE STARTS HERE ---

// Define the API_BASE_URL using Vite's environment variable syntax.
//
// import.meta.env.VITE_API_BASE_URL: This is where Vercel (or Vite's build)
//                                     will inject the actual deployed backend URL.
//                                     Vite requires environment variables to start with VITE_.
//
// "http://localhost:3000": This is a fallback for your local development environment.
//                          If import.meta.env.VITE_API_BASE_URL is not set (e.g., when
//                          running `npm run dev` locally without a .env file configured),
//                          it will default to this local URL.
//
// IMPORTANT: Adjust "http://localhost:3000" if your local backend runs on a different port.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// --- RECTIFIED CODE ENDS HERE ---


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

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      // --- RECTIFIED: Use API_BASE_URL for GET request ---
      const { data } = await axios.get(`${API_BASE_URL}/items/inventory`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000
      });
      // --- END RECTIFIED ---

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
  }, []); // Empty dependency array as API_BASE_URL is constant, and no other external mutable state is used directly by fetchItems.


  useEffect(() => {
    // Add storage event listener
    window.addEventListener('storage', handleStorageChange);

    // Initial data load
    fetchItems(); // Now fetchItems is a stable function due to useCallback

    return () => {
      // Clean up the event listener
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchItems]); // fetchItems is a dependency because it's used inside useEffect, though it's stable.


  // Add a function to update local storage and state consistently
  const updateItems = (newItems) => {
    setItems(newItems);
    localStorage.setItem('inventoryData', JSON.stringify({
      data: newItems,
      lastUpdated: new Date().toISOString()
    }));
  };

  const addItem = useCallback(async (newItem) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      // --- RECTIFIED: Use API_BASE_URL for POST request ---
      const response = await axios.post(
        `${API_BASE_URL}/items/inventory`,
        newItem,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000
        }
      );
      // --- END RECTIFIED ---

      // 2. Refresh data from server
      await fetchItems(); // fetchItems is stable from useCallback

      return response.data.item;

    } catch (err) {
      console.error('Add item error:', err);
      throw err;
    }
  }, [fetchItems]); // fetchItems is a dependency here as it's called.


  return (
    <InventoryContext.Provider value={{
      items,
      loading,
      error,
      setItems,
      addItem,
      fetchItems,
      updateItems // Expose the update function
    }}>
      {children}
    </InventoryContext.Provider>
  );
};
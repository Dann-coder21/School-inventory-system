// src/contexts/OrderContext.js
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';

// --- RECTIFIED CODE STARTS HERE ---

// Define the API_BASE_URL using Vite's environment variable syntax.
// This ensures that:
// - In production (on Vercel), it uses your deployed backend URL (e.g., https://inventory-server.fly.dev).
// - In local development, it defaults to your local backend URL (e.g., http://localhost:3000).
// IMPORTANT: Adjust "http://localhost:3000" if your local backend runs on a different port.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// --- RECTIFIED CODE ENDS HERE ---


export const OrderContext = createContext(null);

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState(null);

  // Example function to fetch orders (will be used by StaffOrderPage)
  // It now uses the dynamic API_BASE_URL.
  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    setOrdersError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        // If no token, set error and clear orders. This typically means user is not logged in.
        setOrdersError(new Error('No authentication token found. User not authenticated to fetch orders.'));
        setOrders([]); // Clear any stale orders
        return;
      }
      // --- RECTIFIED: Use API_BASE_URL for GET request ---
      const response = await axios.get(`${API_BASE_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // --- END RECTIFIED ---
      setOrders(response.data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      // More robust error message extraction
      setOrdersError(err.response?.data?.message || err.message || 'Failed to load orders.');
      setOrders([]); // Clear orders on error
    } finally {
      setLoadingOrders(false);
    }
  }, []); // `fetchOrders` itself doesn't depend on outside variables that change
           // as `token` is fetched directly, so it's a stable callback.


  useEffect(() => {
    // Optionally fetch orders when component mounts.
    // In components like OrderTable.jsx, you might call fetchOrders based on isAuthenticated status
    // or when the component specifically needs a refresh.
    // Keep this commented out or uncomment based on your app's flow.
    // If you uncomment, consider adding authentication context to ensure it runs only when authenticated.
    // Example:
    // if (isAuthenticated) {
    //   fetchOrders();
    // }
  }, [fetchOrders]); // fetchOrders is a dependency here because it's used inside useEffect, though it's stable.


  const value = {
    orders,
    loadingOrders,
    ordersError,
    fetchOrders,
    // Add functions for submitting requests, updating status etc. here later if needed
  };

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
};

export const useOrders = () => useContext(OrderContext);
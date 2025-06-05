// src/contexts/OrderContext.js
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';

export const OrderContext = createContext(null);

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState(null);

  // Example function to fetch orders (will be used by StaffOrderPage)
  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    setOrdersError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setOrdersError(new Error('No authentication token found.'));
        return;
      }
      const response = await axios.get('http://localhost:3000/api/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setOrdersError(err.response?.data?.message || err.message || 'Failed to load orders.');
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    // Optionally fetch orders when component mounts
    // fetchOrders();
  }, [fetchOrders]);

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
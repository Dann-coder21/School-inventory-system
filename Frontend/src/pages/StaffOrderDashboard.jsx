import React, { useState, useEffect, useContext, useRef, useMemo, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import {
  MdDashboard, MdInventory, MdList, MdAssessment, MdSettings, 
  MdSchool, MdLogout, MdWbSunny, MdModeNight, MdAccountCircle, 
  MdHelpOutline, MdShoppingCart, MdSearch, MdAddShoppingCart, 
  MdHistory, MdCancel, MdCheckCircle, MdPendingActions, MdLocalShipping,
  MdMenu, MdClose, MdThumbUp, MdThumbDown
} from 'react-icons/md';
import Layout from '../Components/Layout/Layout';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const StaffOrderDashboard = () => {
  const { darkMode, setDarkMode } = useContext(ThemeContext);
  const { currentUser, isLoadingAuth, logout: authLogout } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('items');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notes, setNotes] = useState('');

  const profileButtonRef = useRef(null);
  const profileDropdownRef = useRef(null);

  const swalThemeProps = useMemo(() => ({
    background: darkMode ? 'rgba(30, 41, 59, 0.98)' : 'rgba(255, 255, 255, 0.98)',
    color: darkMode ? '#e2e8f0' : '#1e293b',
    customClass: {
      popup: 'rounded-xl shadow-2xl p-4 sm:p-6',
      confirmButton: `px-5 py-2.5 rounded-lg font-semibold text-white text-sm ${darkMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-500 hover:bg-indigo-600'}`,
      cancelButton: `px-5 py-2.5 rounded-lg font-semibold text-sm ${darkMode ? 'bg-slate-600 hover:bg-slate-500 text-slate-100' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`,
      title: `text-lg sm:text-xl font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`,
      htmlContainer: `text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`,
      icon: 'text-4xl sm:text-5xl mt-2 mb-2 sm:mb-4',
    },
    buttonsStyling: false,
    backdrop: `rgba(0,0,0,0.65)`
  }), [darkMode]);

  // Define fetchData here, wrapped in useCallback
  const fetchData = useCallback(async () => {
    if (!currentUser) return; // Ensure currentUser is available

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
          console.warn("No token found, redirecting to login.");
          navigate('/login');
          return;
      }

      // Fetch inventory items
      const itemsResponse = await axios.get(`${API_BASE_URL}/items/inventory`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems(itemsResponse.data);
      
      // Fetch order history for the current user
      const historyResponse = await axios.get("${API_BASE_URL}/api/orders", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrderHistory(historyResponse.data);

    } catch (error) {
      console.error("Failed to fetch data:", error);
      Swal.fire({
        ...swalThemeProps,
        title: 'Error',
        text: 'Failed to load data (items or order history).',
        icon: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, navigate, swalThemeProps]); // Dependencies for useCallback

  // Use useEffect to call fetchData when component mounts or dependencies change
  useEffect(() => {
    if (!isLoadingAuth && currentUser) {
      fetchData();
    }
  }, [isLoadingAuth, currentUser, fetchData]); // fetchData is now a dependency here

  // Handle theme switch
  const handleThemeSwitch = () => setDarkMode(!darkMode);

  // Logout function
  const handleLogout = () => {
    Swal.fire({
      ...swalThemeProps,
      title: 'Log Out?',
      text: 'Are you sure you want to end your session?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, log out',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        authLogout();
        navigate("/login");
      }
    });
  };

  // Profile dropdown click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if ( profileOpen && profileButtonRef.current && !profileButtonRef.current.contains(event.target) && profileDropdownRef.current && !profileDropdownRef.current.contains(event.target) ) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) { document.addEventListener("mousedown", handleClickOutside); }
    return () => { document.removeEventListener("mousedown", handleClickOutside); };
  }, [profileOpen]);


  // Filter items based on search and category
  const filteredItems = items.filter(item => {
    const itemName = item.item_name || '';
    const itemDescription = item.description || '';

    const matchesSearch = itemName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          itemDescription.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory && item.quantity > 0;
  });

  // Add to cart with stock validation
  const addToCart = (item) => {
    const inventoryItem = items.find(invItem => invItem.id === item.id);
    if (!inventoryItem || inventoryItem.quantity === 0) {
      Swal.fire({
        ...swalThemeProps,
        icon: 'warning',
        title: 'Out of Stock',
        text: `${item.item_name} is currently out of stock.`,
      });
      return;
    }

    const existingCartItem = cart.find(cartItem => cartItem.id === item.id);
    let newQuantityInCart = existingCartItem ? existingCartItem.quantity + 1 : 1;

    // Prevent adding more than available stock
    if (newQuantityInCart > inventoryItem.quantity) {
      Swal.fire({
        ...swalThemeProps,
        icon: 'warning',
        title: 'Quantity Limit Reached',
        text: `You cannot request more than ${inventoryItem.quantity} of ${item.item_name}.`,
      });
      return;
    }

    if (existingCartItem) {
      setCart(cart.map(cartItem => 
        cartItem.id === item.id 
          ? { ...cartItem, quantity: newQuantityInCart } 
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity: newQuantityInCart }]);
    }
    Swal.fire({
      ...swalThemeProps,
      title: 'Added to cart!',
      text: `${item.item_name} has been added to your order`,
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
    });
  };

  // Remove from cart
  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
    Swal.fire({
        ...swalThemeProps,
        title: 'Removed from cart!',
        icon: 'info',
        timer: 1000,
        showConfirmButton: false,
    });
  };

  // Update quantity with stock validation
  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) { // If new quantity is 0 or less, remove item
      removeFromCart(itemId);
      return;
    }
    
    const cartItem = cart.find(item => item.id === itemId);
    if (!cartItem) return;

    const inventoryItem = items.find(invItem => invItem.id === itemId);
    if (!inventoryItem) {
        Swal.fire({
            ...swalThemeProps,
            icon: 'error',
            title: 'Item No Longer Available',
            text: `${cartItem.item_name} is no longer in inventory. Removing from cart.`,
        });
        removeFromCart(itemId);
        return;
    }

    // Prevent increasing quantity beyond available stock
    if (newQuantity > inventoryItem.quantity) {
        Swal.fire({
            ...swalThemeProps,
            icon: 'warning',
            title: 'Quantity Limit',
            text: `You can only request up to ${inventoryItem.quantity} of ${cartItem.item_name}.`,
        });
        return;
    }

    setCart(cart.map(item => 
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    ));
  };

  // Calculate cart total (sum of quantities of all items in cart)
  const cartTotal = cart.reduce((total, item) => total + item.quantity, 0); 

  // Submit order function with comprehensive validation for multiple items
  const submitOrder = async () => {
    if (cart.length === 0) {
      Swal.fire({
        ...swalThemeProps,
        title: 'Empty Cart',
        text: 'Please add items to your cart before submitting',
        icon: 'warning',
      });
      return;
    }

    // Client-side stock validation for all items in the cart
    for (const cartItem of cart) {
        const inventoryItem = items.find(invItem => invItem.id === cartItem.id);
        if (!inventoryItem) {
            Swal.fire({
                ...swalThemeProps,
                icon: 'error',
                title: 'Item Not Found',
                text: `"${cartItem.item_name}" is no longer available in inventory. Please remove it from your cart.`,
            });
            return;
        }
        if (cartItem.quantity > inventoryItem.quantity) {
            Swal.fire({
                ...swalThemeProps,
                icon: 'error',
                title: 'Insufficient Stock',
                text: `Requested quantity for "${cartItem.item_name}" (${cartItem.quantity}) exceeds available stock (${inventoryItem.quantity}). Please adjust your cart.`,
            });
            return;
        }
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
          Swal.fire({ ...swalThemeProps, icon: 'error', title: 'Authentication Required', text: 'Please log in to submit requests.' });
          return;
      }

      Swal.fire({
        ...swalThemeProps,
        title: 'Submitting Order(s)...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const requests = cart.map(item => ({
        item_name: item.item_name,
        requested_quantity: item.quantity,
        notes: notes // All items in this cart share the same notes
      }));

      // Send individual requests for each item in the cart
      const results = await Promise.allSettled(
        requests.map(requestData => 
          axios.post('${API_BASE_URL}/api/orders/request', requestData, {
            headers: { Authorization: `Bearer ${token}` }
          })
        )
      );

      let successCount = 0;
      let failedItems = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successCount++;
        } else {
          // Collect information about failed requests
          const failedItemName = cart[index].item_name;
          const errorMessage = result.reason?.response?.data?.message || result.reason?.message || 'Unknown error';
          failedItems.push(`${failedItemName}: ${errorMessage}`);
        }
      });

      if (successCount === cart.length) {
        Swal.fire({
          ...swalThemeProps,
          title: 'Order(s) Submitted!',
          text: 'All items in your cart have been requested successfully.',
          icon: 'success',
          timer: 2500,
          showConfirmButton: false,
        });
      } else if (successCount > 0) {
        Swal.fire({
          ...swalThemeProps,
          title: 'Partial Submission',
          html: `Successfully requested ${successCount} item(s).<br>Failed to request ${failedItems.length} item(s):<br><ul>${failedItems.map(item => `<li>${item}</li>`).join('')}</ul>`,
          icon: 'warning',
        });
      } else {
        Swal.fire({
          ...swalThemeProps,
          title: 'Submission Failed',
          html: `Failed to request any items:<br><ul>${failedItems.map(item => `<li>${item}</li>`).join('')}</ul>`,
          icon: 'error',
        });
      }

      // Clear cart and notes after submission attempts
      setCart([]);
      setNotes('');
      // Refresh order history to show the newly submitted order(s)
      fetchData(); // Call fetchData which includes history fetch
      setActiveTab('history');
    } catch (error) {
      console.error("Unexpected error during multi-item order submission:", error);
      Swal.fire({
        ...swalThemeProps,
        title: 'Unexpected Error',
        text: 'An unexpected error occurred during submission. Please try again.',
        icon: 'error',
      });
    }
  };

  // Cancel order function
  const cancelOrder = async (orderId) => {
    const result = await Swal.fire({
      ...swalThemeProps,
      title: 'Cancel Order?',
      text: 'Are you sure you want to cancel this order? This action cannot be undone if processed.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, cancel',
      cancelButtonText: 'No, keep it',
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
            Swal.fire({ ...swalThemeProps, icon: 'error', title: 'Authentication Required', text: 'Please log in to cancel orders.' });
            return;
        }
        Swal.fire({
            ...swalThemeProps,
            title: 'Cancelling Order...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
        });
        
        // Correct endpoint and payload for cancelling an order
        await axios.put(`${API_BASE_URL}/api/orders/${orderId}/status`, { status: 'Cancelled' }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // --- IMMEDIATE UI UPDATE: Update the local state for the cancelled order ---
        setOrderHistory(prevHistory => 
          prevHistory.map(order => 
            order.id === orderId ? { ...order, status: 'Cancelled' } : order
          )
        );
        // --- END IMMEDIATE UI UPDATE ---

        Swal.fire({
            ...swalThemeProps,
            title: 'Order Cancelled!',
            text: 'Your order has been successfully cancelled.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
        });
        
        // Optionally, still call fetchData to ensure full data consistency,
        // but the UI update has already happened.
        fetchData(); 
      } catch (error) {
        console.error("Failed to cancel order:", error.response?.data || error.message);
        Swal.fire({
            ...swalThemeProps,
            title: 'Cancellation Failed',
            text: error.response?.data?.message || 'Could not cancel order. Please try again.',
            icon: 'error',
        });
      }
    }
  };

  // Get unique categories for filter
  const categories = useMemo(() => ['All', ...new Set(items.map(item => item.category))].sort(), [items]);

  // Status colors for order history
  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return darkMode ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-700';
      case 'DepartmentApproved': return darkMode ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700';
      case 'Approved': return darkMode ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700';
      case 'Fulfilled': return darkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700';
      case 'Rejected': return darkMode ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700';
      case 'Cancelled': return darkMode ? 'bg-slate-500/20 text-slate-300' : 'bg-slate-200 text-slate-600';
      default: return darkMode ? 'bg-slate-600 text-slate-300' : 'bg-slate-200 text-slate-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending': return <MdPendingActions size={16} />;
      case 'DepartmentApproved': return <MdThumbUp size={16} />; // DH Approved
      case 'Approved': return <MdCheckCircle size={16} />;
      case 'Fulfilled': return <MdLocalShipping size={16} />;
      case 'Rejected': return <MdThumbDown size={16} />;
      case 'Cancelled': return <MdCancel size={16} />;
      default: return <MdList size={16} />;
    }
  };

  if (isLoadingAuth) {
    return (
      <div className={`flex h-screen items-center justify-center ${darkMode ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
        Loading authentication...
      </div>
    );
  }

  if (!currentUser) {
    return (
      <Layout darkMode={darkMode}>
        <div className={`flex-1 flex flex-col items-center justify-center p-6`}>
          <h1 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>Access Denied</h1>
          <p className={`${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>You must be logged in to view this page.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout darkMode={darkMode}>
      {/* Header */}
      <header className={`flex items-center justify-between h-20 px-6 sm:px-8 fixed top-0 left-[250px] right-0 z-40 transition-colors duration-300
                         ${darkMode ? 'bg-slate-800/75 backdrop-blur-lg border-b border-slate-700' : 'bg-white/75 backdrop-blur-lg border-b border-slate-200'} shadow-sm`}>
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
            <MdShoppingCart size={24}/>
          </div>
          <h2 className={`text-xl sm:text-2xl font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>
            Staff Order Dashboard
          </h2>
          {/* Mobile menu toggle button */}
          <button
            className="md:hidden p-2 rounded-lg focus:outline-none focus:ring-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <MdClose className={`text-2xl ${darkMode ? 'text-slate-300' : 'text-slate-600'}`} />
            ) : (
              <MdMenu className={`text-2xl ${darkMode ? 'text-slate-300' : 'text-slate-600'}`} />
            )}
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleThemeSwitch}
            aria-label="Toggle Dark Mode"
            className={`p-2.5 rounded-full transition-colors duration-300 focus-visible:ring-2 ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-yellow-400 focus-visible:ring-yellow-400' : 'bg-slate-200 hover:bg-slate-300 text-indigo-600 focus-visible:ring-indigo-500'}`}
          >
            {darkMode ? <MdWbSunny size={22}/> : <MdModeNight size={22} />}
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              ref={profileButtonRef}
              onClick={() => setProfileOpen(!profileOpen)}
              className={`flex items-center gap-2 ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'} rounded-full p-1.5 pr-3 transition-colors`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${darkMode ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                <MdAccountCircle size={20}/>
              </div>
              <span className={`text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                {currentUser.fullname || currentUser.email || 'User'}
              </span>
            </button>

            {profileOpen && (
              <div
                ref={profileDropdownRef}
                className={`absolute right-0 top-12 w-48 py-2 rounded-lg shadow-xl z-50 ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}`}
              >
                <button
                  onClick={() => {
                    navigate("/settings");
                    setProfileOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${darkMode ? 'hover:bg-slate-700 text-slate-200' : 'hover:hover:bg-slate-100 text-slate-700'}`}
                >
                  <MdSettings size={18}/> Settings
                </button>
                <button className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${darkMode ? 'hover:bg-slate-700 text-slate-200' : 'hover:hover:bg-slate-100 text-slate-700'}`}>
                  <MdHelpOutline size={18}/> Help
                </button>
                <div className={`border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'} my-1`}></div>
                <button
                  onClick={() => {
                    handleLogout();
                    setProfileOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${darkMode ? 'hover:bg-slate-700 text-red-400' : 'hover:hover:bg-slate-100 text-red-600'}`}
                >
                  <MdLogout size={18}/> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 p-6 pt-[104px] ml-[250px] overflow-y-auto max-w-full">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Welcome Banner */}
          <div className={`p-6 rounded-xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6
                          ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white'}`}>
            <span className={`text-4xl sm:text-5xl mt-1 sm:mt-0 p-3 rounded-full ${darkMode ? 'bg-indigo-500 text-white' : 'bg-white/25'}`}>🛒</span>
            <div>
              <h1 className={`text-2xl sm:text-3xl font-bold ${darkMode ? 'text-slate-100' : 'text-white'}`}>
                Welcome, {currentUser.fullname || 'Staff Member'}!
              </h1>
              <p className={`${darkMode ? 'text-slate-300' : 'text-indigo-100'} mt-1 text-sm sm:text-base`}>
                Request items you need for your work. Browse available items and submit your order.
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className={`flex border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
            <button
              className={`px-4 py-2 font-medium text-sm relative ${activeTab === 'items' ? 
                `${darkMode ? 'text-indigo-400' : 'text-indigo-600'} border-b-2 ${darkMode ? 'border-indigo-400' : 'border-indigo-600'}` : 
                `${darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'}`}`}
              onClick={() => setActiveTab('items')}
            >
              Available Items
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm relative ${activeTab === 'history' ? 
                `${darkMode ? 'text-indigo-400' : 'text-indigo-600'} border-b-2 ${darkMode ? 'border-indigo-400' : 'border-indigo-600'}` : 
                `${darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'}`}`}
              onClick={() => setActiveTab('history')}
            >
              Order History
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm relative ${activeTab === 'cart' ? 
                `${darkMode ? 'text-indigo-400' : 'text-indigo-600'} border-b-2 ${darkMode ? 'border-indigo-400' : 'border-indigo-600'}` : 
                `${darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'}`}`}
              onClick={() => setActiveTab('cart')}
            >
              My Cart ({cart.length})
            </button>
          </div>

          {/* Items Tab */}
          {activeTab === 'items' && (
            <div className="space-y-6">
              {/* Search and Filter */}
              <div className={`p-6 rounded-xl shadow-lg ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      Search Items
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search by name or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-md border text-sm transition-colors duration-150 focus:ring-2 focus-visible:outline-none ${
                          darkMode
                            ? 'bg-slate-700 border-slate-600 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400 text-slate-100'
                            : 'bg-white border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400 text-slate-800'
                        }`}
                      />
                      <MdSearch className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} size={20} />
                    </div>
                  </div>
                  <div>
                    <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      Filter by Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className={`w-full px-3 py-2.5 rounded-md border text-sm transition-colors duration-150 focus:ring-2 focus-visible:outline-none ${
                        darkMode
                          ? 'bg-slate-700 border-slate-600 focus:ring-indigo-500 focus:border-indigo-500 text-slate-100'
                          : 'bg-white border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800'
                      }`}
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Items Grid */}
              {isLoading ? (
                <div className={`p-6 rounded-xl shadow-lg ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border-slate-200'}`}>
                  <div className="animate-pulse space-y-4">
                    <div className={`h-6 w-1/4 rounded ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className={`p-4 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                          <div className={`h-40 rounded-lg ${darkMode ? 'bg-slate-600' : 'bg-slate-200'}`}></div>
                          <div className="mt-4 space-y-2">
                            <div className={`h-4 w-3/4 rounded ${darkMode ? 'bg-slate-600' : 'bg-slate-200'}`}></div>
                            <div className={`h-4 w-1/2 rounded ${darkMode ? 'bg-slate-600' : 'bg-slate-200'}`}></div>
                            <div className={`h-8 w-full rounded ${darkMode ? 'bg-slate-600' : 'bg-slate-200'}`}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className={`p-10 text-center rounded-xl shadow-lg ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border-slate-200'}`}>
                  <MdSearch size={48} className="mx-auto mb-4 opacity-70" />
                  <h3 className={`text-xl font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>No items found</h3>
                  <p className={`mt-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Try adjusting your search or filter criteria or check back later.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredItems.map(item => (
                    <div 
                      key={item.id} 
                      className={`p-4 rounded-xl shadow-lg border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                        darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <h3 className={`font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                          {item.item_name}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${darkMode ? 'bg-indigo-900/30 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                          {item.category}
                        </span>
                      </div>
                      <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {item.description || 'No description available'}
                      </p>
                      <div className={`mt-4 flex items-center justify-between ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        <span className="text-sm">
                          Available: <span className="font-semibold">{item.quantity}</span>
                        </span>
                        <button
                          onClick={() => addToCart(item)}
                          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                            darkMode 
                              ? 'bg-indigo-600 hover:bg-indigo-500 text-white' 
                              : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                          }`}
                        >
                          <MdAddShoppingCart /> Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Cart Tab */}
          {activeTab === 'cart' && (
            <div className={`p-6 rounded-xl shadow-lg ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border-slate-200'}`}>
              <h3 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                Your Order Cart
              </h3>
              
              {cart.length === 0 ? (
                <div className="text-center py-10">
                  <MdShoppingCart size={48} className="mx-auto mb-4 opacity-70" />
                  <p className={`${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Your cart is empty</p>
                  <button
                    onClick={() => setActiveTab('items')}
                    className={`mt-4 px-4 py-2 rounded-md font-medium ${
                      darkMode 
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white' 
                        : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                    }`}
                  >
                    Browse Items
                  </button>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className={`${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                        <tr>
                          <th className="py-3 px-4 text-left">Item</th>
                          <th className="py-3 px-4 text-left">Category</th>
                          <th className="py-3 px-4 text-left">Quantity</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className={`${darkMode ? 'divide-y divide-slate-700' : 'divide-y divide-slate-200'}`}>
                        {cart.map(item => (
                          <tr key={item.id} className={`${darkMode ? 'hover:bg-slate-700/60' : 'hover:bg-slate-50/70'}`}>
                            <td className={`py-3 px-4 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                              <div className="font-medium">{item.item_name}</div>
                              <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                {item.description || 'No description'}
                              </div>
                            </td>
                            <td className={`py-3 px-4 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                              {item.category}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className={`w-6 h-6 flex items-center justify-center rounded ${
                                    darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-200 hover:bg-slate-300'
                                  }`}
                                >
                                  -
                                </button>
                                <span className="w-8 text-center">{item.quantity}</span>
                                <button 
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className={`w-6 h-6 flex items-center justify-center rounded ${
                                    darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-200 hover:bg-slate-300'
                                  }`}
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className={`p-1.5 rounded-full hover:opacity-75 ${
                                  darkMode ? 'text-red-400' : 'text-red-600'
                                }`}
                                aria-label="Remove item"
                              >
                                <MdCancel size={20} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-700">
                    <h4 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                      Order Notes
                    </h4>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any special instructions or notes about your order..."
                      className={`w-full px-3 py-2 rounded-md border text-sm transition-colors duration-150 focus:ring-2 focus-visible:outline-none ${
                        darkMode
                          ? 'bg-slate-700 border-slate-600 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400 text-slate-100'
                          : 'bg-white border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400 text-slate-800'
                      }`}
                      rows={3}
                    />

                    <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className={`text-lg font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                        Total Items: <span className="text-indigo-500">{cartTotal}</span>
                      </div>
                      <button
                        onClick={submitOrder}
                        className={`px-6 py-3 rounded-md font-medium text-white transition-colors ${
                          darkMode 
                            ? 'bg-green-600 hover:bg-green-500' 
                            : 'bg-green-500 hover:bg-green-600'
                        }`}
                      >
                        Submit Order
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Order History Tab */}
          {activeTab === 'history' && (
            <div className={`p-6 rounded-xl shadow-lg ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border-slate-200'}`}>
              <h3 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                Your Order History
              </h3>
              
              {isLoading ? ( // Show loading state for history specifically
                <div className="p-10 text-center">
                  <span className={`text-xl ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Loading history...</span>
                </div>
              ) : orderHistory.length === 0 ? (
                <div className="text-center py-10">
                  <MdHistory size={48} className="mx-auto mb-4 opacity-70" />
                  <p className={`${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>You haven't placed any orders yet</p>
                  <button
                    onClick={() => setActiveTab('items')}
                    className={`mt-4 px-4 py-2 rounded-md font-medium ${
                      darkMode 
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white' 
                        : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                    }`}
                  >
                    Browse Items
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className={`${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                      <tr>
                        <th className="py-3 px-4 text-left">Order #</th>
                        <th className="py-3 px-4 text-left">Item Name</th>
                        <th className="py-3 px-4 text-left">Quantity</th>
                        <th className="py-3 px-4 text-left">Date</th>
                        <th className="py-3 px-4 text-left">Status</th>
                        <th className="py-3 px-4 text-left">Last Action By</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className={`${darkMode ? 'divide-y divide-slate-700' : 'divide-y divide-slate-200'}`}>
                      {orderHistory.map(order => (
                        <tr key={order.id} className={`${darkMode ? 'hover:bg-slate-700/60' : 'hover:bg-slate-50/70'}`}>
                          <td className={`py-3 px-4 font-medium ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                            #{order.id}
                          </td>
                          <td className={`py-3 px-4 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            {order.item_name}
                          </td>
                          <td className={`py-3 px-4 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            {order.requested_quantity}
                          </td>
                          <td className={`py-3 px-4 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            {new Date(order.request_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-3 py-1 text-xs rounded-full flex items-center justify-center gap-1 ${getStatusColor(order.status)}`}>
                              {getStatusIcon(order.status)} {order.status}
                            </span>
                          </td>
                          <td className={`py-3 px-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {order.status === 'Rejected' && order.rejected_by_name
                                ? `${order.rejected_by_name} (${order.rejected_by_role})`
                                : order.status === 'Fulfilled' && order.fulfilled_by_name
                                    ? `${order.fulfilled_by_name} (${order.fulfilled_by_role})`
                                    : (order.status === 'Approved' || order.status === 'DepartmentApproved') && order.approved_by_name
                                        ? `${order.approved_by_name} (${order.approved_by_role})`
                                        : 'N/A'
                            }
                          </td>
                          <td className="py-3 px-4 text-right">
                            {/* Staff can cancel if the order is not yet Approved, Rejected, Fulfilled, or already Cancelled */}
                            {!(order.status === 'Approved' || order.status === 'Rejected' || order.status === 'Fulfilled' || order.status === 'Cancelled') && (
                              <button
                                onClick={() => cancelOrder(order.id)}
                                className={`px-3 py-1 text-xs rounded-md ${
                                  darkMode 
                                    ? 'bg-red-700 hover:bg-red-600 text-white' 
                                    : 'bg-red-600 hover:bg-red-700 text-white'
                                }`}
                              >
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
};
export default StaffOrderDashboard;
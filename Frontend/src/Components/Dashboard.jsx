import React, { useContext, useEffect, useState, useRef, useMemo } from "react";
import { InventoryContext } from "../contexts/InventoryContext";
import { ThemeContext } from "../contexts/ThemeContext";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

import Layout from "../Components/Layout/Layout";

import {
  MdDashboard, MdInventory, MdErrorOutline, MdWarningAmber, MdQueryStats,
  MdOutlineBarChart, MdAddCircleOutline, MdPieChartOutline,
  MdAccountCircle, MdHelpOutline, MdLogout, MdSettings,
  MdWbSunny, MdModeNight, MdOutlineCategory, MdAttachMoney,
  MdHistory, MdCheckCircle, MdLowPriority,
  MdMenu, MdClose,
  MdPendingActions, MdArrowForward, MdAssessment, MdList
} from "react-icons/md";

import CategoryPieChart from './CategoryPieChart';
import LoadingSpinner from "../Components/LoadingSpinner";
import { useAuth } from "../contexts/AuthContext";
import { useOrders } from "../contexts/OrderContext";

// Import Framer Motion
import { motion, AnimatePresence } from "framer-motion";

// Helper Functions (kept as is)
const formatTimeAgo = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return `${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} months ago`;
  const years = Math.floor(months / 12);
  return `${years} years ago`;
};

const formatKESCurrency = (value) => {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(value);
};

const StatCardSkeleton = ({ darkMode }) => (
  <div className={`p-5 sm:p-6 rounded-xl shadow-lg animate-pulse ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
    <div className={`h-4 w-3/4 mb-3 rounded ${darkMode ? 'bg-slate-600' : 'bg-slate-300'}`}></div>
    <div className={`h-8 w-1/2 rounded ${darkMode ? 'bg-slate-500' : 'bg-slate-400'}`}></div>
  </div>
);

// Enhanced Framer Motion Variants
const bannerVariants = {
  hidden: { opacity: 0, y: -30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: "spring",
      damping: 10,
      stiffness: 100,
      duration: 0.8
    } 
  }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
      when: "beforeChildren"
    }
  }
};

const itemVariants = {
  hidden: { 
    y: 25, 
    opacity: 0, 
    scale: 0.98 
  },
  visible: { 
    y: 0, 
    opacity: 1, 
    scale: 1, 
    transition: { 
      type: "spring",
      damping: 10,
      stiffness: 100,
      duration: 0.5
    } 
  },
  hover: {
    y: -3,
    transition: { duration: 0.2 }
  }
};

const sectionWrapperVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: "spring",
      damping: 15,
      stiffness: 100,
      duration: 0.6
    } 
  }
};

const dropdownVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.95, 
    y: -15,
    transition: { duration: 0.15 } 
  },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { 
      type: "spring",
      damping: 20,
      stiffness: 300,
      duration: 0.3
    } 
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    y: -15, 
    transition: { 
      duration: 0.2 
    } 
  }
};

const listItemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3
    }
  }),
  hover: {
    scale: 1.02,
    transition: { duration: 0.2 }
  }
};

// Create motion components
const MotionLink = motion(Link);
const MotionButton = motion.button;
const MotionDiv = motion.div;

const Dashboard = () => {
  const { items, loading: itemsLoading, error: itemsError, fetchItems } = useContext(InventoryContext);
  const { darkMode, setDarkMode } = useContext(ThemeContext);
  const navigate = useNavigate();

  const { currentUser, isLoadingAuth, logout: authLogout } = useAuth();
  const { orders, loadingOrders, ordersError, fetchOrders } = useOrders();

  const [categoryData, setCategoryData] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [itemsBelowReorderPoint, setItemsBelowReorderPoint] = useState([]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const profileButtonRef = useRef(null);
  const profileDropdownRef = useRef(null);

  const lowStockCount = items.filter(item => item.quantity > 0 && item.quantity < 5).length;
  const outOfStockCount = items.filter(item => item.quantity === 0).length;

  const totalInventoryValue = items.reduce((acc, item) => {
    const quantity = Number(item.quantity) || 0;
    const cost_price = Number(item.cost_price) || 0;
    return acc + (quantity * cost_price);
  }, 0);

  useEffect(() => {
    if (!isLoadingAuth && currentUser) {
        if (fetchItems) {
            console.log("Dashboard: User authenticated, fetching items.");
            fetchItems();
        }
        fetchOrders();
    } else if (!isLoadingAuth && !currentUser) {
        console.log("Dashboard: User not authenticated, redirecting to login.");
        navigate("/login", { replace: true });
    }
  }, [isLoadingAuth, currentUser, fetchItems, navigate, fetchOrders]);

  useEffect(() => {
    if (items.length > 0) {
      const categoryCounts = items.reduce((acc, item) => {
        const category = item.category || 'Uncategorized';
        acc[category] = (acc[category] || 0) + item.quantity;
        return acc;
      }, {});
      const formattedCategoryData = Object.entries(categoryCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
      setCategoryData(formattedCategoryData.length > 0 ? formattedCategoryData : [{ name: 'No Data', value: 1 }]);

      const sortedByDateItems = [...items].sort((a, b) => {
        const dateA = new Date(a.date_added || a.createdAt);
        const dateB = new Date(b.date_added || b.createdAt);
        return dateB - dateA;
      });
      setRecentActivities(sortedByDateItems.slice(0, 5));

      const filteredReorderItems = items.filter(item =>
        item.reorderPoint !== undefined && item.reorderPoint !== null &&
        Number(item.quantity) < Number(item.reorderPoint) && Number(item.quantity) >= 0
      ).sort((a, b) => (a.quantity - b.quantity));
      setItemsBelowReorderPoint(filteredReorderItems);

    } else if (!itemsLoading) {
      setCategoryData([{ name: 'No Items Yet', value: 1 }]);
      setRecentActivities([]);
      setItemsBelowReorderPoint([]);
    }
  }, [items, itemsLoading]);

  const swalThemeProps = {
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
  };

  const handleThemeSwitch = () => setDarkMode(!darkMode);

  const handleLogout = () => {
     Swal.fire({
       ...swalThemeProps,
       title: 'Log Out?', html: ` <div class="flex flex-col items-center gap-4"> <span class="${darkMode ? 'text-yellow-300' : 'text-yellow-500'}"> <svg xmlns="http://www.w3.org/2000/svg" class="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"> <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" /> </svg> </span> <p class="text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'} text-center"> Are you sure you want to end your session?<br>You'll need to log in again to access your account. </p> </div> `,
       icon: 'warning', showCancelButton: true, confirmButtonText: 'Yes, log me out', cancelButtonText: 'Cancel', reverseButtons: false, focusCancel: true,
       customClass: { popup: darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900', actions: 'flex justify-center gap-4 mt-6', confirmButton: 'bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow', cancelButton: 'bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded shadow', }, buttonsStyling: false,
     }).then((result) => { if (result.isConfirmed) { authLogout(); navigate("/login"); } });
   };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if ( profileOpen && profileButtonRef.current && !profileButtonRef.current.contains(event.target) && profileDropdownRef.current && !profileDropdownRef.current.contains(event.target) ) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) { document.addEventListener("mousedown", handleClickOutside); }
    return () => { document.removeEventListener("mousedown", handleClickOutside); };
  }, [profileOpen]);

  const statCards = [
    { title: "Total Items", value: items.length, Icon: MdQueryStats, color: "blue", link: "/viewitems" },
    { title: "Low Stock", value: lowStockCount, Icon: MdWarningAmber, color: "yellow", link: "/inventory?filter=lowstock" },
    { title: "Out of Stock", value: outOfStockCount, Icon: MdErrorOutline, color: "red", link: "/inventory?filter=outofstock" },
    { title: "Total Value", value: formatKESCurrency(totalInventoryValue), Icon: MdAttachMoney, color: "purple", link: null },
    { title: "Categories", value: new Set(items.map(i => i.category || 'Uncategorized')).size, Icon: MdOutlineCategory, color: "green", link: null },
  ];

  const canViewIncomingRequests = useMemo(() => {
    const allowedRoles = ['Admin', 'DepartmentHead', 'StockManager'];
    return currentUser && allowedRoles.includes(currentUser.role);
  }, [currentUser]);

  const pendingOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter(order => order.status === 'Pending');
  }, [orders]);

  if (isLoadingAuth || (itemsLoading && currentUser)) {
    return (
        <div className={`flex h-screen items-center justify-center ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
            <LoadingSpinner size="lg" />
        </div>
    );
  }

  if (!currentUser && !isLoadingAuth) {
      return null;
  }

  return (
    <Layout>
      <div className={`flex-1 flex flex-col min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>

        {/* Dashboard Header */}
        <header className={`flex items-center justify-between h-20 px-6 sm:px-8 fixed top-0 left-[250px] right-0 z-40 transition-colors duration-300 print:hidden
                         ${darkMode ? 'bg-slate-800/75 backdrop-blur-lg border-b border-slate-700' : 'bg-white/75 backdrop-blur-lg border-b border-slate-200'} shadow-sm`}>
          <div className="flex items-center gap-3">
             <div className={`p-2.5 rounded-lg ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                <MdDashboard size={24}/>
            </div>
            <h2 className={`text-xl sm:text-2xl font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>
              Dashboard Overview
            </h2>
            <MotionButton
              className="md:hidden p-2 rounded-lg focus:outline-none focus:ring-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {mobileMenuOpen ? (
                <MdClose className={`text-2xl ${darkMode ? 'text-slate-300' : 'text-slate-600'}`} />
              ) : (
                <MdMenu className={`text-2xl ${darkMode ? 'text-slate-300' : 'text-slate-600'}`} />
              )}
            </MotionButton>
          </div>
          <div className="flex items-center gap-4">
            <MotionButton
              onClick={handleThemeSwitch} aria-label="Toggle Dark Mode"
              className={`p-2.5 rounded-full transition-colors duration-300 focus-visible:ring-2 ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-yellow-400 focus-visible:ring-yellow-400' : 'bg-slate-200 hover:bg-slate-300 text-indigo-600 focus-visible:ring-indigo-500'}`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {darkMode ? <MdWbSunny size={22}/> : <MdModeNight size={22} />}
            </MotionButton>

            {/* Profile Dropdown */}
            <div className="relative">
              <MotionButton
                ref={profileButtonRef} onClick={() => setProfileOpen(!profileOpen)}
                className={`flex items-center gap-2 ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'} rounded-full p-1.5 pr-3 transition-colors`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${darkMode ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-600'}`}> <MdAccountCircle size={20}/> </div>
                <span className={`text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  {currentUser ? (currentUser.fullname || currentUser.email || 'User') : 'Guest'}
                </span>
              </MotionButton>
              <AnimatePresence>
                {profileOpen && (
                  <MotionDiv
                    ref={profileDropdownRef}
                    className={`absolute right-0 top-12 w-48 py-2 rounded-lg shadow-xl z-50 ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}`}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={dropdownVariants}
                  >
                    <MotionButton 
                      className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${darkMode ? 'hover:bg-slate-700 text-slate-200' : 'hover:bg-slate-100 text-slate-700'}`}
                      whileHover={{ x: 5 }}
                      whileTap={{ scale: 0.98 }}
                    > 
                      <MdAccountCircle size={18}/> Profile 
                    </MotionButton>
                    <MotionButton 
                      onClick={() => { navigate("/settings"); setProfileOpen(false); }} 
                      className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${darkMode ? 'hover:bg-slate-700 text-slate-200' : 'hover:hover:bg-slate-100 text-slate-700'}`}
                      whileHover={{ x: 5 }}
                      whileTap={{ scale: 0.98 }}
                    > 
                      <MdSettings size={18}/> Settings 
                    </MotionButton>
                    <MotionButton 
                      className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${darkMode ? 'hover:bg-slate-700 text-slate-200' : 'hover:hover:bg-slate-100 text-slate-700'}`}
                      whileHover={{ x: 5 }}
                      whileTap={{ scale: 0.98 }}
                    > 
                      <MdHelpOutline size={18}/> Help 
                    </MotionButton>
                    <div className={`border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'} my-1`}></div>
                    <MotionButton 
                      onClick={() => { handleLogout(); setProfileOpen(false); }} 
                      className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${darkMode ? 'hover:bg-slate-700 text-red-400' : 'hover:hover:bg-slate-100 text-red-600'}`}
                      whileHover={{ x: 5 }}
                      whileTap={{ scale: 0.98 }}
                    > 
                      <MdLogout size={18}/> Logout 
                    </MotionButton>
                  </MotionDiv>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <MotionDiv
              className="fixed inset-0 z-40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
              <MotionDiv
                className={`absolute top-0 left-0 w-64 h-full ${darkMode ? 'bg-slate-800' : 'bg-gradient-to-b from-indigo-600 to-indigo-700'} shadow-xl flex flex-col`}
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
              >
                <p className={`p-4 ${darkMode ? 'text-slate-300' : 'text-white'}`}>Mobile menu content goes here (if needed)</p>
                <MotionButton 
                  className="absolute top-4 right-4 p-2 rounded-lg focus:outline-none focus:ring-2" 
                  onClick={() => setMobileMenuOpen(false)}
                  whileHover={{ rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <MdClose className={`text-2xl ${darkMode ? 'text-slate-300' : 'text-white'}`} />
                </MotionButton>
              </MotionDiv>
            </MotionDiv>
          )}
        </AnimatePresence>

        {/* Page Content */}
        <main className="flex-1 p-6 pt-[104px] overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Welcome Banner */}
            <MotionDiv
              className={`p-6 rounded-xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6
                            ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white'}`}
              initial="hidden"
              animate="visible"
              variants={bannerVariants}
              whileHover={{ scale: 1.005 }}
            >
              <span className={`text-4xl sm:text-5xl mt-1 sm:mt-0 p-3 rounded-full ${darkMode ? 'bg-indigo-500 text-white' : 'bg-white/25'}`}>👋</span>
              <div>
                <h1 className={`text-2xl sm:text-3xl font-bold ${darkMode ? 'text-slate-100' : 'text-white'}`}>
                  Welcome back{currentUser?.fullname ? `, ${currentUser.fullname}` : ''}!
                </h1>
                <p className={`${darkMode ? 'text-slate-300' : 'text-indigo-100'} mt-1 text-sm sm:text-base`}>
                  Here's your inventory at a glance. Manage items, view reports, and stay organized.
                </p>
              </div>
            </MotionDiv>

            {/* Statistic Cards */}
            {itemsLoading && currentUser ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6"> 
                {[...Array(5)].map((_, i) => <StatCardSkeleton key={`skeleton-${i}`} darkMode={darkMode} />)} 
              </div>
            ) : itemsError && currentUser ? (
              <div className={`col-span-full text-center py-10 rounded-xl shadow-lg p-6 ${darkMode ? 'bg-slate-800 text-red-400' : 'bg-white text-red-600'}`}> 
                <MdErrorOutline size={48} className="mx-auto mb-3"/> 
                <p className="font-semibold text-lg">Error loading inventory data.</p> 
                <p className="text-sm">{itemsError.message || "Please try refreshing the page."}</p> 
              </div>
            ) : !itemsLoading && items.length === 0 && currentUser ? (
              <div className={`col-span-full text-center py-10 rounded-xl shadow-lg p-6 ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-white text-slate-500'}`}> 
                <MdInventory size={48} className="mx-auto mb-3"/> 
                <p className="font-semibold text-lg">No items in your inventory yet.</p> 
                <p className="text-sm">Click "Add New Item" to get started!</p> 
              </div>
            ) : currentUser && items.length > 0 ? (
              <MotionDiv
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {statCards.map((card, index) => (
                  <MotionDiv
                    key={card.title}
                    onClick={() => card.link && navigate(card.link)}
                    className={`p-5 sm:p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border-b-4 ${card.link ? 'cursor-pointer' : 'cursor-default'} ${darkMode ? `bg-slate-800 border-${card.color}-600 hover:border-${card.color}-500` : `bg-white border-${card.color}-400 hover:border-${card.color}-500`}`}
                    variants={itemVariants}
                    custom={index}
                    whileHover={{ 
                      scale: 1.03, 
                      boxShadow: darkMode ? '0 10px 20px rgba(0,0,0,0.4)' : '0 10px 20px rgba(0,0,0,0.1)',
                      transition: { duration: 0.2 }
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className={`text-base font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{card.title}</h3>
                      <div className={`p-2 rounded-full ${darkMode ? `bg-${card.color}-500/20 text-${card.color}-400` : `bg-${card.color}-100 text-${card.color}-600`}`}> 
                        <card.Icon className="text-2xl" /> 
                      </div>
                    </div>
                    <p className={`text-xl sm:text-2xl font-extrabold break-words ${darkMode ? `text-${card.color}-300` : `text-${card.color}-600`}`}> 
                      {card.value} 
                    </p>
                  </MotionDiv>
                ))}
              </MotionDiv>
            ) : null}

            {/* Incoming Requests Section */}
            {canViewIncomingRequests && (
              <MotionDiv
                className={`p-6 rounded-xl shadow-lg ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}`}
                initial="hidden"
                animate="visible"
                variants={sectionWrapperVariants}
              >
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-dashed border-gray-300 dark:border-slate-700">
                  <h3 className={`text-xl font-semibold flex items-center gap-3 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                    <MdPendingActions className="text-2xl text-yellow-500" /> Pending Item Requests ({pendingOrders.length})
                  </h3>
                  <MotionLink 
                    to="/incoming-requests" 
                    className={`flex items-center text-sm font-medium ${darkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'}`}
                    whileHover={{ x: 5 }} 
                    whileTap={{ scale: 0.98 }}
                  > 
                    View All Requests <MdArrowForward className="ml-1 text-base" /> 
                  </MotionLink>
                </div>
                {loadingOrders ? (
                  <div className="py-10 text-center"> 
                    <LoadingSpinner /> 
                    <p className={`mt-4 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Loading requests...</p> 
                  </div>
                ) : ordersError ? (
                  <div className="py-10 text-center text-red-500"> 
                    <p>Error loading requests: {ordersError.message}</p> 
                    <MotionButton 
                      onClick={fetchOrders} 
                      className="mt-4 px-4 py-2 rounded-md bg-indigo-500 text-white text-sm"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Retry
                    </MotionButton> 
                  </div>
                ) : pendingOrders.length === 0 ? (
                  <div className={`py-10 text-center ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}> 
                    <p className="font-medium">No pending item requests.</p> 
                    <p className="text-sm">Great job, everything is up to date!</p> 
                  </div>
                ) : (
                  <MotionDiv
                    className="overflow-x-auto"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <table className="min-w-full text-sm">
                      <thead className={`${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'} text-xs uppercase tracking-wider`}>
                        <tr> 
                          <th className="py-2 px-3 text-left">Item</th> 
                          <th className="py-2 px-3 text-center">Qty</th> 
                          <th className="py-2 px-3 text-left">Requester</th> 
                          <th className="py-2 px-3 text-left">Date</th> 
                        </tr>
                      </thead>
                      <MotionTbody
                        className={`${darkMode ? 'divide-y divide-slate-700' : 'divide-y divide-slate-200'}`}
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        {pendingOrders.map((order, index) => (
                          <MotionTr
                            key={order.id}
                            className={`${darkMode ? 'hover:bg-slate-600/60' : 'hover:bg-slate-50/70'}`}
                            variants={listItemVariants}
                            custom={index}
                            whileHover="hover"
                          >
                            <td className={`py-2 px-3 font-medium ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{order.item_name}</td>
                            <td className={`py-2 px-3 text-center ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{order.requested_quantity}</td>
                            <td className={`py-2 px-3 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{order.requester_name}</td>
                            <td className={`py-2 px-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{formatTimeAgo(order.request_date)}</td>
                          </MotionTr>
                        ))}
                      </MotionTbody>
                    </table>
                  </MotionDiv>
                )}
              </MotionDiv>
            )}

            {/* Main Content Grid: Charts, Recent Activities, and Quick Actions */}
            {currentUser && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Item Categories Distribution Chart */}
                  <MotionDiv
                    className={`lg:col-span-2 p-6 rounded-xl shadow-lg ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}`}
                    initial="hidden"
                    animate="visible"
                    variants={sectionWrapperVariants}
                  >
                      <h3 className={`text-xl font-semibold mb-1 flex items-center gap-2 ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}> 
                        <MdOutlineBarChart className={`text-2xl ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}/> Item Categories Distribution 
                      </h3>
                      <p className={`text-sm mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Based on item quantity per category.</p>
                      {itemsError ? ( 
                        <div className={`flex flex-col items-center justify-center h-64 text-center ${darkMode ? 'text-red-400' : 'text-red-600'}`}> 
                          <MdWarningAmber size={40} className="mb-2"/> 
                          <p>Error loading item data for chart.</p> 
                        </div> 
                      ) : categoryData.length > 0 && categoryData[0].name !== 'No Items Yet' && categoryData[0].name !== 'No Data' ? ( 
                        <CategoryPieChart data={categoryData} darkMode={darkMode} /> 
                      ) : ( 
                        <div className={`flex flex-col items-center justify-center h-64 text-center ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}> 
                          <MdPieChartOutline size={48} className="mb-3"/> 
                          <p className="font-medium">No category data to display.</p> 
                          <p className="text-xs">Add items with categories to see the chart.</p> 
                        </div> 
                      )}
                  </MotionDiv>

                  {/* Right Column for Recent Activities and Quick Actions */}
                  <div className="lg:col-span-1 flex flex-col gap-8">
                      {/* Items Below Reorder Point */}
                      <MotionDiv
                        className={`p-6 rounded-xl shadow-lg ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}`}
                        initial="hidden"
                        animate="visible"
                        variants={sectionWrapperVariants}
                      >
                          <h3 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}> 
                            <MdLowPriority className={`text-2xl ${darkMode ? 'text-red-400' : 'text-red-600'}`}/> Items Below Reorder Point 
                          </h3>
                          {itemsBelowReorderPoint.length > 0 ? (
                              <MotionUl
                                className="space-y-3"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                              >
                                  {itemsBelowReorderPoint.map((item, index) => (
                                    <MotionLi
                                      key={item.id}
                                      className="flex items-center gap-3"
                                      variants={listItemVariants}
                                      custom={index}
                                      whileHover="hover"
                                    >
                                      <div className={`p-2 rounded-full ${darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'}`}> 
                                        <MdWarningAmber size={18}/> 
                                      </div> 
                                      <div className="flex-1"> 
                                        <p className={`font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}> {item.item_name} </p> 
                                        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}> Current: {item.quantity} | Reorder: {item.reorderPoint} </p> 
                                      </div> 
                                      <MotionLink 
                                        to={`/viewitems?search=${item.item_name}`} 
                                        className={`text-xs px-2 py-1 rounded-full ${darkMode ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-indigo-500 hover:bg-indigo-600 text-white'}`} 
                                        whileHover={{ scale: 1.05 }} 
                                        whileTap={{ scale: 0.95 }}
                                      > 
                                        View 
                                      </MotionLink>
                                    </MotionLi>
                                  ))}
                              </MotionUl>
                          ) : ( 
                            <div className={`text-center py-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}> 
                              <MdLowPriority size={48} className="mx-auto mb-3 opacity-70"/> 
                              <p className="font-medium">No items currently below reorder point.</p> 
                              <p className="text-xs">Keep up the good work!</p> 
                            </div> 
                          )}
                      </MotionDiv>

                      {/* Recent Activities */}
                      <MotionDiv
                        className={`p-6 rounded-xl shadow-lg ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}`}
                        initial="hidden"
                        animate="visible"
                        variants={sectionWrapperVariants}
                      >
                          <h3 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}> 
                            <MdHistory className={`text-2xl ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}/> Recent Activities 
                          </h3>
                          {recentActivities.length > 0 ? (
                              <MotionUl
                                className="space-y-4"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                              >
                                  {recentActivities.map((item, index) => (
                                    <MotionLi
                                      key={item.id}
                                      className="flex items-center gap-3"
                                      variants={listItemVariants}
                                      custom={index}
                                      whileHover="hover"
                                    >
                                      <div className={`p-2 rounded-full ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}> 
                                        <MdCheckCircle size={18}/> 
                                      </div> 
                                      <div className="flex-1"> 
                                        <p className={`font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}> {item.item_name} </p> 
                                        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}> Quantity: {item.quantity} in {item.category || 'Uncategorized'} </p> 
                                      </div> 
                                      <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}> {formatTimeAgo(item.date_added)} </span>
                                    </MotionLi>
                                  ))}
                              </MotionUl>
                          ) : ( 
                            <div className={`text-center py-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}> 
                              <MdHistory size={48} className="mx-auto mb-3 opacity-70"/> 
                              <p className="font-medium">No recent item activities.</p> 
                              <p className="text-xs">Add new items to see them here.</p> 
                            </div> 
                          )}
                      </MotionDiv>

                      {/* Quick Actions */}
                      <MotionDiv
                        className={`p-6 rounded-xl shadow-lg ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'} flex flex-col gap-5`}
                        initial="hidden"
                        animate="visible"
                        variants={sectionWrapperVariants}
                      >
                          <h3 className={`text-xl font-semibold mb-1 flex items-center gap-2 ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}> 🚀 Quick Actions </h3>
                          <MotionLink 
                            to="/AddItemsForm" 
                            className={`w-full flex items-center justify-center gap-2.5 py-3 px-5 rounded-lg text-sm font-semibold transition-all duration-300 group ${darkMode ? 'bg-indigo-600 hover:bg-indigo-500 text-white focus-visible:ring-2 focus-visible:ring-indigo-400' : 'bg-indigo-500 hover:bg-indigo-600 text-white focus-visible:ring-2 focus-visible:ring-indigo-300' } hover:shadow-md active:scale-95`}
                            whileHover={{ 
                              scale: 1.02, 
                              boxShadow: darkMode ? '0 5px 10px rgba(0,0,0,0.3)' : '0 5px 10px rgba(0,0,0,0.1)',
                              transition: { duration: 0.2 }
                            }}
                            whileTap={{ scale: 0.98 }}
                          > 
                            <MdAddCircleOutline className="text-xl transition-transform duration-300 group-hover:scale-110" /> Add New Item 
                          </MotionLink>
                          <MotionLink 
                            to="/reports" 
                            className={`w-full flex items-center justify-center gap-2.5 py-3 px-5 rounded-lg text-sm font-semibold transition-all duration-300 group ${darkMode ? 'bg-sky-600 hover:bg-sky-500 text-white focus-visible:ring-2 focus-visible:ring-sky-400' : 'bg-sky-500 hover:bg-sky-600 text-white focus-visible:ring-2 focus-visible:ring-sky-300' } hover:shadow-md active:scale-95`}
                            whileHover={{ 
                              scale: 1.02, 
                              boxShadow: darkMode ? '0 5px 10px rgba(0,0,0,0.3)' : '0 5px 10px rgba(0,0,0,0.1)',
                              transition: { duration: 0.2 }
                            }}
                            whileTap={{ scale: 0.98 }}
                          > 
                            <MdAssessment className="text-xl transition-transform duration-300 group-hover:scale-110" /> Generate Reports 
                          </MotionLink>
                          <MotionLink 
                            to="/viewitems" 
                            className={`w-full flex items-center justify-center gap-2.5 py-3 px-5 rounded-lg text-sm font-semibold transition-all duration-300 group ${darkMode ? 'bg-teal-600 hover:bg-teal-500 text-white focus-visible:ring-2 focus-visible:ring-teal-400' : 'bg-teal-500 hover:bg-teal-600 text-white focus-visible:ring-2 focus-visible:ring-teal-300' } hover:shadow-md active:scale-95`}
                            whileHover={{ 
                              scale: 1.02, 
                              boxShadow: darkMode ? '0 5px 10px rgba(0,0,0,0.3)' : '0 5px 10px rgba(0,0,0,0.1)',
                              transition: { duration: 0.2 }
                            }}
                            whileTap={{ scale: 0.98 }}
                          > 
                            <MdList className="text-xl transition-transform duration-300 group-hover:scale-110" /> View All Items 
                          </MotionLink>
                      </MotionDiv>
                  </div>
                </div>
            )}
          </div>
        </main>
      </div>
    </Layout>
  );
};

// Create motion components for table elements
const MotionTbody = motion.tbody;
const MotionTr = motion.tr;
const MotionUl = motion.ul;
const MotionLi = motion.li;

export default Dashboard;
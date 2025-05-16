// Dashboard.jsx
import React, { useContext, useEffect } from "react";
import { InventoryContext } from "../contexts/InventoryContext";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';


import {
  MdDashboard,
  MdInventory,
  MdAddBox,
  MdList,
  MdAssessment,
  MdSettings,
} from "react-icons/md";

const Dashboard = () => {
  const { items } = useContext(InventoryContext);
  const navigate = useNavigate();

  const lowStockCount = items.filter(
    (item) => item.quantity > 0 && item.quantity < 5
  ).length;
  const outOfStockCount = items.filter((item) => item.quantity === 0).length;

 const handleLogout = () => {
  Swal.fire({
    title: 'Logout Confirmation',
    text: 'Are you sure you want to logout?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Yes, logout',
    cancelButtonText: 'Cancel',
    background: 'rgba(255, 255, 255, 0.95)', // Slight translucent white
    backdrop: `
      rgba(0, 0, 0, 0.5)
      left top
      no-repeat
    `,
    customClass: {
      popup: 'rounded-xl shadow-xl',
      confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
      cancelButton: 'bg-gray-200 text-black px-4 py-2 rounded-md',
    },
  }).then((result) => {
    if (result.isConfirmed) {
      navigate("/login");
    }
  });
};

const fetchUser = async () => {
  // 1. First check if token exists
  const token = localStorage.getItem("token");
  if (!token) {
    console.log("No token found in localStorage");
    navigate("/login");
    return;
  }

  try {
    // 2. Make the request
    const response = await axios.get("http://localhost:3000/auth/dashboard", {
      headers: { Authorization: `Bearer ${token}` },
    });

    // 3. Check for successful response (200 range)
    if (response.status >= 200 && response.status < 300) {
      // User is authenticated, proceed with dashboard
      console.log("User authenticated:", response.data);
      return;
    }

    // 4. Handle unexpected successful status codes
    console.warn("Unexpected status code:", response.status);
    throw new Error(`Unexpected status: ${response.status}`);

  } catch (err) {
    // 5. Proper error handling
    console.error("Dashboard auth error:", err);

    // Only redirect on 401 Unauthorized
    if (err.response?.status === 401) {
      localStorage.removeItem("token"); // Clear invalid token
      navigate("/login");
    } else {
      // Handle other errors (network, server, etc.) differently
      // Maybe show an error message instead of redirecting
      alert("Failed to load dashboard. Please try again later.");
    }
  }
};

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <div className="bg-gradient-to-br from-cyan-100 to-blue-100 flex min-h-screen font-['Inter']">
      {/* Sidebar */}
      <div className="w-[250px] bg-[#3f51b5] text-white fixed h-full flex flex-col shadow-lg z-50">
  {/* Header Section - Centered with increased padding */}
  <div className="flex flex-col items-center pt-10 px-6 pb-10 mb-6 border-b border-white/10">
    <div className="p-4 bg-white/10 rounded-xl mb-4"> {/* Increased padding and rounded-xl */}
      <span className="text-3xl">📊</span> {/* Larger icon */}
    </div>
    <h2 className="text-2xl font-bold text-center">Inventory Pro</h2> {/* Larger text */}
    <p className="text-white/70 text-base mt-2 text-center">Management Console</p> {/* Larger text */}
  </div>

  {/* Navigation Links - Centered with increased padding */}
  <div className="fixed top-0 left-0 w-[250px] h-screen bg-[#3f51b5] text-white pt-8 flex flex-col z-50">
          <h2 className="text-center mb-10 text-xl font-semibold">Dashboard</h2>
          <Link to="/dashboard" className="px-5 py-3 hover:bg-[#5c6bc0] transition-colors flex items-center gap-2">
            <MdDashboard className="text-xl" /> Dashboard
          </Link>
          <Link to="/inventory" className="px-5 py-3 hover:bg-[#5c6bc0] transition-colors flex items-center gap-2">
            <MdInventory className="text-xl" /> Inventory
          </Link>
          <Link to="/AddItemsForm" className="px-5 py-3 hover:bg-[#5c6bc0] transition-colors flex items-center gap-2">
            <MdAddBox className="text-xl" /> Add Items
          </Link>
          <Link to="/viewitems" className="px-5 py-3 hover:bg-[#5c6bc0] transition-colors flex items-center gap-2">
            <MdList className="text-xl" /> View Items
          </Link>
          <Link to="/reports" className="px-5 py-3 hover:bg-[#5c6bc0] transition-colors flex items-center gap-2">
            <MdAssessment className="text-xl" /> Reports
          </Link>
          <Link to="/settings" className="px-5 py-3 hover:bg-[#5c6bc0] transition-colors flex items-center gap-2">
            <MdSettings className="text-xl" /> Settings
          </Link>
        </div>
   
  {/* Bottom spacer - increased padding */}
  <div className="mt-auto pb-10"></div>
</div>
      {/* Main Section */}
      <div className="flex-1 ml-[250px] flex flex-col">
      <div className="grid grid-cols-3 items-center bg-gradient-to-r from-blue-500 to-indigo-500 text-white h-[70px] fixed top-0 left-[250px] right-0 shadow-lg z-40">
  {/* Left Section - Title */}
  <div className="flex justify-center">
    <span className="text-2xl font-bold tracking-wide flex items-center gap-3">
      <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">📦</div>
      <span>Inventory Dashboard</span>
    </span>
  </div>

  {/* Middle Section - Spacer */}
  <div className="flex-1"></div>

  {/* Right Section - Button Centered in its Grid */}
  <div className="flex items-center justify-center pr-3 h-full"> {/* Changed to justify-center */}
    <button
      className="logout-btn inline-flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 text-white py-4 px-6 rounded-[7px] text-sm font-medium transition-all duration-300 hover:shadow-md active:scale-95 border border-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 min-w-[160px] h-12"
      onClick={handleLogout}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="size-5"
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
        />
      </svg>
      Logout
    </button>
  </div>
</div>

        {/* Dashboard content */}
 <div className="pt-10 px-6 py-8 w-full flex justify-center">
  <div className="w-full max-w-[1200px] flex flex-col gap-20">
    {/* Header */}
    <h2 className="text-2xl font-semibold">📊 Overview</h2>

    {/* Cards Section */}
    {/* Cards Section */}
<div className="flex flex-wrap justify-between gap-5">
  {[
    { title: "Total Items", value: items.length },
    { title: "Low Stock", value: lowStockCount },
    { title: "Out of Stock", value: outOfStockCount },
    { title: "Recently Added", value: `${items.slice(-5).length} Items` }
  ].map((card, index) => (
    <div
      key={index}
      onClick={() => navigate("/viewitems")}
      className="bg-white flex-1 min-w-[220px] h-[180px] p-5 rounded-xl shadow-md text-center transition-transform duration-300 hover:-translate-y-1.5 hover:shadow-xl cursor-pointer flex flex-col justify-center"
    >
      <h3 className="text-2xl text-gray-700 font-semibold mb-2">{card.title}</h3>
      <p className="text-lg text-gray-600">{card.value}</p>
    </div>
  ))}
</div>


    {/* Action Buttons Section */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-2xl mx-auto px-4">
      <button
        className="group relative bg-white overflow-hidden rounded-2xl p-px transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/30"
        onClick={() => navigate("/AddItemsForm")}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
        <div className="relative flex items-center justify-center gap-3 bg-gradient-to-br from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white py-5 px-10 rounded-2xl transition-all duration-300 hover:scale-[1.02] h-14 min-h-[56px]">
  <span className="text-2xl">➕</span>
  <span className="font-semibold text-lg">Add New Item</span>
</div>
      </button>

      <button
        className="group relative bg-white overflow-hidden rounded-2xl p-px transition-all duration-300 hover:shadow-2xl hover:shadow-pink-500/30"
        onClick={() => navigate("/reports")}
      >
        <div className="relative flex items-center justify-center gap-3 bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-4 px-10 rounded-2xl transition-all duration-300 hover:scale-[1.02] h-14 min-h-[56px]">
  <span className="text-2xl">📊</span>
  <span className="font-semibold text-lg">Generate Report</span>
</div>
      </button>
    </div>
  </div>
</div>

      </div>
    </div>
  );
};

export default Dashboard;

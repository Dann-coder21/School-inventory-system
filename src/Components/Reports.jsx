import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { InventoryContext } from "../contexts/InventoryContext";
import {
  MdDashboard,
  MdInventory,
  MdAddBox,
  MdList,
  MdAssessment,
  MdSettings,
} from "react-icons/md";
import "../Styles/print.css"; 

const Reports = () => {
  const { items } = useContext(InventoryContext);

  // Calculate report data
  const calculateReports = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const totalItems = items.length;
    const availableItems = items.filter(
      (item) => item.status === "Available"
    ).length;
    const outOfStockItems = items.filter(
      (item) => item.quantity === 0
    ).length;

    const addedThisMonth = items.filter((item) => {
  const itemDate = new Date(item.date_added); // <-- use date_added
  return (
    itemDate.getMonth() === currentMonth &&
    itemDate.getFullYear() === currentYear
  );
}).length;

    const lowStockItems = items.filter(
      (item) => item.status !== "Out of Stock" && item.quantity < 5
    );

    const recentlyAdded = [...items]
      .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))
      .slice(0, 5);

    return {
      totalItems,
      availableItems,
      outOfStockItems,
      addedThisMonth,
      lowStockItems,
      recentlyAdded,
    };
  };

  const {
    totalItems,
    availableItems,
    outOfStockItems,
    addedThisMonth,
    lowStockItems,
    recentlyAdded,
  } = calculateReports();

  return (
    <div className="min-h-screen flex flex-col font-inter bg-gradient-to-br from-[#e0f7fa] to-[#f1f8ff] print:bg-white">

      {/* Sidebar */}
      <div className="no-print fixed top-0 left-0 w-[250px] h-screen bg-[#3f51b5] text-white pt-8 flex flex-col z-50 shadow-lg">
        <h2 className="text-center mb-10 text-2xl font-bold tracking-wide">📊 Reports</h2>
        <Link to="/dashboard" className="px-5 py-3 hover:bg-[#5c6bc0] transition-colors flex items-center gap-2 rounded-md">
          <MdDashboard className="text-xl" /> Dashboard
        </Link>
        <Link to="/inventory" className="px-5 py-3 hover:bg-[#5c6bc0] transition-colors flex items-center gap-2 rounded-md">
          <MdInventory className="text-xl" /> Inventory
        </Link>
        <Link to="/AddItemsForm" className="px-5 py-3 hover:bg-[#5c6bc0] transition-colors flex items-center gap-2 rounded-md">
          <MdAddBox className="text-xl" /> Add Items
        </Link>
        <Link to="/viewitems" className="px-5 py-3 hover:bg-[#5c6bc0] transition-colors flex items-center gap-2 rounded-md">
          <MdList className="text-xl" /> View Items
        </Link>
        <Link to="/reports" className="px-5 py-3 hover:bg-[#5c6bc0] transition-colors flex items-center gap-2 rounded-md">
          <MdAssessment className="text-xl" /> Reports
        </Link>
        
        <Link to="/settings" className="px-5 py-3 hover:bg-[#5c6bc0] transition-colors flex items-center gap-2 rounded-md">
          <MdSettings className="text-xl" /> Settings
        </Link>
      </div>

      {/* Navbar */}
        <div className="no-print grid grid-cols-3 items-center bg-gradient-to-r from-blue-500 to-indigo-500 text-white h-[70px] px-6 shadow-lg z-40">
        <div/>
        <div className="flex items-center justify-center">
          <div className="flex items-center">
            <div className="p-2 bg-white/10 rounded-lg mr-3">
              <span className="text-2xl">📈</span>
            </div>
            <span className="text-2xl font-bold whitespace-nowrap tracking-wide drop-shadow">
              Inventory Reports
            </span>
          </div>
        </div>
        <div />
      </div>

      {/* Print Header */}
    <div className="hidden print:block print-header">
      <h1 className="text-2xl font-bold mb-2">Inventory Report</h1>
      <p className="text-sm">Generated on: {new Date().toLocaleDateString()}</p>
    </div>

      {/* Main Content */}

        <div className="ml-[250px] mt-[70px] p-8 flex-1 min-h-[calc(100vh-70px)] flex flex-col print-content">
       <h1 className="text-2xl font-bold text-[#3f51b5] mb-8 text-center tracking-wide no-print">
        📋 Inventory Summary
      </h1>
        {/* Summary Cards */}
          {/* Print Version (hidden on screen) */}
      <div className="hidden print:grid print-summary">
        <div>
          <h3>Total Items</h3>
          <p className="text-xl font-bold">{totalItems}</p>
        </div>
        <div>
          <h3>Available</h3>
          <p className="text-xl font-bold">{availableItems}</p>
        </div>
        <div>
          <h3>Out of Stock</h3>
          <p className="text-xl font-bold">{outOfStockItems}</p>
        </div>
        <div>
          <h3>Added This Month</h3>
          <p className="text-xl font-bold">{addedThisMonth}</p>
        </div>
      </div>

          {/* Screen Version (hidden when printing) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10 no-print">
          <div className="bg-gradient-to-br from-[#e3f2fd] to-[#bbdefb] p-6 rounded-xl shadow-lg text-center border-t-4 border-blue-400">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Items</h3>
            <p className="text-3xl font-extrabold text-[#1976d2] mb-1">{totalItems}</p>
            <small className="text-gray-500">All items ever in system</small>
          </div>
          <div className="bg-gradient-to-br from-[#e8f5e9] to-[#b2dfdb] p-6 rounded-xl shadow-lg text-center border-t-4 border-green-400">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Available</h3>
            <p className="text-3xl font-extrabold text-[#388e3c] mb-1">{availableItems}</p>
            <small className="text-gray-500">Currently in stock</small>
          </div>
          <div className="bg-gradient-to-br from-[#ffebee] to-[#ffcdd2] p-6 rounded-xl shadow-lg text-center border-t-4 border-red-400">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Out of Stock</h3>
            <p className="text-3xl font-extrabold text-[#d32f2f] mb-1">{outOfStockItems}</p>
            <small className="text-gray-500">Needs restocking</small>
          </div>
          <div className="bg-gradient-to-br from-[#fffde7] to-[#fff9c4] p-6 rounded-xl shadow-lg text-center border-t-4 border-yellow-400">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Added This Month</h3>
            <p className="text-3xl font-extrabold text-[#fbc02d] mb-1">{addedThisMonth}</p>
            <small className="text-gray-500">New inventory</small>
          </div>
        
        
      / </div>
        {/* Low Stock Table */}
        <div className="print-section mb-10"> 
        <h2 className="text-xl font-semibold text-[#d32f2f] mb-4 flex items-center gap-2">
           <span className="no-print">⚠️</span> Low Stock Items 
            <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs no-print">{lowStockItems.length}</span>
             <span className="hidden print:inline">({lowStockItems.length} items)</span>
        </h2>
          <table className="min-w-full bg-white rounded-xl shadow-lg print-table">
            <thead>
              <tr className="bg-[#d32f2f] text-white">
                <th className="py-3 px-4 text-left rounded-tl-xl">Item</th>
                <th className="py-3 px-4 text-left">Category</th>
                <th className="py-3 px-4 text-left">Quantity</th>
                <th className="py-3 px-4 text-left rounded-tr-xl">Status</th>
              </tr>
            </thead>
            <tbody>
              {lowStockItems.length > 0 ? (
                lowStockItems.map((item, index) => (
                  <tr
                    key={index}
                    className="border-t border-gray-200 hover:bg-red-50 transition"
                  >
                    <td className="py-3 px-4 font-medium">{item.item_name}</td>
                    <td className="py-3 px-4">{item.category}</td>
                    <td className="py-3 px-4">{item.quantity}</td>
                    <td className="py-3 px-4 text-red-600 font-semibold">Low Stock</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="4"
                    className="py-6 text-center text-gray-500 italic"
                  >
                    No low stock items
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        

        {/* Recently Added Table */}
        <div className="print-section mb-10">
          <h2 className="text-xl font-semibold text-[#1976d2] mb-4 flex items-center gap-2">
            <span className="no-print">🆕</span> Recently Added
          </h2>
          <div className="overflow-x-auto mb-10">
            <table className="min-w-full bg-white rounded-xl shadow-lg print-table">
              <thead>
                <tr className="bg-[#1976d2] text-white">
                  <th className="py-3 px-4 text-left rounded-tl-xl">Item</th>
                  <th className="py-3 px-4 text-left">Category</th>
                  <th className="py-3 px-4 text-left">Date Added</th>
                <th className="py-3 px-4 text-left rounded-tr-xl">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {recentlyAdded.map((item, index) => (
                <tr
                  key={index}
                  className="border-t border-gray-200 hover:bg-blue-50 transition"
                >
                  <td className="py-3 px-4 font-medium">{item.item_name}</td>
                  <td className="py-3 px-4">{item.category}</td>
                  <td className="py-3 px-4">
                    {new Date(item.date_added).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      

        {/* Actions */}
        <div className="flex justify-center gap-6 mt-10 no-print">
          <button
            onClick={() => window.print()}
            className="bg-gradient-to-r from-[#4c8bf5] to-[#1976d2] hover:from-[#3b73d1] hover:to-[#1565c0] text-white py-3 px-8 rounded-xl shadow-lg font-semibold text-lg transition-all duration-300 flex items-center gap-2"
          >
            🖨️ Print Report
          </button>
          <button
            onClick={() => alert("Export to CSV coming soon!")}
            className="bg-gradient-to-r from-[#43e97b] to-[#38f9d7] hover:from-[#34d399] hover:to-[#06b6d4] text-white py-3 px-8 rounded-xl shadow-lg font-semibold text-lg transition-all duration-300 flex items-center gap-2"
          >
            📥 Export CSV
          </button>
        </div>
      </div>
      </div>
    </div>
     
    
  );
};

export default Reports;
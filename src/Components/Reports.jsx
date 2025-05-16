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
      (item) => item.status === "Out of Stock"
    ).length;

    const addedThisMonth = items.filter((item) => {
      const itemDate = new Date(item.dateAdded);
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
    <div className="min-h-screen flex flex-col font-inter bg-gradient-to-br from-[#e0f7fa] to-[#f1f8ff]">
      {/* Sidebar */}
      <div className="fixed top-0 left-0 w-[250px] h-screen bg-[#3f51b5] text-white pt-8 flex flex-col z-50">
             <h2 className="text-center mb-10 text-xl font-semibold">Reports</h2>
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

      {/* Navbar */}
      <div className="grid grid-cols-3 items-center bg-gradient-to-r from-blue-500 to-indigo-500 text-white h-[70px] px-6 shadow-lg z-40">
        <div className="flex justify-end"></div>
        <div className="flex items-center justify-center">
          <div className="flex items-center">
            <div className="p-2 bg-white/10 rounded-lg mr-3">
              <span className="text-xl">📈</span>
            </div>
            <span className="text-lg font-bold whitespace-nowrap">
              Inventory Reports
            </span>
          </div>
        </div>
        <div></div>
      </div>

      {/* Main Content */}
      <div className="ml-[250px] mt-[70px] p-8 flex-1 min-h-[calc(100vh-70px)] flex flex-col">
        <h1 className="text-xl font-semibold text-[#3f51b5] mb-4 text-center">
          📋 Inventory Summary
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h3 className="text-lg font-semibold text-gray-700">Total Items</h3>
            <p className="text-2xl font-bold text-[#3f51b5]">{totalItems}</p>
            <small className="text-gray-500">All items ever in system</small>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h3 className="text-lg font-semibold text-gray-700">Available</h3>
            <p className="text-2xl font-bold text-[#3f51b5]">
              {availableItems}
            </p>
            <small className="text-gray-500">Currently in stock</small>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h3 className="text-lg font-semibold text-gray-700">
              Out of Stock
            </h3>
            <p className="text-2xl font-bold text-[#3f51b5]">
              {outOfStockItems}
            </p>
            <small className="text-gray-500">Needs restocking</small>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h3 className="text-lg font-semibold text-gray-700">
              Added This Month
            </h3>
            <p className="text-2xl font-bold text-[#3f51b5]">
              {addedThisMonth}
            </p>
            <small className="text-gray-500">New inventory</small>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-[#3f51b5] mb-4">
          ⚠️ Low Stock Items ({lowStockItems.length})
        </h2>
        <div className="overflow-x-auto mb-8">
          <table className="min-w-full bg-white rounded-lg shadow-md">
            <thead>
              <tr className="bg-[#3f51b5] text-white">
                <th className="py-2 px-4 text-left">Item</th>
                <th className="py-2 px-4 text-left">Category</th>
                <th className="py-2 px-4 text-left">Quantity</th>
                <th className="py-2 px-4 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {lowStockItems.length > 0 ? (
                lowStockItems.map((item, index) => (
                  <tr
                    key={index}
                    className="border-t border-gray-200 hover:bg-gray-50"
                  >
                    <td className="py-2 px-4">{item.itemName}</td>
                    <td className="py-2 px-4">{item.category}</td>
                    <td className="py-2 px-4">{item.quantity}</td>
                    <td className="py-2 px-4 text-red-500">Low Stock</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="4"
                    className="py-4 text-center text-gray-500 italic"
                  >
                    No low stock items
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <h2 className="text-lg font-semibold text-[#3f51b5] mb-4">
          🆕 Recently Added
        </h2>
        <div className="overflow-x-auto mb-8">
          <table className="min-w-full bg-white rounded-lg shadow-md">
            <thead>
              <tr className="bg-[#3f51b5] text-white">
                <th className="py-2 px-4 text-left">Item</th>
                <th className="py-2 px-4 text-left">Category</th>
                <th className="py-2 px-4 text-left">Date Added</th>
                <th className="py-2 px-4 text-left">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {recentlyAdded.map((item, index) => (
                <tr
                  key={index}
                  className="border-t border-gray-200 hover:bg-gray-50"
                >
                  <td className="py-2 px-4">{item.itemName}</td>
                  <td className="py-2 px-4">{item.category}</td>
                  <td className="py-2 px-4">
                    {new Date(item.dateAdded).toLocaleDateString()}
                  </td>
                  <td className="py-2 px-4">{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-center gap-4 mt-8">
          <button
            onClick={() => window.print()}
            className="bg-[#4c8bf5] hover:bg-[#3b73d1] text-white py-2 px-6 rounded-lg transition-colors duration-300"
          >
            🖨️ Print Report
          </button>
          <button
            onClick={() => alert("Export to CSV coming soon!")}
            className="bg-[#4c8bf5] hover:bg-[#3b73d1] text-white py-2 px-6 rounded-lg transition-colors duration-300"
          >
            📥 Export CSV
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reports;
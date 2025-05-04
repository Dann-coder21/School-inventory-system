import React, { useContext, useState } from "react";
import { InventoryContext } from "../contexts/InventoryContext";
import { Link, useNavigate } from "react-router-dom";
import {
  MdDashboard,
  MdInventory,
  MdAddBox,
  MdList,
  MdAssessment,
  MdSettings,
} from "react-icons/md";
import axios from "axios";

const AddItemForm = () => {
  const { items, addItem } = useContext(InventoryContext);
  const navigate = useNavigate();

  const existingItemNames = [...new Set(items.map((item) => item.itemName))];

  const [formData, setFormData] = useState({
    itemName: "",
    category: "",
    quantity: 0,
    location: "",
    dateAdded: "",
    status: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await addItem(formData); // Uses context's addItem (which now syncs with backend)
      navigate("/inventory");  // Redirect after success
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add item");
    }
  };

  return (
    <>
      {/* Sidebar */}
    <div className="fixed top-0 left-0 w-[250px] h-screen bg-[#3f51b5] text-white pt-8 flex flex-col z-50">
           <h2 className="text-center mb-10 text-xl font-semibold">Settings</h2>
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
              <span className="text-xl">📦</span>
            </div>
            <span className="text-lg font-bold whitespace-nowrap">School Inventory Overview</span>
          </div>
        </div>
        <div></div>
      </div>

      {/* Main Content - Centered Single Column */}
      <div className="flex items-center justify-center min-h-screen bg-gray-100 ml-[250px] p-8">
        <div className="bg-gradient-to-r from-[#e0f7fa] to-[#f1f8ff] shadow-lg rounded-lg p-10 w-full max-w-2xl min-h-[80vh]">
          <h2 className="text-3xl font-bold text-center text-blue-600 mb-10">
            Add New Inventory Item
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col items-center gap-6 w-full">
            {/* Item Name */}
            <div className="max-w-md w-full mx-auto">
              <label htmlFor="itemName" className="block text-sm font-medium text-gray-700 mb-2">
                Item Name
              </label>
              <input
                type="text"
                id="itemName"
                name="itemName"
                value={formData.itemName}
                onChange={handleChange}
                placeholder="Enter item name"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none h-12 bg-gray-50 transition duration-150 ease-in-out"
                list="itemSuggestions"
              />
              <datalist id="itemSuggestions">
                {existingItemNames.map((name, index) => (
                  <option key={index} value={name} />
                ))}
              </datalist>
            </div>

            {/* Category */}
            <div className="max-w-md w-full mx-auto">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none h-12 bg-gray-50 transition duration-150 ease-in-out"
              >
                <option value="">Select a category</option>
                <option>Books</option>
                <option>Electronics</option>
                <option>Lab Equipment</option>
                <option>Stationery</option>
                <option>Furniture</option>
              </select>
            </div>

            {/* Quantity */}
            <div className="max-w-md w-full mx-auto">
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="0"
                placeholder="Enter quantity"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none h-12 bg-gray-50 transition duration-150 ease-in-out pr-12 [&::-webkit-outer-spin-button]:[-webkit-appearance:none] [&::-webkit-inner-spin-button]:[-webkit-appearance:none] [-moz-appearance:textfield]"
              />
            </div>

            {/* Location */}
            <div className="max-w-md w-full mx-auto">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Enter location"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none h-12 bg-gray-50 transition duration-150 ease-in-out"
              />
            </div>

            {/* Date Added */}
            <div className="max-w-md w-full mx-auto">
              <label htmlFor="dateAdded" className="block text-sm font-medium text-gray-700 mb-2">
                Date Added
              </label>
              <input
                type="date"
                id="dateAdded"
                name="dateAdded"
                value={formData.dateAdded}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none h-12 bg-gray-50 transition duration-150 ease-in-out"
              />
            </div>

            {/* Status */}
            <div className="max-w-md w-full mx-auto">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none h-12 bg-gray-50 transition duration-150 ease-in-out"
              >
                <option value="">Select status</option>
                <option>Available</option>
                <option>Low Stock</option>
                <option>Out of Stock</option>
              </select>
            </div>

            {/* Submit Button */}
            <div className="max-w-[200px] w-full mx-auto mt-4">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-5 rounded-lg font-medium hover:bg-blue-700 transition duration-300 text-lg shadow-md hover:shadow-lg min-h-[60px]"
              >
                Add Item
              </button>
            </div>
          </form>
          
        </div>
      </div>
    </>
  );
};

export default AddItemForm;
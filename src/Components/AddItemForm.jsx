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
           <h2 className="text-center mb-10 text-xl font-semibold">Add Items</h2>
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
 {/* Main Content - Centered Single Column */}
<div className="flex items-center justify-center min-h-screen bg-gray-50 ml-[250px] px-6 py-10">
  <div className="w-full max-w-2xl bg-white shadow-xl rounded-2xl p-10 border border-gray-200">
    <h2 className="text-3xl font-bold text-center text-indigo-700 mb-8">
      Add New Inventory Item
    </h2>
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Item Name */}
      <div>
        <label htmlFor="itemName" className="block text-sm font-semibold text-gray-700 mb-1">
          Item Name
        </label>
        <input
          type="text"
          id="itemName"
          name="itemName"
          value={formData.itemName}
          onChange={handleChange}
          placeholder="e.g. Microscope"
          list="itemSuggestions"
          required
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
        />
        <datalist id="itemSuggestions">
          {existingItemNames.map((name, index) => (
            <option key={index} value={name} />
          ))}
        </datalist>
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-1">
          Category
        </label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
        >
          <option value="">Select category</option>
          <option>Books</option>
          <option>Electronics</option>
          <option>Lab Equipment</option>
          <option>Stationery</option>
          <option>Furniture</option>
        </select>
      </div>

      {/* Quantity */}
      <div>
        <label htmlFor="quantity" className="block text-sm font-semibold text-gray-700 mb-1">
          Quantity
        </label>
        <input
          type="number"
          id="quantity"
          name="quantity"
          value={formData.quantity}
          onChange={handleChange}
          min="0"
          placeholder="e.g. 10"
          required
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
        />
      </div>

      {/* Location */}
      <div>
        <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-1">
          Location
        </label>
        <input
          type="text"
          id="location"
          name="location"
          value={formData.location}
          onChange={handleChange}
          placeholder="e.g. Room 102"
          required
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
        />
      </div>

      {/* Date Added */}
      <div>
        <label htmlFor="dateAdded" className="block text-sm font-semibold text-gray-700 mb-1">
          Date Added
        </label>
        <input
          type="date"
          id="dateAdded"
          name="dateAdded"
          value={formData.dateAdded}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
        />
      </div>

      {/* Status */}
      <div>
        <label htmlFor="status" className="block text-sm font-semibold text-gray-700 mb-1">
          Status
        </label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
        >
          <option value="">Select status</option>
          <option>Available</option>
          <option>Low Stock</option>
          <option>Out of Stock</option>
        </select>
      </div>

      {/* Submit Button */}
      <div className="pt-4">
  <button
    type="submit"
    className="w-40 bg-indigo-600 text-white py-2 px-4 rounded-md text-base font-medium hover:bg-indigo-700 transition shadow-sm mx-auto block"
  >
    ➕ Add Item
  </button>
</div>


    </form>
  </div>
</div>

    </>
  );
};

export default AddItemForm;
import React from "react";
import { Link } from "react-router-dom";
import {
  MdDashboard,
  MdInventory,
  MdAddBox,
  MdList,
  MdAssessment,
  MdSettings,
} from "react-icons/md";

const Settings = () => {
  return (
    <div className="flex h-screen font-inter bg-[#f1f4f9]">
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

      {/* Main Content */}
      <div className="flex-1 ml-[250px]">
        {/* Navbar */}
        <div className="bg-[#4c8bf5] text-white py-4 px-6 text-lg font-bold text-center fixed top-0 left-[250px] right-0 z-10">
          ⚙️ Settings
        </div>

        {/* Content */}
        <div className="mt-20 px-8 py-6 overflow-y-auto">
          <h1 className="mb-8 text-2xl font-semibold text-[#3f51b5]">Manage Your Preferences</h1>

          <div className="grid gap-5 max-w-[1200px] mx-auto grid-cols-1 md:grid-cols-2">
            {/* Profile Info */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">👤 Profile Information</h2>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col">
                  <label htmlFor="username" className="mb-1 font-semibold text-gray-700">Username</label>
                  <input type="text" id="username" placeholder="e.g. johndoe" className="p-2 border border-gray-300 rounded-lg bg-gray-100" />
                </div>
                <div className="flex flex-col">
                  <label htmlFor="email" className="mb-1 font-semibold text-gray-700">Email Address</label>
                  <input type="email" id="email" placeholder="e.g. user@school.edu" className="p-2 border border-gray-300 rounded-lg bg-gray-100" />
                </div>
                <div className="flex flex-col">
                  <label htmlFor="password" className="mb-1 font-semibold text-gray-700">Change Password</label>
                  <input type="password" id="password" placeholder="••••••••" className="p-2 border border-gray-300 rounded-lg bg-gray-100" />
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">⚙️ Inventory Preferences</h2>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col">
                  <label htmlFor="low-stock" className="mb-1 font-semibold text-gray-700">Low Stock Alert Threshold</label>
                  <input type="text" id="low-stock" placeholder="e.g. 5" className="p-2 border border-gray-300 rounded-lg bg-gray-100" />
                </div>
                <div className="flex flex-col">
                  <label htmlFor="default-category" className="mb-1 font-semibold text-gray-700">Default Category</label>
                  <select id="default-category" className="p-2 border border-gray-300 rounded-lg bg-gray-100">
                    <option>Stationery</option>
                    <option>Furniture</option>
                    <option>Lab Equipment</option>
                    <option>Cleaning Supplies</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">🔔 Notification Settings</h2>
              <div className="flex flex-col gap-4">
                <label className="flex items-center text-gray-700">
                  <input type="checkbox" defaultChecked className="mr-2" /> Email Alerts
                </label>
                <label className="flex items-center text-gray-700">
                  <input type="checkbox" defaultChecked className="mr-2" /> Weekly Inventory Summary
                </label>
              </div>
            </div>

            {/* Backup */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">💾 Backup & Restore</h2>
              <div className="flex gap-4 flex-wrap">
                <button onClick={() => alert("Backup initiated!")} className="bg-[#3f51b5] hover:bg-[#5c6bc0] text-white font-bold py-2 px-4 rounded transition-colors">
                  Backup Data
                </button>
                <button onClick={() => alert("Import functionality coming soon")} className="bg-[#3f51b5] hover:bg-[#5c6bc0] text-white font-bold py-2 px-4 rounded transition-colors">
                  Import Backup
                </button>
              </div>
            </div>
          </div>

          {/* Save & Logout Buttons */}
          <div className="mt-8 flex gap-4 flex-wrap">
            <button onClick={() => alert("Changes saved!")} className="bg-[#3f51b5] hover:bg-[#5c6bc0] text-white font-bold py-2 px-4 rounded transition-colors">
              ✅ Save Changes
            </button>
            <button onClick={() => alert("Logging out...")} className="bg-[#3f51b5] hover:bg-[#5c6bc0] text-white font-bold py-2 px-4 rounded transition-colors">
              🚪 Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

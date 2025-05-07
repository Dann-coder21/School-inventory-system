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

const ViewItems = () => {
  const { items } = useContext(InventoryContext);

  return (
    <div className="min-h-screen flex flex-col font-inter bg-gradient-to-br from-[#e0f7fa] to-[#f1f8ff]">
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
        <MdInventory className="text-2xl" /> {/* Changed to MdInventory */}
      </div>
      <span className="text-lg font-bold whitespace-nowrap">School Inventory Overview</span>
    </div>
  </div>
  <div></div>
</div>

   {/* Main Content */}
   <div className="ml-[250px] mt-[70px] p-8 flex-1 min-h-[calc(100vh-70px)] flex flex-col">
  <h1 className="text-xl font-semibold text-[#3f51b5] mb-4 text-center">📋 Items in Inventory</h1>
  
  <div className="flex-1 flex flex-col items-center justify-start">
    <div className="w-full max-w-7xl mx-auto">
    <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-12"> {/* Increased mb-8 to mb-12 */}
    <table className="w-full border-collapse">
    <thead>
      <tr>
        <th className="py-2 px-6 text-sm text-left bg-[#3f51b5] text-white font-semibold">
          Item Name
        </th>
        <th className="py-2 px-6 text-sm text-left bg-[#3f51b5] text-white font-semibold">
          Category
        </th>
        <th className="py-2 px-6 text-sm text-left bg-[#3f51b5] text-white font-semibold">
          Quantity
        </th>
        <th className="py-2 px-6 text-sm text-left bg-[#3f51b5] text-white font-semibold">
          Status
        </th>
      </tr>
    </thead>
    <tbody>
      {items.length === 0 ? (
        <tr>
          <td colSpan="4" className="text-center py-4 text-sm text-gray-500">
            No items found in inventory
          </td>
        </tr>
      ) : (
        items.map((item, index) => (
          <tr key={index} className="hover:bg-gray-50">
            <td className="py-2 px-6 text-sm border-t border-gray-100">{item.item_name}</td>
            <td className="py-2 px-6 text-sm border-t border-gray-100">{item.category}</td>
            <td className="py-2 px-6 text-sm border-t border-gray-100">{item.quantity}</td>
            <td className="py-2 px-6 text-sm border-t border-gray-100">
              {item.status === "Out of Stock" ? (
                <span className="text-red-500 flex items-center gap-1">
                  <span className="text-xs">❌</span>
                  {item.status}
                </span>
              ) : (
                <span className="text-green-500 flex items-center gap-1">
                  <span className="text-xs">✅</span>
                  {item.status}
                </span>
              )}
            </td>
          </tr>
        ))
      )}
    </tbody>
  </table>
</div>

<div className="text-center mt-12"> {/* Increased mt-8 to mt-12 */}
  <Link
    to="/dashboard"
    className="inline-block bg-[#4c8bf5] hover:bg-[#3b73d1] text-white py-2 px-5 rounded-lg transition-colors duration-300 text-sm font-medium"
  >
    ← Back to Dashboard
  </Link>
</div>

</div>
  </div>
</div>
    </div>
  );
};

export default ViewItems;
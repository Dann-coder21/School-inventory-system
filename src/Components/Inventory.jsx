import React, { useContext, useState, useEffect} from "react";
import "../Styles/Inventory.css"
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
import axios from "axios";
import Swal from "sweetalert2";


function Inventory() {
  const [withdrawInfo, setWithdrawInfo] = useState({});
  const [addStockInfo, setAddStockInfo] = useState({});
  const [whoTook, setWhoTook] = useState({});
  const [activeRow, setActiveRow] = useState(null);
  const [activeAddRow, setActiveAddRow] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showActions, setShowActions] = useState(null);
  const { items, setItems, loading, error, fetchItems, updateItems } = useContext(InventoryContext);


  // Add this right before your loading check

  useEffect(() => {

   if (loading) {
     // Show loading indicator
   } else if (error) {
     // Show error message
   }
  }, [fetchItems, loading, error]);



  console.log(items)
  const filteredItems = items.filter((item) => {
    // Safely handle potentially undefined properties
    const itemName = item.item_name ? item.item_name.toLowerCase() : '';
    const category = item.category ? item.category.toLowerCase() : '';
    const status = item.status ? item.status.toLowerCase() : '';
    const dateAdded = item.date_added 
      ? new Date(item.date_added).toLocaleDateString().toLowerCase() 
      : '';
  
    return (
      itemName.includes(searchTerm.toLowerCase()) ||
      category.includes(searchTerm.toLowerCase()) ||
      status.includes(searchTerm.toLowerCase()) ||
      dateAdded.includes(searchTerm.toLowerCase())
    );
  });

  const handleDelete = () => {
    if (itemToDelete !== null) {
      const updatedItems = [...items];
      updatedItems.splice(itemToDelete, 1);
      setItems(updatedItems);
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };
const handleWithdraw = async (index, recipientName, quantity) => {
  if (!recipientName || !quantity || quantity <= 0) {
    Swal.fire({
      icon: "warning",
      title: "Invalid Input",
      text: "Please enter valid withdrawal details",
    });
    return;
  }

  const item = items[index];

  try {
    const token = localStorage.getItem("token");
    if (!token) {
      Swal.fire({
        icon: "error",
        title: "Session Expired",
        text: "Please login again.",
      }).then(() => {
        window.location.href = "/login";
      });
      return;
    }

    // Send withdrawal request
    const response = await axios.post(
      "http://localhost:3000/withdrawals/withdraw",
      {
        item_id: item.id,
        quantity: Number(quantity),
        withdrawn_by: recipientName,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Use the context's updateItems function to ensure consistency
    updateItems(items.map(item => 
      item.id === response.data.updatedItem.id 
        ? response.data.updatedItem 
        : item
    ));

    // Reset UI states
    setWithdrawInfo(prev => ({ ...prev, [index]: {} }));
    setActiveRow(null);
    setWhoTook(prev => ({ ...prev, [index]: recipientName }));

    // Show success
    await Swal.fire({
      icon: "success",
      title: "Withdrawal Recorded",
      text: "The withdrawal was recorded successfully.",
      timer: 2000,
      showConfirmButton: false,
    });

  } catch (error) {
    console.error("Withdrawal error:", error);

    if (error.response?.status === 401) {
      Swal.fire({
        icon: "error",
        title: "Session Expired",
        text: "Please login again.",
      }).then(() => {
        localStorage.removeItem("token");
        window.location.href = "/login";
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Withdrawal Failed",
        text: error.response?.data?.error || "Failed to record withdrawal",
      });
    }
  }
};

  const handleAddStock = (index, quantity) => {
    // Convert quantity to number if it's a string
    const quantityToAdd = Number(quantity);
    
    if (!quantityToAdd || quantityToAdd <= 0) {
      alert("Please enter a valid quantity to add.");
      return;
    }
  
    const updatedItems = [...items];
    // Ensure we're adding numbers, not concatenating strings
    updatedItems[index].quantity += quantityToAdd;
    
    updatedItems[index].status =
      updatedItems[index].quantity === 0
        ? "Out of Stock"
        : updatedItems[index].quantity < 5
        ? "Low Stock"
        : "Available";
  
    setItems(updatedItems);
    setAddStockInfo((prev) => ({
      ...prev,
      [index]: "",
    }));
    setActiveAddRow(null);
  };
  return (
    <>
    <div> welcome </div>
  <div className="fixed top-0 left-0 w-[250px] h-screen bg-[#3f51b5] text-white pt-8 flex flex-col z-50">
         <h2 className="text-center mb-10 text-xl font-semibold">Inventory</h2>
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
{/* Navbar */}
<div className="grid grid-cols-3 items-center bg-gradient-to-r from-blue-500 to-indigo-500 text-white h-[70px] px-6 shadow-lg z-40">
  {/* First Grid - Empty but keeps space (matches your second example) */}
  <div className="flex justify-end">
    <div className="relative w-[240px]">
      <input
        type="text"
        placeholder="🔍 Search inventory..."
        className="w-full py-2 px-4 rounded-xl bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300 text-sm"
      />
    </div>
  </div>

  {/* Second Grid - Centered Title (matches your second example structure) */}
  <div className="flex items-center justify-center">
    <div className="flex items-center">
      <div className="p-2 bg-white/10 rounded-lg mr-3">
        <span className="text-xl">📦</span>
      </div>
      <span className="text-lg font-bold whitespace-nowrap">School Inventory Overview</span>
    </div>
  </div>

  {/* Third Grid - Empty (balance) */}
  <div></div>
</div>


{/* Content Section Below Navbar */}
<div
  className="flex flex-col pt-[80px] p-6 w-[calc(100%-400px)] text-[0.9rem] gap-6" 
  style={{ marginLeft: '300px' }}
>



  {/* Header and Add Item Button */}
  <div className="flex justify-between items-center mb-4">
    <h1 className="text-xl font-semibold">📋 Current Inventory</h1>
    <Link
  to="/AddItemsForm"
  className="inline-flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white py-4 px-6 rounded-[7px] text-sm font-medium transition-all duration-300 hover:shadow-md active:scale-95 border border-green-700 focus:outline-none focus:ring-2 focus:ring-green-300 min-w-[160px] h-12"
>
  + Add New Item
</Link>
  </div>

  {filteredItems.length === 0 ? (
    <div className="text-center p-12 bg-white rounded-lg shadow-md">
      <p className="mb-5 text-gray-600">
        {items.length === 0
          ? "No items in inventory yet."
          : "No items match your search."}
      </p>
      <Link
        to="/AddItemsForm"
        className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition"
      >
        {items.length === 0 ? "Add Your First Item" : "Add New Item"}
      </Link>
    </div>
  ) : (
    <div className="bg-white rounded-md shadow-md overflow-hidden">
      <table className="w-full border-collapse text-[0.8rem]">
        <thead className="bg-gray-100 text-gray-700 text-[0.75rem] uppercase">
          <tr>
            <th className="py-2 px-3 text-left border-b">Item Name</th>
            <th className="py-2 px-3 text-left border-b">Category</th>
            <th className="py-2 px-3 text-left border-b">Quantity</th>
            <th className="py-2 px-3 text-left border-b">Status</th>
            <th className="py-2 px-3 text-left border-b">Date Added</th>
            <th className="py-2 px-3 text-left border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredItems.map((item, index) => (
            <tr
              key={item.id}
              className={`hover:bg-gray-100 ${
                activeRow === index ? "bg-blue-100" : ""
              }`}
            >
              <td className="py-2 px-3 border-b">{item.item_name}</td>
              <td className="py-2 px-3 border-b">{item.category}</td>
              <td className="py-2 px-3 border-b">{item.quantity}</td>
              <td
                className={`py-2 px-3 border-b font-semibold ${
                  item.status.toLowerCase() === "available"
                    ? "text-green-500"
                    : item.status.toLowerCase() === "low stock"
                    ? "text-orange-400"
                    : "text-red-500"
                }`}
              >
                {item.status}
              </td>
              <td className="py-2 px-3 border-b">
                {new Date(item.date_added).toLocaleDateString()}
                </td>
                <td className="py-2 px-3 border-b w-[220px] align-top">
  {/* Ellipsis button for actions */}
  <button
    onClick={() => setShowActions(showActions === index ? null : index)}
    className="flex flex-col items-center justify-center p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
    aria-label="Actions"
  >
    <svg
      className="w-5 h-5"
      fill="currentColor"  
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="6" r="2" />  {/* Top dot */}
      <circle cx="12" cy="12" r="2" /> {/* Middle dot */}
      <circle cx="12" cy="18" r="2" /> {/* Bottom dot */}
    </svg>
  </button>

  {/* Conditionally render the buttons only when toggled */}
  {showActions === index && (
    <div className="mt-3 flex gap-3 flex-wrap">
      {/* Withdraw Button */}
      <button
        onClick={() => setActiveRow(activeRow === index ? null : index)}
        className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-[7px] text-sm font-medium transition-all duration-300 hover:shadow-md active:scale-95 border border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 min-w-[150px] h-10"
      >
        {activeRow === index ? "Cancel" : "Withdraw"}
      </button>
      
      {/* Add Stock Button */}
      <button
        onClick={() => setActiveAddRow(activeAddRow === index ? null : index)}
        className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-[7px] text-sm font-medium transition-all duration-300 hover:shadow-md active:scale-95 border border-green-700 focus:outline-none focus:ring-2 focus:ring-green-300 min-w-[150px] h-10"
      >
        {activeAddRow === index ? "Cancel" : "Add Stock"}
      </button>

      {/* Delete Button */}
      <button
        onClick={() => {
          setItemToDelete(index);
          setShowDeleteModal(true);
        }}
        className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-[7px] text-sm font-medium transition-all duration-300 hover:shadow-md active:scale-95 border border-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 min-w-[120px] h-8"
        title="Delete item"
      >
        🗑️
      </button>
    </div>
  )}
</td>
      
 {/* These modals should be outside the td element */}
  {activeRow === index && (
    <div className="fixed inset-0 z-[1000] overflow-y-auto">
      <div className="fixed inset-0 bg-gradient-to-br from-black/30 to-black/50 backdrop-blur-md transition-opacity" />
      <div className="flex min-h-full items-center justify-center p-8 text-center">
        {/* Main modal container - added pb-8 for bottom padding */}
        <div className="relative w-full transform overflow-hidden rounded-[1.5rem] bg-white p-10 text-left shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] transition-all sm:my-16 sm:max-w-xl min-h-[70vh] flex flex-col pb-8">
          <button
          onClick={() => setActiveRow(null)}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Close"
        >
          <svg
            className="w-6 h-6 text-gray-500 hover:text-gray-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex-grow">
          {/* Withdraw icon */}
          <div className="mx-auto flex flex-col items-center mb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-blue-100 mb-5 shadow-inner">
              <div className="p-3 bg-white rounded-full shadow-md">
                <svg
                  className="h-8 w-8 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
              </div>
            </div>
            
            <h3 className="text-3xl font-bold text-gray-900 mb-2">
              Withdraw Items
            </h3>
            <div className="w-16 h-1 bg-blue-200 rounded-full mb-4"></div>
          </div>

          {/* Form Content */}
          <div className="space-y-6 px-4">
          <div className="grid place-items-center w-full mt-6">
  <div className="w-full max-w-md">
    <label className="block text-sm font-medium text-gray-700 mb-6 text-left">
      Recipient Name
    </label>
    <input
      type="text"
      placeholder="Who is receiving these items?"
      value={withdrawInfo[index]?.name || ""}
      onChange={(e) =>
        setWithdrawInfo((prev) => ({
          ...prev,
          [index]: {
            ...prev[index],
            name: e.target.value,
          },
        }))
      }
      className="w-full px-5 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-400 placeholder-opacity-100"
    />
  </div>
</div>


<div className="grid place-items-center mt-8 w-full">
  <div className="w-2/3 max-w-sm">  {/* Reduced from w-3/4 to w-2/3 and max-w-md to max-w-sm */}
    <label className="block text-sm font-medium text-gray-700 mb-2 text-center">  {/* Reduced mb-3 to mb-2 */}
      Quantity (Max: {item.quantity})
    </label>
  <input
  type="number"
  min="1"
  max={item.quantity}
  value={withdrawInfo[index]?.quantity || ""}
  onChange={(e) => {
    const value = Math.min(
      item.quantity, 
      Math.max(1, parseInt(e.target.value) || 1)  // Added missing parenthesis here
    );
    setWithdrawInfo((prev) => ({
      ...prev,
      [index]: {
        ...prev[index],
        quantity: value,
      },
    }));
  }}
  className="w-full px-5 py-3 text-lg bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-400 h-12"
  placeholder="Enter quantity"
/>
  </div>
</div>






            
          </div>
        </div>

        {/* Buttons moved to bottom with margin */}
        {/* Buttons container - positioned at bottom center with proper spacing */}
        <div className="mt-8 px-4 w-full">
  <div className="flex gap-4 justify-center mb-6"> {/* Added mb-6 for margin below button group */}
    <button
      onClick={() => setActiveRow(null)}
      className="bg-gray-500 hover:bg-gray-600 text-white px-5 py-2 rounded-[7px] text-sm font-medium transition-all duration-300 hover:shadow-md active:scale-95 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 min-w-[150px] h-10"
    >
      Cancel
    </button>
    <button
      onClick={() => handleWithdraw(index, withdrawInfo[index]?.name, withdrawInfo[index]?.quantity)}
      className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-[7px] text-sm font-medium transition-all duration-300 hover:shadow-md active:scale-95 border border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 min-w-[150px] h-10"
    >
      Confirm Withdrawal
    </button>
  </div>
  
  {whoTook[index] && (
    <p className="text-xs text-gray-500 mt-2 text-center"> {/* Added mt-2 for spacing above text */}
      Last withdrawal: <strong>{whoTook[index]}</strong>
    </p>
  )}
</div>
      </div>
    </div>
  </div>
)}

  
{activeAddRow === index && (
  <div className="fixed inset-0 z-[1000] overflow-y-auto">
    <div className="fixed inset-0 bg-gradient-to-br from-black/30 to-black/50 backdrop-blur-md transition-opacity" />
    <div className="flex min-h-full items-center justify-center p-6 text-center">
      <div className="relative w-full transform overflow-hidden rounded-[1.5rem] bg-white p-8 text-left shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] transition-all sm:my-8 sm:max-w-xl min-h-[60vh] flex flex-col pb-6">
        
        {/* Close Button */}
        <button
          onClick={() => setActiveAddRow(null)}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
          aria-label="Close"
        >
          <svg
            className="w-6 h-6 text-gray-500 hover:text-gray-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex-grow">
          {/* Header Section */}
          <div className="mx-auto flex flex-col items-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-50 to-green-100 mb-4 shadow-inner">
              <div className="p-3 bg-white rounded-full shadow-md">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              Add Stock Quantity
            </h3>
            <p className="text-gray-600 mb-4">
              <span className="font-semibold text-gray-800">{items[index]?.itemName}</span>
            </p>
            <div className="w-16 h-1 bg-green-200 rounded-full mb-4"></div>
          </div>

          {/* Input Field with Grid */}
          <div className="grid place-items-center w-full mt-4">
            <div className="w-2/3 max-w-sm">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Quantity to Add
                </label>
                <span className="text-sm text-gray-500">
                  Current: <span className="font-medium text-gray-700">{items[index]?.quantity || 0}</span>
                </span>
              </div>
              <input
                type="number"
                min="1"
                value={addStockInfo[index] || ""}
                onChange={(e) => {
                  const value = e.target.value === "" ? "" : Math.max(1, parseInt(e.target.value)) || "";
                  setAddStockInfo((prev) => ({
                    ...prev,
                    [index]: value,
                  }));
                }}
                className="w-full px-5 py-3 text-lg bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all placeholder-gray-400 h-12"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 px-4 w-full">
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setActiveAddRow(null)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-5 py-2 rounded-[7px] text-sm font-medium transition-all duration-300 hover:shadow-md active:scale-95 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 min-w-[150px] h-10"
            >
              Cancel
            </button>
            <button
              onClick={() => handleAddStock(index, addStockInfo[index])}
              disabled={!addStockInfo[index]}
              className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-[7px] text-sm font-medium transition-all duration-300 hover:shadow-md active:scale-95 border border-green-700 focus:outline-none focus:ring-2 focus:ring-green-300 min-w-[150px] h-10 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Confirm Addition
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>
{/* Delete Confirmation Modal */}
{/* Delete Confirmation Modal */}
{showDeleteModal && (
  <div className="fixed inset-0 z-[1000] overflow-y-auto">
    {/* Enhanced blur backdrop */}
    <div className="fixed inset-0 bg-gradient-to-br from-black/30 to-black/50 backdrop-blur-md transition-opacity" />
    
    {/* Modal container */}
    <div className="flex min-h-full items-center justify-center p-8 text-center">
      {/* Modal panel */}
      <div 
        className="relative w-full transform overflow-hidden rounded-[1.5rem] bg-white p-10 text-left shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] transition-all sm:my-16 sm:max-w-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-headline"
      >
        {/* Close button */}
        <button
          onClick={() => setShowDeleteModal(false)}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
          aria-label="Close"
        >
          <svg
            className="w-6 h-6 text-gray-500 hover:text-gray-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal content */}
        <div className="text-center">
          {/* Warning icon */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 mb-6 shadow-inner">
            <div className="p-3 bg-white rounded-full shadow-md">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>
          
          {/* Modal title */}
          <h3 
            className="text-3xl font-bold text-gray-900 mb-2"
            id="modal-headline"
          >
            Confirm Deletion
          </h3>
          <div className="w-16 h-1 bg-red-200 rounded-full mb-6 mx-auto"></div>
          
          <div className="mt-2 px-4">
            <p className="text-gray-600 mb-8 text-lg">
              Are you sure you want to delete this item? This action cannot be undone.
            </p>
          </div>
        </div>

        {/* Action buttons - matching other modals */}
        <div className="mt-6 px-4 w-full">
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-5 py-2 rounded-[7px] text-sm font-medium transition-all duration-300 hover:shadow-md active:scale-95 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 min-w-[150px] h-10"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-[7px] text-sm font-medium transition-all duration-300 hover:shadow-md active:scale-95 border border-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 min-w-[150px] h-10"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

</>
);
}

export default Inventory;
import React, { useContext, useState, useEffect } from "react";
import { InventoryContext } from "../contexts/InventoryContext";
import { ThemeContext } from "../contexts/ThemeContext";
import { NavLink, useNavigate } from "react-router-dom"; // Using NavLink
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

// Importing icons
import {
  MdDashboard,
  MdInventory,
  MdAddBox,
  MdList,
  MdAssessment,
  MdSettings,
  MdSchool, // For sidebar brand
  MdOutlineNoteAdd, // Icon for "Add Item" form header
  MdSave, // Icon for submit button
} from "react-icons/md";

const AddItemForm = () => {
  const { items, addItem } = useContext(InventoryContext);
  const { darkMode } = useContext(ThemeContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    itemName: "",
    category: "",
    quantity: "", // Keep as string for easier input handling, convert on submit
    location: "",
    dateAdded: new Date().toISOString().split('T')[0], // Default to today
    // Status will be derived from quantity, so no need for a status input field
  });

  const [existingItemNames, setExistingItemNames] = useState([]);
  
  // Update datalist when items change
  useEffect(() => {
    setExistingItemNames([...new Set(items.map((item) => item.item_name))]); // Assuming item_name from backend
  }, [items]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const swalThemeProps = { // Copied from Inventory page for consistency
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const itemDataToSend = {
      ...formData,
      quantity: parseInt(formData.quantity, 10), // Ensure quantity is a number
      // Status is usually determined by backend based on quantity or set to 'Available'
    };

    // Simple validation
    if (itemDataToSend.quantity < 0) {
        Swal.fire({
            ...swalThemeProps,
            icon: "warning",
            title: "Invalid Quantity",
            text: "Quantity cannot be negative."
        });
        return;
    }

    try {
      await addItem(itemDataToSend); // addItem should handle API call
      
      Swal.fire({
        ...swalThemeProps,
        iconHtml: `<span class="text-green-500 dark:text-green-400"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg></span>`,
        title: 'Item Added!',
        text: `"${itemDataToSend.itemName}" has been successfully added to the inventory.`,
        timer: 3000,
        showConfirmButton: false, // Timer will close it
      }).then(() => {
        navigate("/inventory");
      });
    } catch (err) {
      // Error handling should be based on how your `addItem` function in context throws errors
      const errorMessage = err.response?.data?.message || err.message || 'Failed to add item. Please try again.';
      const errorTitle = err.response?.data?.message === "Item already exists in your inventory" 
                         ? 'Item Already Exists' 
                         : 'Error Adding Item';
      
      Swal.fire({
        ...swalThemeProps,
        icon: "error",
        title: errorTitle,
        text: errorMessage,
        footer: err.response?.data?.existingId ? `Item ID: ${err.response?.data?.existingId}` : undefined,
      });
    }
  };

  // Sidebar link styling (identical to Inventory/Settings)
  const sidebarLinkClass = ({ isActive }) =>
    `px-5 py-3.5 hover:bg-white/20 transition-colors flex items-center gap-3.5 text-sm font-medium rounded-lg mx-3 my-1.5 ${
      isActive 
        ? (darkMode ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/30 text-white shadow-md') 
        : (darkMode ? 'text-slate-300 hover:text-white hover:bg-slate-700/50' : 'text-indigo-100 hover:text-white')
    }`;
  const sidebarIconClass = "text-xl";

  // Common styles for form elements
  const formGroupClass = "flex flex-col gap-1.5";
  const labelClass = `block text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`;
  const inputBaseClass = `w-full px-3.5 py-2.5 rounded-md border text-sm transition-colors duration-150 focus:ring-2 focus-visible:outline-none
                        ${darkMode ? 'bg-slate-700 border-slate-600 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400 text-slate-100' 
                                  : 'bg-white border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400 text-slate-800'}`;


  return (
    <div className={`flex h-screen font-sans antialiased ${darkMode ? 'dark' : ''}`}>
      {/* Sidebar (Identical to Inventory/Settings Page) */}
      <aside className={`fixed top-0 left-0 w-[250px] h-full flex flex-col z-50 transition-colors duration-300 shadow-xl print:hidden
                       ${darkMode ? 'bg-slate-800 border-r border-slate-700' : 'bg-gradient-to-b from-indigo-600 to-indigo-700 border-r border-indigo-700'}`}>
        <div className="flex items-center justify-center h-20 border-b border-white/20">
          <MdSchool className={`text-3xl ${darkMode ? 'text-indigo-400' : 'text-white'}`} />
          <h1 className={`ml-3 text-2xl font-bold tracking-tight ${darkMode ? 'text-slate-100' : 'text-white'}`}>School IMS</h1>
        </div>
        <nav className="flex-grow pt-5">
          <NavLink to="/dashboard" className={sidebarLinkClass}><MdDashboard className={sidebarIconClass} /> Dashboard</NavLink>
          <NavLink to="/inventory" className={sidebarLinkClass}><MdInventory className={sidebarIconClass} /> Inventory</NavLink>
          <NavLink to="/AddItemsForm" className={sidebarLinkClass}><MdAddBox className={sidebarIconClass} /> Add Items</NavLink>
          <NavLink to="/viewitems" className={sidebarLinkClass}><MdList className={sidebarIconClass} /> View Items</NavLink>
          <NavLink to="/reports" className={sidebarLinkClass}><MdAssessment className={sidebarIconClass} /> Reports</NavLink>
          <NavLink to="/settings" className={sidebarLinkClass}><MdSettings className={sidebarIconClass} /> Settings</NavLink>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col ml-[250px] min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
        {/* Header (Identical structure, title changed) */}
        <header className={`flex items-center justify-between h-20 px-6 sm:px-8 fixed top-0 left-[250px] right-0 z-40 transition-colors duration-300 print:hidden
                           ${darkMode ? 'bg-slate-800/75 backdrop-blur-lg border-b border-slate-700' : 'bg-white/75 backdrop-blur-lg border-b border-slate-200'} shadow-sm`}>
          <h2 className={`text-xl sm:text-2xl font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>
            Add New Item to Inventory
          </h2>
          {/* Optional: Can add a "Cancel" or "Back to Inventory" button here */}
        </header>

        {/* Form Content */}
        <main className="flex-1 p-6 pt-[104px] overflow-y-auto flex items-center justify-center"> {/* 80px header + 24px padding */}
          <div className={`w-full max-w-2xl rounded-xl shadow-2xl p-6 sm:p-8 
                         ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}`}>
            
            <div className="flex items-center gap-3 mb-6 sm:mb-8">
              <div className={`p-3 rounded-lg ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                <MdOutlineNoteAdd size={28}/>
              </div>
              <h2 className={`text-2xl sm:text-3xl font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                New Item Details
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                {/* Item Name */}
                <div className={formGroupClass}>
                  <label htmlFor="itemName" className={labelClass}>Item Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    id="itemName"
                    name="itemName"
                    value={formData.itemName}
                    onChange={handleChange}
                    placeholder="e.g., Dell Laptop XPS 15"
                    list="itemSuggestions"
                    required
                    className={inputBaseClass}
                  />
                  <datalist id="itemSuggestions">
                    {existingItemNames.map((name, index) => (
                      <option key={index} value={name} />
                    ))}
                  </datalist>
                </div>

                {/* Category */}
                <div className={formGroupClass}>
                  <label htmlFor="category" className={labelClass}>Category <span className="text-red-500">*</span></label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className={`${inputBaseClass} ${formData.category === "" ? (darkMode ? 'text-slate-400' : 'text-slate-500') : ''}`}
                  >
                    <option value="">Select a category...</option>
                    <option value="Books">Books</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Lab Equipment">Lab Equipment</option>
                    <option value="Sports Gear">Sports Gear</option>
                    <option value="Stationery">Stationery</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Quantity */}
                <div className={formGroupClass}>
                  <label htmlFor="quantity" className={labelClass}>Quantity <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    min="0"
                    placeholder="e.g., 10"
                    required
                    className={inputBaseClass}
                  />
                </div>

                {/* Location */}
                <div className={formGroupClass}>
                  <label htmlFor="location" className={labelClass}>Location</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g., Library Shelf A3, Lab 102"
                    className={inputBaseClass}
                  />
                </div>

                {/* Date Added */}
                <div className={`${formGroupClass} md:col-span-2`}> {/* Spanning full width on larger screens if desired, or keep as is */}
                  <label htmlFor="dateAdded" className={labelClass}>Date Added <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    id="dateAdded"
                    name="dateAdded"
                    value={formData.dateAdded}
                    onChange={handleChange}
                    required
                    className={`${inputBaseClass} ${darkMode ? '[color-scheme:dark]' : ''}`} // Helps with date picker theme
                  />
                </div>
              </div>
              
              {/* Submit Button */}
              <div className="pt-4 flex justify-end gap-3">
                <button
                    type="button"
                    onClick={() => navigate('/inventory')}
                    className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-colors
                                ${darkMode ? 'bg-slate-600 hover:bg-slate-500 text-slate-100' 
                                          : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
                >
                    Cancel
                </button>
                <button
                  type="submit"
                  className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg text-white transition-all duration-300 ease-in-out group
                              ${darkMode ? 'bg-indigo-600 hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-400' 
                                        : 'bg-indigo-500 hover:bg-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-300'} 
                              hover:shadow-md active:scale-95`}
                >
                  <MdSave className="text-lg" />
                  Add Item to Inventory
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AddItemForm;
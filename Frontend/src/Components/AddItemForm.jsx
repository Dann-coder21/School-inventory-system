import React, { useContext, useState, useEffect, useMemo, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { InventoryContext } from "../contexts/InventoryContext";
import { ThemeContext } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import Swal from "sweetalert2";
import 'sweetalert2/dist/sweetalert2.min.css';

// Importing icons
import {
  MdDashboard,
  MdInventory,
  MdAddBox,
  MdList,
  MdAssessment,
  MdSettings,
  MdSchool,
  MdOutlineNoteAdd,
  MdSave,
  MdHourglassEmpty,
  MdClear,
  MdRefresh,
  MdPeople,
  MdShoppingCart // ADDED: Icon for Staff Orders link
} from "react-icons/md";
import LoadingSpinner from "../Components/LoadingSpinner";
import Layout from "../Components/Layout/Layout";


// Simple Spinner Icon Component (unchanged)
const SpinnerIcon = () => (
  <MdHourglassEmpty className="animate-spin text-lg" />
);

// Mock dynamic options (unchanged)
const DYNAMIC_CATEGORIES = [
  { value: "Books", label: "Books" },
  { value: "Electronics", label: "Electronics (General)" },
  { value: "Computers", label: "Computers & Laptops" },
  { value: "Furniture", label: "Furniture" },
  { value: "Lab Equipment", label: "Lab Equipment" },
  { value: "Sports Gear", label: "Sports Gear" },
  { value: "Stationery", label: "Stationery" },
  { value: "Consumables", label: "Consumables" },
  { value: "Other", label: "Other" },
];


const AddItemForm = () => {
  const { items, addItem, /* fetchCategories, fetchLocations - if they come from context */ } = useContext(InventoryContext);
  const { darkMode } = useContext(ThemeContext);
  const navigate = useNavigate();
  const itemNameRef = useRef(null);

  const initialFormData = {
    itemName: "",
    sku: "",
    category: "",
    description: "",
    quantity: "",
    costPrice: "",
    location: "",
    dateAdded: new Date().toISOString().split('T')[0],
  };

  const { currentUser } = useAuth(); // Access currentUser

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [existingItemNames, setExistingItemNames] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addAnother, setAddAnother] = useState(false);

  // Focus on the first input field on mount
  useEffect(() => {
    itemNameRef.current?.focus();
  }, []);

  // Update datalist when items change
  useEffect(() => {
    setExistingItemNames([...new Set(items.map((item) => item.item_name))]);
  }, [items]);

  // --- Client-Side Validation Logic (unchanged) ---
  const validateField = (name, value) => {
    let errorMsg = "";
    switch (name) {
      case "itemName":
        if (!value.trim()) errorMsg = "Item name is required.";
        else if (value.trim().length < 3) errorMsg = "Item name must be at least 3 characters.";
        break;
      case "category":
        if (!value) errorMsg = "Category is required.";
        break;
      case "quantity":
        if (value === "" || value === null) errorMsg = "Quantity is required.";
        else if (isNaN(Number(value)) || Number(value) < 0) errorMsg = "Quantity must be a non-negative number.";
        break;
      case "costPrice":
        if (value !== "" && (isNaN(Number(value)) || Number(value) < 0)) errorMsg = "Cost price must be a non-negative number.";
        break;
      case "location": // Ensure location is validated if required
        if (!value.trim()) errorMsg = "Location is required.";
        break;
      default:
        break;
    }
    return errorMsg;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      const fieldError = validateField(name, value);
      setErrors(prevErrors => ({ ...prevErrors, [name]: fieldError }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const fieldError = validateField(name, value);
    setErrors(prevErrors => ({ ...prevErrors, [name]: fieldError }));
  };


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

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;
    Object.keys(initialFormData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });
    if (formData.quantity === "" || formData.quantity === null || isNaN(Number(formData.quantity)) || Number(formData.quantity) < 0) {
      newErrors.quantity = "Quantity must be a non-negative number and is required.";
      isValid = false;
    }
    // Check location if it's required (e.g. if it's always mandatory)
    // if (!formData.location.trim()) { newErrors.location = "Location is required."; isValid = false; }


    setErrors(newErrors);
    return isValid;
  };

  const resetForm = (fullReset = true) => {
    if (fullReset || !addAnother) {
        setFormData(initialFormData);
    } else {
        setFormData(prev => ({
            ...initialFormData,
            category: prev.category,
            location: prev.location,
            dateAdded: prev.dateAdded,
        }));
    }
    setErrors({});
    itemNameRef.current?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      Swal.fire({
        ...swalThemeProps,
        icon: 'warning',
        title: 'Validation Errors',
        text: 'Please correct the errors in the form.',
      });
      return;
    }

    setIsSubmitting(true);

    const itemDataToSend = {
      itemName: formData.itemName.trim(),
      sku: formData.sku.trim(),
      category: formData.category,
      description: formData.description.trim(),
      quantity: parseInt(formData.quantity, 10),
      costPrice: formData.costPrice !== "" ? parseFloat(formData.costPrice) : null,
      location: formData.location.trim(),
      dateAdded: formData.dateAdded,
    };

    try {
      // Assuming addItem handles the API call and updates context
      // You should update your addItem in InventoryContext to handle new fields.
      await addItem(itemDataToSend);

      Swal.fire({
        ...swalThemeProps,
        iconHtml: `<span class="text-green-500 dark:text-green-400"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg></span>`,
        title: 'Item Added!',
        text: `"${itemDataToSend.itemName}" has been successfully added.`,
        timer: 2000,
        showConfirmButton: false,
      }).then(() => {
        if (addAnother) {
          resetForm(false);
        } else {
          navigate("/inventory");
        }
      });
    } catch (err) {
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const sidebarLinkClass = ({ isActive }) =>
    `px-5 py-3.5 hover:bg-white/20 transition-colors flex items-center gap-3.5 text-sm font-medium rounded-lg mx-3 my-1.5 ${
      isActive
        ? (darkMode ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/30 text-white shadow-md')
        : (darkMode ? 'text-slate-300 hover:text-white hover:bg-slate-700/50' : 'text-indigo-100 hover:text-white')
    }`;
  const sidebarIconClass = "text-xl";

  const formGroupClass = "flex flex-col gap-1";
  const labelClass = `block text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`;
  const inputBaseClass = (hasError = false) =>
    `w-full px-3.5 py-2.5 rounded-md border text-sm transition-colors duration-150 focus:ring-2 focus-visible:outline-none
    ${darkMode
      ? `bg-slate-700 placeholder-slate-400 text-slate-100 ${hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50' : 'border-slate-600 focus:ring-indigo-500 focus:border-indigo-500'}`
      : `bg-white placeholder-slate-400 text-slate-800 ${hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50' : 'border-slate-300 focus:ring-indigo-500 focus:border-indigo-500'}`
    }`;
  const errorTextClass = "text-xs text-red-500 dark:text-red-400 mt-1";

  // NEW: Staff Orders link visibility
  const canViewOrders = ['Admin', 'Staff', 'DepartmentHead', 'StockManager'];
  const showOrdersLink = useMemo(() => {
    return canViewOrders.includes(currentUser?.role);
  }, [currentUser?.role]);

  return (
    <Layout>
    <div className={`flex h-screen font-sans antialiased ${darkMode ? 'dark' : ''}`}>
     
      
      {/* Sidebar */}
      {/*
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
                  {currentUser?.role === 'Admin' && (
                    <NavLink to="/admin/users" className={sidebarLinkClass}><MdPeople className={sidebarIconClass} /> User Management</NavLink>
                  )}
                  {showOrdersLink && ( // Conditionally render Staff Orders link
                    <NavLink to="/orders" className={sidebarLinkClass}><MdShoppingCart className={sidebarIconClass} /> Staff Orders</NavLink>
                  )}
                  <NavLink to="/settings" className={sidebarLinkClass}><MdSettings className={sidebarIconClass} /> Settings</NavLink>

                </nav>
      </aside>
      */}

    {/* Main Content Area (unchanged) */}
      <div className={`flex-1 flex flex-col ml-[250px] min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
        {/* Header (unchanged) */}
    <header className={`flex items-center justify-between h-20 px-6 sm:px-8 fixed top-0 left-[250px] right-0 z-40 ${
  darkMode ? 'bg-slate-800/75 backdrop-blur-lg border-b border-slate-700' : 'bg-white/75 backdrop-blur-lg border-b border-slate-200'
} shadow-sm`}>
  <div className="flex items-center gap-3">
    <div className={`p-2.5 rounded-lg ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
      <MdAddBox size={24}/>
    </div>
    <h2 className={`text-xl sm:text-2xl font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>
      Add New Item to Inventory
    </h2>
  </div>
</header>

        {/* Form Content (unchanged) */}
        <main className="flex-1 p-6 pt-[104px] overflow-y-auto flex items-center justify-center">
          <div className={`w-full max-w-3xl rounded-xl shadow-2xl p-6 sm:p-8
                         ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}`}>
            <div className="flex items-center gap-3 mb-6 sm:mb-8">
              <div className={`p-3 rounded-lg ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                <MdOutlineNoteAdd size={28}/>
              </div>
              <h2 className={`text-2xl sm:text-3xl font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                New Item Details
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {/* Item Name */}
                <div className={formGroupClass}>
                  <label htmlFor="itemName" className={labelClass}>Item Name <span className="text-red-500">*</span></label>
                  <input
                    ref={itemNameRef}
                    type="text"
                    id="itemName"
                    name="itemName"
                    value={formData.itemName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="e.g., Dell Laptop XPS 15"
                    list="itemSuggestions"
                    required
                    className={inputBaseClass(!!errors.itemName)}
                    disabled={isSubmitting}
                  />
                  <datalist id="itemSuggestions">
                    {existingItemNames.map((name, index) => ( <option key={index} value={name} /> ))}
                  </datalist>
                  {errors.itemName && <p className={errorTextClass}>{errors.itemName}</p>}
                </div>

                {/* SKU */}
                <div className={formGroupClass}>
                  <label htmlFor="sku" className={labelClass}>SKU / Barcode</label>
                  <input
                    type="text"
                    id="sku"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="e.g., SKU12345 or scan barcode"
                    className={inputBaseClass(!!errors.sku)}
                    disabled={isSubmitting}
                  />
                  {errors.sku && <p className={errorTextClass}>{errors.sku}</p>}
                </div>

                {/* Category */}
                <div className={formGroupClass}>
                  <label htmlFor="category" className={labelClass}>Category <span className="text-red-500">*</span></label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    className={`${inputBaseClass(!!errors.category)} ${formData.category === "" ? (darkMode ? 'text-slate-400' : 'text-slate-500') : ''}`}
                    disabled={isSubmitting}
                  >
                    <option value="">Select a category...</option>
                    {DYNAMIC_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                  {errors.category && <p className={errorTextClass}>{errors.category}</p>}
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
                    onBlur={handleBlur}
                    min="0"
                    placeholder="e.g., 10"
                    required
                    className={inputBaseClass(!!errors.quantity)}
                    disabled={isSubmitting}
                  />
                  {errors.quantity && <p className={errorTextClass}>{errors.quantity}</p>}
                </div>

                {/* Cost Price */}
                <div className={formGroupClass}>
                  <label htmlFor="costPrice" className={labelClass}>Cost Price (per unit)</label>
                  <input
                    type="number"
                    id="costPrice"
                    name="costPrice"
                    value={formData.costPrice}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    min="0"
                    step="0.01"
                    placeholder="e.g., 19.99"
                    className={inputBaseClass(!!errors.costPrice)}
                    disabled={isSubmitting}
                  />
                  {errors.costPrice && <p className={errorTextClass}>{errors.costPrice}</p>}
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
                    onBlur={handleBlur}
                    placeholder="e.g., Library Shelf A3, Lab 102"
                    className={inputBaseClass(!!errors.location)}
                    disabled={isSubmitting}
                  />
                  {errors.location && <p className={errorTextClass}>{errors.location}</p>}
                </div>

                {/* Date Added - Spans 2 columns */}
                <div className={`${formGroupClass} md:col-span-2`}>
                  <label htmlFor="dateAdded" className={labelClass}>Date Added <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    id="dateAdded"
                    name="dateAdded"
                    value={formData.dateAdded}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    className={`${inputBaseClass(!!errors.dateAdded)} ${darkMode ? '[color-scheme:dark]' : ''}`}
                    disabled={isSubmitting}
                  />
                  {errors.dateAdded && <p className={errorTextClass}>{errors.dateAdded}</p>}
                </div>

                {/* Description - Spans 2 columns */}
                <div className={`${formGroupClass} md:col-span-2`}>
                  <label htmlFor="description" className={labelClass}>Description / Notes</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    rows="3"
                    placeholder="Enter any additional details about the item..."
                    className={inputBaseClass(!!errors.description)}
                    disabled={isSubmitting}
                  ></textarea>
                  {errors.description && <p className={errorTextClass}>{errors.description}</p>}
                </div>
              </div>

              {/* Add Another Item Checkbox */}
              <div className="flex items-center justify-start pt-2 no-print">
                <input
                  type="checkbox"
                  id="addAnother"
                  name="addAnother"
                  checked={addAnother}
                  onChange={(e) => setAddAnother(e.target.checked)}
                  disabled={isSubmitting}
                  className={`w-4 h-4 rounded mr-2 transition-colors duration-150
                              ${darkMode ? 'bg-slate-600 border-slate-500 text-indigo-500 focus:ring-indigo-600'
                                        : 'border-slate-300 text-indigo-600 focus:ring-indigo-500'}`}
                />
                <label htmlFor="addAnother" className={`${labelClass} cursor-pointer`}>
                  Add another item after this one
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex flex-col sm:flex-row justify-end items-center gap-3">
                <button
                    type="button"
                    onClick={() => resetForm(true)}
                    className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-colors
                                ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                    disabled={isSubmitting}
                >
                    <MdClear className="text-lg" /> Clear Form
                </button>
                <button
                    type="button"
                    onClick={() => navigate('/inventory')}
                    className={`w-full sm:w-auto px-5 py-2.5 text-sm font-medium rounded-lg transition-colors
                                ${darkMode ? 'bg-slate-600 hover:bg-slate-500 text-slate-100'
                                          : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
                    disabled={isSubmitting}
                >
                    Cancel
                </button>
                <button
                  type="submit"
                  className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg text-white transition-all duration-300 ease-in-out group
                              ${darkMode ? 'bg-indigo-600 hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-400'
                                        : 'bg-indigo-500 hover:bg-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-300'}
                              hover:shadow-md active:scale-95
                              ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <SpinnerIcon /> : <MdSave className="text-lg" />}
                  {isSubmitting ? 'Adding Item...' : 'Add Item to Inventory'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
    </Layout>
  );
};

export default AddItemForm;
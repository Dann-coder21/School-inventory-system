import React, { useContext, useState, useEffect, useMemo, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { InventoryContext } from "../contexts/InventoryContext"; // Make sure this path is correct if not already fixed
import { ThemeContext } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import Swal from "sweetalert2";
import 'sweetalert2/dist/sweetalert2.min.css';
import LoadingSpinner from "../Components/LoadingSpinner";
import Layout from "../Components/Layout/Layout";

// Importing all necessary icons
import {
  MdDashboard, MdInventory, MdAddBox, MdList, MdAssessment, MdSettings, MdSchool,
  MdSearch, MdMoreVert, MdDeleteOutline, MdArrowUpward, MdArrowDownward, MdClose,
  MdOutlineInventory2, MdSystemUpdateAlt, MdAddCircleOutline, MdWarningAmber,
  MdPeople, MdInfoOutline, MdEdit, MdSave, MdCancel, MdError, // Added MdError for validation messages
  MdShoppingCart
} from "react-icons/md";


// --- RECTIFIED CODE STARTS HERE ---

// Define the API_BASE_URL using Vite's environment variable syntax.
// This ensures that in production (on Vercel), it uses your deployed backend URL,
// and in local development, it defaults to your local backend URL.
// IMPORTANT: Adjust "http://localhost:3000" if your local backend runs on a different port.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// --- RECTIFIED CODE ENDS HERE ---


// --- VALIDATION HELPER FUNCTIONS for Inventory Items (unchanged) ---
const validateItemName = (name) => {
  if (!name || name.trim() === '') return { isValid: false, message: 'Item name is required.' };
  return { isValid: true, message: '' };
};

const validateCategory = (category) => {
  if (!category || category.trim() === '') return { isValid: false, message: 'Category is required.' };
  return { isValid: true, message: '' };
};

const validateLocation = (location) => {
  if (!location || location.trim() === '') return { isValid: false, message: 'Location is required.' };
  return { isValid: true, message: '' };
};

const validateNonNegativeNumber = (value, fieldName) => {
    const num = Number(value);
    if (value === '' || value === null) return { isValid: true, message: '' }; // Allow empty for initial state, handle required separately
    if (isNaN(num)) return { isValid: false, message: `${fieldName} must be a number.` };
    if (num < 0) return { isValid: false, message: `${fieldName} cannot be negative.` };
    return { isValid: true, message: '' };
};

// --- NEW HELPER: Currency Formatting for KES (unchanged) ---
const formatKESCurrency = (value) => {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(value);
};

// --- DELETE ITEM MODAL COMPONENT (unchanged, just added MdError import for getEditValidationClass) ---
const DeleteItemModal = ({ item, onConfirm, onCancel, darkMode }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 print:hidden animate-fadeIn">
            <div className={`relative w-full max-w-md p-6 sm:p-7 rounded-xl shadow-2xl ${darkMode ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-900'} animate-scaleUp`}>
                <button onClick={onCancel} className={`absolute top-3.5 right-3.5 p-1.5 rounded-full transition-colors ${darkMode ? 'text-slate-400 hover:bg-slate-700 hover:text-slate-100' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-700'}`}><MdClose size={22}/></button>
                <div className="flex items-center mb-5 sm:mb-6">
                    <div className={`p-3 rounded-full mr-4 ${darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'}`}><MdDeleteOutline size={24}/></div>
                    <div>
                        <h3 className="text-lg sm:text-xl font-semibold">Confirm Deletion</h3>
                        <p className={`text-xs sm:text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>You are about to delete an item.</p>
                    </div>
                </div>
                <div className={`space-y-3 text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    <p className="font-medium flex items-center gap-2">
                        <MdInfoOutline className="text-lg flex-shrink-0" /> Are you sure you want to delete <span className={`${darkMode ? 'text-red-300' : 'text-red-700'} font-bold`}>"{item.item_name}"</span>?
                    </p>
                    <p className="font-medium flex items-center gap-2">
                        <MdWarningAmber className="text-lg flex-shrink-0" /> This action is permanent and cannot be undone.
                    </p>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onCancel} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${darkMode ? 'bg-slate-600 hover:bg-slate-500 text-slate-100' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}>Cancel</button>
                    <button onClick={onConfirm}
                            className={`px-4 py-2 text-sm font-medium rounded-md text-white transition-colors ${darkMode ? 'bg-red-600 hover:bg-red-500' : 'bg-red-500 hover:bg-red-600'}`}>Delete Permanently</button>
                </div>
            </div>
        </div>
    );
};


// --- INVENTORY COMPONENT ---
function Inventory() {

   // Define getEditValidationClass HERE, inside the Inventory component
  const getEditValidationClass = (fieldName) => {
    if (editValidationErrors[fieldName]) {
      return 'border-red-500 focus:border-red-500 focus:ring-red-500';
    }
    // Check if the field is not empty AND there are no errors for it, then it's valid/green
    if (editingItem?.[fieldName] !== undefined && editingItem?.[fieldName] !== null &&
       String(editingItem[fieldName]).trim() !== '' && // Check if value is not empty string
       !editValidationErrors[fieldName] &&
       (fieldName === 'item_name' || fieldName === 'category' || fieldName === 'location' ||
        (fieldName === 'quantity' && validateNonNegativeNumber(editingItem.quantity, 'Quantity').isValid) ||
        (fieldName === 'cost_price' && validateNonNegativeNumber(editingItem.cost_price, 'Cost Price').isValid))) {
      return 'border-green-500 focus:border-green-500 focus:ring-green-500';
    }
    return '';
  };

  const { items, setItems, loading, error, fetchItems } = useContext(InventoryContext);
  const { darkMode } = useContext(ThemeContext);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // State for modals and forms
  const [withdrawInfo, setWithdrawInfo] = useState({});
  const [addStockInfo, setAddStockInfo] = useState({});
  const [whoTook, setWhoTook] = useState({});

  const [activeWithdrawRowId, setActiveWithdrawRowId] = useState(null);
  const [activeAddStockRowId, setActiveAddStockRowId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [itemForDeleteModal, setItemForDeleteModal] = useState(null);
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);

  // State for inline editing
  const [editingItem, setEditingItem] = useState(null);
  const [editValidationErrors, setEditValidationErrors] = useState({});


  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'ascending'
  });

  const actionMenuRef = useRef(null);


  // --- PERMISSION FLAGS (CORRECTED) ---
  const canAdd = useMemo(() => {
    const allowedRoles = ['Admin', 'DepartmentHead', 'StockManager', 'Staff'];
    return allowedRoles.includes(currentUser?.role);
  }, [currentUser?.role]);

  const canWithdraw = useMemo(() => {
    const allowedRoles = ['Admin', 'DepartmentHead', 'StockManager', 'Staff'];
    return allowedRoles.includes(currentUser?.role);
  }, [currentUser?.role]);

  const canAddStock = useMemo(() => {
    // CORRECTED: Staff CAN add stock
    const allowedRoles = ['Admin', 'DepartmentHead', 'StockManager', 'Staff'];
    return allowedRoles.includes(currentUser?.role);
  }, [currentUser?.role]);

  const canEdit = useMemo(() => {
    // Staff CANNOT edit
    const allowedRoles = ['Admin', 'DepartmentHead', 'StockManager'];
    return allowedRoles.includes(currentUser?.role);
  }, [currentUser?.role]);

  const canDelete = useMemo(() => {
    // Staff CANNOT delete
    const allowedRoles = ['Admin', 'DepartmentHead', 'StockManager'];
    return allowedRoles.includes(currentUser?.role);
  }, [currentUser?.role]);

  const showOrdersLink = useMemo(() => {
    // Viewer cannot see Staff Orders
    const allowedRolesForOrders = ['Admin', 'Staff', 'DepartmentHead', 'StockManager'];
    return allowedRolesForOrders.includes(currentUser?.role);
  }, [currentUser?.role]);
  // --- END PERMISSION FLAGS ---


  // Handle click outside for action menu dropdowns (unchanged)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
        const isMenuButton = event.target.closest('button[aria-label="Actions"]');
        if (!isMenuButton) {
          setActiveActionMenuId(null);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  const filteredItems = useMemo(() => items.filter((item) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const itemStatus = item.quantity === 0 ? "out of stock" : item.quantity < 5 ? "low stock" : "available";
    return (
      (item.item_name?.toLowerCase() || '').includes(searchLower) ||
      (item.category?.toLowerCase() || '').includes(searchLower) ||
      (item.location?.toLowerCase() || '').includes(searchLower) ||
      (itemStatus.includes(searchLower)) ||
      (item.date_added && new Date(item.date_added).toLocaleDateString().toLowerCase().includes(searchLower)) ||
      (item.quantity?.toString() || '').includes(searchTerm) ||
      (item.cost_price?.toString() || '').includes(searchTerm)
    );
  }), [items, searchTerm]);

  const sortedItems = useMemo(() => {
    let sortableItems = [...filteredItems];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let valueA = a[sortConfig.key];
        let valueB = b[sortConfig.key];

        if (['quantity', 'cost_price'].includes(sortConfig.key)) {
            valueA = Number(valueA) || 0;
            valueB = Number(valueB) || 0;
        } else if (sortConfig.key === 'date_added') {
            valueA = new Date(valueA);
            valueB = new Date(valueB);
        } else if (sortConfig.key === 'status') {
            const getStatusValue = (qty) => qty === 0 ? 2 : qty < 5 ? 1 : 0;
            valueA = getStatusValue(a.quantity);
            valueB = getStatusValue(b.quantity);
        } else if (typeof valueA === 'string' && typeof valueB === 'string') {
            valueA = valueA.toLowerCase();
            valueB = valueB.toLowerCase();
        } else {
            if (valueA == null) return sortConfig.direction === 'ascending' ? 1 : -1;
            if (valueB == null) return sortConfig.direction === 'ascending' ? -1 : 1;
        }

        if (valueA < valueB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valueA > valueB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredItems, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? <MdArrowUpward className="ml-1.5 text-xs" /> : <MdArrowDownward className="ml-1.5 text-xs" />;
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

  const handleSessionExpired = () => {
    localStorage.removeItem("token");
    Swal.fire({
      ...swalThemeProps,
      iconHtml: `<span class="text-red-500 dark:text-red-400"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.25-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" /></svg></span>`,
      title: "Session Expired",
      text: "Your session has expired. Please login again.",
    }).then(() => navigate("/login"));
  };

  const handleDeleteConfirmed = async () => {
    if (!itemForDeleteModal) return;

    Swal.fire({
      ...swalThemeProps,
      title: "Deleting Item...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
      showConfirmButton: false,
    });

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      // --- RECTIFIED: Use API_BASE_URL for DELETE request ---
      await axios.delete(`${API_BASE_URL}/delete/items/${itemForDeleteModal.id}`, { // <-- CHANGED
        headers: { Authorization: `Bearer ${token}` },
      });
      // --- END RECTIFIED ---

      setItems(prevItems => prevItems.filter(i => i.id !== itemForDeleteModal.id));

      Swal.fire({
        ...swalThemeProps,
        iconHtml: `<span class="text-green-500 dark:text-green-400"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg></span>`,
        title: "Deleted Successfully!",
        text: `"${itemForDeleteModal.item_name}" has been removed.`,
        timer: 2500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Delete error:", err);
      if (err.response?.status === 401) handleSessionExpired();
      else Swal.fire({ ...swalThemeProps, icon: "error", title: "Deletion Failed", text: err.response?.data?.error || "Could not delete the item." });
    } finally {
      setItemForDeleteModal(null);
      setActiveActionMenuId(null);
    }
  };

  const handleWithdraw = async (item, recipientName, quantity) => {
    const withdrawQuantity = Number(quantity);

    if (!recipientName?.trim() || !withdrawQuantity || withdrawQuantity <= 0) {
      Swal.fire({ ...swalThemeProps, icon: "warning", title: "Invalid Input",
                text: "Please provide a valid recipient name and quantity." });
      return;
    }

    if (withdrawQuantity > item.quantity) {
      Swal.fire({ ...swalThemeProps, icon: "error", title: "Insufficient Stock",
                text: `Cannot withdraw more than the available ${item.quantity} units.` });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        handleSessionExpired();
        return;
      }

      Swal.fire({
        ...swalThemeProps,
        title: "Processing Withdrawal...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
        showConfirmButton: false
      });

      // --- RECTIFIED: Use API_BASE_URL for POST request ---
      const response = await axios.post(
        `${API_BASE_URL}/withdrawals/withdraw`, // <-- CHANGED
        {
          item_id: item.id,
          quantity: withdrawQuantity,
          withdrawn_by: recipientName.trim()
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // --- END RECTIFIED ---

    const { updatedItem } = response.data || {};
      if (!updatedItem) {
        throw new Error(response.data?.message || "Invalid response from server");
      }

      setItems(prevItems =>
        prevItems.map(i =>
          i.id === item.id
            ? { ...i, quantity: updatedItem.quantity }
            : i
        )
      );

      setWithdrawInfo(prev => ({ ...prev, [item.id]: { name: '', quantity: '' } }));
      setActiveWithdrawRowId(null);
      setWhoTook(prev => ({ ...prev, [item.id]: recipientName.trim() }));
      setActiveActionMenuId(null);

      Swal.fire({
        ...swalThemeProps,
        icon: "success",
        title: "Withdrawal Successful",
        text: `${withdrawQuantity} of "${item.item_name}" withdrawn by ${recipientName.trim()}.`,
        timer: 2500,
        showConfirmButton: false
      });

    } catch (err) {
      console.error("Withdrawal error:", err);

      let errorMessage = "Could not record withdrawal";
      if (err.response) {
        if (err.response.status === 401) {
          handleSessionExpired();
          return;
        }
        errorMessage = err.response.data?.error || errorMessage;
      } else if (err.message) {
        errorMessage = err.message;
      }

      Swal.fire({
        ...swalThemeProps,
        icon: "error",
        title: "Withdrawal Failed",
        text: errorMessage
      });
    }
  };

  const handleAddStock = async (item, quantity) => {
    const quantityToAdd = Number(quantity);
    if (!quantityToAdd || quantityToAdd <= 0) {
      Swal.fire({ ...swalThemeProps, icon: "warning", title: "Invalid Input", text: "Please enter a valid quantity (must be greater than 0)." });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) { handleSessionExpired(); return; }

      Swal.fire({
        ...swalThemeProps,
        title: "Processing Stock Addition...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
        showConfirmButton: false
      });

      // --- RECTIFIED: Use API_BASE_URL for PUT request ---
      const response = await axios.put(
        `${API_BASE_URL}/stock/${item.id}/add-stock`, // <-- CHANGED
        { quantity: quantityToAdd },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // --- END RECTIFIED ---

      setItems(prevItems => prevItems.map(i => i.id === response.data.updatedItem.id ? response.data.updatedItem : i));
      setAddStockInfo(prev => ({ ...prev, [item.id]: '' }));
      setActiveAddStockRowId(null);
      setActiveActionMenuId(null);

      Swal.fire({ ...swalThemeProps, icon: "success", title: "Stock Added", text: `${quantityToAdd} units added to "${item.item_name}". New total: ${response.data.updatedItem.quantity}.`, timer: 2500, showConfirmButton: false });
    } catch (err) {
      console.error("Add stock error:", err);
      if (err.response?.status === 401) handleSessionExpired();
      else Swal.fire({ ...swalThemeProps, icon: "error", title: "Update Failed", text: err.response?.data?.error || "Could not add stock." });
    }
  };

  // --- INLINE EDITING HANDLERS ---
  const handleEditItem = (item) => {
    setEditingItem({
      ...item,
      quantity: item.quantity !== null ? String(item.quantity) : '',
      cost_price: item.cost_price !== null ? String(item.cost_price) : '',
      location: item.location || ''
    });
    setEditValidationErrors({});
    setActiveActionMenuId(null);
  };

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    setEditingItem(prev => ({ ...prev, [name]: value }));

    let currentErrors = { ...editValidationErrors };
    if (name === 'item_name') currentErrors.item_name = validateItemName(value).message;
    else if (name === 'category') currentErrors.category = validateCategory(value).message;
    else if (name === 'location') currentErrors.location = validateLocation(value).message;
    else if (name === 'quantity') currentErrors.quantity = validateNonNegativeNumber(value, 'Quantity').message;
    else if (name === 'cost_price') currentErrors.cost_price = validateNonNegativeNumber(value, 'Cost Price').message;
    setEditValidationErrors(currentErrors);
  };

  const handleSaveItem = async (itemId) => {
    if (!editingItem) return;

    let errors = {};
    if (!validateItemName(editingItem.item_name).isValid) errors.item_name = validateItemName(editingItem.item_name).message;
    if (!validateCategory(editingItem.category).isValid) errors.category = validateCategory(editingItem.category).message;
    if (!validateLocation(editingItem.location).isValid) errors.location = validateLocation(editingItem.location).message;
    if (!validateNonNegativeNumber(editingItem.quantity, 'Quantity').isValid) errors.quantity = validateNonNegativeNumber(editingItem.quantity, 'Quantity').message;
    if (!validateNonNegativeNumber(editingItem.cost_price, 'Cost Price').isValid) errors.cost_price = validateNonNegativeNumber(editingItem.cost_price, 'Cost Price').message;

    setEditValidationErrors(errors);
    if (Object.values(errors).some(msg => msg !== '')) {
      Swal.fire('Validation Error', 'Please correct the errors in the form before saving.', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) { handleSessionExpired(); return; }

      Swal.fire({
        ...swalThemeProps,
        title: "Saving Changes...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
        showConfirmButton: false,
      });

      const updatePayload = {
        item_name: editingItem.item_name,
        category: editingItem.category,
        quantity: Number(editingItem.quantity),
        location: editingItem.location,
        cost_price: Number(editingItem.cost_price),
      };

      // --- RECTIFIED: Use API_BASE_URL for PUT request ---
      const response = await axios.put(`${API_BASE_URL}/items/${itemId}`, // <-- CHANGED
        updatePayload,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      // --- END RECTIFIED ---

      setItems(prevItems => prevItems.map(i => i.id === response.data.updatedItem.id ? response.data.updatedItem : i));

      Swal.fire({
        ...swalThemeProps,
        icon: "success",
        title: "Item Updated!",
        text: `"${editingItem.item_name}" has been updated successfully.`,
        timer: 2500,
        showConfirmButton: false,
      });
      setEditingItem(null);
    } catch (err) {
      console.error("Update item error:", err);
      if (err.response?.status === 401) handleSessionExpired();
      else Swal.fire({ ...swalThemeProps, icon: "error", title: "Update Failed", text: err.response?.data?.message || "Could not update the item." });
    }
  };

  const handleCancelItemEdit = () => {
    setEditingItem(null);
    setEditValidationErrors({});
  };

  const sidebarLinkClass = ({ isActive }) =>
    `px-5 py-3.5 hover:bg-white/20 transition-colors flex items-center gap-3.5 text-sm font-medium rounded-lg mx-3 my-1.5 ${
      isActive
        ? (darkMode ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/30 text-white shadow-md')
        : (darkMode ? 'text-slate-300 hover:text-white hover:bg-slate-700/50' : 'text-indigo-100 hover:text-white')
    }`;
  const sidebarIconClass = "text-xl";

  return (
  <Layout>


      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col ml-[250px] min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
        {/* Header */}
        <header className={`flex items-center justify-between h-20 px-6 sm:px-8 fixed top-0 left-[250px] right-0 z-40 transition-colors duration-300 print:hidden
                           ${darkMode ? 'bg-slate-800/75 backdrop-blur-lg border-b border-slate-700' : 'bg-white/75 backdrop-blur-lg border-b border-slate-200'} shadow-sm`}>
          <div className="relative flex items-center w-full max-w-sm">
            <MdSearch className={`absolute left-3.5 text-xl ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
            <input
              type="text"
              placeholder="Search inventory..."
              className={`w-full py-2.5 pl-11 pr-4 rounded-lg text-sm transition-all duration-300 focus:ring-2 focus:outline-none focus:shadow-md
                          ${darkMode
                            ? 'bg-slate-700 text-slate-200 placeholder-slate-400 focus:ring-indigo-500 border border-slate-600 hover:border-slate-500'
                            : 'bg-white text-slate-700 placeholder-slate-400 focus:ring-indigo-500 border border-slate-300 hover:border-slate-400'}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4">
            {canAdd && ( // Only show "Add New Item" button for allowed roles
                <Link
                to="/AddItemsForm"
                className={`flex items-center gap-2 py-2.5 px-4 sm:px-5 rounded-lg text-sm font-semibold transition-all duration-300 ease-in-out group
                            ${darkMode
                                ? 'bg-indigo-600 hover:bg-indigo-500 text-white focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800'
                                : 'bg-indigo-500 hover:bg-indigo-600 text-white focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-100'
                            } hover:shadow-md active:scale-95`}
                >
                <MdAddBox className="text-lg transition-transform duration-300 group-hover:scale-110" />
                Add New Item
                </Link>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 pt-[104px] overflow-y-auto">
          <div className="max-w-full mx-auto">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-3">
              <h1 className={`text-2xl sm:text-3xl font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                Current Inventory
              </h1>
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {sortedItems.length} item{sortedItems.length === 1 ? '' : 's'} found
                {searchTerm && ` (filtered from ${items.length})`}
              </p>
            </div>

            {loading ? (
              <div className={`flex justify-center items-center min-h-[400px] rounded-lg p-8 ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}`}>
                <LoadingSpinner />
              </div>
            ) : error ? (
              <div className={`text-center p-8 sm:p-10 rounded-lg shadow-md ${darkMode ? 'bg-slate-800 text-red-400 border border-slate-700' : 'bg-white text-red-600 border border-slate-200'}`}>
                <MdWarningAmber size={52} className="mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Error Loading Inventory</h3>
                <p className="text-sm sm:text-base">{error.message || "Could not fetch inventory data. Please try again."}</p>
                <button
                    onClick={() => fetchItems()}
                    className={`mt-6 py-2.5 px-5 rounded-lg font-semibold text-sm transition-colors ${darkMode ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-indigo-500 hover:bg-indigo-600 text-white'}`}
                > Retry </button>
              </div>
            ) : sortedItems.length === 0 ? (
              <div className={`text-center p-10 sm:p-12 rounded-xl shadow-lg ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'} min-h-[350px] flex flex-col justify-center items-center`}>
                <MdOutlineInventory2 className={`text-6xl sm:text-7xl mb-6 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                <h3 className={`text-xl sm:text-2xl font-semibold mb-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  {searchTerm ? "No Items Match Your Search" : "Your Inventory is Looking Empty"}
                </h3>
                <p className={`mb-6 text-sm sm:text-base ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {searchTerm ? "Try different keywords or clear the search." : "Add your first item to get started!"}
                </p>
                {!searchTerm && canAdd && ( // Only show "Add First Item" for allowed roles
                  <Link
                    to="/AddItemsForm"
                    className={`flex items-center gap-2 py-2.5 px-5 rounded-lg text-sm font-semibold transition-all duration-300 group
                                ${darkMode
                                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white focus-visible:ring-2 focus-visible:ring-indigo-400'
                                  : 'bg-indigo-500 hover:bg-indigo-600 text-white focus-visible:ring-2 focus-visible:ring-indigo-300'
                                } hover:shadow-lg active:scale-95`}
                  > <MdAddBox className="text-lg" /> Add First Item </Link>
                )}
              </div>
            ) : (
              <div className={`rounded-lg shadow-xl overflow-hidden ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}`}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] text-sm">
                    <thead className={`${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'} text-xs uppercase tracking-wider`}>
                      <tr>
                        {/* Table Headers with Sort and Vertical Lines */}
                        {['Item Name', 'Category', 'Quantity', 'Cost Price', 'Location', 'Status', 'Date Added'].map((header) => (
                          <th
                            key={header}
                            className={`py-3.5 px-4 text-left font-semibold cursor-pointer transition-colors
                                        ${darkMode ? 'hover:bg-slate-600' : 'hover:bg-slate-200'}
                                        ${header !== 'Date Added' ? (darkMode ? 'border-r border-slate-600' : 'border-r border-slate-200') : ''}`}
                            onClick={() => requestSort(header.toLowerCase().replace(/ /g, '_').replace(' ', '_'))}
                          >
                            <div className="flex items-center">
                              {header}
                              {getSortIcon(header.toLowerCase().replace(/ /g, '_').replace(' ', '_'))}
                            </div>
                          </th>
                        ))}
                        <th className={`py-3.5 px-4 text-center font-semibold ${darkMode ? 'border-l border-slate-600' : 'border-l border-slate-200'}`}>
                            Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`${darkMode ? 'divide-y divide-slate-700' : 'divide-y divide-slate-200'}`}>
                      {sortedItems.map((item) => (
                        <tr key={item.id} className={`${darkMode ? 'hover:bg-slate-700/60' : 'hover:bg-slate-50/70'} transition-colors duration-150`}>
                          {/* Item Name */}
                          <td className={`py-3 px-4 whitespace-nowrap font-medium ${darkMode ? 'text-slate-100 border-r border-slate-700' : 'text-slate-800 border-r border-slate-200'}`}>
                            {editingItem?.id === item.id ? (
                              <>
                                <input
                                  type="text"
                                  name="item_name"
                                  value={editingItem.item_name}
                                  onChange={handleItemChange}
                                  className={`w-full px-2 py-1 rounded-md text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-100' : 'bg-white border-slate-300 text-slate-800'} ${getEditValidationClass('item_name')}`}
                                  disabled={!canEdit}
                                />
                                {editValidationErrors.item_name && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><MdError size={14}/> {editValidationErrors.item_name}</p>}
                              </>
                            ) : (
                              item.item_name
                            )}
                          </td>
                          {/* Category */}
                          <td className={`py-3 px-4 whitespace-nowrap ${darkMode ? 'text-slate-300 border-r border-slate-700' : 'text-slate-600 border-r border-slate-200'}`}>
                            {editingItem?.id === item.id ? (
                              <>
                                <input
                                  type="text"
                                  name="category"
                                  value={editingItem.category}
                                  onChange={handleItemChange}
                                  className={`w-full px-2 py-1 rounded-md text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-100' : 'bg-white border-slate-300 text-slate-800'} ${getEditValidationClass('category')}`}
                                  disabled={!canEdit}
                                />
                                {editValidationErrors.category && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><MdError size={14}/> {editValidationErrors.category}</p>}
                              </>
                            ) : (
                              item.category
                            )}
                          </td>
                          {/* Quantity */}
                          <td className={`py-3 px-4 whitespace-nowrap text-center font-medium ${darkMode ? 'text-slate-200 border-r border-slate-700' : 'text-slate-700 border-r border-slate-200'}`}>
                            {editingItem?.id === item.id ? (
                              <>
                                <input
                                  type="number"
                                  name="quantity"
                                  value={editingItem.quantity}
                                  onChange={handleItemChange}
                                  min="0"
                                  className={`w-full px-2 py-1 rounded-md text-sm text-center ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-100' : 'bg-white border-slate-300 text-slate-800'} ${getEditValidationClass('quantity')}`}
                                  disabled={!canEdit}
                                />
                                {editValidationErrors.quantity && <p className="text-red-500 text-xs mt-1 text-left flex items-center gap-1"><MdError size={14}/> {editValidationErrors.quantity}</p>}
                              </>
                            ) : (
                              item.quantity
                            )}
                          </td>
                          {/* Cost Price */}
                          <td className={`py-3 px-4 whitespace-nowrap text-center ${darkMode ? 'text-slate-200 border-r border-slate-700' : 'text-slate-700 border-r border-slate-200'}`}>
                            {editingItem?.id === item.id ? (
                              <>
                                <input
                                  type="number"
                                  name="cost_price"
                                  value={editingItem.cost_price}
                                  onChange={handleItemChange}
                                  min="0"
                                  step="0.01"
                                  className={`w-full px-2 py-1 rounded-md text-sm text-center ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-100' : 'bg-white border-slate-300 text-slate-800'} ${getEditValidationClass('cost_price')}`}
                                  disabled={!canEdit}
                                />
                                {editValidationErrors.cost_price && <p className="text-red-500 text-xs mt-1 text-left flex items-center gap-1"><MdError size={14}/> {editValidationErrors.cost_price}</p>}
                              </>
                            ) : (
                              formatKESCurrency(item.cost_price || 0)
                            )}
                          </td>
                          {/* Location */}
                          <td className={`py-3 px-4 whitespace-nowrap ${darkMode ? 'text-slate-300 border-r border-slate-700' : 'text-slate-600 border-r border-slate-200'}`}>
                            {editingItem?.id === item.id ? (
                              <>
                                <input
                                  type="text"
                                  name="location"
                                  value={editingItem.location}
                                  onChange={handleItemChange}
                                  className={`w-full px-2 py-1 rounded-md text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-100' : 'bg-white border-slate-300 text-slate-800'} ${getEditValidationClass('location')}`}
                                  disabled={!canEdit}
                                />
                                {editValidationErrors.location && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><MdError size={14}/> {editValidationErrors.location}</p>}
                              </>
                            ) : (
                              item.location || 'N/A'
                            )}
                          </td>
                          {/* Status */}
                          <td className={`py-3 px-4 whitespace-nowrap ${darkMode ? 'border-r border-slate-700' : 'border-r border-slate-200'}`}>
                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full
                              ${item.quantity === 0 ? (darkMode ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700')
                              : item.quantity < 5 ? (darkMode ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-700')
                              : (darkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700')}`}>
                              {item.quantity === 0 ? "Out of Stock" : item.quantity < 5 ? "Low Stock" : "Available"}
                            </span>
                          </td>
                          {/* Date Added */}
                          <td className={`py-3 px-4 whitespace-nowrap ${darkMode ? 'text-slate-400 border-r border-slate-700' : 'text-slate-500 border-r border-slate-200'}`}>{new Date(item.date_added).toLocaleDateString()}</td>
                          {/* Actions */}
                          <td className="py-2 px-4 text-center relative">
                            {editingItem?.id === item.id ? (
                              <div className="flex items-center gap-1 sm:gap-2 justify-center">
                                <button
                                  onClick={() => handleSaveItem(item.id)}
                                  className={`p-2 rounded-full transition-colors ${darkMode ? 'text-green-400 hover:bg-green-600 hover:text-white' : 'text-green-600 hover:bg-green-100 hover:text-green-700'}`}
                                  aria-label="Save changes"
                                  disabled={Object.values(editValidationErrors).some(err => err !== '') || !canEdit}
                                >
                                  <MdSave size={20} />
                                </button>
                                <button
                                  onClick={handleCancelItemEdit}
                                  className={`p-2 rounded-full transition-colors ${darkMode ? 'text-slate-400 hover:bg-slate-600 hover:text-slate-100' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-700'}`}
                                  aria-label="Cancel edit"
                                >
                                  <MdCancel size={20} />
                                </button>
                              </div>
                            ) : (
                                // Only show action menu if ANY action is allowed for the current user's role
                                (canWithdraw || canAddStock || canEdit || canDelete) && (
                                  <>
                                    <button
                                      onClick={() => setActiveActionMenuId(activeActionMenuId === item.id ? null : item.id)}
                                      className={`p-2 rounded-full transition-colors ${darkMode ? 'text-slate-400 hover:bg-slate-600 hover:text-slate-100' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-700'}`}
                                      aria-label="Actions"
                                    >
                                      <MdMoreVert size={20} />
                                    </button>
                                    {activeActionMenuId === item.id && (
                                      <div
                                        ref={actionMenuRef}
                                        className={`absolute right-full mr-2.5 top-1/2 -translate-y-1/2 w-48 rounded-md shadow-xl z-20
                                                    ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200'} border`}
                                      >
                                        <button
                                          onClick={() => setActiveActionMenuId(null)}
                                          aria-label="Close actions menu"
                                          className={`absolute top-1 right-1 p-1.5 rounded-full transition-colors
                                                      ${darkMode ? 'text-slate-400 hover:bg-slate-600 hover:text-slate-100' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
                                        >
                                          <MdClose size={16} />
                                        </button>
                                        <div className="p-1.5 pt-7">
                                          {canWithdraw && (
                                            <button
                                              onClick={() => { setActiveWithdrawRowId(item.id); setWithdrawInfo(prev => ({ ...prev, [item.id]: { name: '', quantity: '1' }})); setActiveActionMenuId(null); }}
                                              className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-2.5 transition-colors
                                                          ${darkMode ? 'text-slate-200 hover:bg-indigo-600 hover:text-white' : 'text-slate-700 hover:bg-indigo-100 hover:text-indigo-700'}`}
                                            >
                                              <MdSystemUpdateAlt className="text-base"/> Withdraw
                                            </button>
                                          )}
                                          {canAddStock && (
                                            <button
                                              onClick={() => { setActiveAddStockRowId(item.id); setAddStockInfo(prev => ({ ...prev, [item.id]: '' })); setActiveActionMenuId(null); }}
                                              className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-2.5 transition-colors
                                                          ${darkMode ? 'text-slate-200 hover:bg-green-600 hover:text-white' : 'text-slate-700 hover:bg-green-100 hover:text-green-700'}`}
                                            >
                                              <MdAddCircleOutline className="text-base"/> Add Stock
                                            </button>
                                          )}
                                          {/* Separator only if there are actions before AND actions after */}
                                          {( (canWithdraw || canAddStock) && (canEdit || canDelete) ) &&
                                            <div className={`my-1.5 h-px ${darkMode ? 'bg-slate-600' : 'bg-slate-200'}`}></div>
                                          }
                                          {canEdit && (
                                            <button
                                              onClick={() => handleEditItem(item)}
                                              className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-2.5 transition-colors
                                                          ${darkMode ? 'text-blue-400 hover:bg-blue-600 hover:text-white' : 'text-blue-600 hover:bg-blue-100 hover:text-blue-700'}`}
                                            >
                                              <MdEdit className="text-base"/> Edit
                                            </button>
                                          )}
                                          {canDelete && (
                                            <button
                                              onClick={() => { setItemForDeleteModal(item); setActiveActionMenuId(null); }}
                                              className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-2.5 transition-colors
                                                          ${darkMode ? 'text-red-400 hover:bg-red-600 hover:text-white' : 'text-red-600 hover:bg-red-100 hover:text-red-700'}`}
                                            >
                                              <MdDeleteOutline className="text-base"/> Delete
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </>
                                )
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* MODALS (unchanged) */}
      {activeWithdrawRowId && (() => {
        const item = items.find(i => i.id === activeWithdrawRowId);
        if (!item) return null;
        return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 print:hidden animate-fadeIn">
          <div className={`relative w-full max-w-md p-6 sm:p-7 rounded-xl shadow-2xl ${darkMode ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-900'} animate-scaleUp`}>
            <button onClick={() => setActiveWithdrawRowId(null)} className={`absolute top-3.5 right-3.5 p-1.5 rounded-full transition-colors ${darkMode ? 'text-slate-400 hover:bg-slate-700 hover:text-slate-100' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-700'}`}><MdClose size={22}/></button>
            <div className="flex items-center mb-5 sm:mb-6">
                <div className={`p-3 rounded-full mr-4 ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}><MdSystemUpdateAlt size={24}/></div>
                <div>
                    <h3 className="text-lg sm:text-xl font-semibold">Withdraw Item</h3>
                    <p className={`text-xs sm:text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.item_name}</p>
                </div>
            </div>
            <div className="space-y-4 text-sm">
              <div>
                <label htmlFor={`withdrawName-${item.id}`} className={`block font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Recipient Name</label>
                <input type="text" id={`withdrawName-${item.id}`} placeholder="Enter full name"
                       value={withdrawInfo[item.id]?.name || ""}
                       onChange={(e) => setWithdrawInfo(prev => ({ ...prev, [item.id]: { ...prev[item.id], name: e.target.value }}))}
                       className={`w-full px-3.5 py-2.5 rounded-md border transition-colors ${darkMode ? 'bg-slate-700 border-slate-600 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400' : 'bg-slate-50 border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400'}`} />
              </div>
              <div>
                <label htmlFor={`withdrawQty-${item.id}`} className={`block font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Quantity (Available: {item.quantity})</label>
                <input type="number" id={`withdrawQty-${item.id}`} min="1" max={item.quantity}
                       value={withdrawInfo[item.id]?.quantity || ""}
                       onChange={(e) => {
                         const val = e.target.value ? Math.min(item.quantity, Math.max(1, parseInt(e.target.value))) : '';
                         setWithdrawInfo(prev => ({ ...prev, [item.id]: { ...prev[item.id], quantity: val }}));
                       }}
                       className={`w-full px-3.5 py-2.5 rounded-md border transition-colors ${darkMode ? 'bg-slate-700 border-slate-600 focus:ring-indigo-500 focus:border-indigo-500' : 'bg-slate-50 border-slate-300 focus:ring-indigo-500 focus:border-indigo-500'}`} />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setActiveWithdrawRowId(null)} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${darkMode ? 'bg-slate-600 hover:bg-slate-500 text-slate-100' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}>Cancel</button>
              <button onClick={() => handleWithdraw(item, withdrawInfo[item.id]?.name, withdrawInfo[item.id]?.quantity)}
                      disabled={!withdrawInfo[item.id]?.name?.trim() || !withdrawInfo[item.id]?.quantity || withdrawInfo[item.id]?.quantity > item.quantity || withdrawInfo[item.id]?.quantity <= 0}
                      className={`px-4 py-2 text-sm font-medium rounded-md text-white transition-colors ${darkMode ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-indigo-500 hover:bg-indigo-600'} disabled:opacity-60 disabled:cursor-not-allowed`}>Confirm Withdraw</button>
            </div>
            {whoTook[item.id] && <p className={`mt-3 text-xs text-center ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Last withdrawn by: <strong>{whoTook[item.id]}</strong></p>}
          </div>
        </div>
      )})()}

      {activeAddStockRowId && (() => {
    const item = items.find(i => i.id === activeAddStockRowId);
    if (!item) return null;
    return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 print:hidden animate-fadeIn">
      <div className={`relative w-full max-w-md p-6 sm:p-7 rounded-xl shadow-2xl ${darkMode ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-900'} animate-scaleUp`}>
        <button onClick={() => setActiveAddStockRowId(null)} className={`absolute top-3.5 right-3.5 p-1.5 rounded-full transition-colors ${darkMode ? 'text-slate-400 hover:bg-slate-700 hover:text-slate-100' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-700'}`}><MdClose size={22}/></button>
        <div className="flex items-center mb-5 sm:mb-6">
            <div className={`p-3 rounded-full mr-4 ${darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'}`}><MdAddCircleOutline size={24}/></div>
            <div>
                <h3 className="text-lg sm:text-xl font-semibold">Add Stock</h3>
                <p className={`text-xs sm:text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.item_name} (Current: {item.quantity})</p>
            </div>
        </div>
        <div className="space-y-4 text-sm">
          <div>
            <label htmlFor={`addStockQty-${item.id}`} className={`block font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Quantity to Add</label>
            <input type="number" id={`addStockQty-${item.id}`} min="1" placeholder="Enter quantity"
                   value={addStockInfo[item.id] || ""}
                   onChange={(e) => {
                     const val = e.target.value ? Math.max(1, parseInt(e.target.value)) : '';
                     setAddStockInfo(prev => ({ ...prev, [item.id]: val }));
                   }}
                   className={`w-full px-3.5 py-2.5 rounded-md border transition-colors ${darkMode ? 'bg-slate-700 border-slate-600 focus:ring-green-500 focus:border-green-500 placeholder-slate-400' : 'bg-slate-50 border-slate-300 focus:ring-green-500 focus:border-green-500 placeholder-slate-400'}`} />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => setActiveAddStockRowId(null)} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${darkMode ? 'bg-slate-600 hover:bg-slate-500 text-slate-100' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}>Cancel</button>
          <button onClick={() => handleAddStock(item, addStockInfo[item.id])}
                  disabled={!addStockInfo[item.id] || addStockInfo[item.id] <= 0}
                  className={`px-4 py-2 text-sm font-medium rounded-md text-white transition-colors ${darkMode ? 'bg-green-600 hover:bg-green-500' : 'bg-green-500 hover:bg-green-600'} disabled:opacity-60 disabled:cursor-not-allowed`}>Confirm Addition</button>
        </div>
      </div>
    </div>
  )})()}

  {/* Delete Item Confirmation Modal */}
  {itemForDeleteModal && (
    <DeleteItemModal
      item={itemForDeleteModal}
      onConfirm={handleDeleteConfirmed}
      onCancel={() => setItemForDeleteModal(null)}
      darkMode={darkMode}
    />
  )}
</Layout>
  );
}

export default Inventory;
import React, { useContext, useState, useEffect, useMemo } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom"; // Using NavLink for active styles
import { InventoryContext } from "../contexts/InventoryContext";
import { ThemeContext } from "../contexts/ThemeContext";
import axios from "axios";
import Swal from "sweetalert2";
import 'sweetalert2/dist/sweetalert2.min.css'; // Essential for SweetAlert2 styling
import LoadingSpinner from "../Components/LoadingSpinner"; // Your custom loading spinner

// Importing all necessary icons
import {
  MdDashboard,
  MdInventory,
  MdAddBox,
  MdList,
  MdAssessment,
  MdSettings,
  MdSchool, // For sidebar brand
  MdSearch, // For search input
  MdMoreVert, // For row actions menu
  MdDeleteOutline, // Delete icon
  MdArrowUpward, // Sort icon
  MdArrowDownward, // Sort icon
  MdClose, // Close modal icon
  MdOutlineInventory2, // Empty state icon
  MdSystemUpdateAlt, // Withdraw icon (can also use something like MdRemoveCircleOutline)
  MdAddCircleOutline, // Add Stock icon
  MdWarningAmber,
  MdPeople // Warning/Error icon
} from "react-icons/md";

function Inventory() {
  const { items, setItems, loading, error, fetchItems /* updateItems - if used for global sync */ } = useContext(InventoryContext);
  const { darkMode } = useContext(ThemeContext);
  const navigate = useNavigate();

  // State for modals and forms - using item.id as key for robustness
  const [withdrawInfo, setWithdrawInfo] = useState({}); // { [itemId]: { name: '', quantity: '' } }
  const [addStockInfo, setAddStockInfo] = useState({});   // { [itemId]: '' } for quantity
  const [whoTook, setWhoTook] = useState({});           // { [itemId]: 'recipientName' }

  // State to control modal visibility - stores the item.id of the active row
  const [activeWithdrawRowId, setActiveWithdrawRowId] = useState(null);
  const [activeAddStockRowId, setActiveAddStockRowId] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [itemForDeleteModal, setItemForDeleteModal] = useState(null); // Stores the full item object for delete
  const [activeActionMenuId, setActiveActionMenuId] = useState(null); // item.id for the row with open action menu

  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'ascending'
  });

  // Initial data fetch if not handled by context provider on app load
  useEffect(() => {
    if (!items.length && !loading && !error) {
      // fetchItems(); // Uncomment if you want this component to trigger fetch
    }
  }, [items.length, loading, error, fetchItems]);

  const filteredItems = useMemo(() => items.filter((item) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const itemStatus = item.quantity === 0 ? "out of stock" : item.quantity < 5 ? "low stock" : "available";
    return (
      (item.item_name?.toLowerCase() || '').includes(searchLower) ||
      (item.category?.toLowerCase() || '').includes(searchLower) ||
      (itemStatus.includes(searchLower)) ||
      (item.date_added && new Date(item.date_added).toLocaleDateString().toLowerCase().includes(searchLower)) ||
      (item.quantity?.toString() || '').includes(searchTerm)
    );
  }), [items, searchTerm]);

  const sortedItems = useMemo(() => {
    let sortableItems = [...filteredItems];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let valueA = a[sortConfig.key];
        let valueB = b[sortConfig.key];
        
        if (sortConfig.key === 'date_added') {
          valueA = new Date(valueA);
          valueB = new Date(valueB);
        } else if (sortConfig.key === 'status') {
            const getStatusValue = (qty) => qty === 0 ? 2 : qty < 5 ? 1 : 0; // 0: Avail, 1: Low, 2: Out
            valueA = getStatusValue(a.quantity);
            valueB = getStatusValue(b.quantity);
        } else if (typeof valueA === 'string' && typeof valueB === 'string') { // Ensure both are strings for toLowerCase
            valueA = valueA.toLowerCase();
            valueB = valueB.toLowerCase();
        } else if (typeof valueA === 'number' && typeof valueB === 'number') {
            // Standard number comparison is fine
        } else { // Handle mixed types or nulls gracefully
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
    buttonsStyling: false, // Use customClass for buttons
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

  const handleDelete = async () => {
    if (!itemForDeleteModal) return;

    Swal.fire({
      ...swalThemeProps,
      title: `Delete "${itemForDeleteModal.item_name}"?`,
      text: "This action cannot be undone and the item will be permanently removed.",
      iconHtml: `<span class="text-red-500 dark:text-red-400"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c.34-.059.678-.113 1.017-.165m11.543 0c-3.445-.217-7.151-.217-10.596 0m10.596 0a48.108 48.108 0 0 1-3.478-.397m-7.503 0c.339-.059.677-.113 1.017-.165" /></svg></span>`,
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      // confirmButtonColor: '#e53e3e', // Red, but covered by customClass
    }).then(async (result) => {
      if (result.isConfirmed) {
        Swal.fire({ // Loading state
          ...swalThemeProps,
          title: "Deleting Item...",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
          showConfirmButton: false,
        });

        try {
          const token = localStorage.getItem("token");
          if (!token) throw new Error("Authentication token not found.");

          await axios.delete(`http://localhost:3000/delete/items/${itemForDeleteModal.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

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
      } else {
        setItemForDeleteModal(null); // User cancelled
      }
    });
  };

  const handleWithdraw = async (item, recipientName, quantity) => {
  const withdrawQuantity = Number(quantity);
  
  // Validation checks
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

    // Show loading state
    Swal.fire({
      ...swalThemeProps,
      title: "Processing Withdrawal...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
      showConfirmButton: false
    });

    const response = await axios.post(
      "http://localhost:3000/withdrawals/withdraw",
      { 
        item_id: item.id, 
        quantity: withdrawQuantity, 
        withdrawn_by: recipientName.trim() 
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Verify response structure
   const { updatedItem, message } = response.data || {};
if (!updatedItem) {
  throw new Error(message || "Invalid response from server");
}


    // Update state optimistically
    setItems(prevItems => 
  prevItems.map(i => 
    i.id === item.id 
      ? { ...i, quantity: response.data.updatedItem.quantity } 
      : i
  )
);

    // Reset form state
    setWithdrawInfo(prev => ({ ...prev, [item.id]: { name: '', quantity: '' } }));
    setActiveWithdrawRowId(null);
    setWhoTook(prev => ({ ...prev, [item.id]: recipientName.trim() }));

    // Show success message
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
    
    // Show appropriate error message
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

      const response = await axios.put(
        `http://localhost:3000/stock/${item.id}/add-stock`,
        { quantity: quantityToAdd },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
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

  const sidebarLinkClass = ({ isActive }) =>
    `px-5 py-3.5 hover:bg-white/20 transition-colors flex items-center gap-3.5 text-sm font-medium rounded-lg mx-3 my-1.5 ${
      isActive 
        ? (darkMode ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/30 text-white shadow-md') 
        : (darkMode ? 'text-slate-300 hover:text-white hover:bg-slate-700/50' : 'text-indigo-100 hover:text-white')
    }`;
  const sidebarIconClass = "text-xl";

  return (
    <div className={`flex h-screen font-sans antialiased ${darkMode ? 'dark' : ''}`}>
      {/* Sidebar */}
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
                  <NavLink to="/admin/users" className={sidebarLinkClass}><MdPeople className={sidebarIconClass} /> User Management  </NavLink> {/* Assuming MdPeople is imported */}
              
                  <NavLink to="/settings" className={sidebarLinkClass}><MdSettings className={sidebarIconClass} /> Settings</NavLink>
              
           
                </nav>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col ml-[250px] min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
        {/* Header */}
        <header className={`flex items-center justify-between h-20 px-6 sm:px-8 fixed top-0 left-[250px] right-0 z-40 transition-colors duration-300 print:hidden
                           ${darkMode ? 'bg-slate-800/75 backdrop-blur-lg border-b border-slate-700' : 'bg-white/75 backdrop-blur-lg border-b border-slate-200'} shadow-sm`}>
          <div className="relative">
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
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 pt-[104px] overflow-y-auto"> {/* 80px header + 24px padding = 104px */}
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
              <div className="flex justify-center items-center min-h-[400px]"> <LoadingSpinner /> </div>
            ) : error ? (
              <div className={`text-center p-8 sm:p-10 rounded-lg shadow-md ${darkMode ? 'bg-slate-800 text-red-400' : 'bg-white text-red-600'}`}>
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
                {!searchTerm && (
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
                        {['Item Name', 'Category', 'Quantity', 'Status', 'Date Added'].map((header) => (
                          <th 
                            key={header}
                            className={`py-3.5 px-4 text-left font-semibold cursor-pointer transition-colors ${darkMode ? 'hover:bg-slate-600' : 'hover:bg-slate-200'}`}
                            onClick={() => requestSort(header.toLowerCase().replace(/ /g, '_'))}
                          >
                            <div className="flex items-center">
                              {header}
                              {getSortIcon(header.toLowerCase().replace(/ /g, '_'))}
                            </div>
                          </th>
                        ))}
                        <th className="py-3.5 px-4 text-center font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className={`${darkMode ? 'divide-y divide-slate-700' : 'divide-y divide-slate-200'}`}>
                      {sortedItems.map((item) => (
                        <tr key={item.id} className={`${darkMode ? 'hover:bg-slate-700/60' : 'hover:bg-slate-50/70'} transition-colors duration-150`}>
                          <td className={`py-3 px-4 whitespace-nowrap font-medium ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{item.item_name}</td>
                          <td className={`py-3 px-4 whitespace-nowrap ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{item.category}</td>
                          <td className={`py-3 px-4 whitespace-nowrap text-center font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{item.quantity}</td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full
                              ${item.quantity === 0 ? (darkMode ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700')
                              : item.quantity < 5 ? (darkMode ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-700')
                              : (darkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700')}`}>
                              {item.quantity === 0 ? "Out of Stock" : item.quantity < 5 ? "Low Stock" : "Available"}
                            </span>
                          </td>
                          <td className={`py-3 px-4 whitespace-nowrap ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{new Date(item.date_added).toLocaleDateString()}</td>
                          <td className="py-2 px-4 text-center relative">
  <button
    onClick={() => setActiveActionMenuId(activeActionMenuId === item.id ? null : item.id)}
    className={`p-2 rounded-full transition-colors ${darkMode ? 'text-slate-400 hover:bg-slate-600 hover:text-slate-100' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-700'}`}
    aria-label="Actions"
  >
    <MdMoreVert size={20} />
  </button>
  {activeActionMenuId === item.id && (
    <div
      className={`absolute right-full mr-2.5 top-1/2 -translate-y-1/2 w-44 rounded-md shadow-xl z-20 
                  ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200'} border`}
      // Add a ref here if you want click-outside-to-close for this menu specifically
    >
      {/* Close X Icon for the Action Menu Popover */}
      <button
        onClick={() => setActiveActionMenuId(null)}
        aria-label="Close actions menu"
        className={`absolute top-1 right-1 p-1 rounded-full transition-colors 
                    ${darkMode ? 'text-slate-400 hover:bg-slate-600 hover:text-slate-100' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
      >
        <MdClose size={16} /> {/* Smaller icon for a smaller menu */}
      </button>

      {/* Menu Content - Add some padding-top if the X icon overlaps */}
      <div className="p-1.5 pt-6"> {/* Increased pt-6 to make space for the close button */}
        <button
          onClick={() => { setActiveWithdrawRowId(item.id); setWithdrawInfo(prev => ({ ...prev, [item.id]: { name: '', quantity: '1' }})); setActiveActionMenuId(null); }}
          className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-2.5 transition-colors
                      ${darkMode ? 'text-slate-200 hover:bg-indigo-600 hover:text-white' : 'text-slate-700 hover:bg-indigo-100 hover:text-indigo-700'}`}
        >
          <MdSystemUpdateAlt className="text-base"/> Withdraw
        </button>
        <button
          onClick={() => { setActiveAddStockRowId(item.id); setAddStockInfo(prev => ({ ...prev, [item.id]: '' })); setActiveActionMenuId(null); }}
          className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-2.5 transition-colors
                      ${darkMode ? 'text-slate-200 hover:bg-green-600 hover:text-white' : 'text-slate-700 hover:bg-green-100 hover:text-green-700'}`}
        >
          <MdAddCircleOutline className="text-base"/> Add Stock
        </button>
        <div className={`my-1.5 h-px ${darkMode ? 'bg-slate-600' : 'bg-slate-200'}`}></div>
        <button
          onClick={() => { setItemForDeleteModal(item); setActiveActionMenuId(null); /* handleDelete called by Swal */ }}
          className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-2.5 transition-colors
                      ${darkMode ? 'text-red-400 hover:bg-red-600 hover:text-white' : 'text-red-600 hover:bg-red-100 hover:text-red-700'}`}
        >
          <MdDeleteOutline className="text-base"/> Delete
        </button>
      </div>
    </div>
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

      {/* MODALS */}
      {/* Withdraw Modal */}
      {activeWithdrawRowId && (() => {
        const item = items.find(i => i.id === activeWithdrawRowId);
        if (!item) return null; // Item might have been deleted
        return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60  print:hidden animate-fadeIn"> {/* Or backdrop-blur-none */}
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
                      disabled={!withdrawInfo[item.id]?.name?.trim() || !withdrawInfo[item.id]?.quantity}
                      className={`px-4 py-2 text-sm font-medium rounded-md text-white transition-colors ${darkMode ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-indigo-500 hover:bg-indigo-600'} disabled:opacity-60 disabled:cursor-not-allowed`}>Confirm Withdraw</button>
            </div>
            {whoTook[item.id] && <p className={`mt-3 text-xs text-center ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Last withdrawn by: <strong>{whoTook[item.id]}</strong></p>}
          </div>
        </div>
      )})()}

      {/* Add Stock Modal */}
  {activeAddStockRowId && (() => {
    const item = items.find(i => i.id === activeAddStockRowId);
    if (!item) return null;
    return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60  print:hidden animate-fadeIn">
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
                  disabled={!addStockInfo[item.id]}
                  className={`px-4 py-2 text-sm font-medium rounded-md text-white transition-colors ${darkMode ? 'bg-green-600 hover:bg-green-500' : 'bg-green-500 hover:bg-green-600'} disabled:opacity-60 disabled:cursor-not-allowed`}>Confirm Addition</button>
        </div>
      </div>
    </div>
  )})()}

  {/* Delete Confirmation uses SweetAlert2, triggered by setItemForDeleteModal(item) then calling handleDelete() */}
</div>
  );
}

export default Inventory;
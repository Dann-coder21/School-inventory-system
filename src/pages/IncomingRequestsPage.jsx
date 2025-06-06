import React, { useContext, useEffect, useMemo, useState, useRef } from 'react'; // Added useRef
import { useNavigate, Link } from 'react-router-dom';
import { ThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useOrders } from '../contexts/OrderContext';
import LoadingSpinner from '../Components/LoadingSpinner';
import Swal from 'sweetalert2';
import axios from 'axios';
import Layout from '../Components/Layout/Layout'; // Import Layout component

// Icons for page content
import {
  MdAssignmentTurnedIn, MdArrowUpward, MdArrowDownward, MdArrowForward, MdInfoOutline, MdWarningAmber,
  MdInfo, MdCheckCircle, MdError, MdThumbUp, MdThumbDown, MdClose, MdMoreVert // Added MdMoreVert
} from 'react-icons/md';


const formatTimeAgo = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return `${seconds} secs ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} mins ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} days ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} months ago`;
    const years = Math.floor(months / 12); // Keep this for consistency, though days/365 is more accurate
    return `${years} years ago`;
};

const formatFullDate = (dateString) => {
  if (!dateString) return 'N/A';
  const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

function IncomingRequestsPage() {
  const { darkMode } = useContext(ThemeContext);
  const { currentUser, isLoadingAuth } = useAuth();
  const { orders, loadingOrders, ordersError, fetchOrders } = useOrders();
  const navigate = useNavigate();

  const [sortConfig, setSortConfig] = useState({ key: 'request_date', direction: 'descending' });
  const [viewingOrderDetails, setViewingOrderDetails] = useState(null); // State for modal
  const [activeActionMenuId, setActiveActionMenuId] = useState(null); // State for kebab menu
  const actionMenuRef = useRef(null); // Ref for kebab menu dropdown

  const canApproveRejectFulfill = useMemo(() => {
    // Admins and Stock Managers can approve/reject/fulfill from this page.
    return currentUser && (currentUser.role === 'Admin' || currentUser.role === 'StockManager');
  }, [currentUser]);

  useEffect(() => {
    if (!isLoadingAuth) {
      if (!currentUser || !(currentUser.role === 'Admin' || currentUser.role === 'StockManager')) {
        console.warn("Unauthorized access attempt to Incoming Requests Page. Redirecting.");
        navigate('/dashboard', { replace: true });
      } else {
        fetchOrders();
      }
    }
  }, [currentUser, isLoadingAuth, navigate, fetchOrders]);

  useEffect(() => {
    // Handle clicks outside the action menu to close it
    const handleClickOutside = (event) => {
      if (activeActionMenuId && actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
        const isMenuButton = event.target.closest(`button[aria-label^="Actions-for-"]`);
        if (!isMenuButton) { // Ensure the click wasn't on the menu button itself
          setActiveActionMenuId(null);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeActionMenuId]);

  const pendingOrders = useMemo(() => {
    if (!orders) return [];
    let filtered = orders.filter(order =>
      (order.status === 'Pending' || order.status === 'DepartmentApproved')
    );

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];
        if (sortConfig.key === 'request_date' || sortConfig.key === 'response_date') {
          valA = new Date(valA); valB = new Date(valB);
        }
        else if (typeof valA === 'string' && typeof valB === 'string') { valA = valA.toLowerCase(); valB = valB.toLowerCase(); }
        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [orders, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? <MdArrowUpward className="ml-1 text-xs" /> : <MdArrowDownward className="ml-1 text-xs" />;
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Pending': return darkMode ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-700';
      case 'DepartmentApproved': return darkMode ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700';
      case 'Approved': return darkMode ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700';
      case 'Fulfilled': return darkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700';
      case 'Rejected': return darkMode ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700';
      case 'Cancelled': return darkMode ? 'bg-slate-500/20 text-slate-300' : 'bg-slate-200 text-slate-600';
      default: return darkMode ? 'bg-slate-600 text-slate-300' : 'bg-slate-200 text-slate-600';
    }
  };

  const handleViewDetails = (order) => {
    setViewingOrderDetails(order);
    setActiveActionMenuId(null); // Close kebab menu if open
  };
  const closeDetailsModal = () => {
    setViewingOrderDetails(null);
  };

  const handleUpdateStatus = async (order, newStatus) => {
    setActiveActionMenuId(null); // Close kebab menu immediately
    if (!canApproveRejectFulfill) return;
    
    let titleText = ''; let confirmText = ''; let inputOptions = {}; let showInput = false; let icon = 'info';
    switch (newStatus) {
      case 'Approved':
        titleText = `Approve Request for "${order.item_name}"?`;
        confirmText = 'Yes, Approve';
        icon = 'question';
        // Stock Managers can only approve requests that are DepartmentApproved.
        // Admins can approve Pending or DepartmentApproved requests.
        if (currentUser.role === 'StockManager' && order.status === 'Pending') {
            Swal.fire({
                title: 'Action Not Allowed',
                text: 'Stock Managers typically approve requests that have already been Department Approved.',
                icon: 'warning',
                confirmButtonColor: '#f59e0b',
                customClass: { popup: 'z-50' }
            });
            return;
        }
        break;
      case 'Rejected':
        titleText = `Reject Request for "${order.item_name}"?`;
        confirmText = 'Yes, Reject';
        showInput = true;
        inputOptions = { 'low_stock': 'Low Stock', 'not_available': 'Item Not Available', 'other': 'Other Reason (specify below)' };
        icon = 'warning';
        break;
      case 'Fulfilled':
        titleText = `Fulfill Request for "${order.item_name}"?`;
        confirmText = `Yes, Fulfill`;
        icon = 'question';
        showInput = true; // For fulfilled quantity input
        inputOptions = null; // No select options for fulfill
        // Only StockManager can fulfill
        if (currentUser.role !== 'StockManager') {
            Swal.fire({
                title: 'Permission Denied',
                text: 'Only Stock Managers can fulfill requests.',
                icon: 'error',
                confirmButtonColor: '#ef4444',
                customClass: { popup: 'z-50' }
            });
            return;
        }
        // Only fulfill if already approved or department approved (if SM can directly fulfill after DH approval)
        if (order.status === 'Pending') {
             Swal.fire({
                title: 'Order Not Approved Yet',
                text: 'This order is still pending initial approval. It must be approved by a Department Head or Admin first before fulfillment.',
                icon: 'warning',
                confirmButtonColor: '#f59e0b',
                customClass: { popup: 'z-50' }
            });
            return;
        }
        break;
      default: return;
    }

    const { value: formValues } = await Swal.fire({
      title: titleText,
      html: showInput ? `
        <div class="flex flex-col gap-3 p-4 text-left">
          ${newStatus === 'Rejected' ? `
            <label class="block text-sm font-semibold mb-1 text-gray-700 ${darkMode ? 'text-gray-300' : ''}">Reason:</label>
            <select id="swal-input1" class="swal2-input border rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-100' : 'bg-white border-gray-300 text-gray-800'}">
              ${Object.entries(inputOptions).map(([key, value]) => `<option value="${key}">${value}</option>`).join('')}
            </select>
            <input id="swal-input2" class="swal2-input border rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-100' : 'bg-white border-gray-300 text-gray-800'}" placeholder="Details (e.g., specific reason)">
          ` : newStatus === 'Fulfilled' ? `
            <label class="block text-sm font-semibold mb-1 text-gray-700 ${darkMode ? 'text-gray-300' : ''}">Quantity to Fulfill (Current Stock: ${order.current_stock}, Requested Remaining: ${order.requested_quantity - (order.fulfilled_quantity || 0)}):</label>
            <input type="number" id="swal-input3" class="swal2-input border rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-100' : 'bg-white border-gray-300 text-gray-800'}" placeholder="Enter quantity" min="1" value="${order.requested_quantity - (order.fulfilled_quantity || 0)}">
          ` : ''}
        </div>
      ` : null,
      focusConfirm: false, showCancelButton: true, confirmButtonText: confirmText, preConfirm: showInput ? () => {
        if (newStatus === 'Rejected') {
          const selectValue = document.getElementById('swal-input1').value;
          const textValue = document.getElementById('swal-input2').value;
          return { selectValue, textValue };
        } else if (newStatus === 'Fulfilled') {
          const quantity = document.getElementById('swal-input3').value;
          if (quantity <= 0 || !Number.isInteger(Number(quantity))) {
            Swal.showValidationMessage('Please enter a valid positive integer for quantity.');
            return false;
          }
          const remainingRequested = order.requested_quantity - (order.fulfilled_quantity || 0);
          const currentStock = order.current_stock !== undefined ? order.current_stock : Infinity;
          if (Number(quantity) > remainingRequested) {
              Swal.showValidationMessage(`Quantity cannot exceed remaining requested quantity (${remainingRequested}).`);
              return false;
          }
          if (Number(quantity) > currentStock && currentUser.role === 'StockManager') {
             Swal.showValidationMessage(`Quantity cannot exceed current stock (${currentStock}).`);
             return false;
          }
          return { quantity: Number(quantity) };
        }
        return undefined;
      } : undefined,
      background: darkMode ? '#1e293b' : '#ffffff', color: darkMode ? '#e2e8f0' : '#1e293b', confirmButtonColor: darkMode ? '#4f46e5' : '#6366f1', cancelButtonColor: darkMode ? '#64748b' : '#cbd5e1',
      customClass: { popup: 'rounded-xl shadow-2xl p-4 sm:p-6', confirmButton: 'px-5 py-2.5 rounded-lg font-semibold text-white text-sm', cancelButton: 'px-5 py-2.5 rounded-lg font-semibold text-sm', title: `text-lg sm:text-xl font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`, htmlContainer: `text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`, icon: 'text-4xl sm:text-5xl mt-2 mb-2 sm:mb-4', }, buttonsStyling: false, icon: icon
    });
    if (formValues !== undefined) {
      let payload = { status: newStatus };
      if (newStatus === 'Rejected') { payload.rejection_reason = formValues.selectValue + (formValues.textValue ? `: ${formValues.textValue}` : ''); }
      else if (newStatus === 'Fulfilled') { payload.fulfilled_quantity = formValues.quantity; }

      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found.');
        const response = await axios.put(`http://localhost:3000/api/orders/${order.id}/status`, payload, { headers: { Authorization: `Bearer ${token}` } });
        if (response.status === 200) { Swal.fire('Success', `Request ${newStatus}!`, 'success'); fetchOrders(); }
        else { throw new Error(response.data.message || 'Failed to update request.'); }
      } catch (err) { console.error("Error updating request status:", err); Swal.fire('Error', err.response?.data?.message || err.message || 'Failed to update request.', 'error'); }
    }
  };

  if (isLoadingAuth || !canApproveRejectFulfill) {
    return (
      <div className={`flex h-screen items-center justify-center ${darkMode ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
        {isLoadingAuth ? <LoadingSpinner /> : "Checking permissions..."}
      </div>
    );
  }

  const renderPageContent = (content) => (
    <div className={`flex-1 flex flex-col min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
      <header className={`flex items-center justify-between h-20 px-6 sm:px-8 fixed top-0 left-[250px] right-0 z-40 transition-colors duration-300
                         ${darkMode ? 'bg-slate-800/75 backdrop-blur-lg border-b border-slate-700' : 'bg-white/75 backdrop-blur-lg border-b border-slate-200'} shadow-sm`}>
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${darkMode ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600'}`}>
            <MdAssignmentTurnedIn size={24}/>
          </div>
          <h2 className={`text-xl sm:text-2xl font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>
            Incoming Item Requests
          </h2>
        </div>
        <Link
          to="/orders"
          className={`flex items-center text-sm font-medium ${darkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'}`}
        >
          View All Requests <MdArrowForward className="ml-1 text-base" />
        </Link>
      </header>

      <main className="flex-1 p-6 pt-[104px] ml-[250px] overflow-y-auto max-w-full">
        <div className="max-w-7xl mx-auto space-y-8">
          {content}
        </div>
      </main>
    </div>
  );

  if (loadingOrders) {
    return renderPageContent(
      <div className={`flex justify-center items-center min-h-[300px] rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
        <LoadingSpinner />
      </div>
    );
  }

  if (ordersError) {
    return renderPageContent(
      <div className={`text-center p-8 rounded-xl shadow-md ${darkMode ? 'bg-slate-800 text-red-400' : 'bg-white text-red-600'}`}>
        <MdWarningAmber size={52} className="mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Error Loading Requests</h3>
        <p className="text-sm">{ordersError.message || "Could not fetch order requests. Please try again."}</p>
        <button onClick={fetchOrders} className="mt-4 px-4 py-2 rounded-md bg-indigo-500 text-white">Retry</button>
      </div>
    );
  }

  return (
    <Layout>
      {renderPageContent(
        <div className={`p-6 rounded-xl shadow-lg ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}`}>
            {pendingOrders.length === 0 ? (
                <div className={`text-center py-10 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                <MdInfoOutline size={48} className="mx-auto mb-3" />
                <p className="font-medium">No new incoming item requests. Everything is up to date!</p>
                </div>
            ) : (
                <div className={`rounded-lg shadow-xl overflow-hidden ${darkMode ? 'bg-slate-700 border border-slate-600' : 'bg-white border border-slate-200'}`}>
                <div className="overflow-x-auto">
                    {/* Increased min-width for the new column */}
                    <table className="w-full min-w-[1000px] text-sm">
                    <thead className={`${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'} text-xs uppercase tracking-wider`}>
                        <tr>
                        <th className="py-3.5 px-4 text-left font-semibold cursor-pointer" onClick={() => requestSort('item_name')}>
                            Item Name {getSortIcon('item_name')}
                        </th>
                        <th className="py-3.5 px-4 text-left font-semibold cursor-pointer" onClick={() => requestSort('requested_quantity')}>
                            Req. Qty {getSortIcon('requested_quantity')}
                        </th>
                        <th className="py-3.5 px-4 text-left font-semibold">Current Stock</th>
                        <th className="py-3.5 px-4 text-left font-semibold">Requester</th>
                        <th className="py-3.5 px-4 text-left font-semibold hidden sm:table-cell">Department</th>
                        {/* RE-ADDED: Department Approval column */}
                        <th className="py-3.5 px-4 text-left font-semibold hidden md:table-cell">DH Approved By</th>
                        <th className="py-3.5 px-4 text-left font-semibold cursor-pointer" onClick={() => requestSort('request_date')}>
                            Date {getSortIcon('request_date')}
                        </th>
                        <th className="py-3.5 px-4 text-left font-semibold">Status</th>
                        <th className="py-3.5 px-4 text-left font-semibold">Notes</th>
                        <th className="py-3.5 px-4 text-left font-semibold hidden lg:table-cell">Last Action By</th>
                        {canApproveRejectFulfill && <th className="py-3.5 px-4 text-center font-semibold">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className={`${darkMode ? 'divide-y divide-slate-700' : 'divide-y divide-slate-200'}`}>
                        {pendingOrders.map(order => (
                        <tr key={order.id} className={`${darkMode ? 'hover:bg-slate-600/60' : 'hover:bg-slate-50/70'} transition-colors duration-150`}>
                            <td className={`py-3 px-4 font-medium ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                            {order.item_name}
                            </td>
                            <td className={`py-3 px-4 text-center ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                            {order.requested_quantity}
                            </td>
                            <td className={`py-3 px-4 text-center ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                                {order.current_stock !== undefined ? order.current_stock : 'N/A'}
                            </td>
                            <td className={`py-3 px-4 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            {order.requester_name}
                            </td>
                            <td className={`py-3 px-4 hidden sm:table-cell ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                {order.requester_department_name || 'N/A'}
                            </td>
                            {/* RE-ADDED: Department Approval column data */}
                            <td className={`py-3 px-4 hidden md:table-cell ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                {order.approved_by_name && order.approved_by_role === 'DepartmentHead'
                                    ? `${order.approved_by_name} (DH)`
                                    : 'N/A'}
                            </td>
                            <td className={`py-3 px-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {formatTimeAgo(order.request_date)}
                            </td>
                            <td className="py-3 px-4">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(order.status)}`}>
                                {order.status}
                                </span>
                            </td>
                            <td className={`py-3 px-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'} italic max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap`} title={order.notes || order.admin_notes}>
                            {order.notes || order.admin_notes || 'No notes'}
                            </td>
                            <td className={`py-3 px-4 hidden lg:table-cell ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                {order.status === 'Rejected' && order.rejected_by_name
                                    ? `${order.rejected_by_name} (${order.rejected_by_role})`
                                    : order.status === 'Fulfilled' && order.fulfilled_by_name
                                        ? `${order.fulfilled_by_name} (${order.fulfilled_by_role})`
                                        : (order.status === 'Approved' || order.status === 'DepartmentApproved') && order.approved_by_name && order.approved_by_role !== 'DepartmentHead'
                                            ? `${order.approved_by_name} (${order.approved_by_role})`
                                            : 'N/A'
                                }
                            </td>
                            {canApproveRejectFulfill && (
                            <td className="py-3 px-4 text-center relative"> {/* Add relative positioning for the dropdown */}
                                {/* Kebab menu button */}
                                <button
                                    onClick={() => setActiveActionMenuId(activeActionMenuId === order.id ? null : order.id)}
                                    className={`p-2 rounded-full transition-colors ${darkMode ? 'text-slate-400 hover:bg-slate-600 hover:text-slate-100' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-700'}`}
                                    aria-label={`Actions-for-${order.id}`}
                                >
                                    <MdMoreVert size={20} />
                                </button>

                                {/* Action Menu Dropdown */}
                                {activeActionMenuId === order.id && (
                                    <div
                                        ref={actionMenuRef} // Attach ref here
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
                                        <div className="p-1.5 pt-7"> {/* Adjust padding to account for close button */}
                                            {/* Admin can approve pending or department-approved requests */}
                                            {(currentUser.role === 'Admin' || (currentUser.role === 'StockManager' && order.status === 'DepartmentApproved')) && (
                                                <button
                                                    onClick={() => handleUpdateStatus(order, 'Approved')}
                                                    className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-2.5 transition-colors
                                                                ${darkMode ? 'text-slate-200 hover:bg-green-600 hover:text-white' : 'text-slate-700 hover:bg-green-100 hover:text-green-700'}
                                                                ${(order.status !== 'Pending' && order.status !== 'DepartmentApproved') ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    disabled={order.status !== 'Pending' && order.status !== 'DepartmentApproved'}
                                                >
                                                    <MdThumbUp className="text-base"/> Approve
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleUpdateStatus(order, 'Rejected')}
                                                className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-2.5 transition-colors
                                                            ${darkMode ? 'text-red-400 hover:bg-red-600 hover:text-white' : 'text-red-600 hover:bg-red-100 hover:text-red-700'}
                                                            ${(order.status !== 'Pending' && order.status !== 'DepartmentApproved') ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                disabled={order.status !== 'Pending' && order.status !== 'DepartmentApproved'}
                                            >
                                                <MdThumbDown className="text-base"/> Reject
                                            </button>
                                            {/* StockManager can fulfill orders that are Approved or DepartmentApproved */}
                                            {currentUser.role === 'StockManager' && (order.status === 'Approved' || order.status === 'DepartmentApproved') && (
                                                <button
                                                    onClick={() => handleUpdateStatus(order, 'Fulfilled')}
                                                    className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-2.5 transition-colors
                                                                ${darkMode ? 'text-blue-400 hover:bg-blue-600 hover:text-white' : 'text-blue-600 hover:bg-blue-100 hover:text-blue-700'}`}
                                                >
                                                    <MdCheckCircle className="text-base"/> Fulfill
                                                </button>
                                            )}
                                            {/* Separator only if there are actions before */}
                                            { ( (currentUser.role === 'Admin') || (currentUser.role === 'StockManager' && order.status === 'DepartmentApproved') ) &&
                                              <div className={`my-1.5 h-px ${darkMode ? 'bg-slate-600' : 'bg-slate-200'}`}></div>
                                            }
                                            <button
                                                onClick={() => handleViewDetails(order)}
                                                className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-2.5 transition-colors
                                                            ${darkMode ? 'text-slate-200 hover:bg-indigo-600 hover:text-white' : 'text-slate-700 hover:bg-indigo-100 hover:text-indigo-700'}`}
                                            >
                                                <MdInfo className="text-base"/> Details
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </td>
                            )}
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
                </div>
            )}
        </div>
      )}
      {/* Order Details Modal for IncomingRequestsPage (Keeping Department Approved By here as it's useful context) */}
      {viewingOrderDetails && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className={`relative w-full max-w-lg rounded-lg shadow-xl p-6 ${darkMode ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-800'}`}>
            <h3 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
              <MdInfo /> Order Details
            </h3>
            <button
              onClick={closeDetailsModal}
              className={`absolute top-4 right-4 p-1.5 rounded-full hover:opacity-70 ${darkMode ? 'text-slate-300' : 'text-gray-500'}`}
              aria-label="Close details"
            >
              <MdClose className="text-xl" />
            </button>

            <div className="space-y-3 text-sm">
              <p><strong>Item:</strong> {viewingOrderDetails.item_name}</p>
              <p><strong>Quantity:</strong> {viewingOrderDetails.requested_quantity}</p>
              <p><strong>Requester:</strong> {viewingOrderDetails.requester_name}</p>
              <p><strong>Department:</strong> {viewingOrderDetails.requester_department_name || 'N/A'}</p>
              <p><strong>Status:</strong> <span className={`font-semibold ${getStatusClass(viewingOrderDetails.status)}`}>{viewingOrderDetails.status}</span></p>
              <p><strong>Requested On:</strong> {formatFullDate(viewingOrderDetails.request_date)}</p>
              {viewingOrderDetails.response_date && <p><strong>Last Action On:</strong> {formatFullDate(viewingOrderDetails.response_date)}</p>}
              
              {/* Approval/Rejection/Fulfillment details with roles */}
              {viewingOrderDetails.approved_by_name && viewingOrderDetails.approved_by_role === 'DepartmentHead' && (
                <p><strong>Department Approved By:</strong> {viewingOrderDetails.approved_by_name} ({viewingOrderDetails.approved_by_role})</p>
              )}
              {viewingOrderDetails.approved_by_name && (viewingOrderDetails.approved_by_role === 'Admin' || viewingOrderDetails.approved_by_role === 'StockManager') && (
                  <p><strong>Approved By:</strong> {viewingOrderDetails.approved_by_name} ({viewingOrderDetails.approved_by_role})</p>
              )}
              {viewingOrderDetails.fulfilled_by_name && (
                <p><strong>Fulfilled By:</strong> {viewingOrderDetails.fulfilled_by_name} ({viewingOrderDetails.fulfilled_by_role})</p>
              )}
              {viewingOrderDetails.rejected_by_name && (
                <p><strong>Rejected By:</strong> {viewingOrderDetails.rejected_by_name} ({viewingOrderDetails.rejected_by_role})</p>
              )}

              {viewingOrderDetails.notes && <p><strong>Requester Notes:</strong> {viewingOrderDetails.notes}</p>}
              {viewingOrderDetails.admin_notes && <p><strong>Admin Notes:</strong> {viewingOrderDetails.admin_notes}</p>}
              
              {/* Highlight rejection reason */}
              {viewingOrderDetails.status === 'Rejected' && viewingOrderDetails.rejection_reason && (
                <div className={`mt-4 p-3 rounded-md border ${darkMode ? 'bg-red-900/30 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-800'}`}>
                  <p className="font-semibold flex items-center gap-1"><MdError size={18}/> Rejection Reason:</p>
                  <p className="ml-6">{viewingOrderDetails.rejection_reason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default IncomingRequestsPage;
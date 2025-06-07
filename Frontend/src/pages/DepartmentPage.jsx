// DepartmentPage.jsx - NO CHANGES NEEDED
import React, { useState, useContext, useEffect, useCallback, useRef, useMemo } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import Swal from 'sweetalert2';
import axios from "axios";
import Layout from "../Components/Layout/Layout";
import LoadingSpinner from "../Components/LoadingSpinner";

// Icons
import {
  MdHistory, MdSort, MdArrowUpward, MdArrowDownward, MdMoreVert, MdClose, MdInfo,
  MdCheckCircleOutline, MdCancel, MdThumbUp, MdThumbDown, MdApartment,
  MdArrowForward, MdInfoOutline, MdWarningAmber
} from 'react-icons/md';

const API_BASE_URL = "http://localhost:3000";

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
  const years = Math.floor(months / 12);
  return `${years} years ago`;
};

const formatFullDate = (dateString) => {
  if (!dateString) return 'N/A';
  const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const DepartmentPage = () => {
  const { darkMode } = useContext(ThemeContext);
  const { currentUser, isLoadingAuth } = useAuth();

  const [departmentOrders, setDepartmentOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  const [sortConfig, setSortConfig] = useState({ key: 'request_date', direction: 'descending' });
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('Pending'); // Default filter status
  const [searchTerm, setSearchTerm] = useState('');
  const [ordersPerPage, setOrdersPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [activeActionMenuId, setActiveActionMenuId] = useState(null);
  const actionMenuRef = useRef(null); // Reference for the action menu dropdown

  const [viewingOrderDetails, setViewingOrderDetails] = useState(null);

  const allowedViewerRoles = useMemo(() => ['Admin', 'DepartmentHead', 'StockManager'], []);
  const canApproveRejectFulfill = useMemo(() => {
    // Only Department Heads can approve/reject from this page.
    // Admin/StockManager actions are typically handled on the IncomingRequestsPage.
    return currentUser && currentUser.role === 'DepartmentHead';
  }, [currentUser]);

  const fetchDepartmentOrders = useCallback(async () => {
    setIsLoadingOrders(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        Swal.fire('Authentication Error', 'No token found. Please log in again.', 'error');
        setIsLoadingOrders(false);
        return;
      }

      if (currentUser?.role === 'DepartmentHead' && !currentUser?.department_id) {
        console.warn("Department Head's department not found. Cannot fetch specific orders.");
        setDepartmentOrders([]);
        setIsLoadingOrders(false);
        return;
      }
      
      const response = await axios.get(`${API_BASE_URL}/api/orders/department-requests`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setDepartmentOrders(response.data);
    } catch (error) {
      console.error("Failed to fetch department orders:", error);
      const errorMsg = error.response?.data?.message || error.message || "Could not load department orders.";
      Swal.fire({
        title: 'Error Fetching Orders',
        text: errorMsg,
        icon: 'error',
      });
    } finally {
      setIsLoadingOrders(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!isLoadingAuth && currentUser && allowedViewerRoles.includes(currentUser.role)) {
      fetchDepartmentOrders();
    } else if (!isLoadingAuth && (!currentUser || !allowedViewerRoles.includes(currentUser.role))) {
      setIsLoadingOrders(false);
      setDepartmentOrders([]);
    }
  }, [currentUser, isLoadingAuth, fetchDepartmentOrders, allowedViewerRoles]);

  useEffect(() => {
    // This effect handles closing the action menu when clicking outside
    const handleClickOutside = (event) => {
      // Check if the click is outside the action menu and not on a menu toggle button
      if (activeActionMenuId && actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
        // Prevent closing if the click target is the actual MdMoreVert button that opened it
        const isMenuButton = event.target.closest(`button[aria-label^="Actions-for-"]`);
        if (!isMenuButton) {
          setActiveActionMenuId(null);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeActionMenuId]);

  const processedOrders = useMemo(() => {
    let tempOrders = [...departmentOrders];

    if (searchTerm) {
      tempOrders = tempOrders.filter(order =>
        order.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.requester_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.notes && order.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedStatusFilter && selectedStatusFilter !== 'All') {
      tempOrders = tempOrders.filter(order => order.status === selectedStatusFilter);
    }

    if (sortConfig.key) {
      tempOrders.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];
        if (sortConfig.key === 'request_date' || sortConfig.key === 'response_date') {
          valA = new Date(valA); valB = new Date(valB);
        } else if (typeof valA === 'string' && typeof valB === 'string') {
          valA = valA.toLowerCase(); valB = valB.toLowerCase();
        }
        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }

    const totalCount = tempOrders.length;
    const totalPages = Math.ceil(totalCount / ordersPerPage);
    const indexOfLastOrder = currentPage * ordersPerPage;
    const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;

    const paginatedOrders = tempOrders.slice(indexOfFirstOrder, indexOfLastOrder);

    return { 
        paginatedOrders, 
        totalCount: totalCount, 
        totalPages: totalPages,
        indexOfFirstOrder: indexOfFirstOrder,
        indexOfLastOrder: indexOfLastOrder
    };
  }, [departmentOrders, searchTerm, selectedStatusFilter, sortConfig, ordersPerPage, currentPage]);


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
    setActiveActionMenuId(null); // Close any open action menu
  };

  const closeDetailsModal = () => {
    setViewingOrderDetails(null);
  };

  const handleUpdateStatus = async (order, newStatus) => {
    setActiveActionMenuId(null); // Close kebab menu immediately
    if (!canApproveRejectFulfill) return;

    if (currentUser?.role === 'DepartmentHead' && order.requester_id === currentUser.id && (newStatus === 'DepartmentApproved' || newStatus === 'Rejected')) {
      Swal.fire({
        title: 'Action Not Allowed',
        text: 'Department Heads cannot approve or reject their own requests.',
        icon: 'warning',
        confirmButtonColor: '#f59e0b',
        customClass: { popup: 'z-50' }
      });
      return;
    }

    let titleText = ''; let confirmText = ''; let inputOptions = {}; let showInput = false; let icon = 'info';
    let payloadStatus = newStatus;

    switch (newStatus) {
      case 'DepartmentApproved':
        titleText = `Allow Approval for "${order.item_name}"?`;
        confirmText = 'Yes, Allow';
        icon = 'question';
        payloadStatus = 'DepartmentApproved';
        break;
      case 'Rejected':
        titleText = `Reject Request for "${order.item_name}"?`; confirmText = 'Yes, Reject'; showInput = true;
        inputOptions = { 'low_stock': 'Low Stock', 'not_available': 'Item Not Available', 'other': 'Other Reason (specify below)' };
        icon = 'warning';
        break;
      default: return;
    }

    const { value: formValues } = await Swal.fire({
      title: titleText,
      html: showInput ? `
        <div class="flex flex-col gap-3 p-4 text-left">
          ${newStatus === 'Rejected' ? `
            <label class="block text-sm font-semibold mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}">Reason:</label>
            <select id="swal-input1" class="swal2-input border rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-100' : 'bg-white border-gray-300 text-gray-800'}">
              ${Object.entries(inputOptions).map(([key, value]) => `<option value="${key}">${value}</option>`).join('')}
            </select>
            <input id="swal-input2" class="swal2-input border rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-100' : 'bg-white border-gray-300 text-gray-800'}" placeholder="Details (e.g., specific reason)">
          ` : ''}
        </div>
      ` : null,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: confirmText,
      preConfirm: showInput ? () => {
        if (newStatus === 'Rejected') {
          const selectValue = document.getElementById('swal-input1').value;
          const textValue = document.getElementById('swal-input2').value;
          return { selectValue, textValue };
        }
        return undefined;
      } : undefined,
      background: darkMode ? '#1e293b' : '#ffffff', color: darkMode ? '#e2e8f0' : '#1e293b',
      confirmButtonColor: darkMode ? '#4f46e5' : '#6366f1', cancelButtonColor: darkMode ? '#64748b' : '#cbd5e1',
      customClass: {
        popup: 'rounded-xl shadow-2xl p-4 sm:p-6',
        confirmButton: 'px-5 py-2.5 rounded-lg font-semibold text-white text-sm',
        cancelButton: 'px-5 py-2.5 rounded-lg font-semibold text-sm',
        title: `text-lg sm:text-xl font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`,
        htmlContainer: `text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`,
        icon: 'text-4xl sm:text-5xl mt-2 mb-2 sm:mb-4',
      },
      buttonsStyling: false,
      icon: icon
    });

    if (formValues !== undefined) {
      let payload = { status: payloadStatus };
      if (payloadStatus === 'Rejected') {
        payload.rejection_reason = formValues.selectValue + (formValues.textValue ? `: ${formValues.textValue}` : '');
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found.');

        const response = await axios.put(`${API_BASE_URL}/api/orders/${order.id}/status`, payload, { headers: { Authorization: `Bearer ${token}` } });
        
        if (response.status === 200) {
          Swal.fire('Success', `Request ${newStatus}!`, 'success');
          fetchDepartmentOrders();
        } else {
          throw new Error(response.data.message || 'Failed to update request.');
        }
      } catch (err) {
        console.error("Error updating request status:", err);
        Swal.fire('Error', err.response?.data?.message || err.message || 'Failed to update request.', 'error');
      }
    }
  };

  const commonInputClass = `w-full px-3 py-2 rounded-md border text-sm transition-colors duration-150 focus:ring-2 focus-visible:outline-none ${
    darkMode ? 'bg-slate-700 border-slate-600 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400 text-slate-100' : 'bg-white border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400 text-slate-800'
  }`;

  const isAuthorized = currentUser && allowedViewerRoles.includes(currentUser.role) && 
                       (currentUser.role !== 'DepartmentHead' || (currentUser.role === 'DepartmentHead' && currentUser.department_id));

  if (isLoadingAuth || !isAuthorized) {
    return (
      <div className={`flex h-screen items-center justify-center ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
        <LoadingSpinner size="lg" />
        <p className={`ml-4 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
          {isLoadingAuth ? "Authenticating..." :
           (currentUser?.role === 'DepartmentHead' && !currentUser?.department_id
              ? "Department Head not assigned to a department..."
              : "Checking permissions...")}
        </p>
      </div>
    );
  }

  return (
    <Layout>
      <div className={`flex-1 flex flex-col min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
        <header className={`flex items-center justify-between h-20 px-6 sm:px-8 fixed top-0 left-[250px] right-0 z-40 ${
          darkMode ? 'bg-slate-800/75 backdrop-blur-lg border-b border-slate-700' : 'bg-white/75 backdrop-blur-lg border-b border-slate-200'
        } shadow-sm`}>
          <h2 className={`text-xl sm:text-2xl font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>
            Department Order Requests
          </h2>
          <div className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Department: <span className="font-bold">{currentUser?.department_name || 'N/A'}</span>
          </div>
        </header>

        <main className="flex-1 p-6 pt-[104px] ml-[250px] overflow-y-auto max-w-full">
          {/* Search, Filter & Pagination Controls */}
          <div className={`mb-4 p-4 rounded-lg shadow-md flex flex-wrap gap-4 items-center justify-between ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}`}>
            <div className="flex-1 min-w-[200px] max-w-md">
              <label htmlFor="search" className="sr-only">Search orders</label>
              <input
                id="search"
                type="text"
                placeholder="Search by item, requester..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${commonInputClass} text-sm`}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Status:</span>
              <select
                value={selectedStatusFilter}
                onChange={(e) => { setSelectedStatusFilter(e.target.value); setCurrentPage(1); }}
                className={`${commonInputClass} w-auto text-sm p-1.5`}
              >
                <option value="Pending">Pending</option>
                <option value="All">All</option>
                <option value="DepartmentApproved">Dept. Approved</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Fulfilled">Fulfilled</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Orders per page:</span>
              <select
                value={ordersPerPage}
                onChange={(e) => { setOrdersPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className={`${commonInputClass} w-auto text-sm p-1.5`}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>

          {/* Orders Table */}
          <div className={`w-full rounded-xl shadow-xl p-0 overflow-hidden ${
            darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
          }`}>
            {isLoadingOrders ? (
              <div className="p-10 text-center">
                <LoadingSpinner size="md"/>
                <p className={`mt-3 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Loading department orders...</p>
              </div>
            ) : processedOrders.paginatedOrders.length === 0 ? (
              <div className={`p-10 text-center ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                <MdInfoOutline size={48} className="mx-auto mb-3 opacity-70"/>
                <p className="font-medium text-lg">No order requests found for your department with the current filters.</p>
                <p className="text-sm">Check back later or adjust your filters.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] text-sm">
                    <thead className={`${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'} text-xs uppercase tracking-wider`}>
                      <tr>
                        {[
                          { key: 'item_name', label: 'Item' },
                          { key: 'requested_quantity', label: 'Req. Qty' },
                          { key: 'current_stock', label: 'Curr. Stock' },
                          { key: 'requester_name', label: 'Requester' },
                          { key: 'status', label: 'Status' },
                          { key: 'request_date', label: 'Request Date', hiddenClass: 'hidden md:table-cell' },
                          { key: 'notes', label: 'Notes', hiddenClass: 'hidden lg:table-cell' },
                          { key: 'approved_by_role', label: 'DH Approved By', hiddenClass: 'hidden xl:table-cell', isSortable: false },
                          { key: 'last_action_by', label: 'Last Action By', hiddenClass: 'hidden xl:table-cell', isSortable: false },
                          { key: 'response_date', label: 'Last Action Date', hiddenClass: 'hidden lg:table-cell' },
                        ].map(({ key, label, hiddenClass, isSortable = true }) => (
                          <th
                            key={key}
                            className={`py-3.5 px-4 text-left font-semibold ${isSortable ? 'cursor-pointer' : ''} ${hiddenClass || ''}`}
                            onClick={() => isSortable && requestSort(key)}
                          >
                            <div className="flex items-center gap-1">
                              {label}
                              {isSortable && getSortIcon(key)}
                            </div>
                          </th>
                        ))}
                        {canApproveRejectFulfill && <th className="py-3.5 px-4 text-center font-semibold">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className={`${darkMode ? 'divide-y divide-slate-700' : 'divide-y divide-slate-200'}`}>
                      {processedOrders.paginatedOrders.map((order) => {
                          const isActionDisabled = (order.status !== 'Pending' && order.status !== 'DepartmentApproved') ||
                                                   (currentUser?.id === order.requester_id);
                          
                          const showDHButtons = currentUser?.role === 'DepartmentHead' && order.status === 'Pending';

                          return (
                            <tr key={order.id} className={`${darkMode ? 'hover:bg-slate-600/60' : 'hover:bg-slate-50/70'} transition-colors duration-150`}>
                              <td className={`py-3 px-4 font-medium ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{order.item_name}</td>
                              <td className={`py-3 px-4 text-center ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{order.requested_quantity}</td>
                              <td className={`py-3 px-4 text-center ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                                {order.current_stock !== undefined ? order.current_stock : 'N/A'}
                              </td>
                              <td className={`py-3 px-4 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                {order.requester_name}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(order.status)}`}>
                                  {order.status}
                                </span>
                              </td>
                              <td className={`py-3 px-4 hidden md:table-cell ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                {formatTimeAgo(order.request_date)}
                              </td>
                              <td className={`py-3 px-4 hidden lg:table-cell ${darkMode ? 'text-slate-400' : 'text-slate-500'} italic max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap`} title={order.notes || order.admin_notes}>
                                {order.notes || order.admin_notes || 'No notes'}
                              </td>
                              <td className={`py-3 px-4 hidden xl:table-cell ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                {order.status === 'DepartmentApproved' && order.approved_by_name && order.approved_by_role === 'DepartmentHead'
                                    ? `${order.approved_by_name} (DH)`
                                    : 'N/A'}
                              </td>
                              <td className={`py-3 px-4 hidden xl:table-cell ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                {order.approved_by_name && order.approved_by_role !== 'DepartmentHead'
                                    ? `${order.approved_by_name} (${order.approved_by_role})`
                                    : order.rejected_by_name && order.rejected_by_role
                                        ? `${order.rejected_by_name} (${order.rejected_by_role})`
                                        : order.fulfilled_by_name && order.fulfilled_by_role
                                            ? `${order.fulfilled_by_name} (${order.fulfilled_by_role})`
                                            : 'N/A'}
                              </td>
                              <td className={`py-3 px-4 hidden lg:table-cell ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                {order.response_date ? formatTimeAgo(order.response_date) : 'N/A'}
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
                                        {showDHButtons && ( // Only show Approve/Reject if it's a DH and status is Pending
                                          <>
                                            <button
                                              onClick={() => { handleUpdateStatus(order, 'DepartmentApproved'); setActiveActionMenuId(null); }}
                                              className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-2.5 transition-colors
                                                          ${darkMode ? 'text-slate-200 hover:bg-indigo-600 hover:text-white' : 'text-slate-700 hover:bg-indigo-100 hover:text-indigo-700'}
                                                          ${isActionDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                              disabled={isActionDisabled}
                                            >
                                              <MdThumbUp className="text-base"/> Approve
                                            </button>
                                            <button
                                              onClick={() => { handleUpdateStatus(order, 'Rejected'); setActiveActionMenuId(null); }}
                                              className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-2.5 transition-colors
                                                          ${darkMode ? 'text-red-400 hover:bg-red-600 hover:text-white' : 'text-red-600 hover:bg-red-100 hover:text-red-700'}
                                                          ${isActionDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                              disabled={isActionDisabled}
                                            >
                                              <MdThumbDown className="text-base"/> Reject
                                            </button>
                                            <div className={`my-1.5 h-px ${darkMode ? 'bg-slate-600' : 'bg-slate-200'}`}></div> {/* Separator */}
                                          </>
                                        )}
                                        <button
                                          onClick={() => handleViewDetails(order)}
                                          className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-2.5 transition-colors
                                                      ${darkMode ? 'text-blue-400 hover:bg-blue-600 hover:text-white' : 'text-blue-600 hover:bg-blue-100 hover:text-blue-700'}`}
                                        >
                                          <MdInfo className="text-base"/> Details
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </td>
                              )}
                            </tr>
                          );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className={`flex justify-between items-center px-4 py-3 border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                  <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Showing {processedOrders.paginatedOrders.length > 0 ? processedOrders.indexOfFirstOrder + 1 : 0} to {Math.min(processedOrders.indexOfLastOrder, processedOrders.totalCount)} of {processedOrders.totalCount} requests
                  </span>
                  <nav className="relative z-0 inline-flex shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(prev => prev - 1)}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium
                        ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}
                        ${currentPage === 1 && 'opacity-50 cursor-not-allowed'}`}
                    >
                      Previous
                    </button>
                    {Array.from({ length: processedOrders.totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        aria-current={currentPage === page ? 'page' : undefined}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium
                          ${currentPage === page
                            ? (darkMode ? 'bg-indigo-600 text-white' : 'bg-indigo-500 text-white')
                            : (darkMode ? 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50')
                          }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      disabled={currentPage === processedOrders.totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium
                        ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}
                        ${currentPage === processedOrders.totalPages && 'opacity-50 cursor-not-allowed'}`}
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Order Details Modal */}
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
};

export default DepartmentPage;
import React, { useState, useContext, useEffect, useCallback, useRef, useMemo } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext'; // To get currentUser and their department
import Swal from 'sweetalert2';
import axios from "axios";
import Layout from "./Layout/Layout"; // Path to Layout
import LoadingSpinner from "./LoadingSpinner"; // Path to LoadingSpinner

// Icons
import {
  MdHistory, MdSort, MdArrowUpward, MdArrowDownward, MdMoreVert, MdClose, MdInfo,
  MdCheckCircleOutline, MdCancel, MdThumbUp, MdThumbDown // New icons for approve/reject
} from 'react-icons/md';

const API_BASE_URL = "http://localhost:3000";

// Helper for date formatting (re-used from OrderHistory)
const formatTimeAgo = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return `${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minutes ago`;
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
  const { currentUser, isLoadingAuth } = useAuth(); // Get current user's info

  const [departmentOrders, setDepartmentOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [processingOrderId, setProcessingOrderId] = useState(null); // To disable buttons during API call

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('Pending'); // Default to showing only pending
  const [sortBy, setSortBy] = useState('request_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(10);

  const [activeActionMenuId, setActiveActionMenuId] = useState(null);
  const actionMenuRef = useRef(null);

  const [viewingOrderDetails, setViewingOrderDetails] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [orderToReject, setOrderToReject] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');


  // Define allowed roles for this page
  const allowedRolesForPage = useMemo(() => ['Admin', 'DepartmentHead', 'StockManager'], []);

  // Fetch orders specific to the department
  const fetchDepartmentOrders = useCallback(async () => {
    setIsLoadingOrders(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        Swal.fire('Authentication Error', 'No token found. Please log in again.', 'error');
        setIsLoadingOrders(false);
        return;
      }
      if (!currentUser?.department_name) { // Ensure department head has a department
        console.warn("Department Head's department not found. Cannot fetch specific orders.");
        setDepartmentOrders([]);
        setIsLoadingOrders(false);
        return;
      }

      // Modify this API call to fetch orders for the current user's department.
      // Option 1: Backend filters based on current user's token/role (most secure/common)
      const response = await axios.get(`${API_BASE_URL}/api/orders/department-requests`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Option 2 (Less secure, but for illustration): Pass department name as a query param or path param
      // const response = await axios.get(`${API_BASE_URL}/api/orders?department=${currentUser.department_name}`, { ... });

      const sortedOrders = response.data.sort((a, b) => new Date(b.request_date) - new Date(a.request_date));
      setDepartmentOrders(sortedOrders);
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
  }, [currentUser]); // Re-fetch if currentUser changes (e.g., department info loads)

  useEffect(() => {
    if (!isLoadingAuth && currentUser && allowedRolesForPage.includes(currentUser.role)) {
      fetchDepartmentOrders();
    } else if (!isLoadingAuth && (!currentUser || !allowedRolesForPage.includes(currentUser.role))) {
      setIsLoadingOrders(false);
    }
  }, [currentUser, isLoadingAuth, fetchDepartmentOrders, allowedRolesForPage]);

  // Click outside handler for action menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
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

  // --- Filter, Sort, Paginate Logic ---
  const filteredAndSortedOrders = useMemo(() => {
    let tempOrders = [...departmentOrders];

    // 1. Filter by search term
    if (searchTerm) {
      tempOrders = tempOrders.filter(order =>
        order.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.requester_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.status.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 2. Filter by status
    if (selectedStatusFilter && selectedStatusFilter !== 'All') {
      tempOrders = tempOrders.filter(order => order.status === selectedStatusFilter);
    }

    // 3. Sort
    tempOrders.sort((a, b) => {
      const aValue = String(a[sortBy] || '').toLowerCase();
      const bValue = String(b[sortBy] || '').toLowerCase();

      if (sortBy === 'request_date' || sortBy === 'action_date') {
        const dateA = new Date(a[sortBy]);
        const dateB = new Date(b[sortBy]);
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      } else {
        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      }
    });

    return tempOrders;
  }, [departmentOrders, searchTerm, selectedStatusFilter, sortBy, sortOrder]);

  // 4. Paginate
  const totalPages = Math.ceil(filteredAndSortedOrders.length / ordersPerPage);
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredAndSortedOrders.slice(indexOfFirstOrder, indexOfLastOrder);

  // --- Pagination Handlers ---
  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
    setActiveActionMenuId(null);
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleViewDetails = (order) => {
    setViewingOrderDetails(order);
    setActiveActionMenuId(null);
  };

  const closeDetailsModal = () => {
    setViewingOrderDetails(null);
  };

  // --- Order Approval/Rejection Logic ---
  const handleApproveOrder = async (orderId, requesterName) => {
    setActiveActionMenuId(null);
    setProcessingOrderId(orderId); // Set processing state for this order

    const result = await Swal.fire({
      title: 'Approve Request?',
      text: `Are you sure you want to approve this request from ${requesterName}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, Approve'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found.');

        // Assuming a PUT endpoint for approval
        await axios.put(`${API_BASE_URL}/api/orders/${orderId}/approve`,
          { approved_by: currentUser.fullname }, // Send who approved it
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Swal.fire('Approved!', 'The request has been approved.', 'success');
        fetchDepartmentOrders(); // Refresh orders
      } catch (error) {
        Swal.fire('Error', error.response?.data?.message || error.message || 'Failed to approve request.', 'error');
      } finally {
        setProcessingOrderId(null);
      }
    } else {
      setProcessingOrderId(null); // Clear processing state if cancelled
    }
  };

  const handleRejectOrderInitiate = (order) => {
    setActiveActionMenuId(null);
    setOrderToReject(order);
    setRejectionReason(''); // Clear previous reason
    setShowRejectModal(true);
  };

  const handleRejectOrderConfirm = async () => {
    if (!rejectionReason.trim()) {
      Swal.fire('Input Required', 'Please provide a reason for rejection.', 'warning');
      return;
    }
    if (!orderToReject) return;

    setProcessingOrderId(orderToReject.id);
    setShowRejectModal(false); // Close the input modal

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token not found.');

      // Assuming a PUT endpoint for rejection
      await axios.put(`${API_BASE_URL}/api/orders/${orderToReject.id}/reject`,
        { rejected_by: currentUser.fullname, rejection_reason: rejectionReason.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Swal.fire('Rejected!', 'The request has been rejected.', 'success');
      fetchDepartmentOrders(); // Refresh orders
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || error.message || 'Failed to reject request.', 'error');
    } finally {
      setProcessingOrderId(null);
      setOrderToReject(null);
      setRejectionReason('');
    }
  };

  // Common Tailwind classes
  const inputBaseClass = `w-full px-3 py-2 rounded-md border text-sm transition-colors duration-150 focus:ring-2 focus-visible:outline-none ${
    darkMode
      ? 'bg-slate-700 border-slate-600 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400 text-slate-100'
      : 'bg-white border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400 text-slate-800'
  }`;

  const buttonBaseClass = "px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center gap-1.5";


  // --- Access Denied Block ---
  if (isLoadingAuth) {
    return (
      <div className={`flex h-screen items-center justify-center ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!currentUser || !allowedRolesForPage.includes(currentUser.role)) {
    return (
      <Layout>
        <div className={`flex-1 flex flex-col items-center justify-center p-6 ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
          <h1 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>Access Denied</h1>
          <p className={`${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>You do not have permission to view this page.</p>
        </div>
      </Layout>
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
                className={`${inputBaseClass} text-sm`}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Status:</span>
              <select
                value={selectedStatusFilter}
                onChange={(e) => { setSelectedStatusFilter(e.target.value); setCurrentPage(1); }}
                className={`${inputBaseClass} w-auto text-sm p-1.5`}
              >
                <option value="Pending">Pending</option> {/* Default to pending */}
                <option value="All">All</option>
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
                className={`${inputBaseClass} w-auto text-sm p-1.5`}
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
            ) : filteredAndSortedOrders.length === 0 ? (
              <div className={`p-10 text-center ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                <MdHistory size={48} className="mx-auto mb-3 opacity-70"/>
                <p className="font-medium text-lg">No order requests found for your department.</p>
                <p className="text-sm">Check back later or adjust your filters.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className={`${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                      <tr>
                        {[
                          { key: 'item_name', label: 'Item' },
                          { key: 'requested_quantity', label: 'Qty' },
                          { key: 'requester_name', label: 'Requester' },
                          { key: 'status', label: 'Status' },
                          { key: 'request_date', label: 'Request Date', hiddenClass: 'hidden md:table-cell' },
                          { key: 'notes', label: 'Notes', hiddenClass: 'hidden lg:table-cell' },
                        ].map(({ key, label, hiddenClass }) => (
                          <th
                            key={key}
                            className={`py-3 px-4 text-left text-xs uppercase font-semibold cursor-pointer ${hiddenClass || ''}`}
                            onClick={() => handleSort(key)}
                          >
                            <div className="flex items-center gap-1">
                              {label}
                              {sortBy === key && (
                                sortOrder === 'asc' ? <MdArrowUpward size={16} /> : <MdArrowDownward size={16} />
                              )}
                              {sortBy !== key && <MdSort size={16} className="text-slate-400 opacity-50"/>}
                            </div>
                          </th>
                        ))}
                        <th className="py-3 px-4 text-center text-xs uppercase font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className={`${darkMode ? 'divide-y divide-slate-700' : 'divide-y divide-slate-200'}`}>
                      {currentOrders.map((order) => {
                          // Determine if actions should be disabled (not pending, or is self-request)
                          const isActionDisabled = order.status !== 'Pending' ||
                                                   (currentUser?.id === order.requester_id) || // Department Head cannot approve/reject their own request
                                                   (processingOrderId === order.id); // Disable if currently processing this order
                          
                          return (
                            <tr key={order.id} className={`${darkMode ? 'hover:bg-slate-700/60' : 'hover:bg-slate-50/70'}`}>
                              <td className={`py-3 px-4 font-medium ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{order.item_name}</td>
                              <td className={`py-3 px-4 text-center ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{order.requested_quantity}</td>
                              <td className={`py-3 px-4 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{order.requester_name}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  order.status === 'Approved' ? (darkMode ? 'bg-green-500/30 text-green-300' : 'bg-green-100 text-green-700')
                                  : order.status === 'Rejected' ? (darkMode ? 'bg-red-500/30 text-red-300' : 'bg-red-100 text-red-700')
                                  : order.status === 'Pending' ? (darkMode ? 'bg-yellow-500/30 text-yellow-300' : 'bg-yellow-100 text-yellow-700')
                                  : order.status === 'Fulfilled' ? (darkMode ? 'bg-blue-500/30 text-blue-300' : 'bg-blue-100 text-blue-700')
                                  : (darkMode ? 'bg-slate-600/30 text-slate-300' : 'bg-slate-200 text-slate-600')
                                }`}>
                                  {order.status}
                                </span>
                              </td>
                              <td className={`py-3 px-4 hidden md:table-cell ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{formatTimeAgo(order.request_date)}</td>
                              <td className={`py-3 px-4 hidden lg:table-cell ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{order.notes || 'N/A'}</td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-1 sm:gap-2 justify-center relative">
                                  {isActionDisabled && order.status === 'Pending' && currentUser?.id === order.requester_id && (
                                      <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-600'} italic`}>Self-request</span>
                                  )}
                                  {isActionDisabled && order.status !== 'Pending' && (
                                      <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-600'} italic`}>Processed</span>
                                  )}
                                  <button
                                    onClick={() => setActiveActionMenuId(activeActionMenuId === order.id ? null : order.id)}
                                    className={`p-2 rounded-full transition-colors ${darkMode ? 'text-slate-400 hover:bg-slate-600 hover:text-slate-100' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-700'} ${isActionDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    aria-label={`Actions-for-${order.id}`}
                                    disabled={isActionDisabled}
                                  >
                                    <MdMoreVert size={20} />
                                  </button>
                                  {activeActionMenuId === order.id && (
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
                                        <MdClose className="text-xl" />
                                      </button>
                                      <div className="p-1.5 pt-7">
                                        <button
                                          onClick={() => handleApproveOrder(order.id, order.requester_name)}
                                          className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-2.5 transition-colors
                                                      ${darkMode ? 'text-green-400 hover:bg-green-600 hover:text-white' : 'text-green-600 hover:bg-green-100 hover:text-green-700'}`}
                                          disabled={isActionDisabled}
                                        >
                                          <MdThumbUp className="text-base"/> Approve
                                        </button>
                                        <button
                                          onClick={() => handleRejectOrderInitiate(order)}
                                          className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-2.5 transition-colors
                                                      ${darkMode ? 'text-red-400 hover:bg-red-600 hover:text-white' : 'text-red-600 hover:bg-red-100 hover:text-red-700'}`}
                                          disabled={isActionDisabled}
                                        >
                                          <MdThumbDown className="text-base"/> Reject
                                        </button>
                                        <div className={`my-1.5 h-px ${darkMode ? 'bg-slate-600' : 'bg-slate-200'}`}></div>
                                        <button
                                          onClick={() => handleViewDetails(order)}
                                          className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-2.5 transition-colors
                                                      ${darkMode ? 'text-slate-200 hover:bg-blue-600 hover:text-white' : 'text-slate-700 hover:bg-blue-100 hover:text-blue-700'}`}
                                        >
                                          <MdInfo className="text-base"/> View Details
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className={`flex justify-between items-center px-4 py-3 border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                  <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Showing {indexOfFirstOrder + 1} to {Math.min(indexOfLastOrder, filteredAndSortedOrders.length)} of {filteredAndSortedOrders.length} requests
                  </span>
                  <nav className="relative z-0 inline-flex shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium
                        ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}
                        ${currentPage === 1 && 'opacity-50 cursor-not-allowed'}`}
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
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
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium
                        ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}
                        ${currentPage === totalPages && 'opacity-50 cursor-not-allowed'}`}
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

      {/* Order Details Modal (re-used from OrderHistory) */}
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
              <p><strong>Status:</strong> <span className={`font-semibold ${
                  viewingOrderDetails.status === 'Approved' ? (darkMode ? 'text-green-300' : 'text-green-700')
                  : viewingOrderDetails.status === 'Rejected' ? (darkMode ? 'text-red-300' : 'text-red-700')
                  : viewingOrderDetails.status === 'Pending' ? (darkMode ? 'text-yellow-300' : 'text-yellow-700')
                  : viewingOrderDetails.status === 'Fulfilled' ? (darkMode ? 'text-blue-300' : 'text-blue-700')
                  : (darkMode ? 'text-slate-300' : 'text-slate-600')
                }`}>{viewingOrderDetails.status}</span>
              </p>
              <p><strong>Requested On:</strong> {formatFullDate(viewingOrderDetails.request_date)}</p>
              {viewingOrderDetails.action_date && <p><strong>Last Action On:</strong> {formatFullDate(viewingOrderDetails.action_date)}</p>}
              {viewingOrderDetails.approved_by && <p><strong>Approved By:</strong> {viewingOrderDetails.approved_by}</p>}
              {viewingOrderDetails.rejected_by && <p><strong>Rejected By:</strong> {viewingOrderDetails.rejected_by}</p>}
              {viewingOrderDetails.fulfilled_by && <p><strong>Fulfilled By:</strong> {viewingOrderDetails.fulfilled_by}</p>}
              <p><strong>Department:</strong> {viewingOrderDetails.requester_department || 'N/A'}</p> {/* Display department */}
              {viewingOrderDetails.notes && <p><strong>Notes:</strong> {viewingOrderDetails.notes}</p>}
              
              {viewingOrderDetails.status === 'Rejected' && viewingOrderDetails.rejection_reason && (
                <div className={`mt-4 p-3 rounded-md border ${darkMode ? 'bg-red-900/30 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-800'}`}>
                  <p className="font-semibold flex items-center gap-1"><MdCancel size={18}/> Rejection Reason:</p>
                  <p className="ml-6">{viewingOrderDetails.rejection_reason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Order Reason Modal */}
      {showRejectModal && orderToReject && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className={`relative w-full max-w-md rounded-lg shadow-xl p-6 ${darkMode ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-800'}`}>
            <h3 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
              <MdThumbDown /> Reject Order
            </h3>
            <button
              onClick={() => { setShowRejectModal(false); setOrderToReject(null); setRejectionReason(''); }}
              className={`absolute top-4 right-4 p-1.5 rounded-full hover:opacity-70 ${darkMode ? 'text-slate-300' : 'text-gray-500'}`}
              aria-label="Close rejection modal"
            >
              <MdClose className="text-xl" />
            </button>

            <p className="mb-4 text-sm">
              Please provide a reason for rejecting the request for <strong>{orderToReject.item_name}</strong> by <strong>{orderToReject.requester_name}</strong>.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className={`${inputBaseClass} h-28 resize-y`}
              placeholder="e.g., Not enough stock, incorrect item requested, budget constraints..."
            ></textarea>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowRejectModal(false); setOrderToReject(null); setRejectionReason(''); }}
                className={`${buttonBaseClass} ${darkMode ? 'bg-slate-600 hover:bg-slate-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
              >
                Cancel
              </button>
              <button
                onClick={handleRejectOrderConfirm}
                className={`${buttonBaseClass} ${darkMode ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                disabled={!rejectionReason.trim()}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default DepartmentPage;
import React, { useState, useContext, useEffect, useCallback, useRef, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { ThemeContext } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import Swal from 'sweetalert2';
import axios from "axios";
import Layout from "../Layout/Layout";
 // Adjust the path as necessary
import LoadingSpinner from "../LoadingSpinner";

// Icons
import {
  MdDashboard, MdInventory, MdAddBox, MdList, MdAssessment, MdSettings, MdSchool,
  MdPeople, MdShoppingCart, MdAssignmentTurnedIn, MdHistory,
  MdSort, MdArrowUpward, MdArrowDownward, MdMoreVert, MdClose, MdInfo, MdCheckCircle, MdError
} from 'react-icons/md';

const API_BASE_URL = "http://localhost:3000";

// Helper for date formatting
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

const OrderHistory = () => {
  const { darkMode } = useContext(ThemeContext);
  const { currentUser, isLoadingAuth } = useAuth();

  const [allOrders, setAllOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState(''); // 'All', 'Pending', 'Approved', 'Rejected', 'Fulfilled', 'Cancelled'
  const [sortBy, setSortBy] = useState('request_date');
  const [sortOrder, setSortOrder] = useState('desc'); // Newest first
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(10);

  const [activeActionMenuId, setActiveActionMenuId] = useState(null);
  const actionMenuRef = useRef(null);

  const [viewingOrderDetails, setViewingOrderDetails] = useState(null); // Stores the order object for detailed view

  const allowedRolesToView = useMemo(() => ['Admin', 'Staff', 'DepartmentHead', 'StockManager'], []);

  const fetchOrders = useCallback(async () => {
    setIsLoadingOrders(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        Swal.fire('Authentication Error', 'No token found. Please log in again.', 'error');
        setIsLoadingOrders(false);
        return;
      }
      const response = await axios.get(`${API_BASE_URL}/api/orders`, { // Assuming this endpoint gives all orders
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Sort orders by request_date by default, newest first
      const sortedOrders = response.data.sort((a, b) => new Date(b.request_date) - new Date(a.request_date));
      setAllOrders(sortedOrders);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      const errorMsg = error.response?.data?.message || error.message || "Could not load order history.";
      Swal.fire({
        title: 'Error Fetching Orders',
        text: errorMsg,
        icon: 'error',
      });
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoadingAuth && currentUser && allowedRolesToView.includes(currentUser.role)) {
      fetchOrders();
    } else if (!isLoadingAuth && (!currentUser || !allowedRolesToView.includes(currentUser.role))) {
      setIsLoadingOrders(false);
    }
  }, [currentUser, isLoadingAuth, fetchOrders, allowedRolesToView]);

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

  const filteredAndSortedOrders = useMemo(() => {
    let tempOrders = [...allOrders];

    // 1. Filter by search term
    if (searchTerm) {
      tempOrders = tempOrders.filter(order =>
        order.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.requester_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.rejection_reason && order.rejection_reason.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // 2. Filter by status
    if (selectedStatusFilter && selectedStatusFilter !== 'All') {
      tempOrders = tempOrders.filter(order => order.status === selectedStatusFilter);
    }

    // 3. Sort
    tempOrders.sort((a, b) => {
      const aValue = String(a[sortBy] || '').toLowerCase(); // Handle null/undefined values
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
  }, [allOrders, searchTerm, selectedStatusFilter, sortBy, sortOrder]);

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

  const inputBaseClass = `w-full px-3 py-2 rounded-md border text-sm transition-colors duration-150 focus:ring-2 focus-visible:outline-none ${
    darkMode
      ? 'bg-slate-700 border-slate-600 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400 text-slate-100'
      : 'bg-white border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400 text-slate-800'
  }`;

  const buttonBaseClass = "px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center gap-1.5";

  if (isLoadingAuth) {
    return (
      <div className={`flex h-screen items-center justify-center ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!currentUser || !allowedRolesToView.includes(currentUser.role)) {
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
            Order History
          </h2>
          {/* Optional: Add a button here if there's a specific action for the overall history page */}
        </header>

        <main className="flex-1 p-6 pt-[104px] ml-[250px] overflow-y-auto max-w-full">
          {/* Search, Filter & Pagination Controls */}
          <div className={`mb-4 p-4 rounded-lg shadow-md flex flex-wrap gap-4 items-center justify-between ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}`}>
            <div className="flex-1 min-w-[200px] max-w-md">
              <label htmlFor="search" className="sr-only">Search orders</label>
              <input
                id="search"
                type="text"
                placeholder="Search by item, requester, status..."
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
                <option value="">All</option>
                <option value="Pending">Pending</option>
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
                <p className={`mt-3 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Loading order history...</p>
              </div>
            ) : filteredAndSortedOrders.length === 0 ? (
              <div className={`p-10 text-center ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                <MdHistory size={48} className="mx-auto mb-3 opacity-70"/>
                <p className="font-medium text-lg">No order history found.</p>
                <p className="text-sm">Try adjusting your filters or check back later.</p>
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
                          { key: 'requester_name', label: 'Requester', hiddenClass: 'hidden sm:table-cell' },
                          { key: 'status', label: 'Status' },
                          { key: 'request_date', label: 'Request Date', hiddenClass: 'hidden md:table-cell' },
                          { key: 'action_date', label: 'Last Action Date', hiddenClass: 'hidden lg:table-cell' },
                          { key: 'approved_by', label: 'Handled By', hiddenClass: 'hidden xl:table-cell' },
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
                        <th className="py-3 px-4 text-center text-xs uppercase font-semibold">Details</th>
                      </tr>
                    </thead>
                    <tbody className={`${darkMode ? 'divide-y divide-slate-700' : 'divide-y divide-slate-200'}`}>
                      {currentOrders.map((order) => (
                        <tr key={order.id} className={`${darkMode ? 'hover:bg-slate-700/60' : 'hover:bg-slate-50/70'}`}>
                          <td className={`py-3 px-4 font-medium ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{order.item_name}</td>
                          <td className={`py-3 px-4 text-center ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{order.requested_quantity}</td>
                          <td className={`py-3 px-4 hidden sm:table-cell ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{order.requester_name}</td>
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
                          <td className={`py-3 px-4 hidden lg:table-cell ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{order.action_date ? formatTimeAgo(order.action_date) : 'N/A'}</td>
                          <td className={`py-3 px-4 hidden xl:table-cell ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{order.approved_by || order.rejected_by || order.fulfilled_by || 'N/A'}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center relative">
                              <button
                                onClick={() => setActiveActionMenuId(activeActionMenuId === order.id ? null : order.id)}
                                className={`p-2 rounded-full transition-colors ${darkMode ? 'text-slate-400 hover:bg-slate-600 hover:text-slate-100' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-700'}`}
                                aria-label={`Actions-for-${order.id}`}
                              >
                                <MdMoreVert size={20} />
                              </button>
                              {activeActionMenuId === order.id && (
                                <div
                                  ref={actionMenuRef}
                                  className={`absolute right-full mr-2.5 top-1/2 -translate-y-1/2 w-40 rounded-md shadow-xl z-20
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
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className={`flex justify-between items-center px-4 py-3 border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                  <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Showing {indexOfFirstOrder + 1} to {Math.min(indexOfLastOrder, filteredAndSortedOrders.length)} of {filteredAndSortedOrders.length} orders
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

      {/* Order Details Modal/Drawer */}
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
              {viewingOrderDetails.notes && <p><strong>Notes:</strong> {viewingOrderDetails.notes}</p>}
              
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

export default OrderHistory;
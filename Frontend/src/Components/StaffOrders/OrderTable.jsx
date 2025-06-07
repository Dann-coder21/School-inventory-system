// src/components/StaffOrders/OrderTable/OrderTable.jsx
import React, { useContext, useEffect, useState, useMemo } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useOrders } from '../../contexts/OrderContext'; // Use OrderContext for fetching orders
import LoadingSpinner from '../LoadingSpinner';
import { MdHistory, MdFilterList, MdSort, MdCheckCircleOutline, MdClose, MdInfoOutline, MdWarningAmber, MdArrowDownward } from 'react-icons/md';
import Swal from 'sweetalert2';
import axios from 'axios';

// Helper for time ago (copy from Dashboard)
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

const OrderTable = () => {
  const { darkMode } = useContext(ThemeContext);
  const { currentUser } = useAuth();
  const { orders, loadingOrders, ordersError, fetchOrders } = useOrders(); // Consume from OrderContext

  const [filterStatus, setFilterStatus] = useState('All');
  const [sortConfig, setSortConfig] = useState({ key: 'request_date', direction: 'descending' });

  // Permissions for action buttons
  const canApproveRejectFulfill = useMemo(() => {
    const allowedRoles = ['Admin', 'DepartmentHead', 'StockManager'];
    return allowedRoles.includes(currentUser?.role);
  }, [currentUser?.role]);

  useEffect(() => {
    // Fetch orders when component mounts or permissions/auth state changes
    if (currentUser) { // Only fetch if user is logged in
      fetchOrders();
    }
  }, [currentUser, fetchOrders]);


  const filteredAndSortedOrders = useMemo(() => {
    let sortableOrders = [...orders];

    // Filter
    if (filterStatus !== 'All') {
      sortableOrders = sortableOrders.filter(order => order.status === filterStatus);
    }

    // Sort
    if (sortConfig.key) {
      sortableOrders.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];

        if (sortConfig.key === 'request_date' || sortConfig.key === 'response_date') {
          valA = new Date(valA);
          valB = new Date(valB);
        } else if (typeof valA === 'string' && typeof valB === 'string') {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
        } else if (typeof valA === 'number' && typeof valB === 'number') {
            // No need to change
        } else { // Handle nulls or undefined values gracefully
            if (valA == null) return sortConfig.direction === 'ascending' ? 1 : -1;
            if (valB == null) return sortConfig.direction === 'ascending' ? -1 : 1;
        }

        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableOrders;
  }, [orders, filterStatus, sortConfig]);

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
      case 'Approved': return darkMode ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700';
      case 'Fulfilled': return darkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700';
      case 'Rejected': return darkMode ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700';
      default: return darkMode ? 'bg-slate-600 text-slate-300' : 'bg-slate-200 text-slate-600';
    }
  };

  const handleUpdateStatus = async (order, newStatus) => {
    if (!canApproveRejectFulfill) return; // Double check permissions

    let titleText = '';
    let confirmText = '';
    let inputOptions = {};
    let showInput = false;
    let icon = 'info';

    switch (newStatus) {
      case 'Approved':
        titleText = `Approve Request for "${order.item_name}"?`;
        confirmText = 'Yes, Approve';
        icon = 'question';
        break;
      case 'Rejected':
        titleText = `Reject Request for "${order.item_name}"?`;
        confirmText = 'Yes, Reject';
        showInput = true;
        inputOptions = {
            'low_stock': 'Low Stock',
            'not_available': 'Item Not Available',
            'reason_misc': 'Other Reason (specify below)'
        };
        icon = 'warning';
        break;
      case 'Fulfilled':
        titleText = `Fulfill Request for "${order.item_name}"?`;
        confirmText = 'Yes, Fulfill';
        showInput = true;
        inputOptions = {
            'full': `Full Amount (${order.requested_quantity})`,
            'partial': 'Partial Amount (specify below)'
        };
        icon = 'success';
        break;
      default:
        return;
    }

    const { value: formValues } = await Swal.fire({
      title: titleText,
      html: showInput ? `
        <div class="flex flex-col gap-3 p-4">
          <label class="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300 text-left">Reason/Quantity:</label>
          <select id="swal-input1" class="swal2-input border rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100">
            ${Object.entries(inputOptions).map(([key, value]) => `<option value="${key}">${value}</option>`).join('')}
          </select>
          <input id="swal-input2" class="swal2-input border rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100" placeholder="Details (e.g., specific reason, partial quantity)">
        </div>
      ` : null,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: confirmText,
      preConfirm: showInput ? () => {
          const selectValue = document.getElementById('swal-input1').value;
          const textValue = document.getElementById('swal-input2').value;
          return { selectValue, textValue };
      } : undefined,
      background: darkMode ? '#1e293b' : '#ffffff',
      color: darkMode ? '#e2e8f0' : '#1e293b',
      confirmButtonColor: darkMode ? '#4f46e5' : '#6366f1',
      cancelButtonColor: darkMode ? '#64748b' : '#cbd5e1',
      customClass: {
          popup: 'rounded-xl shadow-2xl p-4 sm:p-6',
          confirmButton: 'px-5 py-2.5 rounded-lg font-semibold text-white text-sm',
          cancelButton: 'px-5 py-2.5 rounded-lg font-semibold text-sm',
          title: `text-lg sm:text-xl font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`,
          htmlContainer: `text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`,
          icon: 'text-4xl sm:text-5xl mt-2 mb-2 sm:mb-4',
      },
      buttonsStyling: false,
      icon: icon // Set icon dynamically
    });

    if (formValues) {
      let fulfilledQuantity = 0;
      let adminNotes = '';

      if (newStatus === 'Fulfilled') {
          if (formValues.selectValue === 'full') {
              fulfilledQuantity = order.requested_quantity;
          } else if (formValues.selectValue === 'partial') {
              const parsedQty = Number(formValues.textValue);
              if (isNaN(parsedQty) || parsedQty <= 0 || parsedQty > order.requested_quantity) {
                  Swal.fire('Error', 'Invalid partial quantity.', 'error');
                  return;
              }
              fulfilledQuantity = parsedQty;
          }
      } else { // Rejected
          adminNotes = formValues.selectValue + (formValues.textValue ? `: ${formValues.textValue}` : '');
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found.');

        const payload = {
          status: newStatus,
          fulfilled_quantity: fulfilledQuantity,
          admin_notes: adminNotes,
        };

        const response = await axios.put(`http://localhost:3000/api/orders/${order.id}/status`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.status === 200) {
            Swal.fire('Success', `Request ${newStatus}!`, 'success');
            fetchOrders(); // Refresh orders after update
        } else {
            throw new Error(response.data.message || 'Failed to update request.');
        }

      } catch (err) {
        console.error("Error updating request status:", err);
        Swal.fire('Error', err.response?.data?.message || err.message || 'Failed to update request.', 'error');
      }
    }
  };


  if (loadingOrders) {
    return (
      <div className={`flex justify-center items-center min-h-[300px] rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
        <LoadingSpinner />
      </div>
    );
  }

  if (ordersError) {
    return (
      <div className={`text-center p-8 rounded-xl shadow-md ${darkMode ? 'bg-slate-800 text-red-400' : 'bg-white text-red-600'}`}>
        <MdWarningAmber size={52} className="mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Error Loading Requests</h3>
        <p className="text-sm">{ordersError.message || "Could not fetch order requests. Please try again."}</p>
        <button onClick={fetchOrders} className="mt-4 px-4 py-2 rounded-md bg-indigo-500 text-white">Retry</button>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-xl shadow-lg ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}`}>
      <h3 className={`text-xl font-semibold mb-6 flex items-center gap-3 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
        <MdHistory className="text-2xl text-purple-500" /> Item Request History
      </h3>

      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
        <div className="w-full sm:w-auto">
          <label htmlFor="filterStatus" className={`sr-only ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Filter by Status</label>
          <select
            id="filterStatus"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`w-full px-3 py-2 rounded-md border text-sm transition-colors duration-150 focus:ring-2 focus-visible:outline-none ${
              darkMode ? 'bg-slate-700 border-slate-600 focus:ring-indigo-500 text-slate-100' : 'bg-white border-slate-300 focus:ring-indigo-500 text-slate-800'
            }`}
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Fulfilled">Fulfilled</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {filteredAndSortedOrders.length === 0 ? (
        <div className={`text-center py-10 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          <MdInfoOutline size={48} className="mx-auto mb-3" />
          <p className="font-medium">No item requests found for this filter.</p>
          <p className="text-sm">Try adjusting your filters or submit a new request!</p>
        </div>
      ) : (
        <div className={`rounded-lg shadow-xl overflow-hidden ${darkMode ? 'bg-slate-700 border border-slate-600' : 'bg-white border border-slate-200'}`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
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
                  <th className="py-3.5 px-4 text-left font-semibold cursor-pointer" onClick={() => requestSort('request_date')}>
                    Date {getSortIcon('request_date')}
                  </th>
                  <th className="py-3.5 px-4 text-left font-semibold cursor-pointer" onClick={() => requestSort('status')}>
                    Status {getSortIcon('status')}
                  </th>
                  <th className="py-3.5 px-4 text-left font-semibold">Notes</th>
                  {canApproveRejectFulfill && <th className="py-3.5 px-4 text-center font-semibold">Actions</th>}
                </tr>
              </thead>
              <tbody className={`${darkMode ? 'divide-y divide-slate-700' : 'divide-y divide-slate-200'}`}>
                {filteredAndSortedOrders.map(order => (
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
                    <td className={`py-3 px-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {formatTimeAgo(order.request_date)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusClass(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className={`py-3 px-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'} italic max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap`} title={order.notes || order.admin_notes}>
                      {order.notes || order.admin_notes || 'No notes'}
                    </td>
                    {canApproveRejectFulfill && (
                      <td className="py-3 px-4 text-center">
                        {order.status === 'Pending' ? (
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleUpdateStatus(order, 'Approved')}
                              className={`px-3 py-1 text-xs font-medium rounded-md ${darkMode ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(order, 'Rejected')}
                              className={`px-3 py-1 text-xs font-medium rounded-md ${darkMode ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                            >
                              Reject
                            </button>
                          </div>
                        ) : order.status === 'Approved' && order.current_stock > 0 && order.requested_quantity > order.fulfilled_quantity ? (
                          <button
                            onClick={() => handleUpdateStatus(order, 'Fulfilled')}
                            className={`px-3 py-1 text-xs font-medium rounded-md ${darkMode ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-indigo-500 hover:bg-indigo-600 text-white'}`}
                          >
                            Fulfill
                          </button>
                        ) : (
                          <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                              {order.status === 'Fulfilled' ? `Fulfilled (${order.fulfilled_quantity}/${order.requested_quantity})` : 'No Action'}
                          </span>
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
  );
};

export default OrderTable;
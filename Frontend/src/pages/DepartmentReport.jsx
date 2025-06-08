import React, { useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import Swal from 'sweetalert2';
import axios from 'axios';
import Layout from "../Components/Layout/Layout";
import LoadingSpinner from "../Components/LoadingSpinner";

// Icons
import {
  MdApartment, MdBarChart, MdPeople, MdShoppingCart, MdInfoOutline, MdWarningAmber,
  MdCheckCircle, MdPendingActions, MdLocalShipping, MdThumbDown, MdCancel,
  MdError // Added MdError for rejection reason in modal
} from 'react-icons/md';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const formatKESCurrency = (value) => {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(value || 0);
};

const formatFullDate = (dateString) => {
  if (!dateString) return 'N/A';
  const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const DepartmentReportPage = () => {
  const { darkMode } = useContext(ThemeContext);
  const { currentUser, isLoadingAuth } = useAuth();
  const { departmentId: paramDepartmentId } = useParams(); // Could be numeric ID or department name/slug
  const navigate = useNavigate();

  const [departmentData, setDepartmentData] = useState(null); 
  const [departmentUsers, setDepartmentUsers] = useState([]);
  const [departmentOrders, setDepartmentOrders] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]); // Stores all departments fetched from backend

  const [isLoadingReport, setIsLoadingReport] = useState(true);
  const [reportError, setReportError] = useState(null);

  const allowedReportViewerRoles = useMemo(() => ['DepartmentHead'], []); 

  // SweetAlert2 theme props
  const swalThemeProps = useMemo(() => ({
    background: darkMode ? '#1e293b' : '#ffffff',
    color: darkMode ? '#e2e8f0' : '#1e293b',
    customClass: { popup: 'rounded-xl shadow-2xl p-4 sm:p-6', confirmButton: 'px-5 py-2.5 rounded-lg font-semibold text-white text-sm', title: `text-lg sm:text-xl font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`, htmlContainer: `text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`, icon: 'text-4xl sm:text-5xl mt-2 mb-2 sm:mb-4', }, buttonsStyling: false,
  }), [darkMode]);

  // Main data fetching function
  // This function is now responsible for resolving the department ID correctly.
  const fetchData = useCallback(async () => {
    setIsLoadingReport(true);
    setReportError(null);
    setDepartmentData(null); 
    setDepartmentUsers([]);
    setDepartmentOrders([]);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      // 1. Fetch ALL departments (essential for mapping names/slugs to IDs)
      const departmentsResponse = await axios.get(`${API_BASE_URL}/api/departments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const fetchedDepartments = departmentsResponse.data;
      setAllDepartments(fetchedDepartments); 

      let resolvedNumericDeptId = null;

      // 2. Determine the numeric department ID based on user role and URL parameter
      if (currentUser.role === 'DepartmentHead') {
        if (!currentUser.department_id) {
          throw new Error("Department Head is not assigned to a department. Please contact admin.");
        }
        resolvedNumericDeptId = currentUser.department_id;

        // If DH is trying to access /reports/department/someId, ensure it's their own.
        // Or if the URL param is a name/slug, redirect to their numeric ID.
        if (paramDepartmentId) {
          if (String(paramDepartmentId) === String(resolvedNumericDeptId)) {
            // Already accessing their own numeric ID, no redirect needed
          } else if (isNaN(Number(paramDepartmentId))) { // If paramDepartmentId is a string (name/slug)
            const foundDeptByNameOrSlug = fetchedDepartments.find(d => 
              d.name.toLowerCase() === paramDepartmentId.toLowerCase() || 
              (d.slug && d.slug.toLowerCase() === paramDepartmentId.toLowerCase())
            );
            if (foundDeptByNameOrSlug && String(foundDeptByNameOrSlug.id) === String(resolvedNumericDeptId)) {
              // It's their department, but accessed by name/slug. Redirect to numeric ID.
              navigate(`/reports/department/${resolvedNumericDeptId}`, { replace: true });
              return; // Stop execution here, new render cycle will start
            } else {
              // Attempting to access another department's report by name/slug, or an invalid name/slug for their department
              navigate(`/reports/department/${resolvedNumericDeptId}`, { replace: true }); // Redirect to their own
              return; // Stop execution
            }
          } else { // paramDepartmentId is a numeric ID, but not their own.
            navigate(`/reports/department/${resolvedNumericDeptId}`, { replace: true }); // Redirect to their own
            return; // Stop execution
          }
        } else {
          // No paramDepartmentId in URL (e.g., /reports/department). Redirect to their own numeric ID.
          navigate(`/reports/department/${resolvedNumericDeptId}`, { replace: true });
          return; // Stop execution
        }
      } else {
        // This 'else' block should ideally not be reached if RouteWrapper is working correctly
        // and only DepartmentHeads are allowed on this page.
        throw new Error("Unauthorized access to department reports.");
      }

      // If we reach here, resolvedNumericDeptId holds the valid numeric ID for the current DH.
      if (!resolvedNumericDeptId) {
        setReportError("No valid department ID determined for report.");
        setIsLoadingReport(false);
        return;
      }

      // 3. Fetch the specific department details using the resolved numeric ID
      const selectedDeptDetails = fetchedDepartments.find(d => String(d.id) === String(resolvedNumericDeptId));
      if (!selectedDeptDetails) {
        throw new Error(`Your department (ID: ${resolvedNumericDeptId}) could not be found in the fetched list.`);
      }
      setDepartmentData(selectedDeptDetails);

      // 4. Fetch all users and filter by the resolved department ID
      const usersResponse = await axios.get(`${API_BASE_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const filteredUsers = usersResponse.data.filter(user => String(user.department_id) === String(resolvedNumericDeptId));
      setDepartmentUsers(filteredUsers);

      // 5. Fetch orders specific to the Department Head's department
      // The /api/orders endpoint is designed to filter orders by the requesting user's department_id
      // when the role is DepartmentHead.
      const ordersResponse = await axios.get(`${API_BASE_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Ensure orders are filtered on frontend if backend doesn't precisely filter by requester_department_id for all roles (though it should for DH)
      const relevantOrders = ordersResponse.data.filter(order => String(order.requester_department_id) === String(resolvedNumericDeptId));
      setDepartmentOrders(relevantOrders);

    } catch (err) {
      console.error("Error fetching department report:", err);
      setReportError(err.response?.data?.message || err.message || "Failed to load report data.");
      Swal.fire({
        ...swalThemeProps,
        title: 'Report Error',
        text: err.response?.data?.message || err.message || 'Could not load department report. Please try again.',
        icon: 'error'
      });
    } finally {
      setIsLoadingReport(false);
    }
  }, [currentUser, navigate, paramDepartmentId, swalThemeProps]); // Re-added paramDepartmentId as a dependency

  // Effect to trigger data fetching when currentUser or paramDepartmentId changes
  useEffect(() => {
    if (!isLoadingAuth && currentUser) {
      // Only proceed if currentUser is a DepartmentHead and has a department_id
      if (currentUser.role === 'DepartmentHead' && currentUser.department_id) {
        fetchData(); // Call fetchData without passing param, it resolves internally
      } else {
        // This handles cases where user is logged in but not DH, or DH without department_id.
        // The RouteWrapper in App.js should catch non-DH roles.
        // For DH without department_id, the fetchData will throw an error and set reportError.
        setIsLoadingReport(false);
      }
    }
  }, [isLoadingAuth, currentUser, fetchData]); // fetchData is now a dependency

  // Derived data for report statistics
  const reportStats = useMemo(() => {
    const stats = {
      totalUsers: departmentUsers.length,
      totalRequests: departmentOrders.length,
      statusCounts: {
        Pending: 0,
        DepartmentApproved: 0,
        Approved: 0,
        Fulfilled: 0,
        Rejected: 0,
        Cancelled: 0,
      },
      totalRequestedQuantity: 0,
      totalFulfilledQuantity: 0,
      totalRejectedQuantity: 0,
      topRequestedItems: [],
      totalCostOfFulfilled: 0
    };

    const itemRequestCounts = {}; 

    departmentOrders.forEach(order => {
      stats.totalRequestedQuantity += order.requested_quantity;
      if (order.status in stats.statusCounts) {
        stats.statusCounts[order.status]++;
      } else {
        stats.statusCounts[order.status] = 1;
      }

      if (order.status === 'Fulfilled') {
        stats.totalFulfilledQuantity += order.fulfilled_quantity || 0;
        stats.totalCostOfFulfilled += (order.fulfilled_quantity || 0) * (order.item_cost_price || 0); // Assuming item_cost_price exists on order
      }
      if (order.status === 'Rejected') {
        stats.totalRejectedQuantity += order.requested_quantity;
      }

      itemRequestCounts[order.item_name] = (itemRequestCounts[order.item_name] || 0) + order.requested_quantity;
    });

    stats.topRequestedItems = Object.entries(itemRequestCounts)
      .sort(([, aQty], [, bQty]) => bQty - aQty)
      .slice(0, 5) 
      .map(([name, quantity]) => ({ name, quantity }));

    return stats;
  }, [departmentOrders, departmentUsers]);

  // Status icons mapping (used in status breakdown)
  const statusIcons = {
    Pending: <MdPendingActions size={18} className="text-yellow-500" />,
    DepartmentApproved: <MdCheckCircle size={18} className="text-purple-500" />,
    Approved: <MdCheckCircle size={18} className="text-indigo-500" />,
    Fulfilled: <MdLocalShipping size={18} className="text-green-500" />,
    Rejected: <MdThumbDown size={18} className="text-red-500" />,
    Cancelled: <MdCancel size={18} className="text-slate-500" />,
  };

  // Centralized loading/error/access checks for all roles
  if (isLoadingAuth || isLoadingReport) {
    return (
      <Layout>
        <div className={`flex h-screen items-center justify-center ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
          <LoadingSpinner size="lg" />
          <p className={`ml-4 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            {isLoadingAuth ? 'Authenticating...' : 'Loading department report...'}
          </p>
        </div>
      </Layout>
    );
  }

  // Access Denied: This check ensures ONLY DepartmentHead with a department_id can proceed.
  // Other roles should be caught by RouteWrapper in App.js.
  if (!currentUser || currentUser.role !== 'DepartmentHead' || !currentUser.department_id) {
    return (
      <Layout>
        <div className={`flex-1 flex flex-col items-center justify-center p-6 ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
          <h1 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>Access Denied</h1>
          <p className={`${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>You do not have permission to view this page, or your department is not assigned.</p>
          <Link to="/dashboard" className={`mt-4 px-4 py-2 rounded-md ${darkMode ? 'bg-indigo-600 text-white' : 'bg-indigo-500 text-white'}`}>Go to Dashboard</Link>
        </div>
      </Layout>
    );
  }

  if (reportError) {
    return (
      <Layout>
        <div className={`flex-1 flex flex-col items-center justify-center p-6 ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
          <MdWarningAmber size={52} className="mx-auto mb-4 text-red-500" />
          <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>Error Loading Report</h3>
          <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{reportError}</p>
          <button onClick={fetchData} className={`mt-4 px-4 py-2 rounded-md ${darkMode ? 'bg-indigo-600 text-white' : 'bg-indigo-500 text-white'}`}>Retry</button>
        </div>
      </Layout>
    );
  }

  // Final check: if departmentData is still null (e.g., initial state or error state that cleared it)
  // This might happen if 'fetchedDepartment' was null from the API for a valid ID.
  if (!departmentData) {
    return (
      <Layout>
        <div className={`flex-1 flex flex-col items-center justify-center p-6 ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
          <MdInfoOutline size={52} className="mx-auto mb-4 text-slate-400" />
          <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>No Department Data Available</h3>
          <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            Could not retrieve data for your assigned department. Please ensure your department is correctly configured.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={`flex-1 flex flex-col min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
        <header className={`flex items-center justify-between h-20 px-6 sm:px-8 fixed top-0 left-[250px] right-0 z-40 transition-colors duration-300
                         ${darkMode ? 'bg-slate-800/75 backdrop-blur-lg border-b border-slate-700' : 'bg-white/75 backdrop-blur-lg border-b border-slate-200'} shadow-sm`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${darkMode ? 'bg-teal-500/20 text-teal-400' : 'bg-teal-100 text-teal-600'}`}>
              <MdBarChart size={24}/>
            </div>
            <h2 className={`text-xl sm:text-2xl font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>
              My Department Report: {departmentData?.name || 'Loading...'}
            </h2>
          </div>
        </header>

        <main className="flex-1 p-6 pt-[104px] ml-[250px] overflow-y-auto max-w-full">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Total Users */}
              <div className={`p-6 rounded-xl shadow-lg border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Users</p>
                    <h3 className={`text-3xl font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-800'} mt-1`}>
                      {reportStats.totalUsers}
                    </h3>
                  </div>
                  <div className={`p-3 rounded-full ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                    <MdPeople size={28}/>
                  </div>
                </div>
              </div>

              {/* Total Requests */}
              <div className={`p-6 rounded-xl shadow-lg border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Requests</p>
                    <h3 className={`text-3xl font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-800'} mt-1`}>
                      {reportStats.totalRequests}
                    </h3>
                  </div>
                  <div className={`p-3 rounded-full ${darkMode ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-100 text-sky-600'}`}>
                    <MdShoppingCart size={28}/>
                  </div>
                </div>
              </div>

              {/* Total Fulfilled Quantity */}
              <div className={`p-6 rounded-xl shadow-lg border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Fulfilled Quantity</p>
                    <h3 className={`text-3xl font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-800'} mt-1`}>
                      {reportStats.totalFulfilledQuantity}
                    </h3>
                  </div>
                  <div className={`p-3 rounded-full ${darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'}`}>
                    <MdCheckCircle size={28}/>
                  </div>
                </div>
              </div>
            </div>

            {/* Request Status Breakdown & Top Requested Items */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Request Status Breakdown */}
              <div className={`p-6 rounded-xl shadow-lg border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                <h3 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                  Request Status Breakdown
                </h3>
                <div className="space-y-3">
                  {Object.entries(reportStats.statusCounts).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between text-sm">
                      <div className={`flex items-center gap-2 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        {statusIcons[status]} {status}
                      </div>
                      <span className={`font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{count}</span>
                    </div>
                  ))}
                </div>
                {reportStats.totalCostOfFulfilled > 0 && (
                  <p className={`mt-4 text-lg font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                    Total Cost of Fulfilled: <span className="text-green-500">{formatKESCurrency(reportStats.totalCostOfFulfilled)}</span>
                  </p>
                )}
              </div>

              {/* Top Requested Items */}
              <div className={`p-6 rounded-xl shadow-lg border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                <h3 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                  Top 5 Requested Items
                </h3>
                {reportStats.topRequestedItems.length === 0 ? (
                  <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>No items requested yet.</p>
                ) : (
                  <div className="space-y-3">
                    {reportStats.topRequestedItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className={`${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{item.name}</span>
                        <span className={`font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{item.quantity} units</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Department Members Table */}
            <div className={`p-6 rounded-xl shadow-lg border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <h3 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                {departmentData?.name || 'My'} Department Members
              </h3>
              {departmentUsers.length === 0 ? (
                <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>No users found in this department.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[500px] text-sm">
                    <thead className={`${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'} text-xs uppercase tracking-wider`}>
                      <tr>
                        <th className="py-3 px-4 text-left">Name</th>
                        <th className="py-3 px-4 text-left">Email</th>
                        <th className="py-3 px-4 text-left">Role</th>
                        <th className="py-3 px-4 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody className={`${darkMode ? 'divide-y divide-slate-700' : 'divide-y divide-slate-200'}`}>
                      {departmentUsers.map(user => (
                        <tr key={user.id} className={`${darkMode ? 'hover:bg-slate-700/60' : 'hover:bg-slate-50/70'}`}>
                          <td className={`py-3 px-4 font-medium ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{user.fullname}</td>
                          <td className={`py-3 px-4 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{user.email}</td>
                          <td className={`py-3 px-4 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                user.role === 'Admin' ? (darkMode ? 'bg-red-500/30 text-red-300' : 'bg-red-100 text-red-700')
                                : user.role === 'Staff' ? (darkMode ? 'bg-sky-500/30 text-sky-300' : 'bg-sky-100 text-sky-700')
                                : user.role === 'DepartmentHead' ? (darkMode ? 'bg-purple-500/30 text-purple-300' : 'bg-purple-100 text-purple-700')
                                : user.role === 'StockManager' ? (darkMode ? 'bg-teal-500/30 text-teal-300' : 'bg-teal-100 text-teal-700')
                                : (darkMode ? 'bg-slate-600 text-slate-300' : 'bg-slate-200 text-slate-600')
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className={`py-3 px-4 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                user.status ? (darkMode ? 'bg-green-500/30 text-green-300' : 'bg-green-100 text-green-700')
                                            : (darkMode ? 'bg-red-500/30 text-red-300' : 'bg-red-100 text-red-700')
                            }`}>
                              {user.status ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
};

export default DepartmentReportPage;
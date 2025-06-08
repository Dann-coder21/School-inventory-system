import React, { useContext, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { ThemeContext } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

import {
  MdDashboard, MdInventory, MdAddBox, MdList, MdAssessment, MdSettings, MdSchool,
  MdPeople, MdShoppingCart, MdAssignmentTurnedIn,
  MdHistory, // Import MdHistory icon for Order History
  MdApartment, // Import MdApartment icon for Department Page
  MdBarChart // Import MdBarChart icon for Department Report
} from 'react-icons/md'; // Ensure MdBarChart is imported

const Layout = ({ children }) => {
  const { darkMode } = useContext(ThemeContext);
  const { currentUser, isLoadingAuth } = useAuth();

  const sidebarLinkClass = ({ isActive }) =>
    `px-5 py-3.5 hover:bg-white/20 transition-colors flex items-center gap-3.5 text-sm font-medium rounded-lg mx-3 my-1.5 ${
      isActive
        ? (darkMode ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/30 text-white shadow-md')
        : (darkMode ? 'text-slate-300 hover:text-white hover:bg-slate-700/50' : 'text-indigo-100 hover:text-white')
    }`;

  // This memoized value determines the correct dashboard link for the current user
  const dashboardNavLink = useMemo(() => {
    if (currentUser?.role === 'Staff' || currentUser?.role === 'DepartmentHead') {
      return (
        <NavLink to="/staffdashboard" className={sidebarLinkClass}>
          <MdDashboard className="text-xl" /> My Dashboard
        </NavLink>
      );
    } else {
      return (
        <NavLink to="/dashboard" className={sidebarLinkClass}>
          <MdDashboard className="text-xl" /> Dashboard
        </NavLink>
      );
    }
  }, [currentUser, sidebarLinkClass]);

  const allowedAllOrdersRoles = useMemo(() => ['Admin', 'Staff', 'DepartmentHead', 'StockManager'], []);
  const showAllOrdersLink = useMemo(() => {
    return currentUser && allowedAllOrdersRoles.includes(currentUser.role);
  }, [currentUser, allowedAllOrdersRoles]);

  const allowedOrderHistoryRoles = useMemo(() => ['Admin', 'Staff', 'DepartmentHead', 'StockManager'], []);
  const showOrderHistoryLink = useMemo(() => {
    return currentUser && allowedOrderHistoryRoles.includes(currentUser.role);
  }, [currentUser, allowedOrderHistoryRoles]);

  const allowedIncomingRoles = useMemo(() => ['Admin', 'StockManager'], []);
  const showIncomingRequestsLink = useMemo(() => {
    return currentUser && allowedIncomingRoles.includes(currentUser.role);
  }, [currentUser, allowedIncomingRoles]);

  const showDepartmentPageLink = useMemo(() => {
    return currentUser && currentUser.role === 'DepartmentHead' && currentUser.department_id;
  }, [currentUser]);

  // Roles that are allowed to see Inventory and generic Reports
  const allowedInventoryReportsRoles = useMemo(() => ['Admin', 'StockManager', 'Viewer'], []);

  // NEW: Department Report Link visibility - ONLY for DepartmentHead
  const showDepartmentReportLink = useMemo(() => {
    // Only Department Head can see THEIR department report.
    return currentUser?.role === 'DepartmentHead' && currentUser?.department_id;
  }, [currentUser]);

  // Determine the correct path for the Department Report link (always specific for DH now)
  const departmentReportPath = useMemo(() => {
    if (currentUser?.role === 'DepartmentHead' && currentUser?.department_id) {
      return `/reports/department/${currentUser.department_id}`;
    }
    // This path shouldn't be reached by other roles as the link won't show
    return `/reports/department`; // Fallback, though should be unreachable
  }, [currentUser]);


  if (isLoadingAuth) {
    return (
      <div className={`flex h-screen items-center justify-center ${darkMode ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
        Initializing application layout...
      </div>
    );
  }

  return (
    <div className={`flex h-screen font-sans antialiased ${darkMode ? 'dark' : ''}`}>
      {/* Sidebar (fixed to left) - Width is 250px */}
      <aside className={`fixed top-0 left-0 w-[250px] h-full flex flex-col z-50 transition-colors duration-300 shadow-xl ${
        darkMode ? 'bg-slate-800 border-r border-slate-700' : 'bg-gradient-to-b from-indigo-600 to-indigo-700 border-r border-indigo-700'
      }`}>
        <div className="flex items-center justify-center h-20 border-b border-white/20">
          <MdSchool className={`text-3xl ${darkMode ? 'text-indigo-400' : 'text-white'}`} />
          <h1 className={`ml-3 text-2xl font-bold tracking-tight ${darkMode ? 'text-slate-100' : 'text-white'}`}>School IMS</h1>
        </div>
        <nav className="flex-grow pt-5">
           
          {dashboardNavLink}
          
          {/* Conditional rendering for "Inventory" - Staff AND DepartmentHead excluded */}
          {currentUser && allowedInventoryReportsRoles.includes(currentUser.role) && (
            <NavLink to="/inventory" className={sidebarLinkClass}><MdInventory className="text-xl" /> Inventory</NavLink>
          )}

          {(currentUser?.role === 'Admin' || currentUser?.role === 'StockManager') && (
            <NavLink to="/additemsform" className={sidebarLinkClass}><MdAddBox className="text-xl" /> Add Items</NavLink>
          )}

          <NavLink to="/viewitems" className={sidebarLinkClass}><MdList className="text-xl" /> View Items</NavLink>
          
          {showAllOrdersLink && (
              <NavLink to="/orders" className={sidebarLinkClass}><MdShoppingCart className="text-xl" /> All Item Requests</NavLink>
          )}

          {showOrderHistoryLink && (
            <NavLink to="/orderhistory" className={sidebarLinkClass}><MdHistory className="text-xl" /> Order History</NavLink>
          )}
          
          {showDepartmentPageLink && (
            <NavLink to="/department-page" className={sidebarLinkClass}><MdApartment className="text-xl" /> My Department</NavLink>
          )}

          {showIncomingRequestsLink && (
            <NavLink to="/incoming-requests" className={sidebarLinkClass}><MdAssignmentTurnedIn className="text-xl" /> Incoming Requests</NavLink>
          )}

           {/* Conditional rendering for generic "Reports" - Staff AND DepartmentHead excluded */}
          {currentUser && allowedInventoryReportsRoles.includes(currentUser.role) && (
            <NavLink to="/reports" className={sidebarLinkClass}><MdAssessment className="text-xl" /> Reports</NavLink>
          )}

          {/* NEW: Department Report Link (ONLY for Department Head, always to their specific report) */}
          {showDepartmentReportLink && (
            <NavLink to={departmentReportPath} className={sidebarLinkClass}>
              <MdBarChart className="text-xl" /> 
              My Department Report {/* Changed text to always be "My Department Report" */}
            </NavLink>
          )}

          {currentUser?.role === 'Admin' && (
            <NavLink to="/admin/users" className={sidebarLinkClass}><MdPeople className="text-xl" /> User Management</NavLink>
          )}

          <NavLink to="/settings" className={sidebarLinkClass}><MdSettings className="text-xl" /> Settings</NavLink>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col w-full min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
        {children} {/* Your page components render here */}
      </div>
    </div>
  );
};

export default Layout;
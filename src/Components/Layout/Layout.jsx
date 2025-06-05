import React, { useContext, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { ThemeContext } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

import {
  MdDashboard, MdInventory, MdAddBox, MdList, MdAssessment, MdSettings, MdSchool,
  MdPeople, MdShoppingCart, MdAssignmentTurnedIn,
  MdHistory // Import MdHistory icon for Order History
} from 'react-icons/md';

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

  // NEW: Define who sees the "Order History" link
  const allowedOrderHistoryRoles = useMemo(() => ['Admin', 'Staff', 'DepartmentHead', 'StockManager'], []);
  const showOrderHistoryLink = useMemo(() => {
    return currentUser && allowedOrderHistoryRoles.includes(currentUser.role);
  }, [currentUser, allowedOrderHistoryRoles]);

  const allowedIncomingRoles = useMemo(() => ['Admin', 'DepartmentHead', 'StockManager'], []);
  const showIncomingRequestsLink = useMemo(() => {
    return currentUser && allowedIncomingRoles.includes(currentUser.role);
  }, [currentUser, allowedIncomingRoles]);

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
           
          {dashboardNavLink} {/* Renders "Dashboard" or "My Dashboard" based on role */}
          
          {/* Conditional rendering for "Inventory" - Staff excluded */}
          {(currentUser?.role !== 'Staff') && (
            <NavLink to="/inventory" className={sidebarLinkClass}><MdInventory className="text-xl" /> Inventory</NavLink>
          )}

          {/* Conditional rendering for "Add Items" - only for Admin and StockManager */}
          {(currentUser?.role === 'Admin' || currentUser?.role === 'StockManager') && (
            <NavLink to="/additemsform" className={sidebarLinkClass}><MdAddBox className="text-xl" /> Add Items</NavLink>
          )}

          <NavLink to="/viewitems" className={sidebarLinkClass}><MdList className="text-xl" /> View Items</NavLink>
          
          {/* Conditional rendering for "Reports" - Staff excluded */}
          {(currentUser?.role !== 'Staff') && (
            <NavLink to="/reports" className={sidebarLinkClass}><MdAssessment className="text-xl" /> Reports</NavLink>
          )}

          {currentUser?.role === 'Admin' && (
            <NavLink to="/admin/users" className={sidebarLinkClass}><MdPeople className="text-xl" /> User Management</NavLink>
          )}

          {/* "All Item Requests" link - visible to Staff as well as managers */}
          {showAllOrdersLink && (
              <NavLink to="/orders" className={sidebarLinkClass}><MdShoppingCart className="text-xl" /> All Item Requests</NavLink>
          )}

          {/* NEW: "Order History" link - visible to authorized roles */}
          {showOrderHistoryLink && (
            <NavLink to="/orderhistory" className={sidebarLinkClass}><MdHistory className="text-xl" /> Order History</NavLink>
          )}
          
          {/* "Incoming Requests" link - visible to specific managers */}
          {showIncomingRequestsLink && (
            <NavLink to="/incoming-requests" className={sidebarLinkClass}><MdAssignmentTurnedIn className="text-xl" /> Incoming Requests</NavLink>
          )}

          <NavLink to="/settings" className={sidebarLinkClass}><MdSettings className="text-xl" /> Settings</NavLink>
        </nav>
      </aside>

      {/* Main Content Area: NO ml-[250px] here as per your request */}
      <div className={`flex-1 flex flex-col w-full min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
        {children} {/* Your page components render here */}
      </div>
    </div>
  );
};

export default Layout;
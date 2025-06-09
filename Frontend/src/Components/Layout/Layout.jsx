import React, { useContext, useMemo, useState, useCallback } from 'react'; // Add useCallback
import { NavLink, useLocation } from 'react-router-dom';
import { ThemeContext } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { SidebarProvider, useSidebar } from '../../contexts/SidebarContext';

import {
  MdDashboard, MdInventory, MdAddBox, MdList, MdAssessment, MdSettings, MdSchool,
  MdPeople, MdShoppingCart, MdAssignmentTurnedIn,
  MdHistory, MdApartment, MdBarChart,
  MdMenu, MdClose,
  MdArrowDropDown, MdArrowDropUp,
  MdPersonAdd
} from 'react-icons/md';

// Layout component, now it's a wrapper for SidebarProvider
const Layout = ({ children }) => {
  return (
    <SidebarProvider>
      <LayoutContent>
        {children}
      </LayoutContent>
    </SidebarProvider>
  );
};

// Internal component for a single sidebar link
const SidebarLink = React.memo(({ to, icon: Icon, text, className, isSubLink = false }) => {
  return (
    <NavLink to={to} className={className}>
      <Icon className="text-xl flex-shrink-0" />
      <span className={`whitespace-nowrap transition-all duration-300`}>
        {text}
      </span>
    </NavLink>
  );
});

// New internal component to render the actual layout structure
const LayoutContent = ({ children }) => {
  const { darkMode } = useContext(ThemeContext);
  const { currentUser, isLoadingAuth } = useAuth();
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const { pathname } = useLocation();

  // State for User Management dropdown
  const [isUserManagementDropdownOpen, setIsUserManagementDropdownOpen] = useState(false);

  // Helper to determine if any of the User Management related pages are active
  const isUserManagementActive = useMemo(() => {
    return pathname.startsWith('/admin/users') || pathname.startsWith('/admin/user-requests');
  }, [pathname]);

  // Unified function to generate classes for various types of sidebar links/buttons
  const getSidebarLinkClasses = useCallback((type = 'main') => ({ isActive }) => {
    const baseClasses = `py-3.5 hover:bg-white/20 transition-colors flex items-center rounded-lg my-1.5`;
    const activeClasses = isActive
      ? (darkMode ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/30 text-white shadow-md')
      : (darkMode ? 'text-slate-300 hover:text-white hover:bg-slate-700/50' : 'text-indigo-100 hover:text-white');

    let dynamicLayoutClasses;
    if (isSidebarOpen) {
      if (type === 'sub') {
        dynamicLayoutClasses = 'px-4 ml-8 gap-3.5'; // Indented for sub-links
      } else if (type === 'dropdownParent') {
        dynamicLayoutClasses = 'px-5 mx-3 gap-3.5'; // For the button that opens dropdown
      } else { // type === 'main'
        dynamicLayoutClasses = 'px-5 mx-3 gap-3.5'; // Standard main links
      }
    } else { // Sidebar is collapsed (icon-only view)
      if (type === 'dropdownParent' || type === 'main') {
        dynamicLayoutClasses = 'justify-center px-4'; // Centered icon
      } else { // type === 'sub' - these should ideally not be rendered or behave like main links when collapsed
        dynamicLayoutClasses = 'justify-center px-4';
      }
    }

    return `${baseClasses} ${activeClasses} ${dynamicLayoutClasses}`;
  }, [darkMode, isSidebarOpen]);

  // Memoized dashboard link as it can change based on user role
  const dashboardNavLink = useMemo(() => {
    if (currentUser?.role === 'Staff' || currentUser?.role === 'DepartmentHead') {
      return (
        <SidebarLink to="/staffdashboard" icon={MdDashboard} text="My Dashboard" className={getSidebarLinkClasses('main')} />
      );
    } else {
      return (
        <SidebarLink to="/dashboard" icon={MdDashboard} text="Dashboard" className={getSidebarLinkClasses('main')} />
      );
    }
  }, [currentUser, getSidebarLinkClasses]);

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

  const allowedInventoryReportsRoles = useMemo(() => ['Admin', 'StockManager', 'Viewer'], []);

  const showDepartmentReportLink = useMemo(() => {
    return currentUser?.role === 'DepartmentHead' && currentUser?.department_id;
  }, [currentUser]);

  const departmentReportPath = useMemo(() => {
    if (currentUser?.role === 'DepartmentHead' && currentUser?.department_id) {
      return `/reports/department/${currentUser.department_id}`;
    }
    return `/reports/department`;
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
      {/* Fixed sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full flex flex-col z-50 transition-all duration-300 shadow-xl
        ${darkMode ? 'bg-slate-800 border-r border-slate-700' : 'bg-gradient-to-b from-indigo-600 to-indigo-700 border-r border-indigo-700'}
        // Mobile behavior
        w-[250px] ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        // Desktop behavior - FIXED WIDTH TRANSITION
        md:translate-x-0
        md:${isSidebarOpen ? 'w-64' : 'w-20'}
      `}>
        {/* Unified Header with Toggle Button */}
        <div className={`flex items-center justify-between h-20 border-b border-white/20
          ${isSidebarOpen ? 'px-4' : 'px-2'} // Less padding when collapsed
        `}>
          <div className="flex items-center overflow-hidden">
            <MdSchool className={`text-3xl flex-shrink-0 ${darkMode ? 'text-indigo-400' : 'text-white'}`} />
            <h1 className={`ml-3 text-2xl font-bold tracking-tight whitespace-nowrap transition-all duration-300 ${darkMode ? 'text-slate-100' : 'text-white'} ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
              School IMS
            </h1>
          </div>
          {/* Unified toggle button: icon changes based on sidebar state */}
          <button
            onClick={toggleSidebar}
            className={`p-2 rounded-full transition-colors duration-300 ${darkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-white hover:bg-indigo-500/50'}`}
            aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isSidebarOpen ? <MdClose size={24} /> : <MdMenu size={24} />}
          </button>
        </div>

        <nav className="flex-grow pt-5 overflow-y-auto custom-scrollbar"> {/* Added custom-scrollbar for better styling */}
          {dashboardNavLink}
          {currentUser && allowedInventoryReportsRoles.includes(currentUser.role) && (
            <SidebarLink to="/inventory" icon={MdInventory} text="Inventory" className={getSidebarLinkClasses('main')} />
          )}
          {(currentUser?.role === 'Admin' || currentUser?.role === 'StockManager') && (
            <SidebarLink to="/additemsform" icon={MdAddBox} text="Add Items" className={getSidebarLinkClasses('main')} />
          )}
          <SidebarLink to="/viewitems" icon={MdList} text="View Items" className={getSidebarLinkClasses('main')} />
          {showAllOrdersLink && (
              <SidebarLink to="/orders" icon={MdShoppingCart} text="All Item Requests" className={getSidebarLinkClasses('main')} />
          )}
          {showOrderHistoryLink && (
            <SidebarLink to="/orderhistory" icon={MdHistory} text="Order History" className={getSidebarLinkClasses('main')} />
          )}
          {showDepartmentPageLink && (
            <SidebarLink to="/department-page" icon={MdApartment} text="My Department" className={getSidebarLinkClasses('main')} />
          )}
          {showIncomingRequestsLink && (
            <SidebarLink to="/incoming-requests" icon={MdAssignmentTurnedIn} text="Incoming Requests" className={getSidebarLinkClasses('main')} />
          )}
          {currentUser && allowedInventoryReportsRoles.includes(currentUser.role) && (
            <SidebarLink to="/reports" icon={MdAssessment} text="Reports" className={getSidebarLinkClasses('main')} />
          )}
          {showDepartmentReportLink && (
            <SidebarLink to={departmentReportPath} icon={MdBarChart} text="My Department Report" className={getSidebarLinkClasses('main')} />
          )}

          {/* NEW: User Management Dropdown */}
          {currentUser?.role === 'Admin' && (
            <div className="relative">
                {isSidebarOpen ? ( // If sidebar is open, use a button that toggles dropdown
                    <button
                        onClick={() => setIsUserManagementDropdownOpen(prev => !prev)}
                        className={getSidebarLinkClasses('dropdownParent')({ isActive: isUserManagementActive })} // Use the class generator for dropdown parent
                        aria-expanded={isUserManagementDropdownOpen}
                    >
                        <MdPeople className="text-xl flex-shrink-0" />
                        <span className="whitespace-nowrap transition-all duration-300 opacity-100 w-auto">
                            User Management
                        </span>
                        <span className="ml-auto">
                            {isUserManagementDropdownOpen ? <MdArrowDropUp size={24} /> : <MdArrowDropDown size={24} />}
                        </span>
                    </button>
                ) : ( // If sidebar is collapsed, use a NavLink to directly navigate
                    <NavLink
                        to="/admin/users"
                        className={({ isActive }) => getSidebarLinkClasses('main')({ isActive: isActive || isUserManagementActive })} // Behaves like a main link when collapsed
                    >
                        <MdPeople className="text-xl flex-shrink-0" />
                        <span className={`whitespace-nowrap transition-all duration-300 ${isSidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}`}>
                            User Management
                        </span>
                    </NavLink>
                )}

                {/* Dropdown Content - Now with rounded corners and background */}
                {isSidebarOpen && isUserManagementDropdownOpen && (
                    <div className={`
                        mt-1.5 pb-2 rounded-lg mx-3 // Apply rounded corners and align horizontally
                        ${darkMode ? 'bg-slate-700/50' : 'bg-indigo-500/50'} // Subtle background for the dropdown panel
                    `}>
                        <SidebarLink to="/admin/users" icon={MdList} text="All Users" className={getSidebarLinkClasses('sub')} />
                        <SidebarLink to="/admin/user-requests" icon={MdPersonAdd} text="User Requests" className={getSidebarLinkClasses('sub')} />
                    </div>
                )}
            </div>
          )}
          {/* END NEW: User Management Dropdown */}

          <SidebarLink to="/settings" icon={MdSettings} text="Settings" className={getSidebarLinkClasses('main')} />
        </nav>
      </aside>

      {/* Overlay for mobile when sidebar is open */}
      {isSidebarOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          aria-hidden="true"
        ></div>
      )}

      {/* Main Content Area - Adjust padding-left based on sidebar state */}
      <div className={`
          flex-1 flex flex-col min-h-screen transition-all duration-300
          ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}
          // Apply padding-left for desktop based on sidebar state
          md:pl-${isSidebarOpen ? '64' : '20'}
      `}>
          {children} {/* This is where Dashboard (or any other page) gets rendered */}
      </div>
    </div>
  );
};

export default Layout;
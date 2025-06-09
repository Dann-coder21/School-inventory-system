// src/App.jsx

import React, { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// --- Imports for existing Components/ folder ---
import Dashboard from "./Components/Dashboard";
import Inventory from "./Components/Inventory";
import AddItemForm from "./Components/AddItemForm";
import ViewItems from "./Components/ViewItems";
import Reports from "./Components/Reports"; // This is your generic Reports page
import Settings from "./Components/Settings";
import Login from "./Components/Login";
import SignupForm from "./Components/Signup";
import UserManagementPage from "./Components/UserManagementPage"; // Keep this as is
import OrderHistory from "./Components/StaffOrders/OrderHistory";

// --- Imports for Auth and Theme Contexts ---
import { AuthProvider, AuthContext } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";

// --- Imports for Inventory and Order Contexts ---
import { InventoryProvider } from "./contexts/InventoryContext";
import { OrderProvider } from "./contexts/OrderContext";

// --- Imports for new pages/ components (assuming they are in `src/pages`) ---
import StaffOrderPage from "./pages/StaffOrderPage";
import StaffOrderDashboard from "./pages/StaffOrderDashboard";
import IncomingRequestsPage from "./pages/IncomingRequestsPage";
import DepartmentPage from "./pages/DepartmentPage";
import DepartmentReportPage from "./pages/DepartmentReport";
import UserRequestsPage from "./pages/UserRequestsPage"; // <--- NEW: Import UserRequestsPage

// Import Layout and LoadingSpinner
import Layout from "./Components/Layout/Layout";
import LoadingSpinner from "./Components/LoadingSpinner";

// --- RouteWrapper Component for Authentication and Authorization ---
const RouteWrapper = ({ children, allowedRoles }) => {
  const { currentUser, isLoadingAuth } = useContext(AuthContext);

  if (isLoadingAuth) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300">
        <LoadingSpinner size="lg" />
        <p className="ml-4">Authenticating...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    console.warn(`Access Denied: User role '${currentUser.role}' is not allowed for this route.`);
    // Redirect unauthorized users to their appropriate dashboard based on their role
    if (currentUser.role === 'Staff' || currentUser.role === 'DepartmentHead') {
        return <Navigate to="/staffdashboard" replace />;
    } else {
        return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

function App() {
  const RootRedirector = () => {
    const { currentUser, isLoadingAuth } = useContext(AuthContext);

    if (isLoadingAuth) {
      return (
        <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300">
          <LoadingSpinner size="lg" />
          <p className="ml-4">Initializing user session...</p>
        </div>
      );
    }

    if (!currentUser) {
      return <Navigate to="/login" replace />;
    }

    if (currentUser.role === 'Staff' || currentUser.role === 'DepartmentHead') {
      return <Navigate to="/staffdashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        <InventoryProvider>
          <OrderProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignupForm />} />

              {/* Central Post-Login Redirection */}
              <Route path="/" element={<RootRedirector />} />

              {/* Protected Routes */}

              {/* General Dashboard (for non-Staff/non-DepartmentHead) */}
              <Route
                path="/dashboard"
                element={<RouteWrapper allowedRoles={['Admin', 'StockManager', 'Viewer']}><Layout><Dashboard /></Layout></RouteWrapper>}
              />
              
              {/* STAFF & DepartmentHead Dashboard */}
              <Route
                path="/staffdashboard"
                element={<RouteWrapper allowedRoles={['Staff', 'DepartmentHead']}><Layout><StaffOrderDashboard/></Layout></RouteWrapper>}
              />
              
              {/* Inventory Listing - Staff AND DepartmentHead excluded */}
              <Route
                path="/inventory"
                element={<RouteWrapper allowedRoles={['Admin', 'StockManager', 'Viewer']}><Layout><Inventory /></Layout></RouteWrapper>}
              />
              {/* Add Items Form */}
              <Route
                path="/AddItemsForm"
                element={<RouteWrapper allowedRoles={['Admin', 'StockManager']}><Layout><AddItemForm /></Layout></RouteWrapper>}
              />
              {/* View Items */}
              <Route
                path="/viewitems"
                element={<RouteWrapper allowedRoles={['Admin', 'Staff', 'DepartmentHead', 'StockManager', 'Viewer']}><Layout><ViewItems /></Layout></RouteWrapper>}
              />
              {/* Generic Reports page - Staff AND DepartmentHead excluded */}
              <Route
                path="/reports"
                element={<RouteWrapper allowedRoles={['Admin', 'StockManager', 'Viewer']}><Layout><Reports /></Layout></RouteWrapper>}
              />
              {/* Settings */}
              <Route
                path="/settings"
                element={<RouteWrapper allowedRoles={['Admin', 'Staff', 'DepartmentHead', 'StockManager', 'Viewer']}><Layout><Settings /></Layout></RouteWrapper>}
              />

              {/* User Management Page (All Users) */}
              <Route
                path="/admin/users"
                element={<RouteWrapper allowedRoles={['Admin']}><Layout><UserManagementPage /></Layout></RouteWrapper>}
              />

              {/* NEW: User Requests Page */}
              <Route
                path="/admin/user-requests"
                element={<RouteWrapper allowedRoles={['Admin']}><Layout><UserRequestsPage /></Layout></RouteWrapper>}
              />

              {/* All Item Requests Page */}
              <Route
                path="/orders"
                element={<RouteWrapper allowedRoles={['Admin', 'Staff', 'DepartmentHead', 'StockManager']}><Layout><StaffOrderPage /></Layout></RouteWrapper>}
              />
              {/* New Order History Page */}
              <Route
                path="/orderhistory"
                element={<RouteWrapper allowedRoles={['Admin', 'Staff', 'DepartmentHead', 'StockManager']}><Layout><OrderHistory /></Layout></RouteWrapper>}
              />

              {/* Department Page (For DepartmentHead to manage their own requests) */}
              <Route
                path="/department-page"
                element={<RouteWrapper allowedRoles={['Admin', 'DepartmentHead', 'StockManager']}><Layout><DepartmentPage /></Layout></RouteWrapper>}
              />

              {/* Incoming Requests Page (Admin/StockManager approve/reject) */}
              <Route
                path="/incoming-requests"
                element={<RouteWrapper allowedRoles={['Admin', 'StockManager']}><Layout><IncomingRequestsPage /></Layout></RouteWrapper>}
              />

              {/* NEW: Department Report Page - Exclusively for Department Heads */}
              {/* DH must provide departmentId in URL or will be redirected to their own */}
              <Route
                path="/reports/department/:departmentId"
                element={<RouteWrapper allowedRoles={['DepartmentHead']}><Layout><DepartmentReportPage /></Layout></RouteWrapper>}
              />
              {/* DH can access /reports/department without ID and will be redirected internally */}
              <Route
                path="/reports/department"
                element={<RouteWrapper allowedRoles={['DepartmentHead']}><Layout><DepartmentReportPage /></Layout></RouteWrapper>}
              />

              {/* Fallback route */}
              <Route path="*" element={<RouteWrapper><Layout><Navigate to="/dashboard" replace /></Layout></RouteWrapper>} />
            </Routes>
          </OrderProvider>
        </InventoryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
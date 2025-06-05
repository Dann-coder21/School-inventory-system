import React, { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// --- Imports for existing Components/ folder ---
import Dashboard from "./Components/Dashboard"; // This is the general/admin dashboard
import Inventory from "./Components/Inventory";
import AddItemForm from "./Components/AddItemForm";
import ViewItems from "./Components/ViewItems";
import Reports from "./Components/Reports";
import Settings from "./Components/Settings";
import Login from "./Components/Login";
import SignupForm from "./Components/Signup";
import UserManagementPage from "./Components/UserManagementPage";
import OrderHistory from "./Components/StaffOrders/OrderHistory"; // This is the order history component

// --- Imports for Auth and Theme Contexts ---
import { AuthProvider, AuthContext } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";

// --- Imports for Inventory and Order Contexts ---
import { InventoryProvider } from "./contexts/InventoryContext";
import { OrderProvider } from "./contexts/OrderContext";

// --- Imports for new pages/ components ---
import StaffOrderPage from "./pages/StaffOrderPage"; // This is the 'All Item Requests' page
import StaffOrderDashboard from "./pages/StaffOrderDashboard"; // This is the staff-specific order dashboard
import IncomingRequestsPage from "./pages/IncomingRequestsPage";

// Import Layout and LoadingSpinner
import Layout from "./Components/Layout/Layout"; // Path is correct
import LoadingSpinner from "./Components/LoadingSpinner"; // Make sure this path is correct

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
    if (currentUser.role === 'Staff') {
        return <Navigate to="/staffdashboard" replace />;
    } else {
        // DepartmentHead can also see staff dashboard now
        if (currentUser.role === 'DepartmentHead') {
            return <Navigate to="/staffdashboard" replace />;
        }
        return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

function App() {
  // Define the RootRedirector component directly within App
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

    if (currentUser.role === 'Staff' || currentUser.role === 'DepartmentHead') { // DepartmentHead now redirects to Staff Dashboard
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
              
              {/* Inventory Listing - Staff excluded */}
              <Route
                path="/inventory"
                element={<RouteWrapper allowedRoles={['Admin', 'DepartmentHead', 'StockManager', 'Viewer']}><Layout><Inventory /></Layout></RouteWrapper>}
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
              {/* Reports - Staff excluded */}
              <Route
                path="/reports"
                element={<RouteWrapper allowedRoles={['Admin', 'DepartmentHead', 'StockManager', 'Viewer']}><Layout><Reports /></Layout></RouteWrapper>}
              />
              {/* Settings */}
              <Route
                path="/settings"
                element={<RouteWrapper allowedRoles={['Admin', 'Staff', 'DepartmentHead', 'StockManager', 'Viewer']}><Layout><Settings /></Layout></RouteWrapper>}
              />

              {/* User Management Page */}
              <Route
                path="/admin/users"
                element={<RouteWrapper allowedRoles={['Admin']}><Layout><UserManagementPage /></Layout></RouteWrapper>}
              />

              {/* All Item Requests Page - NOW INCLUDES STAFF */}
              <Route
                path="/orders"
                element={<RouteWrapper allowedRoles={['Admin', 'Staff', 'DepartmentHead', 'StockManager']}><Layout><StaffOrderPage /></Layout></RouteWrapper>}
              />
              {/* New Order History Page */}
              <Route
                path="/orderhistory"
                element={<RouteWrapper allowedRoles={['Admin', 'Staff', 'DepartmentHead', 'StockManager']}><Layout><OrderHistory /></Layout></RouteWrapper>}
              />

              {/* Incoming Requests Page */}
              <Route
                path="/incoming-requests"
                element={<RouteWrapper allowedRoles={['Admin', 'DepartmentHead', 'StockManager']}><Layout><IncomingRequestsPage /></Layout></RouteWrapper>}
              />

              {/* Fallback route */}
              {/* This fallback should also use Layout to prevent unstyled page */}
              <Route path="*" element={<RouteWrapper><Layout><Navigate to="/dashboard" replace /></Layout></RouteWrapper>} />
            </Routes>
          </OrderProvider>
        </InventoryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
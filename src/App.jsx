import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./Components/Dashboard";
import Inventory from "./Components/Inventory";
import AddItemForm from "./Components/AddItemForm";
import ViewItems from "./Components/ViewItems";
import Reports from "./Components/Reports";
import Settings from "./Components/Settings";
import Login from "./Components/Login";
import SignupForm from "./Components/Signup";
import UserManagementPage from "./Components/UserManagementPage"; // 1. Import UserManagementPage
import { useState } from "react"; // useEffect was not used, so removed it

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("isLoggedIn") === "true"
  );

  // Later, you might also have user role state here or from a context
  // const [userRole, setUserRole] = useState(localStorage.getItem("userRole"));

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route
        path="/login"
        element={<Login setIsLoggedIn={setIsLoggedIn} /* setUserRole={setUserRole} */ />}
      />
      <Route path="/signup" element={<SignupForm />} />

      {/* Protected Routes */}
      {isLoggedIn ? (
        <>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/AddItemsForm" element={<AddItemForm />} />
          <Route path="/viewitems" element={<ViewItems />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          
          {/* 2. Add route for UserManagementPage */}
          {/* For now, any logged-in user can access. Refine with role check later. */}
          <Route path="/admin/users" element={<UserManagementPage />} />

          {/* Fallback for any other authenticated route - could be a 404 page specific to logged-in users */}
          {/* Or redirect to dashboard if no specific match */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </>
      ) : (
        // If not logged in, any attempt to access other paths redirects to login
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
}

export default App;
import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./Components/Dashboard";
import Inventory from "./Components/Inventory";
import AddItemForm from "./Components/AddItemForm";
import ViewItems from "./Components/ViewItems";
import Reports from "./Components/Reports";
import Settings from "./Components/Settings";
import Login from "./Components/Login"; // make sure you have this
import { useEffect, useState } from "react";
import SignupForm from "./Components/Signup";
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("isLoggedIn") === "true"
  );

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route
        path="/login"
        element={<Login setIsLoggedIn={setIsLoggedIn} />} // Passing the setter
      />
      <Route path="/signup" element={<SignupForm />} />

      {/* Protected Routes */}
      {isLoggedIn ? (
        <>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/AddItemsForm" element={<AddItemForm />} />
          {/* ... other routes ... */}
          <Route path="/viewitems" element={<ViewItems />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </>
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
}

export default App;

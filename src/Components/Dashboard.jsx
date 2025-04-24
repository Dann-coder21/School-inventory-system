// Dashboard.jsx
import React, { useContext,useEffect } from "react";
import { InventoryContext } from "../contexts/InventoryContext";
import { Link, useNavigate } from "react-router-dom";
import "../Styles/Dashboard.css";
import axios  from  'axios'


// ICON IMPORTS
import {
  MdDashboard,
  MdInventory,
  MdAddBox,
  MdList,
  MdAssessment,
  MdSettings,
} from "react-icons/md";

const Dashboard = () => {
  const { items } = useContext(InventoryContext);
  const navigate = useNavigate();

  const lowStockCount = items.filter(
    (item) => item.quantity > 0 && item.quantity < 5
  ).length;
  const outOfStockCount = items.filter((item) => item.quantity === 0).length;

  const handleLogout = () => {
    // Optional: clear local storage or auth token here
    navigate("/login");
  };
  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log(token)
      const response = await axios.get("http://localhost:3000/auth/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status !== 201) {

        navigate("/login");
      }
    } catch (err) {
      navigate("/login");
      console.log(err);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <>
      <div className="Full-dashboard">
        <div className="sidebar">
          <h2>Dashboard</h2>
          <Link to="/dashboard">
            <MdDashboard className="icon" /> Dashboard
          </Link>
          <Link to="/inventory">
            <MdInventory className="icon" /> Inventory
          </Link>
          <Link to="/AddItemsForm">
            <MdAddBox className="icon" /> Add Items
          </Link>
          <Link to="/viewitems">
            <MdList className="icon" /> View Items
          </Link>
          <Link to="/reports">
            <MdAssessment className="icon" /> Reports
          </Link>
          <Link to="/settings">
            <MdSettings className="icon" /> Settings
          </Link>
        </div>
        <div className="navbar">
          <span>📦 Inventory Dashboard</span>
          <button className="logout-btn" onClick={handleLogout}>
            Logout{" "}
          </button>
        </div>
        <div className="dashboard">
          <h2>📊 Overview</h2>

          <div className="cards">
            <div
              className="card clickable"
              onClick={() => navigate("/viewitems")}
            >
              <h3>Total Items</h3>
              <p>{items.length}</p>
            </div>
            <div
              className="card clickable"
              onClick={() => navigate("/viewitems")}
            >
              <h3>Low Stock</h3>
              <p>{lowStockCount}</p>
            </div>
            <div
              className="card clickable"
              onClick={() => navigate("/viewitems")}
            >
              <h3>Out of Stock</h3>
              <p>{outOfStockCount}</p>
            </div>
            <div
              className="card clickable"
              onClick={() => navigate("/inventory")}
            >
              <h3>Recently Added</h3>
              <p>{items.slice(-5).length} Items</p>
            </div>
          </div>

          <div className="action-buttons">
            <button onClick={() => navigate("/AddItemsForm")}>
              Add New Item
            </button>
            <button onClick={() => navigate("/reports")}>
              Generate Report
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;

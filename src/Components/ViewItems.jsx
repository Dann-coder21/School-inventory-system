import React, { useContext } from "react";
import { Link } from "react-router-dom";
import "../Styles/ViewItems.css";
import { InventoryContext } from "../contexts/InventoryContext";
import {
  MdDashboard,
  MdInventory,
  MdAddBox,
  MdList,
  MdAssessment,
  MdSettings,
} from "react-icons/md";

const ViewItems = () => {
  const { items } = useContext(InventoryContext);

  return (
    <div className="view-items-container">
      {/* Sidebar */}
      <div className="sidebar">
        <h2>Inventory</h2>
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

      {/* Navbar */}
      <div className="navbar">📦 View Inventory Items</div>

      {/* Main Content */}
      <div className="content">
        <h1>📋 Items in Inventory</h1>
        <table>
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Category</th>
              <th>Quantity</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan="4"
                  style={{ textAlign: "center", padding: "20px" }}
                >
                  No items found.
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={index}>
                  <td>{item.itemName}</td>
                  <td>{item.category}</td>
                  <td>{item.quantity}</td>
                  <td>
                    {item.status === "Out of Stock" ? (
                      <span style={{ color: "red" }}>❌ {item.status}</span>
                    ) : (
                      <span>✅ {item.status}</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <Link to="/dashboard" className="back-btn">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default ViewItems;

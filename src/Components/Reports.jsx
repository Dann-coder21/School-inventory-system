import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { InventoryContext } from "../contexts/InventoryContext";
import "../Styles/Reports.css";
import {
  MdDashboard,
  MdInventory,
  MdAddBox,
  MdList,
  MdAssessment,
  MdSettings,
} from "react-icons/md";

const Reports = () => {
  const { items } = useContext(InventoryContext);

  // Calculate report data
  const calculateReports = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const totalItems = items.length;
    const availableItems = items.filter(
      (item) => item.status === "Available"
    ).length;
    const outOfStockItems = items.filter(
      (item) => item.status === "Out of Stock"
    ).length;

    const addedThisMonth = items.filter((item) => {
      const itemDate = new Date(item.dateAdded);
      return (
        itemDate.getMonth() === currentMonth &&
        itemDate.getFullYear() === currentYear
      );
    }).length;

    const lowStockItems = items.filter(
      (item) => item.status !== "Out of Stock" && item.quantity < 5
    );

    const recentlyAdded = [...items]
      .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))
      .slice(0, 5);

    return {
      totalItems,
      availableItems,
      outOfStockItems,
      addedThisMonth,
      lowStockItems,
      recentlyAdded,
    };
  };

  const {
    totalItems,
    availableItems,
    outOfStockItems,
    addedThisMonth,
    lowStockItems,
    recentlyAdded,
  } = calculateReports();

  return (
    <div className="reports-page">
      {/* Sidebar */}
      <div className="sidebar">
        <h2>Reports</h2>
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
      <div className="navbar">📈 Inventory Reports</div>

      {/* Content */}
      <div className="content">
        <h1>📋 Inventory Summary</h1>

        <div className="cards">
          <div className="card">
            <h3>Total Items</h3>
            <p>{totalItems}</p>
            <small>All items ever in system</small>
          </div>
          <div className="card">
            <h3>Available</h3>
            <p>{availableItems}</p>
            <small>Currently in stock</small>
          </div>
          <div className="card">
            <h3>Out of Stock</h3>
            <p>{outOfStockItems}</p>
            <small>Needs restocking</small>
          </div>
          <div className="card">
            <h3>Added This Month</h3>
            <p>{addedThisMonth}</p>
            <small>New inventory</small>
          </div>
        </div>

        <h2>⚠️ Low Stock Items ({lowStockItems.length})</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {lowStockItems.length > 0 ? (
                lowStockItems.map((item, index) => (
                  <tr key={index}>
                    <td>{item.itemName}</td>
                    <td>{item.category}</td>
                    <td>{item.quantity}</td>
                    <td className="status-warning">Low Stock</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="no-items">
                    No low stock items
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <h2>🆕 Recently Added</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Date Added</th>
                <th>Quantity</th>
              </tr>
            </thead>
            <tbody>
              {recentlyAdded.map((item, index) => (
                <tr key={index}>
                  <td>{item.itemName}</td>
                  <td>{item.category}</td>
                  <td>{new Date(item.dateAdded).toLocaleDateString()}</td>
                  <td>{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="btns print-hidden">
          <button onClick={() => window.print()}>🖨️ Print Report</button>
          <button onClick={() => alert("Export to CSV coming soon!")}>
            📥 Export CSV
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reports;

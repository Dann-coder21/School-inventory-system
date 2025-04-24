import React from "react";
import "../Styles/Settings.css";
import { Link } from "react-router-dom";
import {
  MdDashboard,
  MdInventory,
  MdAddBox,
  MdList,
  MdAssessment,
  MdSettings,
} from "react-icons/md";

const Settings = () => {
  return (
    <div className="settings-wrapper">
      {/* Sidebar */}
      <div className="sidebar">
        <h2>Settings</h2>
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

      <div className="main-section">
        {/* Navbar */}
        <div className="navbar">⚙️ Settings</div>

        {/* Content */}
        <div className="content">
          <h1>Manage Your Preferences</h1>
          <div className="settings-grid">
            {/* Profile Section */}

            <div className="settings-section">
              <h2>👤 Profile Information</h2>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input type="text" id="username" placeholder="e.g. johndoe" />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  placeholder="e.g. user@school.edu"
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Change Password</label>
                <input type="password" id="password" placeholder="••••••••" />
              </div>
            </div>

            {/* Preferences Section */}
            <div className="settings-section">
              <h2>⚙️ Inventory Preferences</h2>
              <div className="form-group">
                <label htmlFor="low-stock">Low Stock Alert Threshold</label>
                <input type="text" id="low-stock" placeholder="e.g. 5" />
              </div>
              <div className="form-group">
                <label htmlFor="default-category">Default Category</label>
                <select id="default-category">
                  <option>Stationery</option>
                  <option>Furniture</option>
                  <option>Lab Equipment</option>
                  <option>Cleaning Supplies</option>
                </select>
              </div>
            </div>

            {/* Notifications Section */}
            <div className="settings-section">
              <h2>🔔 Notification Settings</h2>
              <div className="form-group">
                <label>
                  <input type="checkbox" defaultChecked /> Email Alerts
                </label>
              </div>
              <div className="form-group">
                <label>
                  <input type="checkbox" defaultChecked /> Weekly Inventory
                  Summary
                </label>
              </div>
            </div>

            {/* Backup Section */}
            <div className="settings-section">
              <h2>💾 Backup & Restore</h2>
              <div className="buttons">
                <button onClick={() => alert("Backup initiated!")}>
                  Backup Data
                </button>
                <button
                  onClick={() => alert("Import functionality coming soon")}
                >
                  Import Backup
                </button>
              </div>
            </div>
          </div>

          {/* Save & Logout */}
          <div className="buttons">
            <button onClick={() => alert("Changes saved!")}>
              ✅ Save Changes
            </button>
            <button onClick={() => alert("Logging out...")}>🚪 Logout</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

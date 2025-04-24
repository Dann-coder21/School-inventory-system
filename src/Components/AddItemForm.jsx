import React, { useContext, useState } from "react";
import { InventoryContext } from "../contexts/InventoryContext";
import { Link, useNavigate } from "react-router-dom";
import "../Styles/AddItemsForm.css";
import {
  MdDashboard,
  MdInventory,
  MdAddBox,
  MdList,
  MdAssessment,
  MdSettings,
} from "react-icons/md";

const AddItemForm = () => {
  const { items, addItem } = useContext(InventoryContext);
  const navigate = useNavigate();

  const existingItemNames = [...new Set(items.map((item) => item.itemName))];

  const [formData, setFormData] = useState({
    itemName: "",
    category: "",
    quantity: 0,
    location: "",
    dateAdded: "",
    status: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const alreadyExists = items.some(
      (item) => item.itemName.toLowerCase() === formData.itemName.toLowerCase()
    );

    if (alreadyExists) {
      alert(
        "Item already exists in inventory. Please update it through the inventory page."
      );
      return;
    }

    addItem(formData);
    navigate("/inventory"); // redirect to dashboard
  };

  return (
    <div className="addItems-body">
      <div className="app-container">
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
        <div className="navbar">
          <span>📦 Inventory Management System</span>
        </div>

        {/* Form Content */}
        <div className="content">
          <h2>📝 Add New Inventory Item</h2>
          <div className="form-container">
            <form onSubmit={handleSubmit}>
              <label htmlFor="itemName">Item Name</label>
              <input
                list="existing-items"
                type="text"
                id="itemName"
                name="itemName"
                value={formData.itemName}
                onChange={handleChange}
                required
                placeholder="Enter item name"
              />
              <datalist id="existing-items">
                {existingItemNames.map((name, idx) => (
                  <option key={idx} value={name} />
                ))}
              </datalist>

              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Select a category</option>
                <option>Books</option>
                <option>Electronics</option>
                <option>Lab Equipment</option>
                <option>Stationery</option>
                <option>Furniture</option>
              </select>

              <label htmlFor="quantity">Quantity</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                required
              />

              <label htmlFor="location">Location</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
              />

              <label htmlFor="dateAdded">Date Added</label>
              <input
                type="date"
                id="dateAdded"
                name="dateAdded"
                value={formData.dateAdded}
                onChange={handleChange}
                required
              />

              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <option value="">Select status</option>
                <option>Available</option>
                <option>Low</option>
                <option>Out of Stock</option>
              </select>

              <button type="submit">➕ Add Item</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddItemForm;

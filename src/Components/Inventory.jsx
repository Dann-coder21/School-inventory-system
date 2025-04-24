import React, { useContext, useState } from "react";
import "../styles/inventory.css";
import { Link } from "react-router-dom";
import { InventoryContext } from "../contexts/InventoryContext";
import {
  MdDashboard,
  MdInventory,
  MdAddBox,
  MdList,
  MdAssessment,
  MdSettings,
} from "react-icons/md";

function Inventory() {
  const { items, setItems } = useContext(InventoryContext);
  const [withdrawInfo, setWithdrawInfo] = useState({});
  const [addStockInfo, setAddStockInfo] = useState({});
  const [whoTook, setWhoTook] = useState({});
  const [activeRow, setActiveRow] = useState(null);
  const [activeAddRow, setActiveAddRow] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const filteredItems = items.filter(
    (item) =>
      item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = () => {
    if (itemToDelete !== null) {
      const updatedItems = [...items];
      updatedItems.splice(itemToDelete, 1);
      setItems(updatedItems);
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };

  const handleWithdraw = (index, name, quantity) => {
    if (!name || !quantity) {
      alert("Please enter both name and quantity");
      return;
    }

    const updatedItems = [...items];
    const currentItem = updatedItems[index];

    if (quantity <= 0 || quantity > currentItem.quantity) {
      alert("Invalid quantity.");
      return;
    }

    currentItem.quantity -= quantity;
    currentItem.status =
      currentItem.quantity === 0
        ? "Out of Stock"
        : currentItem.quantity < 5
        ? "Low Stock"
        : "Available";

    setItems(updatedItems);

    setWhoTook((prev) => ({
      ...prev,
      [index]: `${name} withdrew ${quantity} on ${new Date().toLocaleDateString()}`,
    }));

    setWithdrawInfo((prev) => ({
      ...prev,
      [index]: { name: "", quantity: "" },
    }));

    setActiveRow(null);
  };

  const handleAddStock = (index, quantity) => {
    if (!quantity || quantity <= 0) {
      alert("Please enter a valid quantity to add.");
      return;
    }

    const updatedItems = [...items];
    updatedItems[index].quantity += quantity;
    updatedItems[index].status =
      updatedItems[index].quantity === 0
        ? "Out of Stock"
        : updatedItems[index].quantity < 5
        ? "Low Stock"
        : "Available";

    setItems(updatedItems);
    setAddStockInfo((prev) => ({
      ...prev,
      [index]: "",
    }));
    setActiveAddRow(null);
  };

  return (
    <>
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
        <div className="navbar-content">
          <div className="search-container">
            <input
              type="text"
              placeholder="🔍 Search items..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <span className="navbar-title">📦 School Inventory Overview</span>
        </div>
      </div>

      {/* Content */}
      <div className="content">
        <div className="content-header">
          <h1>📋 Current Inventory</h1>
          <Link to="/AddItemsForm" className="add-item-btn">
            + Add New Item
          </Link>
        </div>

        {filteredItems.length === 0 ? (
          <div className="empty-state">
            <p>
              {items.length === 0
                ? "No items in inventory yet."
                : "No items match your search."}
            </p>
            <Link to="/AddItemsForm" className="btn-primary">
              {items.length === 0 ? "Add Your First Item" : "Add New Item"}
            </Link>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Date Added</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, index) => (
                  <tr
                    key={index}
                    className={activeRow === index ? "active-row" : ""}
                  >
                    <td>{item.itemName}</td>
                    <td>{item.category}</td>
                    <td>{item.quantity}</td>
                    <td
                      className={`status-${item.status
                        .toLowerCase()
                        .replace(" ", "-")}`}
                    >
                      {item.status}
                    </td>
                    <td>{new Date(item.dateAdded).toLocaleDateString()}</td>
                    <td className="actions-cell">
                      <div className="action-buttons">
                        <button
                          onClick={() => {
                            setItemToDelete(index);
                            setShowDeleteModal(true);
                          }}
                          className="btn-delete"
                          title="Delete item"
                        >
                          🗑️
                        </button>
                        <button
                          onClick={() =>
                            setActiveRow(activeRow === index ? null : index)
                          }
                          className="btn-withdraw-toggle"
                        >
                          {activeRow === index ? "Cancel" : "Withdraw"}
                        </button>
                        <button
                          onClick={() =>
                            setActiveAddRow(
                              activeAddRow === index ? null : index
                            )
                          }
                          className="btn-add-stock-toggle"
                        >
                          {activeAddRow === index ? "Cancel" : "Add Stock"}
                        </button>
                      </div>

                      {/* Withdraw Form */}
                      {activeRow === index && (
                        <div className="withdraw-form">
                          <div className="form-group">
                            <label>Recipient</label>
                            <input
                              type="text"
                              placeholder="Name"
                              value={withdrawInfo[index]?.name || ""}
                              onChange={(e) =>
                                setWithdrawInfo((prev) => ({
                                  ...prev,
                                  [index]: {
                                    ...prev[index],
                                    name: e.target.value,
                                  },
                                }))
                              }
                            />
                          </div>
                          <div className="form-group">
                            <label>Quantity (Max: {item.quantity})</label>
                            <input
                              type="number"
                              placeholder="Qty"
                              min="1"
                              max={item.quantity}
                              value={withdrawInfo[index]?.quantity || ""}
                              onChange={(e) =>
                                setWithdrawInfo((prev) => ({
                                  ...prev,
                                  [index]: {
                                    ...prev[index],
                                    quantity: parseInt(e.target.value) || "",
                                  },
                                }))
                              }
                            />
                          </div>
                          <button
                            onClick={() =>
                              handleWithdraw(
                                index,
                                withdrawInfo[index]?.name,
                                withdrawInfo[index]?.quantity
                              )
                            }
                            className="btn-withdraw"
                          >
                            Confirm Withdrawal
                          </button>
                          {whoTook[index] && (
                            <div className="withdraw-history">
                              <small>Last: {whoTook[index]}</small>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Add Stock Form */}
                      {activeAddRow === index && (
                        <div className="add-stock-form">
                          <div className="form-group">
                            <label>Add Quantity</label>
                            <input
                              type="number"
                              placeholder="Enter quantity"
                              min="1"
                              value={addStockInfo[index] || ""}
                              onChange={(e) =>
                                setAddStockInfo((prev) => ({
                                  ...prev,
                                  [index]: parseInt(e.target.value) || "",
                                }))
                              }
                            />
                          </div>
                          <button
                            onClick={() =>
                              handleAddStock(index, addStockInfo[index])
                            }
                            className="btn-add-stock"
                          >
                            Confirm Add
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Are you sure you want to delete this item?</h3>
            <button onClick={handleDelete} className="btn-confirm">
              Yes, Delete
            </button>
            <button
              onClick={() => setShowDeleteModal(false)}
              className="btn-cancel"
            >
              No, Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Inventory;

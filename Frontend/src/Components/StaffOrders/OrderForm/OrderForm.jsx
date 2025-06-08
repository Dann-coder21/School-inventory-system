import React, { useState, useEffect, useContext, useMemo, useRef } from 'react'; // Added useMemo, useRef
import useOrderForm from './useOrderForm';
import { ThemeContext } from '../../../contexts/ThemeContext';
import { InventoryContext } from '../../../contexts/InventoryContext';
import { MdAddShoppingCart, MdError, MdCheckCircle } from 'react-icons/md';
import Swal from 'sweetalert2';
import axios from 'axios';


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const OrderForm = ({ onOrderSubmitted }) => {
  const { darkMode } = useContext(ThemeContext);
  const { items, loading: itemsLoading, error: itemsError } = useContext(InventoryContext);
  const { formData, errors, handleChange, validate, resetForm, getValidationClass } = useOrderForm({
    selectedItem: 'default', // Still holds the ID for submission
    requestedQuantity: '',
    notes: ''
  });

  // NEW STATE FOR SEARCHABLE INPUT
  const [searchTerm, setSearchTerm] = useState(''); // What the user types
  const [showSuggestions, setShowSuggestions] = useState(false); // Controls visibility of suggestion list
  const [displayItemName, setDisplayItemName] = useState(''); // What is displayed in the input field
  const inputRef = useRef(null); // Ref for handling clicks outside

  // Effect to reset display name when form is reset
  useEffect(() => {
    if (formData.selectedItem === 'default') {
      setDisplayItemName('');
      setSearchTerm('');
    }
  }, [formData.selectedItem]);

  // Effect to handle clicks outside the input/suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false);
        // If nothing was formally selected and input doesn't match an item, clear the input
        const match = items.find(item => item.item_name.toLowerCase() === displayItemName.toLowerCase());
        if (!match && formData.selectedItem !== 'default') {
            handleChange({ target: { name: 'selectedItem', value: 'default' } });
            setDisplayItemName('');
            setSearchTerm('');
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [displayItemName, formData.selectedItem, handleChange, items]);


  // Filter items based on searchTerm
  const filteredItems = useMemo(() => {
    if (!items || itemsLoading || itemsError) {
      return [];
    }
    // Show all available items if searchTerm is empty, otherwise filter by name and check stock
    return items.filter(item =>
      (searchTerm === '' || item.item_name.toLowerCase().includes(searchTerm.toLowerCase())) &&
      item.quantity > 0 // Only show items that are in stock
    ).sort((a, b) => a.item_name.localeCompare(b.item_name)); // Sort alphabetically
  }, [items, searchTerm, itemsLoading, itemsError]);

  // Handle change in the searchable input field
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setDisplayItemName(value);
    setShowSuggestions(true);
    // Reset the selected item in formData when user starts typing again
    handleChange({ target: { name: 'selectedItem', value: 'default' } });
  };

  // Handle selecting an item from suggestions
  const handleSelectSuggestion = (item) => {
    setDisplayItemName(item.item_name); // Put the item name in the input
    setSearchTerm(item.item_name); // Update searchTerm to match (useful if you want to re-filter later)
    setShowSuggestions(false); // Hide suggestions
    handleChange({ target: { name: 'selectedItem', value: item.id } }); // Update formData with item ID
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    // Re-validate just before submission
    if (!validate()) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please correct the errors in the form.',
        background: darkMode ? '#1e293b' : '#ffffff',
        color: darkMode ? '#e2e8f0' : '#1e293b',
        confirmButtonColor: darkMode ? '#4f46e5' : '#6366f1',
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        Swal.fire({ icon: 'error', title: 'Auth Error', text: 'Please log in to submit requests.' });
        return;
      }

      const selectedItemObj = items.find(item => String(item.id) === String(formData.selectedItem));
      if (!selectedItemObj) {
          // This should ideally be caught by validation, but as a fallback:
          Swal.fire({ icon: 'error', title: 'Invalid Item', text: 'Please select a valid item from the list.' });
          return;
      }
      if (Number(formData.requestedQuantity) > selectedItemObj.quantity) {
          Swal.fire({
            icon: 'error',
            title: 'Stock Error',
            text: `Requested quantity (${formData.requestedQuantity}) exceeds current stock (${selectedItemObj.quantity}) for "${selectedItemObj.item_name}".`,
            background: darkMode ? '#1e293b' : '#ffffff',
            color: darkMode ? '#e2e8f0' : '#1e293b',
            confirmButtonColor: darkMode ? '#4f46e5' : '#6366f1',
          });
          return; // Stop submission
      }

      Swal.fire({
        title: 'Submitting Request...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
        background: darkMode ? '#1e293b' : '#ffffff',
        color: darkMode ? '#e2e8f0' : '#1e293b',
      });

      const response = await axios.post(`${API_BASE_URL}/api/orders/request`, {
        item_name: selectedItemObj.item_name, // Backend expects item_name
        requested_quantity: Number(formData.requestedQuantity),
        notes: formData.notes,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Swal.fire({
        icon: 'success',
        title: 'Request Submitted!',
        text: `"${selectedItemObj.item_name}" requested successfully.`,
        background: darkMode ? '#1e293b' : '#ffffff',
        color: darkMode ? '#e2e8f0' : '#1e293b',
        confirmButtonColor: darkMode ? '#4f46e5' : '#6366f1',
        timer: 2500,
        showConfirmButton: false,
      });
      resetForm(); // This will also trigger the useEffect to clear displayItemName
      onOrderSubmitted(response.data.request);
    } catch (err) {
      console.error('Order submission failed:', err);
      Swal.fire({
        icon: 'error',
        title: 'Submission Failed',
        text: err.response?.data?.message || err.message || 'Could not submit your request.',
        background: darkMode ? '#1e293b' : '#ffffff',
        color: darkMode ? '#e2e8f0' : '#1e293b',
        confirmButtonColor: darkMode ? '#4f46e5' : '#6366f1',
      });
    }
  };

  const inputBaseClass = `w-full px-3 py-2.5 rounded-md border text-sm transition-colors duration-150 focus:ring-2 focus-visible:outline-none ${
    darkMode
      ? 'bg-slate-700 border-slate-600 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400 text-slate-100'
      : 'bg-white border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400 text-slate-800'
  }`;
  const labelClass = `block mb-1 text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-gray-700'}`;

  return (
    <div className={`p-6 rounded-xl shadow-lg ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}`}>
      <h3 className={`text-xl font-semibold mb-6 flex items-center gap-3 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
        <MdAddShoppingCart className="text-2xl text-indigo-500" /> Request New Item
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
        <div className="relative" ref={inputRef}> {/* Apply ref to the container */}
          <label htmlFor="selectedItemInput" className={labelClass}>Select Item <span className="text-red-500">*</span></label>
          <input
            type="text"
            id="selectedItemInput" // New ID for the text input
            name="selectedItemInput" // Use a new name for the input if formData won't track it directly
            value={displayItemName}
            onChange={handleSearchChange}
            onFocus={() => setShowSuggestions(true)}
            // onBlur handled by handleClickOutside with a timeout for click to register
            className={`${inputBaseClass} ${getValidationClass('selectedItem')}`}
            placeholder={itemsLoading ? 'Loading items...' : itemsError ? 'Error loading items' : 'Type to search for an item...'}
            autoComplete="off" // Prevent browser autofill
            disabled={itemsLoading || itemsError}
          />
          {showSuggestions && (filteredItems.length > 0 || searchTerm) && (
            <ul className={`absolute z-10 w-full mt-1 max-h-60 overflow-y-auto rounded-md shadow-lg ${darkMode ? 'bg-slate-700 border border-slate-600' : 'bg-white border border-gray-200'}`}>
              {itemsLoading ? (
                <li className={`px-4 py-2 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Loading items...</li>
              ) : itemsError ? (
                <li className={`px-4 py-2 text-red-500`}>Error: {itemsError.message}</li>
              ) : filteredItems.length > 0 ? (
                filteredItems.map(item => (
                  <li
                    key={item.id}
                    // Prevent blur from firing before onClick on suggestion (important for selection)
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectSuggestion(item)}
                    className={`px-4 py-2 cursor-pointer ${darkMode ? 'hover:bg-slate-600' : 'hover:bg-gray-100'} ${item.quantity <= 0 ? 'text-red-400 opacity-70 cursor-not-allowed' : (darkMode ? 'text-slate-100' : 'text-slate-800')}`}
                  >
                    {item.item_name} ({item.quantity} in stock)
                  </li>
                ))
              ) : (
                <li className={`px-4 py-2 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  {searchTerm ? 'No matching items found.' : 'Start typing to search.'}
                </li>
              )}
            </ul>
          )}
          {errors.selectedItem && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><MdError size={14}/> {errors.selectedItem}</p>}
        </div>

        <div>
          <label htmlFor="requestedQuantity" className={labelClass}>Requested Quantity <span className="text-red-500">*</span></label>
          <input
            type="number"
            id="requestedQuantity"
            name="requestedQuantity"
            value={formData.requestedQuantity}
            onChange={handleChange}
            min="1"
            className={`${inputBaseClass} ${getValidationClass('requestedQuantity')}`}
            placeholder="e.g., 5"
          />
          {errors.requestedQuantity && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><MdError size={14}/> {errors.requestedQuantity}</p>}
        </div>

        <div>
          <label htmlFor="notes" className={labelClass}>Notes (Optional)</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className={`${inputBaseClass} min-h-[80px]`}
            placeholder="Any specific requirements or reasons for request..."
          ></textarea>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={resetForm}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${darkMode ? 'bg-slate-600 hover:bg-slate-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
          >
            Clear Form
          </button>
          <button
            type="submit"
            className={`px-4 py-2 text-sm font-medium rounded-md text-white transition-colors ${darkMode ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-indigo-500 hover:bg-indigo-600'}`}
          >
            <MdAddShoppingCart className="inline-block mr-1 text-lg" /> Submit Request
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrderForm;
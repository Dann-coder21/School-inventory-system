import { useState, useCallback, useContext } from 'react';
import { InventoryContext } from '../../../contexts/InventoryContext'; // <--- Import InventoryContext

const useOrderForm = (initialState) => {
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});

  // <--- NEW: Access items from InventoryContext
  const { items } = useContext(InventoryContext);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for the field when user starts typing/changing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  const validate = useCallback(() => {
    let newErrors = {};
    let isValid = true;

    // <--- MODIFIED VALIDATION FOR SELECTED ITEM
    if (formData.selectedItem === 'default' || !formData.selectedItem) {
      newErrors.selectedItem = 'Please select an item.';
      isValid = false;
    } else {
      // Find the selected item to ensure it's a valid ID and still in stock
      const selectedItem = items.find(item => String(item.id) === String(formData.selectedItem));
      if (!selectedItem) {
        newErrors.selectedItem = 'Selected item is invalid or no longer available.';
        isValid = false;
      }
      // You might also want to add a check here for current stock vs requested quantity
      // if not already handled rigorously on the main form component.
      // (OrderForm.jsx already does this before API call, but having it here makes validation more immediate)
    }

    // Validate requestedQuantity
    if (!formData.requestedQuantity || formData.requestedQuantity <= 0) {
      newErrors.requestedQuantity = 'Quantity is required and must be a positive number.';
      isValid = false;
    } else if (isNaN(Number(formData.requestedQuantity))) {
      newErrors.requestedQuantity = 'Quantity must be a valid number.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  }, [formData, items]); // <--- IMPORTANT: Add 'items' to dependencies

  const resetForm = useCallback(() => {
    setFormData(initialState);
    setErrors({});
  }, [initialState]);

  // Helper for dynamic validation styling
  const getValidationClass = useCallback((fieldName) => {
    if (errors[fieldName]) {
      return 'border-red-500 focus:border-red-500 focus:ring-red-500';
    }
    // Apply green border if field is not empty and valid (optional: only for required fields)
    if (fieldName === 'selectedItem') {
      if (formData.selectedItem && formData.selectedItem !== 'default') {
        // Ensure the selected ID actually corresponds to an item
        const selectedItem = items.find(item => String(item.id) === String(formData.selectedItem));
        if (selectedItem) {
          return 'border-green-500 focus:border-green-500 focus:ring-green-500';
        }
      }
    } else if (formData[fieldName] && !errors[fieldName]) { // For other fields like requestedQuantity
      return 'border-green-500 focus:border-green-500 focus:ring-green-500';
    }
    return '';
  }, [errors, formData, items]); // <--- IMPORTANT: Add 'items' to dependencies

  return {
    formData,
    errors,
    handleChange,
    validate,
    resetForm,
    getValidationClass
  };
};

export default useOrderForm;
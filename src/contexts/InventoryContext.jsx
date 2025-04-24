import React, { createContext, useState, useEffect } from "react";

export const InventoryContext = createContext();

export const InventoryProvider = ({ children }) => {
  // Get stored items from localStorage, or default to an empty array
  const storedItems = JSON.parse(localStorage.getItem("items")) || [];
  const [items, setItems] = useState(storedItems);
  // Persist items to localStorage every time they change

  useEffect(() => {
    localStorage.setItem("items", JSON.stringify(items));
  }, [items]);

  const addItem = (item) => {
    setItems((prevItems) => [...prevItems, item]);
  };

  return (
    <InventoryContext.Provider value={{ items, setItems, addItem }}>
      {children}
    </InventoryContext.Provider>
  );
};

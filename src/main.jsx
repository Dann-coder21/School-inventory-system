import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { InventoryProvider } from "./contexts/InventoryContext";
import { ThemeProvider } from "./contexts/ThemeContext"; // Import the ThemeProvider

createRoot(document.getElementById("root")).render(
  <ThemeProvider>
    <InventoryProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </InventoryProvider>
  </ThemeProvider>
);
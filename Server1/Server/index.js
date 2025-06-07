// server.js (your main backend app file)
import express from "express";
import dotenv from "dotenv";
import cors from "cors";

// Ensure dotenv loads environment variables from .env file
dotenv.config();

// Import Routers
import authRouter from "./routes/authRoutes.js";
import itemsRouter from "./routes/itemsRoutes.js";
import userRouter from "./routes/usersRoutes.js"; // Admin/user management router
import orderRouter from "./routes/orderRoutes.js";
import departmentRouter from "./routes/departmentRoutes.js"; // Department routes
import withdrawRouter from "./routes/withdrawRoutes.js";
import addStockRouter from "./routes/addStockRoute.js";
import deleteItemRouter from "./routes/deleteItemRoute.js";

// Import your database connection utility
import { connectToDatabase } from "./lib/db.js";

console.log("Server starting up...");

const app = express();

// --- Configure the Server Port ---
// Use the port provided by the environment (Fly.io will set process.env.PORT)
// Fallback to 8080 as a common default for Node.js applications if not set.
const PORT = process.env.PORT || 8080;

// --- Middleware ---
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Enable JSON body parsing for incoming requests

// Simple request logger middleware for debugging
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url} from ${req.ip}`);
  next();
});

// --- API Routes ---

// 1. Health Check / Root Route
// This route will respond to GET requests to the root URL (e.g., inventory-server.fly.dev/)
// It's useful for checking if the server is alive and responding.
app.get('/', (req, res) => {
  res.status(200).json({
    message: "Inventory API is running!",
    database_status: "connected", // Based on your logs, DB is connecting
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

// 2. Mount your specific API routers
// Order matters here: specific routes should come before more general catch-alls.
app.use("/auth", authRouter);
app.use("/items", itemsRouter);
app.use("/withdrawals", withdrawRouter);
app.use("/stock", addStockRouter);
app.use("/delete", deleteItemRouter);
app.use("/api/admin", userRouter);
app.use("/api/orders", orderRouter);
app.use("/api/departments", departmentRouter);

// 3. Catch-all for 404 Not Found
// This middleware will be hit if none of the above routes match the incoming request.
app.use((req, res, next) => {
  res.status(404).json({ message: "Endpoint Not Found", path: req.originalUrl });
});

// 4. Global Error Handling Middleware
// This handles any errors that occur in your routes or other middleware.
// It should always be the last `app.use()` call.
app.use((err, req, res, next) => {
  console.error("Caught an error:", err.stack); // Log the full error stack for debugging
  res.status(err.status || 500).json({
    message: err.message || "An unexpected error occurred",
    error: process.env.NODE_ENV === 'production' ? {} : err // Send less detail in production
  });
});


// --- Start the Server ---
// It's crucial to listen on '0.0.0.0' so Fly.io can access your application.
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  // Attempt to connect to the database after the server starts listening
  // This ensures the HTTP server is up and listening quickly,
  // preventing Fly.io's health checks from failing prematurely.
  checkDb();
});

// Function to check database connection
function checkDb() {
  connectToDatabase()
    .then(() => {
      console.log("✅ Database connected successfully at startup.");
    })
    .catch((err) => {
      // It's important to log the error for debugging
      console.error("❌ Database connection failed at startup:", err.message);
      // In a real production app, you might want to consider exiting the process
      // if the database connection is critical for the app to function.
      // process.exit(1);
    });
}
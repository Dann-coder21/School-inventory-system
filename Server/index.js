// server.js (or your main backend app file)
import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";

// Import Routers
import authRouter from "./routes/authRoutes.js";
import itemsRouter from "./routes/itemsRoutes.js";
import userRouter from "./routes/usersRoutes.js"; // This is your admin/user management router
import orderRouter from "./routes/orderRoutes.js";
// NEW: Import your department routes
import departmentRouter from "./routes/departmentRoutes.js"; // Assuming departmentRoutes.js exports default as `router`

import withdrawRouter from "./routes/withdrawRoutes.js";
import addStockRouter from "./routes/addStockRoute.js";
import deleteItemRouter from "./routes/deleteItemRoute.js";

import { connectToDatabase } from "./lib/db.js";

console.log("Server starting up...");

const app = express();
const PORT = process.env.PORT || 3001; // Changed to 3001 to avoid conflict if frontend is on 3000

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url} from ${req.ip}`);
  next();
});

// --- Mount API Routes ---
app.use("/auth", authRouter);
app.use("/items", itemsRouter);
app.use("/withdrawals", withdrawRouter);
app.use("/stock", addStockRouter);
app.use("/delete", deleteItemRouter);

// Mount the User Admin / Role Management routes under the "/api/admin" prefix
app.use("/api/admin", userRouter); 
app.use("/api/orders", orderRouter);

// NEW: Mount the Department routes under the "/api/departments" prefix
app.use("/api/departments", departmentRouter); // Added departmentRouter here

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  checkDb();
});

function checkDb() {
  connectToDatabase()
    .then(() => {
      console.log("Database connected successfully at startup.");
    })
    .catch((err) => {
      console.error("Database connection failed at startup:", err.message);
    });
}
// server.js (or your main backend app file)
import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";

// Import Routers
import authRouter from "./routes/authRoutes.js";
import itemsRouter from "./routes/itemsRoutes.js";
import userRouter from "./routes/usersRoutes.js"; 
import orderRouter from "./routes/orderRoutes.js";
// Import using a descriptive name that matches your intent
// Note: I've named the import 'userRoleAdminRouter' for clarity.
// The actual variable name here doesn't *have* to match 'RoleRouter' from the other file
// as long as the 'export default' from userAdminRoutes.js is what's being imported.
// However, using a name like 'userAdminRouter' or 'roleAdminRouter' for the import is good practice.

import withdrawRouter from "./routes/withdrawRoutes.js";
import addStockRouter from "./routes/addStockRoute.js";
import deleteItemRouter from "./routes/deleteItemRoute.js";

import { connectToDatabase } from "./lib/db.js";

console.log("Server starting up...");

const app = express();
const PORT = process.env.PORT || 3001;

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

// Mount the User Admin / Role Management routes under the "/admin" prefix
app.use("/api/admin", userRouter); 
app.use("/api/orders", orderRouter);

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
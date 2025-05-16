import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import router from "./routes/authRoutes.js";
import itemsRouter from "./routes/itemsRoutes.js";
import { connectToDatabase } from "./lib/db.js";
import withdrawRouter from "./routes/withdrawRoutes.js";
import addStockRouter from "./routes/addStockRoute.js";
import deleteItemRouter from "./routes/deleteItemRoute.js";

console.log("Server started");


const app = express();
const PORT = process.env.PORT;
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});




app.use("/auth", router);
app.use("/items", itemsRouter);
app.use('/withdrawals', withdrawRouter);
app.use('/stock', addStockRouter); 
app.use('/delete', deleteItemRouter);




app.get("/dashboard", (req, res) => {
  console.log("req.body");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  checkDb();
});

function checkDb() {
  connectToDatabase()
    .then(() => {
      console.log("Database connected successfully");
    })
    .catch((err) => {
      console.error("Database connection failed:", err);
    });
}

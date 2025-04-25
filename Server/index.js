import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import router from "./routes/authRoutes.js";
import { connectToDatabase } from "./lib/db.js";
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

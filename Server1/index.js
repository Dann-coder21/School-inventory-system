import express from "express";

import dotenv from "dotenv";
dotenv.config();
import cors from "cors";

const app = express();
app.use(cors());

app.get("/test", (req, res) => {
  console.log("Test route hit!");
  res.send("Test route is working!");
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

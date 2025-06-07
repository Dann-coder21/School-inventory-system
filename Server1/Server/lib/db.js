// lib/db.js
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

let pool = null;

const initializePool = () => {
  if (!pool) {
    console.log("---- Initializing TiDB Pool ----");
    const {
      DB_HOST,
      DB_USER,
      DB_PASSWORD,
      DB_NAME,
      DB_PORT,
      CA
    } = process.env;

    if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME || !CA) {
      console.error("Missing required DB environment variables.");
      return null;
    }

    try {
      pool = mysql.createPool({
        host: DB_HOST,
        port: DB_PORT ? Number(DB_PORT) : 4000 || 3001,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 10000,
        ssl: {
          ca: CA // passed as string from fly secrets
        }
      });

      console.log("✅ TiDB connection pool initialized.");
    } catch (err) {
      console.error("❌ Failed to initialize pool:", err);
      pool = null;
    }
  }
  return pool;
};

export const connectToDatabase = async () => {
  if (!pool) initializePool();
  if (!pool) throw new Error("Failed to initialize DB pool.");
  return pool;
};

export const getDbConnection = async () => {
  if (!pool) initializePool();
  if (!pool) throw new Error("No DB pool available.");
  return await pool.getConnection();
};

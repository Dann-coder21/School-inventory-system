
/*import mysql from "mysql2/promise";

let connection;
let connectionPromise; // Track ongoing connection attempts

export const connectToDatabase = async () => {
  try {
    if (!connectionPromise) {
      connectionPromise = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
      }).then(conn => {
        connection = conn;
        return conn;
      }).catch(err => {
        connectionPromise = null; // Reset on failure
        throw err;
      });
    }
    
    // If we already have a connection, verify it's still alive
    if (connection) {
      try {
        await connection.ping();
        return connection;
      } catch (pingError) {
        console.log("Connection dead, reconnecting...");
        connection = null;
        connectionPromise = null;
        return connectToDatabase(); // Retry
      }
    }
    
    return connectionPromise;
  } catch (err) {
    console.error("Database connection error:", err);
    throw err; // Important: rethrow for route handlers
  }
};

*/

// lib/db.js - With Connection Pooling
// lib/db.js
// lib/db.js - LAZY POOL INITIALIZATION
import mysql from "mysql2/promise";

let pool = null; // Initialize to null

const initializePool = () => {
  // This function is now only called when needed
  if (!pool) { // Check again in case of concurrent calls, though less likely here
    console.log("---- LAZY INITIALIZING POOL in lib/db.js ----");
    console.log("DB_USER:", process.env.DB_USER);
    console.log("DB_HOST:", process.env.DB_HOST);
    console.log("DB_NAME:", process.env.DB_NAME);
    console.log("DB_PASSWORD is set:", !!process.env.DB_PASSWORD);
    console.log("----------------------------------------------");

    if (!process.env.DB_USER || !process.env.DB_HOST || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
        console.error("CRITICAL: Missing DB environment variables during lazy pool initialization.");
        // Don't create the pool if config is missing, let functions below handle 'pool' being null.
        return null;
    }

    try {
      pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 10000
      });
      console.log("Database connection pool LAZILY created successfully.");
    } catch (error) {
      console.error("FATAL: Failed to LAZILY create database connection pool:", error);
      pool = null; // Ensure pool is null on error
      // throw error; // Or handle more gracefully
    }
  }
  return pool;
};

// connectToDatabase will now ensure pool is initialized
export const connectToDatabase = async () => {
  if (!pool) {
    initializePool(); // Initialize on first call
  }
  if (!pool) { // Check if initialization failed
    throw new Error("Database pool could not be initialized.");
  }
  return pool;
};

export const getDbConnection = async () => {
  if (!pool) {
    initializePool(); // Initialize on first call
  }
  if (!pool) { // Check if initialization failed
    throw new Error("Database pool is not initialized. Cannot get a connection.");
  }
  const connection = await pool.getConnection();
  return connection;
};
/*import mysql from "mysql2/promise";

let connection;

export const connectToDatabase = async () => {
  try {
    if (!connection) {
      connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
      });
    }
    return connection;
  } catch (err) {
    console.log(err);
  }
};
*/
import mysql from "mysql2/promise";

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



// Create the pool once when your application starts
/*
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '1234', // Don't hardcode in production
  database: process.env.DB_NAME || 'your_database',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export const connectToDatabase = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("Successfully connected to database");
    return connection;
  } catch (err) {
    console.error("Database connection error:", err);
    throw err; // Re-throw to handle in calling function
  }
};
*/
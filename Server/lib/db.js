import mysql from "mysql2/promise";

let connection;

export const connectToDatabase = async () => {
  try {
    if (!connection) {
      connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password:'1234',
        database: process.env.DB_NAME,
      });
    }
    return connection;
  } catch (err) {
    console.log(err);
  }
};

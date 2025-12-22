const mysql = require('mysql2');
require('dotenv').config();

// Create the connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME, // Make sure this matches your .env
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Convert to promise-based (easier to use)
const promisePool = pool.promise();

// --- TEST CONNECTION BLOCK ---
pool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Database Connection Failed!");
    console.error("Error Code:", err.code);
    console.error("Error Message:", err.message);
  } else {
    console.log("✅ Successfully connected to MySQL Database!");
    connection.release(); // Release connection back to pool
  }
});

module.exports = promisePool;
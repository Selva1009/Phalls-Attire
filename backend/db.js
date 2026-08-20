const mysql = require("mysql2/promise");
const path = require("path");

// Load environment variables (safe even if already loaded elsewhere)
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const pool = mysql.createPool({
  host: process.env.HOST || "localhost",
  user: process.env.MYSQLUSER || "root",
  password: process.env.PASSWORD || "root1234",
  database: process.env.DB_NAME || "phalls",
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;

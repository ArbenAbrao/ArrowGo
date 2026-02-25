const mysql = require("mysql2");

const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "dbtruck",

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  timezone: "+08:00",
  dateStrings: true,
});

const dbPromise = db.promise();

module.exports = { db, dbPromise };
const mysql = require("mysql2");

// Create MySQL connection (callback style - for old routes)
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "dbtruck",

  // ✅ Important settings
  timezone: "+08:00",   // Philippines timezone
  dateStrings: true     // Return DATE/DATETIME as plain strings (no auto shift)
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error("MySQL Connection Error:", err);
    return;
  }
  console.log("MySQL Connected (callback mode)");
});

// Promise wrapper (for async/await routes)
const dbPromise = db.promise();

module.exports = { db, dbPromise };

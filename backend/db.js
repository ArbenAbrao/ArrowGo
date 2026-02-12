const mysql = require("mysql2");

// ================= HOSTINGER DATABASE CONFIG =================
// Replace these values with the info from your Hostinger hPanel
const db = mysql.createConnection({
  host: "mysql.hostinger.com",      // e.g., "localhost" or "mysql.hostinger.com"
  user: "IT_ADMIN",      // e.g., "truck_user"
  password: "ArrowgoITAdmin", // e.g., "yourpassword"
  database: "dbtruck",  // e.g., "dbtruck"
  
  timezone: "+08:00",        // PH timezone
  dateStrings: true          // Return DATE/DATETIME as strings (no timezone shift)
});

// Connect and log status
db.connect((err) => {
  if (err) {
    console.error("❌ MySQL connection error:", err.message);
    return;
  }
  console.log("✅ MySQL Connected to Hostinger database");
});

// Promise wrapper for async/await routes
const dbPromise = db.promise();

module.exports = { db, dbPromise };

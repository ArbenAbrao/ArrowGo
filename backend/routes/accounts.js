const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const requestIp = require("request-ip");
const axios = require("axios");
const { dbPromise } = require("../db");

/* ================= HELPER: GET LOCATION FROM IP ================= */
async function getLocationFromIP(ip) {
  try {
    if (!ip) return "Unknown Location";

    const response = await axios.get(`http://ip-api.com/json/${ip}`);
    const data = response.data;

    if (data.status === "success") {
      return `${data.city || "Unknown City"}, ${data.regionName || ""}, ${data.country}`;
    }

    return "Unknown Location";
  } catch (error) {
    console.error("IP lookup failed:", error.message);
    return "Unknown Location";
  }
}

/* ================= GET ALL ACCOUNTS (WITH ONLINE STATUS) ================= */
router.get("/accounts", async (req, res) => {
  try {
    const [rows] = await dbPromise.query(`
      SELECT *,
        IF(last_active > NOW() - INTERVAL 5 MINUTE, 1, 0) AS is_online
      FROM accounts
      ORDER BY id DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= CREATE ACCOUNT ================= */
router.post("/accounts", async (req, res) => {
  const { firstName, lastName, email, username, password, role, branch } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await dbPromise.query(
      `INSERT INTO accounts
       (first_name, last_name, email, username, password, role, branch)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [firstName, lastName, email, username, hashedPassword, role, branch]
    );

    const [rows] = await dbPromise.query(
      `SELECT id, first_name, last_name, username, email, role, branch, is_active 
       FROM accounts WHERE id = ?`,
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= LOGIN ================= */
router.post("/login", async (req, res) => {
  const { usernameOrEmail, password } = req.body;

  try {
    let ip = requestIp.getClientIp(req);

// Normalize IPv6
if (ip && ip.includes("::ffff:")) {
  ip = ip.split("::ffff:")[1];
}


console.log("Detected IP:", ip);

const location = await getLocationFromIP(ip);

console.log("Detected Location:", location);


    const [rows] = await dbPromise.query(
      "SELECT * FROM accounts WHERE username = ? OR email = ? LIMIT 1",
      [usernameOrEmail, usernameOrEmail]
    );

    if (!rows.length) {
      await dbPromise.query(
        `INSERT INTO login_logs (username_or_email, status, ip_address, location)
         VALUES (?, 'FAILED', ?, ?)`,
        [usernameOrEmail, ip, location]
      );
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = rows[0];

    if (user.is_active === 0) {
      return res.status(403).json({ message: "Account is disabled" });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      await dbPromise.query(
        `INSERT INTO login_logs (user_id, username_or_email, status, ip_address, location)
         VALUES (?, ?, 'FAILED', ?, ?)`,
        [user.id, usernameOrEmail, ip, location]
      );
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Update last active
    await dbPromise.query(
      "UPDATE accounts SET last_active = NOW() WHERE id = ?",
      [user.id]
    );

    // Log successful login
    await dbPromise.query(
      `INSERT INTO login_logs (user_id, username_or_email, status, ip_address, location)
       VALUES (?, ?, 'SUCCESS', ?, ?)`,
      [user.id, usernameOrEmail, ip, location]
    );

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        branch: user.branch,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= LOGIN HISTORY ================= */
router.get("/login-logs", async (req, res) => {
  try {
    const [rows] = await dbPromise.query(`
      SELECT
        l.id,
        CONCAT(a.first_name, ' ', a.last_name) AS name,
        l.username_or_email,
        l.status,
        l.location,
        l.created_at
      FROM login_logs l
      LEFT JOIN accounts a ON l.user_id = a.id
      ORDER BY l.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= GET ACCOUNT BY ID (FULL INFO) ================= */
router.get("/accounts/:id", async (req, res) => {
  try {
    const [rows] = await dbPromise.query(
      `SELECT 
         id,
         first_name,
         last_name,
         email,
         username,
         role,
         branch,
         last_active
       FROM accounts
       WHERE id = ?`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Account not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= CHANGE PASSWORD ================= */
router.put("/accounts/:id/change-password", async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const { id } = req.params;

  try {
    const [rows] = await dbPromise.query(
      "SELECT password FROM accounts WHERE id = ?",
      [id]
    );

    if (!rows.length)
      return res.status(404).json({ message: "Account not found" });

    const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
    if (!isMatch)
      return res.status(401).json({ message: "Incorrect current password" });

    const hashed = await bcrypt.hash(newPassword, 10);

    await dbPromise.query(
      "UPDATE accounts SET password = ? WHERE id = ?",
      [hashed, id]
    );

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= UPDATE PROFILE ================= */
router.put("/accounts/:id", async (req, res) => {
  const { firstName, lastName, email, username } = req.body;
  const { id } = req.params;

  try {
    await dbPromise.query(
      `UPDATE accounts
       SET first_name = ?, last_name = ?, email = ?, username = ?
       WHERE id = ?`,
      [firstName, lastName, email, username, id]
    );

    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= ADMIN RESET PASSWORD ================= */
router.put("/admin/accounts/:id/reset-password", async (req, res) => {
  const { newPassword } = req.body;
  const { id } = req.params;

  try {
    const hashed = await bcrypt.hash(newPassword, 10);

    const [result] = await dbPromise.query(
      "UPDATE accounts SET password = ? WHERE id = ?",
      [hashed, id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Account not found" });

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= UPDATE ACCOUNT ROLE ================= */
router.put("/admin/accounts/:id/role", async (req, res) => {
  const { role } = req.body;
  const { id } = req.params;

  try {
    const [result] = await dbPromise.query(
      "UPDATE accounts SET role = ? WHERE id = ?",
      [role, id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Account not found" });

    // Return updated account
    const [rows] = await dbPromise.query(
      "SELECT id, first_name, last_name, username, email, role, branch, is_active FROM accounts WHERE id = ?",
      [id]
    );

    res.json({ message: "Role updated successfully", account: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


/* ================= ADMIN ENABLE / DISABLE ACCOUNT ================= */
router.put("/admin/accounts/:id/status", async (req, res) => {
  const { is_active } = req.body;

  try {
    const [result] = await dbPromise.query(
      "UPDATE accounts SET is_active = ? WHERE id = ?",
      [is_active, req.params.id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Account not found" });

    res.json({ message: "Account status updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= ADMIN DELETE ACCOUNT ================= */
router.delete("/admin/accounts/:id", async (req, res) => {
  try {
    const [result] = await dbPromise.query(
      "DELETE FROM accounts WHERE id = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Account not found" });

    res.json({ message: "Account deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

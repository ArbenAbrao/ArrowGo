const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const requestIp = require("request-ip");
const axios = require("axios");
const { dbPromise } = require("../db");
const crypto = require("crypto"); // <-- ADD THIS
const useragent = require("useragent");


router.post("/heartbeat", authMiddleware, async (req, res) => {
  try {
    await dbPromise.query(
      "UPDATE accounts SET last_active = NOW() WHERE id = ?",
      [req.user.id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Heartbeat failed" });
  }
});

/* ================= GET LOGIN LOGS ================= */
router.get("/login-logs", async (req, res) => {
  try {
    const [rows] = await dbPromise.query(
  `SELECT 
      ll.id, 
      ll.user_id, 
      ll.username_or_email, 
      ll.status, 
      ll.ip_address, 
      ll.location, 
      ll.device, 
      ll.browser, 
      ll.os, 
      ll.session_token,
      ll.created_at, -- convert UTC to PH time
      CONCAT(a.first_name, ' ', a.last_name) AS name
   FROM login_logs ll
   LEFT JOIN accounts a ON ll.user_id = a.id
   ORDER BY ll.created_at DESC
   LIMIT 500`
);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
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

  let ip = requestIp.getClientIp(req);
  if (ip && ip.includes("::ffff:")) ip = ip.split("::ffff:")[1];

  const location = await getLocationFromIP(ip);

  const [rows] = await dbPromise.query(
    "SELECT * FROM accounts WHERE username = ? OR email = ? LIMIT 1",
    [usernameOrEmail, usernameOrEmail]
  );

  if (!rows.length) {
    await dbPromise.query(
  `INSERT INTO login_logs 
     (username_or_email, status, ip_address, location, created_at)
   VALUES (?, 'FAILED', ?, ?, NOW())`,
  [usernameOrEmail, ip, location]
);
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const user = rows[0];
  if (user.is_active === 0)
    return res.status(403).json({ message: "Account is disabled" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    await dbPromise.query(
      `INSERT INTO login_logs (user_id, username_or_email, status, ip_address, location)
       VALUES (?, ?, 'FAILED', ?, ?)`,
      [user.id, usernameOrEmail, ip, location]
    );
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // --- Generate session token ---
  const sessionToken = crypto.randomBytes(32).toString("hex");

  // Parse device info
  const agent = useragent.parse(req.headers["user-agent"]);
  const deviceInfo = `${agent.family} on ${agent.os.toString()}`;

  // const isSuspicious = await checkSuspiciousLogin(user.id, deviceInfo, ip);

  // --- Update account ---
  await dbPromise.query(
    `UPDATE accounts 
     SET last_active = NOW(), 
         last_device = ?, 
         last_login_ip = ?, 
         current_session_token = ?
     WHERE id = ?`,
    [deviceInfo, ip, sessionToken, user.id]
  );

  // --- Log login ---
  await dbPromise.query(
  `INSERT INTO login_logs 
     (user_id, username_or_email, status, ip_address, location, device, browser, os, session_token, created_at)
   VALUES (?, ?, 'SUCCESS', ?, ?, ?, ?, ?, ?, NOW())`,
  [user.id, usernameOrEmail, ip, location, agent.family, agent.family, agent.os.toString(), sessionToken]
);

  res.json({
    message: "Login successful",
    user: {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      branch: user.branch,
      sessionToken,
      lastDevice: deviceInfo,
      lastLoginIp: ip,
      //isSuspicious
    },
  });
});

/* ================= AUTH MIDDLEWARE ================= */
async function authMiddleware(req, res, next) {
  const token = req.headers["x-session-token"];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  const [rows] = await dbPromise.query(
    "SELECT * FROM accounts WHERE current_session_token = ?",
    [token]
  );

  if (!rows.length) return res.status(401).json({ message: "Session expired" });

  const user = rows[0];
  const lastActive = new Date(user.last_active);
  const now = new Date();

  // Auto-logout after 15 minutes of inactivity
  if ((now - lastActive) / 1000 / 60 > 15) {
    await dbPromise.query(
      "UPDATE accounts SET current_session_token = NULL WHERE id = ?",
      [user.id]
    );
    return res.status(401).json({ message: "Session expired due to inactivity" });
  }

  // Update last_active on every request
  await dbPromise.query(
    "UPDATE accounts SET last_active = NOW() WHERE id = ?",
    [user.id]
  );

  req.user = user;
  next();
}

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

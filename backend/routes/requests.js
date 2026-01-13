const express = require("express");
const router = express.Router();
const db = require("../db"); // your MySQL connection

// GET all requests
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM requests ORDER BY timestamp DESC");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

// POST new request
router.post("/", async (req, res) => {
  try {
    const { type, data, timestamp } = req.body;
    const [result] = await db.query(
      "INSERT INTO requests (type, data, timestamp) VALUES (?, ?, ?)",
      [type, JSON.stringify(data), timestamp]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create request" });
  }
});

// DELETE request
router.delete("/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM requests WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete request" });
  }
});

module.exports = router;

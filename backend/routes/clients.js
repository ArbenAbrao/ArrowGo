// backend/routes/clients.js
const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all clients
router.get("/", (req, res) => {
  db.query("SELECT * FROM clients ORDER BY id DESC", (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

module.exports = router;

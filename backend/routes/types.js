const express = require("express");
const router = express.Router();
const db = require("../db");

// Get all truck types
router.get("/", (req, res) => {
  db.query("SELECT * FROM truck_types ORDER BY name ASC", (err, rows) => {
    if (err) return res.status(500).json({ error: err });
    res.json(rows);
  });
});

// Add truck type
router.post("/", (req, res) => {
  const { name } = req.body;
  db.query("INSERT INTO truck_types (name) VALUES (?)", [name], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "Truck type added", id: result.insertId });
  });
});

// Delete truck type
router.delete("/:id", (req, res) => {
  db.query("DELETE FROM truck_types WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "Truck type deleted" });
  });
});

module.exports = router;

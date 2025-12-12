const express = require("express");
const router = express.Router();
const db = require("../db");

// ---------- GET all visitors ----------
router.get("/", (req, res) => {
  const sql = "SELECT * FROM visitors ORDER BY date DESC, timeIn DESC";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// ---------- ADD a visitor ----------
router.post("/add", (req, res) => {
  const visitor = {
    ...req.body,
    appointmentRequest: req.body.appointmentRequest ? 1 : 0, // ensure it's 0 or 1
  };

  const sql = "INSERT INTO visitors SET ?";
  db.query(sql, visitor, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ id: result.insertId, ...visitor });
  });
});

// ---------- EDIT a visitor ----------
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const updatedVisitor = req.body;
  const sql = "UPDATE visitors SET ? WHERE id = ?";
  db.query(sql, [updatedVisitor, id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ id: parseInt(id), ...updatedVisitor });
  });
});

// ---------- DELETE a visitor ----------
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM visitors WHERE id = ?";
  db.query(sql, [id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Visitor deleted", id: parseInt(id) });
  });
});

module.exports = router;

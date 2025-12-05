const express = require("express");
const router = express.Router();
const db = require("../db");

// -------------------- REGISTER TRUCK --------------------
router.post("/register-truck", (req, res) => {
  const { clientName, truckType, plateNumber } = req.body;

  db.query("SELECT * FROM clients WHERE plateNumber = ?", [plateNumber], (err, rows) => {
    if (err) return res.status(500).json(err);
    if (rows.length > 0) return res.status(400).json({ error: "Truck already registered" });

    db.query(
      "INSERT INTO clients (clientName, truckType, plateNumber) VALUES (?, ?, ?)",
      [clientName, truckType, plateNumber],
      (err2) => {
        if (err2) return res.status(500).json(err2);
        res.json({ message: "Truck registered successfully" });
      }
    );
  });
});

// -------------------- GET CLIENTS --------------------
router.get("/clients", (req, res) => {
  db.query("SELECT * FROM clients ORDER BY clientName ASC", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

// -------------------- GET TRUCKS --------------------
router.get("/trucks", (req, res) => {
  db.query("SELECT * FROM trucks ORDER BY date DESC, id DESC", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

// -------------------- ADD TRUCK --------------------
router.post("/add-truck", (req, res) => {
  const { clientName, truckType, plateNumber, bay, driver, purpose, date, timeIn } = req.body;
  const sql = `INSERT INTO trucks (clientName, truckType, plateNumber, bay, driver, purpose, date, timeIn)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  db.query(sql, [clientName, truckType, plateNumber, bay, driver, purpose, date, timeIn], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Truck added successfully" });
  });
});

// -------------------- TIME OUT --------------------
router.put("/trucks/:id/timeout", (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM trucks WHERE id = ?", [id], (err, rows) => {
    if (err) return res.status(500).json(err);
    if (!rows.length) return res.status(404).json({ error: "Truck not found" });

    const truck = rows[0];
    const timeIn = new Date(`${truck.date}T${truck.timeIn}`);
    const now = new Date();
    const durationMs = now - timeIn;
    const durationMinutes = Math.floor(durationMs / 60000);
    const durationStr = `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`;
    const timeOut = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    db.query(
      "UPDATE trucks SET timeOut = ?, duration = ? WHERE id = ?",
      [timeOut, durationStr, id],
      (err2) => {
        if (err2) return res.status(500).json(err2);
        res.json({ message: "Truck timed out", timeOut, duration: durationStr });
      }
    );
  });
});

// -------------------- DELETE TRUCK --------------------
router.delete("/trucks/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM trucks WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Truck deleted successfully" });
  });
});

module.exports = router;

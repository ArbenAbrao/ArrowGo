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

router.post("/register-truck", async (req, res) => {
  try {
    const {
      plate_number,
      truck_type,
      client_name,
      brand_name,
      model,
      fuel_type,
      displacement,
      payload_capacity,
      branch,
    } = req.body;

    const timestamp = new Date();

    const [result] = await db.query(
      `INSERT INTO \`register-truck\`
      (plate_number, truck_type, client_name, brand_name, model, fuel_type, displacement, payload_capacity, branch, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        plate_number,
        truck_type,
        client_name,
        brand_name,
        model,
        fuel_type,
        displacement,
        payload_capacity,
        branch,
        timestamp,
      ]
    );

    res.status(201).json({
      id: result.insertId,
      message: "Truck registered successfully",
    });
  } catch (err) {
    console.error("Failed to register truck:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
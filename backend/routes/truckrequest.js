const express = require("express");
const router = express.Router();
const { dbPromise } = require("../db"); // ✅ use promise-based DB

/* ===============================
   CREATE TRUCK REQUEST (SUBMIT)
================================ */
router.post("/truck-requests", async (req, res) => {
  const {
    plateNumber,
    truckType,
    clientName,
    brandName,
    model,
    fuelType,
    displacement,
    payloadCapacity,
    branch,
  } = req.body;

  const sql = `
    INSERT INTO request_truck
    (plate_number, truck_type, client_name, brand_name, model, fuel_type, displacement, payload_capacity, branch, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `;

  try {
    const [result] = await dbPromise.query(sql, [
      plateNumber,
      truckType,
      clientName,
      brandName,
      model,
      fuelType,
      displacement,
      payloadCapacity,
      branch,
    ]);

    res.status(201).json({ message: "Truck request submitted", id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to save request" });
  }
});

/* ===============================
   GET ALL PENDING REQUESTS
================================ */
router.get("/truck-requests", async (req, res) => {
  try {
    const [rows] = await dbPromise.query(
      "SELECT * FROM request_truck WHERE status = 'pending' ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch pending truck requests" });
  }
});

/* ===============================
   APPROVE REQUEST
================================ */
router.put("/truck-requests/:id/approve", async (req, res) => {
  const { id } = req.params;

  try {
    await dbPromise.query("UPDATE request_truck SET status='approved' WHERE id=?", [id]);
    res.json({ message: "Request approved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to approve request" });
  }
});

/* ===============================
   REJECT REQUEST
================================ */
router.put("/truck-requests/:id/reject", async (req, res) => {
  const { id } = req.params;

  try {
    await dbPromise.query("UPDATE request_truck SET status='rejected' WHERE id=?", [id]);
    res.json({ message: "Request rejected" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to reject request" });
  }
});

module.exports = router;

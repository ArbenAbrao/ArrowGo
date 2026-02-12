const express = require("express");
const router = express.Router();
const { dbPromise } = require("../db"); // ✅ use promise-based DB

/* ===============================
   REQUEST ANALYTICS / REPORT
================================ */
router.get("/analytics", async (req, res) => {
  try {
    /* COUNTS */
    const [[appointments]] = await dbPromise.query(`
      SELECT COUNT(*) AS count
      FROM appointment_requests
      WHERE status IS NULL OR status = 'pending'
    `);

    const [[trucks]] = await dbPromise.query(`
      SELECT COUNT(*) AS count
      FROM request_truck
      WHERE status = 'pending'
    `);

    /* RECENT APPOINTMENTS */
    const [recentAppointments] = await dbPromise.query(`
      SELECT 
        id,
        visitor_name AS name,
        person_to_visit,
        branch,
        created_at
      FROM appointment_requests
      WHERE status IS NULL OR status = 'pending'
      ORDER BY created_at DESC
      LIMIT 5
    `);

    /* RECENT TRUCKS */
    const [recentTrucks] = await dbPromise.query(`
      SELECT 
        id,
        client_name AS name,
        plate_number,
        branch,
        created_at
      FROM request_truck
      WHERE status = 'pending'
      ORDER BY created_at DESC
      LIMIT 5
    `);

    res.json({
      totalPending: appointments.count + trucks.count,
      appointmentPending: appointments.count,
      truckPending: trucks.count,
      recent: {
        appointments: recentAppointments,
        trucks: recentTrucks,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load request analytics" });
  }
});

module.exports = router;

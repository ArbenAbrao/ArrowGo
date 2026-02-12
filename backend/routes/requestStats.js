const express = require("express");
const router = express.Router();
const { dbPromise } = require("../db"); // ✅ use promise-based DB

/* ===============================
   REQUEST STATS
   =============================== */
router.get("/", async (req, res) => {
  try {
    const [[stats]] = await dbPromise.query(`
      SELECT
        COUNT(*) AS totalRequests,
        SUM(type = 'truck') AS truckRequests,
        SUM(type = 'appointment') AS appointmentRequests,
        SUM(status IS NULL OR status = 'pending') AS pendingRequests
      FROM requests
    `);

    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch request stats" });
  }
});

module.exports = router;

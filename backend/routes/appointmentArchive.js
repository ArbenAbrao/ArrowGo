// routes/appointmentArchive.js
//
// Archive endpoints for appointment requests, written in the same style as
// your visitors router (dbPromise + mysql2).
//
// SETUP
// 1) Run this once against your database:
//
//      ALTER TABLE appointment_requests
//        ADD COLUMN archived TINYINT(1) NOT NULL DEFAULT 0,
//        ADD COLUMN archivedAt DATETIME NULL;
//
// 2) Mount this BEFORE your existing appointment-requests router, on the same
//    prefix. Order matters: if your router has a `GET /:id`, it would swallow
//    `GET /archived` otherwise.
//
//      app.use("/api/appointment-requests", require("./routes/appointmentArchive"));
//      app.use("/api/appointment-requests", require("./routes/appointmentRequests")); // yours
//
// 3) In your existing `GET /approved` query, add `AND archived = 0` so archived
//    rows stop showing up as active requests.

const express = require("express");
const router = express.Router();
const { dbPromise } = require("../db");

// ⚠️ I haven't seen your appointment-requests router, so check these two match
// your schema. DATE_COLUMN is the visit-date column — the same one you'd list
// in DATE_FIELDS in appointmentUtils.js on the frontend.
const TABLE = "appointment_requests";
const DATE_COLUMN = "date";

/* ==================== GET ARCHIVED REQUESTS ==================== */
router.get("/archived", async (req, res) => {
  const { branch } = req.query; // sent for everyone except IT

  try {
    const [rows] = branch
      ? await dbPromise.query(
          "SELECT * FROM ?? WHERE archived = 1 AND branch = ? ORDER BY ?? DESC",
          [TABLE, branch, DATE_COLUMN]
        )
      : await dbPromise.query(
          "SELECT * FROM ?? WHERE archived = 1 ORDER BY ?? DESC",
          [TABLE, DATE_COLUMN]
        );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch archived requests" });
  }
});

/* ==================== ARCHIVE A REQUEST ==================== */
// Idempotent on purpose: the gate PC and the IT PC can both poll and try to
// archive the same expired request, and the second one shouldn't error.
router.put("/:id/archive", async (req, res) => {
  const { id } = req.params;

  try {
    await dbPromise.query(
      "UPDATE ?? SET archived = 1, archivedAt = NOW() WHERE id = ? AND archived = 0",
      [TABLE, id]
    );
    res.json({ message: "Request archived", id: parseInt(id) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to archive request" });
  }
});

/* ==================== RESTORE A REQUEST ==================== */
// Needs a new visit date; otherwise it would be expired again on the next poll.
router.put("/:id/restore", async (req, res) => {
  const { id } = req.params;
  const newDate = req.body[DATE_COLUMN];

  if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate || "")) {
    return res.status(400).json({ message: "A new visit date (YYYY-MM-DD) is required" });
  }

  try {
    const [result] = await dbPromise.query(
      "UPDATE ?? SET archived = 0, archivedAt = NULL, ?? = ? WHERE id = ? AND archived = 1",
      [TABLE, DATE_COLUMN, newDate, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Archived request not found" });
    }
    res.json({ message: "Request restored", id: parseInt(id), [DATE_COLUMN]: newDate });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to restore request" });
  }
});

/* ==================== DELETE AN ARCHIVED REQUEST ==================== */
// Only ever hard-deletes rows that are already archived. If nothing matches,
// it falls through with next() so a `DELETE /:id` in your existing router (if
// you have one) still handles active requests as before.
router.delete("/:id", async (req, res, next) => {
  const { id } = req.params;

  try {
    const [result] = await dbPromise.query(
      "DELETE FROM ?? WHERE id = ? AND archived = 1",
      [TABLE, id]
    );

    if (result.affectedRows === 0) return next();
    res.json({ message: "Request deleted", id: parseInt(id) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete request" });
  }
});

module.exports = router;
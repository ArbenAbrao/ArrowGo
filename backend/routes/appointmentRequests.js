const express = require("express");
const router = express.Router();
const { dbPromise } = require("../db"); // ✅ use promise-style
const { sendAppointmentStatusEmail } = require("../utils/mailer");

/* ===============================
   GET ONLY PENDING REQUESTS
   =============================== */
router.get("/", async (req, res) => {
  try {
    const [rows] = await dbPromise.query(
      `
      SELECT *
      FROM appointment_requests
      WHERE status IS NULL OR status = 'pending'
      ORDER BY created_at DESC
      `
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch appointment requests" });
  }
});

/* ===============================
   CREATE APPOINTMENT REQUEST
   =============================== */
router.post("/", async (req, res) => {
  const {
    visitorName,
    company,
    email,
    personToVisit,
    purpose,
    date,
    scheduleTime,
    branch,
  } = req.body;

  try {
    const [result] = await dbPromise.query(
      `
      INSERT INTO appointment_requests
      (visitor_name, company, email, person_to_visit, purpose, date, schedule_time, branch, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `,
      [visitorName, company, email || null, personToVisit, purpose, date, scheduleTime, branch]
    );

    res.status(201).json({ id: result.insertId, ...req.body, status: "pending" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create appointment request" });
  }
});

/* ===============================
   APPROVE APPOINTMENT
   =============================== */
router.put("/:id/approve", async (req, res) => {
  const { id } = req.params;

  try {
    const [[appointment]] = await dbPromise.query(
      "SELECT * FROM appointment_requests WHERE id = ?",
      [id]
    );

    await dbPromise.query(
      "UPDATE appointment_requests SET status='approved' WHERE id=?",
      [id]
    );

    if (appointment) {
      // fire-and-forget — a failed email should not fail the approval
      sendAppointmentStatusEmail(appointment.email, {
        visitorName: appointment.visitor_name,
        status: "approved",
        branch: appointment.branch,
        date: appointment.date,
        scheduleTime: appointment.schedule_time,
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to approve appointment" });
  }
});

/* ===============================
   REJECT APPOINTMENT
   =============================== */
router.put("/:id/reject", async (req, res) => {
  const { id } = req.params;

  try {
    const [[appointment]] = await dbPromise.query(
      "SELECT * FROM appointment_requests WHERE id = ?",
      [id]
    );

    await dbPromise.query(
      "UPDATE appointment_requests SET status = 'rejected' WHERE id = ?",
      [id]
    );

    if (appointment) {
      sendAppointmentStatusEmail(appointment.email, {
        visitorName: appointment.visitor_name,
        status: "rejected",
        branch: appointment.branch,
        date: appointment.date,
        scheduleTime: appointment.schedule_time,
      });
    }

    res.json({ message: "Appointment rejected" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Rejection failed" });
  }
});




// appointmentrequest.js
router.get("/approved", async (req, res) => {
  try {
    const [rows] = await dbPromise.query(
      "SELECT * FROM appointment_requests WHERE status = 'approved'"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch approved appointments" });
  }
});
 


router.put("/:id/accept", async (req, res) => {
  const { id } = req.params;

  try {
    const [[appointment]] = await dbPromise.query(
      "SELECT * FROM appointment_requests WHERE id = ? AND status = 'approved'",
      [id]
    );

    if (!appointment) {
      return res
        .status(404)
        .json({ message: "Appointment not found or not approved" });
    }

    const now = new Date();

    const dateIn = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const timeIn = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // ✅ INSERT VISITOR (ONLY HERE)
    await dbPromise.query(
      `
      INSERT INTO visitors
      (visitorName, company, personToVisit, purpose, branch, date, timeIn, timeOut, appointmentRequest)
      VALUES (?, ?, ?, ?, ?, ?, ?, '', 1)
      `,
      [
        appointment.visitor_name,
        appointment.company,
        appointment.person_to_visit,
        appointment.purpose,
        appointment.branch,
        dateIn,
        timeIn,
      ]
    );

    // ✅ MARK APPOINTMENT DONE
    await dbPromise.query(
      "UPDATE appointment_requests SET status = 'done' WHERE id = ?",
      [id]
    );

    res.json({ message: "Appointment accepted and timed in" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Accept failed" });
  }
});




module.exports = router;
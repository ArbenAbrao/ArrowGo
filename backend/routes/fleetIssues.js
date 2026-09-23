// backend/routes/fleetIssues.js
//
// Backs the Fleet Monitoring page (FleetMonitoring.jsx). Two concerns:
//
//   1. Issue tracking  -> /api/fleet-issues
//      Matches the shape FleetMonitoring.jsx already expects from
//      ISSUES_ENDPOINT: GET (list), POST (create), PUT /:id (status),
//      DELETE /:id.
//
//   2. PDF records     -> /api/fleet-records
//      New: lets a user attach a PDF at the Branch > Truck > Year > Month
//      level in the Records browser, list what's attached for a given
//      truck+month, and view/download a specific file.
//
// Both use the same multer + dbPromise pattern as trucks.js so this
// slots into the existing app without new dependencies.

const express = require("express");
const router = express.Router();
const { dbPromise } = require("../db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

/* ==================== ISSUE TRACKING ==================== */

// GET /api/fleet-issues
// Full list — FleetMonitoring.jsx does its own filtering/sorting client-side.
router.get("/fleet-issues", async (req, res) => {
  try {
    const [rows] = await dbPromise.query(
      "SELECT * FROM fleet_issues ORDER BY date DESC, id DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch fleet issues" });
  }
});

// POST /api/fleet-issues
// submitLog() in FleetMonitoring.jsx sends { ...logForm, status: "Active" }.
router.post("/fleet-issues", async (req, res) => {
  const { plateNumber, branchRegistered, driver, priority, issue, date, status } = req.body;

  if (!plateNumber || !driver || !issue || !date) {
    return res.status(400).json({ error: "plateNumber, driver, issue, and date are required" });
  }

  try {
    const [result] = await dbPromise.query(
      `INSERT INTO fleet_issues (plateNumber, branchRegistered, driver, priority, issue, status, date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        plateNumber,
        branchRegistered || null,
        driver,
        priority || "Medium",
        issue,
        status || "Active",
        date,
      ]
    );

    const [rows] = await dbPromise.query("SELECT * FROM fleet_issues WHERE id = ?", [result.insertId]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to log issue" });
  }
});

// PUT /api/fleet-issues/:id
// toggleIssueStatus() sends { status }. Kept generic so any field on
// logForm could be edited later without a new route.
router.put("/fleet-issues/:id", async (req, res) => {
  const { id } = req.params;
  const { status, priority, driver, issue, date } = req.body;

  const fields = [];
  const params = [];

  if (status !== undefined) { fields.push("status = ?"); params.push(status); }
  if (priority !== undefined) { fields.push("priority = ?"); params.push(priority); }
  if (driver !== undefined) { fields.push("driver = ?"); params.push(driver); }
  if (issue !== undefined) { fields.push("issue = ?"); params.push(issue); }
  if (date !== undefined) { fields.push("date = ?"); params.push(date); }

  if (!fields.length) return res.status(400).json({ error: "No fields to update" });

  params.push(id);

  try {
    const [result] = await dbPromise.query(
      `UPDATE fleet_issues SET ${fields.join(", ")} WHERE id = ?`,
      params
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: "Issue not found" });

    const [rows] = await dbPromise.query("SELECT * FROM fleet_issues WHERE id = ?", [id]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update issue" });
  }
});

// DELETE /api/fleet-issues/:id
router.delete("/fleet-issues/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await dbPromise.query("DELETE FROM fleet_issues WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Issue not found" });
    res.json({ message: "Issue deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete issue" });
  }
});

/* ==================== PDF RECORDS (Branch > Truck > Year > Month) ==================== */

const recordsDir = path.join(__dirname, "../uploads/fleet-records");
if (!fs.existsSync(recordsDir)) {
  fs.mkdirSync(recordsDir, { recursive: true });
}

const recordsStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, recordsDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;
    cb(null, uniqueName);
  },
});

// PDF-only guard — the frontend only ever wants to insert/view a PDF
// at this level, so reject anything else at upload time rather than
// trusting the client's file picker `accept` attribute.
const recordsUpload = multer({
  storage: recordsStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed"));
  },
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

// GET /api/fleet-records?plateNumber=...&year=...&month=...
// Lists PDFs attached to one truck's month — used when the Records
// browser drills into a specific month folder.
router.get("/fleet-records", async (req, res) => {
  const { plateNumber, year, month } = req.query;

  if (!plateNumber || year === undefined || month === undefined) {
    return res.status(400).json({ error: "plateNumber, year, and month are required" });
  }

  try {
    const [rows] = await dbPromise.query(
      `SELECT * FROM fleet_records WHERE plateNumber = ? AND year = ? AND month = ? ORDER BY uploadedAt DESC`,
      [plateNumber, year, month]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch records" });
  }
});

// POST /api/fleet-records
// multipart/form-data: file field name "pdfFile", plus plateNumber,
// branchRegistered, year, month, uploadedBy in the body.
router.post("/fleet-records", recordsUpload.single("pdfFile"), async (req, res) => {
  const { plateNumber, branchRegistered, year, month, uploadedBy } = req.body;

  if (!req.file) return res.status(400).json({ error: "No PDF uploaded" });
  if (!plateNumber || year === undefined || month === undefined) {
    // Clean up the orphaned upload if required fields are missing.
    fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: "plateNumber, year, and month are required" });
  }

  const fileUrl = `/uploads/fleet-records/${req.file.filename}`;

  try {
    const [result] = await dbPromise.query(
      `INSERT INTO fleet_records (plateNumber, branchRegistered, year, month, fileName, originalName, fileUrl, uploadedBy)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        plateNumber,
        branchRegistered || null,
        year,
        month,
        req.file.filename,
        req.file.originalname,
        fileUrl,
        uploadedBy || null,
      ]
    );

    const [rows] = await dbPromise.query("SELECT * FROM fleet_records WHERE id = ?", [result.insertId]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    // If DB insert fails after the file already landed on disk, remove it
    // so it doesn't sit around unreferenced.
    fs.unlink(req.file.path, () => {});
    res.status(500).json({ error: "Failed to save record" });
  }
});

// GET /api/fleet-records/:id/view
// Streams the PDF inline (Content-Disposition: inline) so the frontend
// can open it in a new tab / <iframe> / <embed> rather than forcing a download.
router.get("/fleet-records/:id/view", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await dbPromise.query("SELECT * FROM fleet_records WHERE id = ?", [id]);
    if (!rows.length) return res.status(404).json({ error: "Record not found" });

    const record = rows[0];
    const filePath = path.join(recordsDir, record.fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File missing on disk" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${record.originalName}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load PDF" });
  }
});

// DELETE /api/fleet-records/:id
router.delete("/fleet-records/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await dbPromise.query("SELECT * FROM fleet_records WHERE id = ?", [id]);
    if (!rows.length) return res.status(404).json({ error: "Record not found" });

    const record = rows[0];
    const filePath = path.join(recordsDir, record.fileName);

    await dbPromise.query("DELETE FROM fleet_records WHERE id = ?", [id]);
    fs.unlink(filePath, () => {}); // best-effort; DB row is already gone either way

    res.json({ message: "Record deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete record" });
  }
});

module.exports = router;
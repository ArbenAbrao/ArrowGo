const express = require("express");
const router = express.Router();
const { dbPromise } = require("../db"); // ✅ use promise-based DB

/* ==================== GET ALL VISITORS ==================== */
router.get("/", async (req, res) => {
  try {
    const [visitors] = await dbPromise.query(
      "SELECT * FROM visitors ORDER BY date DESC, timeIn DESC"
    );
    res.json(visitors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch visitors" });
  }
});

/* ==================== ADD A VISITOR ==================== */
router.post("/add", async (req, res) => {
  const visitor = {
    visitorName: req.body.visitorName,
    company: req.body.company,
    personToVisit: req.body.personToVisit,
    purpose: req.body.purpose,
    idType: req.body.idType,
    idNumber: req.body.idNumber,
    badgeNumber: req.body.badgeNumber,
    branch: req.body.branch || "",
    vehicleMode: req.body.vehicleMode,
    vehicleDetails: req.body.vehicleDetails,
    date: req.body.date,
    timeIn: req.body.timeIn || "",
    timeOut: req.body.timeOut || "",
    appointmentRequest: req.body.appointmentRequest ? 1 : 0,
  };

  try {
    const [result] = await dbPromise.query("INSERT INTO visitors SET ?", [visitor]);
    res.json({ id: result.insertId, ...visitor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add visitor" });
  }
});

/* ==================== EDIT A VISITOR ==================== */
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const updatedVisitor = {
    visitorName: req.body.visitorName,
    company: req.body.company,
    personToVisit: req.body.personToVisit,
    purpose: req.body.purpose,
    idType: req.body.idType,
    idNumber: req.body.idNumber,
    badgeNumber: req.body.badgeNumber,
    branch: req.body.branch || "",
    vehicleMode: req.body.vehicleMode,
    vehicleDetails: req.body.vehicleDetails,
    date: req.body.date,
    timeIn: req.body.timeIn || "",
    timeOut: req.body.timeOut || "",
    appointmentRequest: req.body.appointmentRequest ? 1 : 0,
  };

  try {
    await dbPromise.query("UPDATE visitors SET ? WHERE id = ?", [updatedVisitor, id]);
    res.json({ id: parseInt(id), ...updatedVisitor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update visitor" });
  }
});

/* ==================== DELETE A VISITOR ==================== */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await dbPromise.query("DELETE FROM visitors WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Visitor not found" });
    }
    res.json({ message: "Visitor deleted", id: parseInt(id) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete visitor" });
  }
});

module.exports = router;

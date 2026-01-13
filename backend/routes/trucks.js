const express = require("express");
const router = express.Router();
const db = require("../db");
const QRCode = require("qrcode");

/* ==================== REGISTER TRUCK ==================== */
router.post("/register-truck", async (req, res) => {
  const { clientName, truckType, plateNumber } = req.body;

  db.query(
    "SELECT * FROM clients WHERE plateNumber = ?",
    [plateNumber],
    async (err, rows) => {
      if (err) return res.status(500).json(err);
      if (rows.length > 0) {
        return res.status(400).json({ error: "Truck already registered" });
      }

      try {
        const qrValue = `PLATE:${plateNumber}|CLIENT:${clientName}|TYPE:${truckType}`;
        const qrBuffer = await QRCode.toBuffer(qrValue, {
          type: "png",
          width: 300,
        });

        db.query(
          "INSERT INTO clients (clientName, truckType, plateNumber, qrCode) VALUES (?, ?, ?, ?)",
          [clientName, truckType, plateNumber, qrBuffer],
          (err2, result) => {
            if (err2) return res.status(500).json(err2);
            res.json({ message: "OK", id: result.insertId });
          }
        );
      } catch (e) {
        res.status(500).json({ error: "QR generation failed" });
      }
    }
  );
});

/* ==================== GET CLIENTS ==================== */
router.get("/clients", (req, res) => {
  db.query("SELECT * FROM clients ORDER BY clientName ASC", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

/* ==================== DELETE REGISTERED TRUCK (CLIENTS TABLE) ==================== */
router.delete("/clients/:id", (req, res) => {
  const { id } = req.params;

  db.query(
    "DELETE FROM clients WHERE id = ?",
    [id],
    (err, result) => {
      if (err) return res.status(500).json(err);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Client not found" });
      }

      res.json({ message: "Registered truck deleted successfully" });
    }
  );
});

/* ==================== GET TRUCKS ==================== */
router.get("/trucks", (req, res) => {
  db.query(
    "SELECT * FROM trucks ORDER BY date DESC, id DESC",
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result);
    }
  );
});

/* ==================== ADD TRUCK ==================== */
router.post("/add-truck", (req, res) => {
  const {
    clientName,
    truckType,
    plateNumber,
    bay,
    driver,
    purpose,
    date,
    timeIn,
  } = req.body;

  db.query(
    `
    INSERT INTO trucks
    (clientName, truckType, plateNumber, bay, driver, purpose, date, timeIn)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [clientName, truckType, plateNumber, bay, driver, purpose, date, timeIn],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Truck added successfully" });
    }
  );
});

/* ==================== TIME OUT ==================== */
router.put("/trucks/:id/timeout", (req, res) => {
  const { id } = req.params;

  db.query("SELECT * FROM trucks WHERE id = ?", [id], (err, rows) => {
    if (err) return res.status(500).json(err);
    if (!rows.length) {
      return res.status(404).json({ error: "Truck not found" });
    }

    const truck = rows[0];
    const timeIn = new Date(`${truck.date}T${truck.timeIn}`);
    const now = new Date();

    const durationMs = now - timeIn;
    const durationMinutes = Math.floor(durationMs / 60000);
    const durationStr = `${Math.floor(durationMinutes / 60)}h ${
      durationMinutes % 60
    }m`;

    const timeOut = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const timeOutDate = now.toISOString().split("T")[0]; // YYYY-MM-DD

    db.query(
      "UPDATE trucks SET timeOut = ?, timeOutDate = ?, duration = ? WHERE id = ?",
      [timeOut, timeOutDate, durationStr, id],
      (err2) => {
        if (err2) return res.status(500).json(err2);

        res.json({
          message: "Truck timed out",
          timeOut,
          timeOutDate,
          duration: durationStr,
        });
      }
    );
  });
});


/* ==================== DELETE TRUCK (TRUCKS TABLE) ==================== */
router.delete("/trucks/:id", (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM trucks WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Truck deleted successfully" });
  });
});

/* ==================== TOTAL REGISTERED TRUCKS ==================== */
router.get("/total-registered", (req, res) => {
  db.query(
    "SELECT COUNT(*) AS totalTrucks FROM clients",
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ totalTrucks: result[0].totalTrucks });
    }
  );
});

/* ==================== IN / OUT REPORT ==================== */
router.get("/in-out-report", (req, res) => {
  db.query(
    `
    SELECT
      SUM(CASE WHEN timeOut IS NULL THEN 1 ELSE 0 END) AS trucksIn,
      SUM(CASE WHEN timeOut IS NOT NULL THEN 1 ELSE 0 END) AS trucksOut
    FROM trucks
    `,
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result[0]);
    }
  );
});

/* ==================== GET QR CODE ==================== */
router.get("/clients/:id/qrcode", (req, res) => {
  const { id } = req.params;

  db.query(
    "SELECT qrCode FROM clients WHERE id = ?",
    [id],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      if (!rows.length || !rows[0].qrCode)
        return res.status(404).send("QR not found");

      res.setHeader("Content-Type", "image/png");
      res.send(rows[0].qrCode);
    }
  );
});

module.exports = router;

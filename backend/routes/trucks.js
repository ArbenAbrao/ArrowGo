const express = require("express");
const router = express.Router();
const { dbPromise } = require("../db");
const QRCode = require("qrcode");
// routes/trucks.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload folder exists
const uploadDir = path.join(__dirname, "../uploads/trucks");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

router.put("/clients/:id/upload-image", upload.single("truckImage"), async (req, res) => {
  try {
    console.log("Req params:", req.params);
    console.log("Req file:", req.file);

    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const imageUrl = `/uploads/trucks/${req.file.filename}`;

    const [result] = await dbPromise.query(
      "UPDATE clients SET imageUrl = ? WHERE id = ?",
      [imageUrl, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Client not found" });
    }

    res.json({ message: "Truck image updated successfully", imageUrl });
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ error: "Failed to update truck image" });
  }
});
/* ==================== UPLOAD TRUCK IMAGE ==================== */
router.put(
  "/clients/:id/upload-image",
  upload.single("truckImage"),
  async (req, res) => {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const imageUrl = `/uploads/trucks/${req.file.filename}`;

    try {
      const [result] = await dbPromise.query(
        "UPDATE clients SET imageUrl = ? WHERE id = ?",
        [imageUrl, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Client not found" });
      }

      res.json({ message: "Truck image updated successfully", imageUrl });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update truck image" });
    }
  }
);


/* ==================== REGISTER TRUCK ==================== */
router.post(
  "/register-truck",
  upload.single("truckImage"),
  async (req, res) => {
    const {
      clientName,
      truckType,
      plateNumber,
      brandName,
      model,
      fuelType,
      displacement,
      payloadCapacity,
      branchRegistered,
    } = req.body;

    const imageUrl = req.file
      ? `/uploads/trucks/${req.file.filename}`
      : null;

    try {
      const [existing] = await dbPromise.query(
        "SELECT id FROM clients WHERE plateNumber = ?",
        [plateNumber]
      );

      if (existing.length > 0) {
        return res.status(400).json({ error: "Truck already registered" });
      }

      const qrValue = `PLATE:${plateNumber}|CLIENT:${clientName}|TYPE:${truckType}|BRANCH:${branchRegistered}`;
      const qrBuffer = await QRCode.toBuffer(qrValue, {
        type: "png",
        width: 300,
      });

      const [result] = await dbPromise.query(
        `
        INSERT INTO clients
        (clientName, branchRegistered, truckType, plateNumber, brandName, model, fuelType, displacement, payloadCapacity, qrCode, imageUrl)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          clientName,
          branchRegistered,
          truckType,
          plateNumber,
          brandName,
          model,
          fuelType,
          displacement,
          payloadCapacity,
          qrBuffer,
          imageUrl,
        ]
      );

      res.json({
        message: "Truck registered successfully",
        id: result.insertId,
        imageUrl,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Truck registration failed" });
    }
  }
);


/* ==================== TRUCKS PER BRANCH PER CLIENT ==================== */
router.get("/trucks-per-branch-client", async (req, res) => {
  try {
    const [rows] = await dbPromise.query(`
      SELECT
        branchRegistered,
        clientName,
        COUNT(*) AS totalTrucks
      FROM clients
      GROUP BY branchRegistered, clientName
      ORDER BY branchRegistered ASC, clientName ASC
    `);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch trucks per branch per client" });
  }
});



/* ==================== REGISTERED TRUCKS PER BRANCH ==================== */
router.get("/branches-registered-trucks", async (req, res) => {
  try {
    const [rows] = await dbPromise.query(`
      SELECT 
        branchRegistered AS branchName,
        COUNT(*) AS totalTrucks
      FROM clients
      GROUP BY branchRegistered
      ORDER BY branchName ASC
    `);

    res.json(rows); // Each item has { branchName, totalTrucks }
  } catch (err) {
    console.error("Failed to fetch registered trucks per branch:", err);
    res.status(500).json({ message: "Failed to fetch registered trucks per branch" });
  }
});


/* ==================== GET CLIENTS ==================== */
router.get("/clients", async (req, res) => {
  try {
    const [clients] = await dbPromise.query(
      "SELECT * FROM clients ORDER BY clientName ASC"
    );
    res.json(clients);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch clients" });
  }
});

/* ==================== DELETE REGISTERED TRUCK ==================== */
router.delete("/clients/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await dbPromise.query(
      "DELETE FROM clients WHERE id = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Client not found" });
    }
    res.json({ message: "Registered truck deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete client" });
  }
});

/* ==================== GET TRUCKS ==================== */
router.get("/trucks", async (req, res) => {
  try {
    const [trucks] = await dbPromise.query(`
      SELECT 
        t.*,
        c.id AS clientTruckId
      FROM trucks t
      LEFT JOIN clients c
        ON t.plateNumber = c.plateNumber
      ORDER BY t.date DESC, t.id DESC
    `);

    res.json(trucks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch trucks" });
  }
});


/* ==================== ADD TRUCK ==================== */
router.post("/add-truck", async (req, res) => {
  const {
    clientName,
    branchRegistered,
    truckType,
    plateNumber,
    bay,
    driver,
    purpose,
    date,
    timeIn,
  } = req.body;

  try {
    const [result] = await dbPromise.query(
      `
      INSERT INTO trucks
      (clientName, branchRegistered, truckType, plateNumber, bay, driver, purpose, date, timeIn)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        clientName,
        branchRegistered,
        truckType,
        plateNumber,
        bay,
        driver,
        purpose,
        date,
        timeIn,
      ]
    );

    res.json({ message: "Truck added successfully", id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add truck" });
  }
});

/* ==================== ✅ TIME IN (NEW) ==================== */
router.put("/trucks/:id/timein", async (req, res) => {
  const { id } = req.params;
  const { date, timeIn } = req.body;

  if (!date || !timeIn) {
    return res.status(400).json({ error: "Date and Time In are required" });
  }

  try {
    const [rows] = await dbPromise.query(
      "SELECT timeIn FROM trucks WHERE id = ?",
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Truck not found" });
    }

    if (rows[0].timeIn) {
      return res.status(400).json({ error: "Time In already set" });
    }

    await dbPromise.query(
      "UPDATE trucks SET date = ?, timeIn = ? WHERE id = ?",
      [date, timeIn, id]
    );

    res.json({ message: "Time In set successfully", date, timeIn });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to set Time In" });
  }
});

/* ==================== TIME OUT ==================== */
router.put("/trucks/:id/timeout", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await dbPromise.query(
      "SELECT * FROM trucks WHERE id = ?",
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Truck not found" });
    }

    const truck = rows[0];
    if (!truck.timeIn) {
      return res.status(400).json({ error: "Time In not set" });
    }

    const timeInDate = new Date(`${truck.date}T${truck.timeIn}`);
    const now = new Date();

    const durationMs = now - timeInDate;
    const durationMinutes = Math.floor(durationMs / 60000);
    const durationStr = `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`;

    const timeOut = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const timeOutDate = now.toISOString().split("T")[0];

    await dbPromise.query(
      "UPDATE trucks SET timeOut = ?, timeOutDate = ?, duration = ? WHERE id = ?",
      [timeOut, timeOutDate, durationStr, id]
    );

    res.json({
      message: "Truck timed out",
      timeOut,
      timeOutDate,
      duration: durationStr,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to time out truck" });
  }
});

/* ==================== EDIT TRUCK ==================== */
router.put("/trucks/:id", async (req, res) => {
  const { id } = req.params;
  const { driver, purpose, bay } = req.body; // fields you want to edit

  try {
    const [rows] = await dbPromise.query(
      "SELECT * FROM trucks WHERE id = ?",
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Truck not found" });
    }

    await dbPromise.query(
      "UPDATE trucks SET driver = ?, purpose = ?, bay = ? WHERE id = ?",
      [driver, purpose, bay, id]
    );

    // Fetch updated truck
    const [updated] = await dbPromise.query("SELECT * FROM trucks WHERE id = ?", [id]);

    res.json({ message: "Truck updated successfully", truck: updated[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update truck" });
  }
});


/* ==================== DELETE TRUCK ==================== */
router.delete("/trucks/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await dbPromise.query("DELETE FROM trucks WHERE id = ?", [id]);
    res.json({ message: "Truck deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete truck" });
  }
});

/* ==================== TOTAL REGISTERED ==================== */
router.get("/total-registered", async (req, res) => {
  try {
    const [result] = await dbPromise.query(
      "SELECT COUNT(*) AS totalTrucks FROM clients"
    );
    res.json({ totalTrucks: result[0].totalTrucks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch total registered trucks" });
  }
});

/* ==================== IN / OUT REPORT ==================== */
router.get("/in-out-report", async (req, res) => {
  try {
    const [result] = await dbPromise.query(`
      SELECT
        SUM(CASE WHEN timeOut IS NULL THEN 1 ELSE 0 END) AS trucksIn,
        SUM(CASE WHEN timeOut IS NOT NULL THEN 1 ELSE 0 END) AS trucksOut
      FROM trucks
    `);
    res.json(result[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch in/out report" });
  }
});

/* ==================== GET QR CODE ==================== */
router.get("/clients/:id/qrcode", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await dbPromise.query(
      "SELECT qrCode FROM clients WHERE id = ?",
      [id]
    );

    if (!rows.length || !rows[0].qrCode) {
      return res.status(404).send("QR not found");
    }

    res.setHeader("Content-Type", "image/png");
    res.send(rows[0].qrCode);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch QR code" });
  }
});

module.exports = router;

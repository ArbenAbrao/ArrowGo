// backend/routes/trucks.js
// ⚠️ Also run these once against your DB if the trucks table doesn't
// already have these columns:
//   ALTER TABLE trucks ADD COLUMN controlId VARCHAR(50) NULL;
//   ALTER TABLE trucks ADD COLUMN isVisitor TINYINT(1) NOT NULL DEFAULT 0;
//   ALTER TABLE trucks ADD COLUMN visitorCompany VARCHAR(150) NULL;
//   ALTER TABLE trucks ADD COLUMN visitorContact VARCHAR(100) NULL;
//   ALTER TABLE trucks MODIFY id INT NULL; -- only if id was NOT NULL before
//   ALTER TABLE trucks MODIFY source VARCHAR(20) NULL DEFAULT NULL;
//     -- was ENUM('TRUCKS_PAGE','NEWVIEW_MODAL'), which doesn't include
//        the 'VISITOR' value /add-visitor-truck writes below.

const express = require("express");
const router = express.Router();
const { dbPromise } = require("../db");
const QRCode = require("qrcode");
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

/* ====================================================================
   AUTH MIDDLEWARE
   ====================================================================
   Same pattern as accounts.js's authMiddleware: reads the session
   token from the x-session-token header, looks up the account, and
   attaches it as req.user (which carries req.user.branch and
   req.user.role). Trucks routes that need to know "who is asking, and
   what branch are they" (Time In / Time Out) use this so the backend
   — not just the frontend — enforces branch ownership.

   NOTE: this duplicates accounts.js's authMiddleware because that one
   isn't exported/shared today. If you'd rather share a single
   implementation, move this into a small backend/middleware/auth.js
   and import it from both route files instead of keeping two copies.
==================================================================== */
async function authMiddleware(req, res, next) {
  const token = req.headers["x-session-token"];
  // ✅ FIX: these three responses used to key their error as `message`.
  // Every alert() on the frontend only reads `err.response.data.error`,
  // so any auth failure here (missing token, expired session, the
  // 15-minute idle timeout below) fell through to the generic "Failed to
  // save Time In" / "Failed to save Time Out" instead of the real reason.
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const [rows] = await dbPromise.query(
    "SELECT * FROM accounts WHERE current_session_token = ?",
    [token]
  );

  if (!rows.length) return res.status(401).json({ error: "Session expired" });

  const user = rows[0];
  const lastActive = new Date(user.last_active);
  const now = new Date();

  // Auto-logout after 15 minutes of inactivity — mirrors accounts.js
  if ((now - lastActive) / 1000 / 60 > 15) {
    await dbPromise.query(
      "UPDATE accounts SET current_session_token = NULL WHERE id = ?",
      [user.id]
    );
    return res.status(401).json({ error: "Session expired due to inactivity" });
  }

  await dbPromise.query("UPDATE accounts SET last_active = NOW() WHERE id = ?", [user.id]);

  req.user = user;
  next();
}

/* ==================== SESSION HEARTBEAT ====================
   ✅ NEW: authMiddleware (above) is the only thing in this file that
   refreshes an account's last_active timestamp, and Time In / Time Out
   are the only routes that use authMiddleware. That means ordinary
   browsing — searching, filtering, adding/editing trucks — never keeps
   a session alive server-side; only clicking Time In/Out does. A user
   can be actively using the page for 15+ minutes and still get
   "Session expired" on their next Time In/Out click, because nothing
   else was resetting the idle clock in the meantime.

   This route lets the frontend ping a lightweight authenticated
   endpoint every few minutes while the page is open, so ordinary use
   keeps last_active fresh. It reuses authMiddleware as-is, so it fails
   with the exact same 401 + error shape ("Unauthorized" / "Session
   expired" / "Session expired due to inactivity") as Time In/Out do.
==================================================================== */
router.get("/session/ping", authMiddleware, (req, res) => {
  res.json({ ok: true, branch: req.user.branch, role: req.user.role });
});

/* ====================================================================
   BRANCH OWNERSHIP / STAGE LOGIC
   ====================================================================
   Mirrors getResponsibleBranch() on the frontend (trucks.jsx and
   TruckGrid.jsx) — keep these in sync if you change the rule on either
   side.

   IN_OUT (default flow): destination branch owns the entry end-to-end.
   Stays SINGLE_LEG for its whole life; unaffected by any of the
   multi-leg logic below.

   OUT_IN: the truck moves through three legs, and ownership hands off
   between the home branch and the destination branch as it goes:

     currentStage         | responsible branch  | action they take
     ----------------------|---------------------|-------------------
     LEG1_PENDING_OUT      | branchRegistered    | Time Out (leaves)
     LEG2_PENDING_IN       | destinationBranch   | Time In (arrives)
     LEG2_PENDING_OUT      | destinationBranch   | Time Out (leaves)
     LEG3_PENDING_IN       | branchRegistered    | Time In (returns)
     COMPLETED              | (none — done)       | —
==================================================================== */
function getResponsibleBranch(truck) {
  if (truck.flowType !== "OUT_IN") {
    return truck.destinationBranch;
  }

  switch (truck.currentStage) {
    case "LEG1_PENDING_OUT":
      return truck.branchRegistered;
    case "LEG2_PENDING_IN":
    case "LEG2_PENDING_OUT":
      return truck.destinationBranch;
    case "LEG3_PENDING_IN":
      return truck.branchRegistered;
    default:
      return truck.branchRegistered;
  }
}

// Which action (Time In vs Time Out) is expected next for a given
// truck row, so the endpoints below can reject an out-of-order call
// with a clear message instead of silently corrupting the stage.
function getExpectedAction(truck) {
  if (truck.flowType !== "OUT_IN") {
    if (!truck.timeIn) return "TIME_IN";
    if (!truck.timeOut) return "TIME_OUT";
    return null; // completed
  }

  switch (truck.currentStage) {
    case "LEG1_PENDING_OUT":
      return "TIME_OUT";
    case "LEG2_PENDING_IN":
      return "TIME_IN";
    case "LEG2_PENDING_OUT":
      return "TIME_OUT";
    case "LEG3_PENDING_IN":
      return "TIME_IN";
    default:
      return null; // completed / unknown
  }
}

/* ==================== UPLOAD TRUCK IMAGE ==================== */
router.put("/clients/:id/upload-image", upload.single("truckImage"), async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ error: "No image uploaded" });

    const imageUrl = `/uploads/trucks/${req.file.filename}`;
    const [result] = await dbPromise.query(
      "UPDATE clients SET imageUrl = ? WHERE id = ?",
      [imageUrl, id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: "Client not found" });

    res.json({ message: "Truck image updated successfully", imageUrl });
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ error: "Failed to update truck image" });
  }
});

/* ==================== REGISTER TRUCK ==================== */
router.post("/register-truck", upload.single("truckImage"), async (req, res) => {
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
    controlId,
    registeredName,
    orNo,
    crNo,
    arNo,
    registrationDate,
    nextRenewalDate,
    status,
    price,
    remarks,
  } = req.body;

  const imageUrl = req.file ? `/uploads/trucks/${req.file.filename}` : null;

  try {
    const qrValue = `PLATE:${plateNumber}|CLIENT:${clientName}|TYPE:${truckType}|BRANCH:${branchRegistered}`;
    const qrBuffer = await QRCode.toBuffer(qrValue, { type: "png", width: 300 });

    const [result] = await dbPromise.query(
      `INSERT INTO clients
        (clientName, branchRegistered, truckType, plateNumber, brandName, model, fuelType, displacement, payloadCapacity, qrCode, imageUrl,
         controlId, registeredName, orNo, crNo, arNo, registrationDate, nextRenewalDate, status, price, remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        controlId || null,
        registeredName || null,
        orNo || null,
        crNo || null,
        arNo || null,
        registrationDate || null,
        nextRenewalDate || null,
        status || "Not Paid",
        price === "" || price === undefined ? null : price,
        remarks || null,
      ]
    );

    res.json({ message: "Truck registered successfully", id: result.insertId, imageUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Truck registration failed" });
  }
});

/* ==================== TRUCKS PER BRANCH PER CLIENT ==================== */
router.get("/trucks-per-branch-client", async (req, res) => {
  try {
    const [rows] = await dbPromise.query(`
      SELECT branchRegistered, clientName, COUNT(*) AS totalTrucks
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
      SELECT branchRegistered AS branchName, COUNT(*) AS totalTrucks
      FROM clients
      GROUP BY branchRegistered
      ORDER BY branchName ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch registered trucks per branch" });
  }
});

/* ==================== GET CLIENTS ==================== */
router.get("/clients", async (req, res) => {
  try {
    const [clients] = await dbPromise.query("SELECT * FROM clients ORDER BY clientName ASC");
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
    const [result] = await dbPromise.query("DELETE FROM clients WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Client not found" });
    res.json({ message: "Registered truck deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete client" });
  }
});

/* ==================== GET TRUCKS ====================
   Branch-scoped visibility.

   currentStage (not just flowType) decides which branch a truck's
   card currently belongs to — see getResponsibleBranch() above for
   the full rule, including how OUT_IN entries hand off between the
   home branch and destination branch across their three legs.

   Pass ?branch=<branchName> to scope results to what that branch is
   currently responsible for. Omit it (e.g. IT's cross-branch view) to
   get everything, same as before.
======================================================= */
router.get("/trucks", async (req, res) => {
  try {
    const { source, branch } = req.query;

    let query = "SELECT * FROM trucks WHERE 1=1";
    const params = [];

    if (source) {
      query += " AND source = ?";
      params.push(source);
    }

    if (branch) {
      query += ` AND (
        (flowType != 'OUT_IN' AND destinationBranch = ?)
        OR (flowType = 'OUT_IN' AND currentStage IN ('LEG1_PENDING_OUT', 'LEG3_PENDING_IN') AND branchRegistered = ?)
        OR (flowType = 'OUT_IN' AND currentStage IN ('LEG2_PENDING_IN', 'LEG2_PENDING_OUT') AND destinationBranch = ?)
      )`;
      params.push(branch, branch, branch);
    }

    query += " ORDER BY date DESC, truckKey DESC";

    const [trucks] = await dbPromise.query(query, params);
    res.json(trucks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch trucks" });
  }
});

/* ==================== ADD TRUCK ====================
   flowType: "IN_OUT" (default) -> Time In happens first, then Time Out
             "OUT_IN"           -> multi-leg: home branch releases,
                                    destination branch receives + releases,
                                    home branch receives back

   ✅ FIX: controlId is now read from the request body and stored on
   the trucks row. Previously it was destructured nowhere and silently
   dropped, so every new entry saved with no Control ID and the grid
   had to fall back to matching against the clients table (which could
   fail on id type mismatches). Now the value AddTruckModal already
   sends (from handleSelectVehicle) actually gets persisted.
====================================================== */
router.post("/add-truck", async (req, res) => {
  const {
    id,
    plateNumber,
    truckType,
    clientName,
    branchRegistered,
    destinationBranch,
    bay,
    driver,
    helpers,
    purpose,
    date,
    timeIn,
    vehicleId,
    flowType,
    controlId, // ✅ ADDED
  } = req.body;

  // ✅ FIX: convert array to string
  const helper = JSON.stringify(helpers || []);

  // ✅ Normalize/validate flowType so bad input never gets stored
  const finalFlowType = flowType === "OUT_IN" ? "OUT_IN" : "IN_OUT";

  // OUT_IN entries start their life waiting for the home branch to
  // Time Out (Leg 1). IN_OUT entries don't use the leg system at all.
  const initialStage = finalFlowType === "OUT_IN" ? "LEG1_PENDING_OUT" : "SINGLE_LEG";

  try {
    const [result] = await dbPromise.query(
      `INSERT INTO trucks
        (id, plateNumber, truckType, clientName, branchRegistered, destinationBranch, bay, driver, helper, purpose, date, timeIn, vehicleId, flowType, currentStage, controlId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        plateNumber,
        truckType,
        clientName,
        branchRegistered,
        destinationBranch,
        bay,
        driver,
        helper, // ✅ NOW CORRECT
        purpose,
        date,
        timeIn,
        vehicleId,
        finalFlowType, // ✅ NEW
        initialStage,
        controlId || null, // ✅ ADDED
      ]
    );

    res.json({ message: "Truck added successfully", truckKey: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add truck" });
  }
});

/* ==================== ADD VISITOR / 3PL TRUCK ====================
   For trucks that are NOT registered in the `clients` table — walk-in
   third-party logistics vehicles, visitor deliveries, etc.

   Difference from /add-truck:
   - No `id` (no clients.id foreign reference) — id is stored as NULL.
   - clientName/truckType/plateNumber/branchRegistered are free-text,
     typed by the gate user instead of selected from a dropdown.
   - Adds visitorCompany / visitorContact for who to call if needed.
   - branchRegistered and destinationBranch are typically the SAME
     value for a visitor: they're not being routed between two of our
     branches, they're just showing up at one hub to deliver/pick up.
     The frontend enforces this by setting both fields from a single
     "Branch / Hub Visited" picker. No bay is assigned.
   - Everything else (driver/helper, branch ownership) reuses the
     exact same logic as /add-truck, so visitor trucks show up in
     TruckGrid, Time In/Out, and the Completed List exactly like
     registered ones.
   - ✅ flowType is ALWAYS forced to "IN_OUT" here, regardless of what
     the client sends. The OUT_IN multi-leg handoff (home branch
     releases -> destination receives/releases -> home branch receives
     back) only makes sense for a registered vehicle being routed
     between two of our own branches — a visitor/3PL truck is just
     visiting one hub, so it only ever needs a single Time In -> Time
     Out. The frontend already hides the Out->In option in visitor
     mode; this is the server-side guarantee that holds even if a
     request bypasses the UI.
====================================================================== */
router.post("/add-visitor-truck", async (req, res) => {
  const {
    plateNumber,
    truckType,
    clientName,       // free text: e.g. "ABC Trucking Services"
    visitorCompany,   // optional: company name if different from clientName
    visitorContact,   // optional: contact person / phone number
    branchRegistered, // the hub they're visiting (same as destinationBranch)
    destinationBranch,
    bay,
    driver,
    helpers,
    purpose,
    date,
    timeIn,
    // flowType intentionally NOT read from req.body — see note above,
    // visitor entries always use IN_OUT regardless of what's sent.
  } = req.body;

  if (!plateNumber || !destinationBranch) {
    return res.status(400).json({ error: "Plate number and branch/hub are required" });
  }

  const helper = JSON.stringify(helpers || []);
  const finalFlowType = "IN_OUT";
  const initialStage = "SINGLE_LEG";

  try {
    // ⚠️ "VISITOR" here requires the `source` column migration noted at
    // the top of this file — it used to be ENUM('TRUCKS_PAGE',
    // 'NEWVIEW_MODAL'), which silently rejected this value.
    const [result] = await dbPromise.query(
      `INSERT INTO trucks
        (id, plateNumber, truckType, clientName, branchRegistered, destinationBranch, bay, driver, helper, purpose, date, timeIn, flowType, currentStage, isVisitor, visitorCompany, visitorContact, source)
       VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
      [
        plateNumber,
        truckType || "Unregistered",
        clientName || visitorCompany || "Visitor / 3PL",
        branchRegistered || destinationBranch,
        destinationBranch,
        bay || null,
        driver || null,
        helper,
        purpose,
        date,
        timeIn,
        finalFlowType,
        initialStage,
        visitorCompany || null,
        visitorContact || null,
        "VISITOR",
      ]
    );

    res.json({ message: "Visitor truck logged successfully", truckKey: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to log visitor truck" });
  }
});

/* ==================== ADD TRUCK NEWVIEW ====================
   ✅ FIX: same controlId gap as /add-truck above — now read from the
   body and persisted on insert.
====================================================== */
router.post("/add-truck-newview", async (req, res) => {
  const {
    id,
    plateNumber,
    truckType,
    clientName,
    branchRegistered,
    destinationBranch,
    bay,
    driver,
    helpers,
    purpose,
    date,
    timeOut,
    timeOutDate,
    vehicleId,
    flowType, // ✅ NEW
    controlId, // ✅ ADDED
  } = req.body;

  // ✅ FIX: convert array to string
  const helper = JSON.stringify(helpers || []);

  // ✅ This entry point creates a Time Out first, so it defaults to OUT_IN
  // unless the caller explicitly says otherwise.
  const finalFlowType = flowType === "IN_OUT" ? "IN_OUT" : "OUT_IN";

  // This entry point is already creating the Time Out itself, so an
  // OUT_IN row created here starts at Leg 1 already done — waiting on
  // the destination branch to Time In (Leg 2).
  const initialStage = finalFlowType === "OUT_IN" ? "LEG2_PENDING_IN" : "SINGLE_LEG";

  try {
    const now = new Date();

    const finalDate = date || null;

    const finalTimeOutDate =
      timeOutDate ||
      now.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });

    const finalTimeOut =
      timeOut ||
      now.toLocaleTimeString("en-US", {
        timeZone: "Asia/Manila",
        hour: "2-digit",
        minute: "2-digit",
      });

    const [result] = await dbPromise.query(
      `INSERT INTO trucks
        (id, plateNumber, truckType, clientName, branchRegistered, destinationBranch, bay, driver, helper, purpose, date, timeOut, timeOutDate, vehicleId, source, flowType, currentStage, leg1TimeOut, leg1TimeOutDate, controlId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        plateNumber,
        truckType,
        clientName,
        branchRegistered,
        destinationBranch,
        bay,
        driver,
        helper, // ✅ NOW CORRECT
        purpose,
        finalDate,
        finalTimeOut,
        finalTimeOutDate,
        vehicleId,
        "NEWVIEW_MODAL",
        finalFlowType, // ✅ NEW
        initialStage,
        finalFlowType === "OUT_IN" ? finalTimeOut : null,
        finalFlowType === "OUT_IN" ? finalTimeOutDate : null,
        controlId || null, // ✅ ADDED
      ]
    );

    res.json({
      message: "Truck TIME OUT created",
      truckKey: result.insertId,
    });
  } catch (err) {
    console.error("ADD-TRUCK-NEWVIEW ERROR:", err);
    res.status(500).json({ error: "Failed to add truck" });
  }
});

/* ==================== TIME IN ====================
   ✅ FIX ("Truck not found"): this used to be keyed on `:id` and did
   `WHERE id = ? ORDER BY truckKey DESC LIMIT 1`. `id` is really the
   *client's* id carried over onto the trucks row for registered
   entries — it happens to work as a lookup there. But visitor/3PL
   entries are inserted with `id = NULL` (see /add-visitor-truck), so
   the frontend ends up calling PUT /trucks/undefined/timein, this
   query matches nothing, and the endpoint 404s with "Truck not
   found" for every visitor entry.

   Now keyed on truckKey — the actual unique identifier every trucks
   row has regardless of how it was created. This also incidentally
   fixes a latent bug for registered trucks: a vehicle can have
   several historical entries sharing the same `id`, and "latest by
   id" could occasionally act on the wrong row if timing was close.
   truckKey always points at exactly the card the user clicked.

   Backend-enforced: the caller's session must belong to the branch
   that currently owns this entry (per getResponsibleBranch), or this
   returns 403. This is the real guard — the frontend disabling the
   button is just a UX nicety on top of this.
======================================================= */
router.put("/trucks/:truckKey/timein", authMiddleware, async (req, res) => {
  const { truckKey } = req.params;
  const { timeIn, date } = req.body;

  try {
    const [rows] = await dbPromise.query("SELECT * FROM trucks WHERE truckKey = ?", [truckKey]);
    const truck = rows[0];
    if (!truck) return res.status(404).json({ error: "Truck not found" });

    const expected = getExpectedAction(truck);
    if (expected !== "TIME_IN") {
      return res.status(400).json({
        error:
          expected === "TIME_OUT"
            ? "Time Out is expected next, not Time In"
            : "This entry is already completed",
      });
    }

    const responsibleBranch = getResponsibleBranch(truck);
    if (req.user.role !== "IT" && req.user.branch !== responsibleBranch) {
      return res.status(403).json({
        error: `This entry currently belongs to ${responsibleBranch}. Your branch cannot Time In this truck yet.`,
      });
    }

    // Figure out which stage we're advancing FROM, so we know which leg
    // column (if any) this Time In belongs in, and what the next stage is.
    let nextStage = truck.currentStage;
    let legUpdateField = null;
    let legUpdateDateField = null;

    if (truck.flowType === "OUT_IN") {
      if (truck.currentStage === "LEG2_PENDING_IN") {
        nextStage = "LEG2_PENDING_OUT";
        legUpdateField = "leg2TimeIn";
        legUpdateDateField = "leg2TimeInDate";
      } else if (truck.currentStage === "LEG3_PENDING_IN") {
        nextStage = "COMPLETED";
        legUpdateField = "leg3TimeIn";
        legUpdateDateField = "leg3TimeInDate";
      }
    }

    if (legUpdateField) {
      await dbPromise.query(
        `UPDATE trucks SET timeIn = ?, date = ?, currentStage = ?, ${legUpdateField} = ?, ${legUpdateDateField} = ? WHERE truckKey = ?`,
        [timeIn, date, nextStage, timeIn, date, truck.truckKey]
      );
    } else {
      // SINGLE_LEG (IN_OUT flow) — unchanged behavior
      await dbPromise.query(
        "UPDATE trucks SET timeIn = ?, date = ? WHERE truckKey = ?",
        [timeIn, date, truck.truckKey]
      );
    }

    res.json({ message: "Time In saved for latest log", truckKey: truck.truckKey });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update time in" });
  }
});

/* ==================== TIME OUT ====================
   ✅ Same "Truck not found" fix as Time In above — keyed on truckKey
   instead of the client-derived `id`, which is NULL for visitor
   entries. Same backend-enforced branch check as Time In above.
======================================================= */
router.put("/trucks/:truckKey/timeout", authMiddleware, async (req, res) => {
  const { truckKey } = req.params;
  const { timeOut, timeOutDate } = req.body;

  try {
    const [rows] = await dbPromise.query("SELECT * FROM trucks WHERE truckKey = ?", [truckKey]);
    const truck = rows[0];
    if (!truck) return res.status(404).json({ error: "Truck not found" });

    const expected = getExpectedAction(truck);
    if (expected !== "TIME_OUT") {
      return res.status(400).json({
        error:
          expected === "TIME_IN"
            ? "Time In is expected next, not Time Out"
            : "This entry is already completed",
      });
    }

    const responsibleBranch = getResponsibleBranch(truck);
    if (req.user.role !== "IT" && req.user.branch !== responsibleBranch) {
      return res.status(403).json({
        error: `This entry currently belongs to ${responsibleBranch}. Your branch cannot Time Out this truck yet.`,
      });
    }

    const now = new Date();
    const finalTimeOut = timeOut || now.toLocaleTimeString("en-US", { timeZone: "Asia/Manila", hour: "2-digit", minute: "2-digit" });
    const finalDate = timeOutDate || now.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });

    let nextStage = truck.currentStage;
    let legUpdateField = null;
    let legUpdateDateField = null;

    if (truck.flowType === "OUT_IN") {
      if (truck.currentStage === "LEG1_PENDING_OUT") {
        nextStage = "LEG2_PENDING_IN";
        legUpdateField = "leg1TimeOut";
        legUpdateDateField = "leg1TimeOutDate";
      } else if (truck.currentStage === "LEG2_PENDING_OUT") {
        nextStage = "LEG3_PENDING_IN";
        legUpdateField = "leg2TimeOut";
        legUpdateDateField = "leg2TimeOutDate";
      }
    }

    if (legUpdateField) {
      await dbPromise.query(
        `UPDATE trucks SET timeOut = ?, timeOutDate = ?, currentStage = ?, ${legUpdateField} = ?, ${legUpdateDateField} = ? WHERE truckKey = ?`,
        [finalTimeOut, finalDate, nextStage, finalTimeOut, finalDate, truck.truckKey]
      );
    } else {
      // SINGLE_LEG (IN_OUT flow) — unchanged behavior
      await dbPromise.query(
        "UPDATE trucks SET timeOut = ?, timeOutDate = ? WHERE truckKey = ?",
        [finalTimeOut, finalDate, truck.truckKey]
      );
    }

    res.json({ message: "Time Out saved for latest log", truckKey: truck.truckKey });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update timeout" });
  }
});

/* ==================== EDIT TRUCK ==================== */
router.put("/trucks/:truckKey", async (req, res) => {
  const { truckKey } = req.params;
const { driver, helper, purpose, bay } = req.body;
  try {
    const [rows] = await dbPromise.query("SELECT * FROM trucks WHERE truckKey = ?", [truckKey]);
    if (!rows.length) return res.status(404).json({ error: "Truck not found" });

await dbPromise.query(
  "UPDATE trucks SET driver = ?, helper = ?, purpose = ?, bay = ? WHERE truckKey = ?",
  [driver, helper, purpose, bay, truckKey]
);

    const [updated] = await dbPromise.query("SELECT * FROM trucks WHERE truckKey = ?", [truckKey]);
    res.json({ message: "Truck updated successfully", truck: updated[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update truck" }); // ✅ FIX: was `message` — handleEditSubmit's alert() only reads `.error`
  }
});

/* ==================== DELETE TRUCK ==================== */
router.delete("/trucks/:truckKey", async (req, res) => {
  const { truckKey } = req.params;
  try {
    await dbPromise.query("DELETE FROM trucks WHERE truckKey = ?", [truckKey]);
    res.json({ message: "Truck deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete truck" });
  }
});

/* ==================== TOTAL REGISTERED ==================== */
router.get("/total-registered", async (req, res) => {
  try {
    const [result] = await dbPromise.query("SELECT COUNT(*) AS totalTrucks FROM clients");
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
    const [rows] = await dbPromise.query("SELECT qrCode FROM clients WHERE id = ?", [id]);
    if (!rows.length || !rows[0].qrCode) return res.status(404).send("QR not found");

    res.setHeader("Content-Type", "image/png");
    res.send(rows[0].qrCode);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch QR code" });
  }
});



/* ==================== UPDATE CLIENT BRANCH ==================== */
router.put("/clients/:id/branch", async (req, res) => {
  const { id } = req.params;
  const { branchRegistered } = req.body;

  try {
    const [result] = await dbPromise.query(
      "UPDATE clients SET branchRegistered = ? WHERE id = ?",
      [branchRegistered, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Truck not found" });
    }

    res.json({
      message: "Branch updated successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to update branch",
    });
  }
});

/* ==================== UPDATE CLIENT REGISTRATION & COMPLIANCE ==================== */
router.put("/clients/:id/registration", async (req, res) => {
  const { id } = req.params;
  const {
    controlId,
    registeredName,
    orNo,
    crNo,
    arNo,
    registrationDate,
    nextRenewalDate,
    status,
    price,
    remarks,
  } = req.body;

  try {
    const [result] = await dbPromise.query(
      `UPDATE clients SET
         controlId = ?, registeredName = ?, orNo = ?, crNo = ?, arNo = ?,
         registrationDate = ?, nextRenewalDate = ?, status = ?, price = ?, remarks = ?
       WHERE id = ?`,
      [
        controlId || null,
        registeredName || null,
        orNo || null,
        crNo || null,
        arNo || null,
        registrationDate || null,
        nextRenewalDate || null,
        status || "Not Paid",
        price === "" || price === undefined ? null : price,
        remarks || null,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Client not found" });
    }

    res.json({ message: "Registration details updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update registration details" });
  }
});

module.exports = router;
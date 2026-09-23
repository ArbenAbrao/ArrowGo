const express = require("express");
const router = express.Router();
const { dbPromise } = require("../db"); // promise-based DB connection (mysql2 pool)

// ============================================================
// SHARED HELPERS
// ============================================================

// Wraps an async route handler so every route gets consistent
// error handling without repeating try/catch everywhere.
const asyncHandler = (fn) => (req, res) => fn(req, res).catch((err) => handleError(res, err));

function handleError(res, err) {
  console.error(err);

  // MySQL duplicate-entry / FK errors get friendlier responses instead
  // of a raw 500, since the frontend can show these directly to a user.
  if (err.code === "ER_DUP_ENTRY") {
    return res.status(409).json({ success: false, error: "That name already exists." });
  }
  if (err.code === "ER_NO_REFERENCED_ROW" || err.code === "ER_NO_REFERENCED_ROW_2") {
    return res.status(400).json({ success: false, error: "Referenced record does not exist." });
  }
  if (err.status) {
    return res.status(err.status).json({ success: false, error: err.message });
  }
  return res.status(500).json({ success: false, error: err.message || "Unexpected server error." });
}

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

function notFound(message) {
  const err = new Error(message);
  err.status = 404;
  return err;
}

// Normalizes ?page= & ?limit= into safe SQL LIMIT/OFFSET values.
// limit=0 (or omitted "page") returns everything, so existing frontend
// calls that don't pass pagination params keep working unchanged.
function getPagination(req, defaultLimit = 0, maxLimit = 200) {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  let limit = parseInt(req.query.limit, 10);
  if (!limit || limit <= 0) limit = defaultLimit;
  limit = Math.min(limit, maxLimit);
  const offset = limit ? (page - 1) * limit : 0;
  return { page, limit, offset };
}

// Cleans a list of raw bay names: trims, drops blanks, dedupes
// case-insensitively while preserving the first-seen casing.
function sanitizeNameList(rawNames) {
  const seen = new Set();
  const clean = [];
  for (const raw of rawNames) {
    const name = String(raw || "").trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    clean.push(name);
  }
  return clean;
}

async function branchExists(id) {
  const [rows] = await dbPromise.query("SELECT id FROM branches WHERE id = ?", [id]);
  return rows.length > 0;
}

// ============================================================
// BRANCHES
// ============================================================

// GET /branches — supports ?search= and ?page=&limit= for future scale.
router.get(
  "/branches",
  asyncHandler(async (req, res) => {
    const { search } = req.query;
    const { limit, offset } = getPagination(req);

    const where = [];
    const params = [];
    if (search) {
      where.push("b.name LIKE ?");
      params.push(`%${search}%`);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const limitSql = limit ? "LIMIT ? OFFSET ?" : "";
    if (limit) params.push(limit, offset);

    const sql = `
      SELECT
        b.id,
        b.name,
        COUNT(DISTINCT bc.id) AS clientCount,
        COUNT(DISTINCT bay.id) AS bayCount
      FROM branches b
      LEFT JOIN branch_clients bc ON bc.branch_id = b.id
      LEFT JOIN bays bay ON bay.branch_id = b.id
      ${whereSql}
      GROUP BY b.id
      ORDER BY b.name ASC
      ${limitSql}
    `;
    const [results] = await dbPromise.query(sql, params);
    res.json(results);
  })
);

// GET /branches/:id — single branch lookup (useful for detail views).
router.get(
  "/branches/:id",
  asyncHandler(async (req, res) => {
    const [rows] = await dbPromise.query(
      `SELECT
         b.id, b.name,
         COUNT(DISTINCT bc.id) AS clientCount,
         COUNT(DISTINCT bay.id) AS bayCount
       FROM branches b
       LEFT JOIN branch_clients bc ON bc.branch_id = b.id
       LEFT JOIN bays bay ON bay.branch_id = b.id
       WHERE b.id = ?
       GROUP BY b.id`,
      [req.params.id]
    );
    if (!rows.length) throw notFound("Branch not found.");
    res.json(rows[0]);
  })
);

// CREATE branch
router.post(
  "/branches",
  asyncHandler(async (req, res) => {
    const name = String(req.body.name || "").trim();
    if (!name) throw badRequest("Branch name is required.");

    const [result] = await dbPromise.query("INSERT INTO branches (name) VALUES (?)", [name]);
    res.status(201).json({ id: result.insertId, name, clientCount: 0, bayCount: 0 });
  })
);

// UPDATE branch
router.put(
  "/branches/:id",
  asyncHandler(async (req, res) => {
    const name = String(req.body.name || "").trim();
    if (!name) throw badRequest("Branch name is required.");
    if (!(await branchExists(req.params.id))) throw notFound("Branch not found.");

    await dbPromise.query("UPDATE branches SET name=? WHERE id=?", [name, req.params.id]);
    res.json({ id: Number(req.params.id), name, message: "Updated" });
  })
);

// DELETE branch
router.delete(
  "/branches/:id",
  asyncHandler(async (req, res) => {
    if (!(await branchExists(req.params.id))) throw notFound("Branch not found.");
    await dbPromise.query("DELETE FROM branches WHERE id=?", [req.params.id]);
    res.json({ message: "Deleted" });
  })
);

// ============================================================
// CLIENTS
// ============================================================

// GET /branch-clients — supports ?branch_id= and ?search=
router.get(
  "/branch-clients",
  asyncHandler(async (req, res) => {
    const { branch_id, search } = req.query;
    const { limit, offset } = getPagination(req);

    const where = [];
    const params = [];
    if (branch_id) {
      where.push("bc.branch_id = ?");
      params.push(branch_id);
    }
    if (search) {
      where.push("bc.name LIKE ?");
      params.push(`%${search}%`);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const limitSql = limit ? "LIMIT ? OFFSET ?" : "";
    if (limit) params.push(limit, offset);

    const sql = `
      SELECT bc.id, bc.name, bc.branch_id, b.name AS branch
      FROM branch_clients bc
      JOIN branches b ON b.id = bc.branch_id
      ${whereSql}
      ORDER BY bc.name ASC
      ${limitSql}
    `;
    const [results] = await dbPromise.query(sql, params);
    res.json(results);
  })
);

// GET clients by branch (kept for backwards compatibility with existing calls)
router.get(
  "/branch-clients/:branchId",
  asyncHandler(async (req, res) => {
    const [results] = await dbPromise.query(
      "SELECT id, name FROM branch_clients WHERE branch_id = ? ORDER BY name ASC",
      [req.params.branchId]
    );
    res.json(results);
  })
);

// CREATE client
router.post(
  "/branch-clients",
  asyncHandler(async (req, res) => {
    const name = String(req.body.name || "").trim();
    const { branch_id } = req.body;
    if (!name) throw badRequest("Client name is required.");
    if (!branch_id) throw badRequest("branch_id is required.");
    if (!(await branchExists(branch_id))) throw notFound("Branch not found.");

    const [result] = await dbPromise.query(
      "INSERT INTO branch_clients (name, branch_id) VALUES (?, ?)",
      [name, branch_id]
    );
    res.status(201).json({ id: result.insertId, name, branch_id });
  })
);

// UPDATE client (new — future-proofing for editable client records)
router.put(
  "/branch-clients/:id",
  asyncHandler(async (req, res) => {
    const name = String(req.body.name || "").trim();
    const { branch_id } = req.body;
    if (!name) throw badRequest("Client name is required.");
    if (branch_id && !(await branchExists(branch_id))) throw notFound("Branch not found.");

    const fields = ["name = ?"];
    const params = [name];
    if (branch_id) {
      fields.push("branch_id = ?");
      params.push(branch_id);
    }
    params.push(req.params.id);

    const [result] = await dbPromise.query(
      `UPDATE branch_clients SET ${fields.join(", ")} WHERE id = ?`,
      params
    );
    if (result.affectedRows === 0) throw notFound("Client not found.");
    res.json({ message: "Client updated" });
  })
);

// DELETE client
router.delete(
  "/branch-clients/:id",
  asyncHandler(async (req, res) => {
    const [result] = await dbPromise.query("DELETE FROM branch_clients WHERE id=?", [req.params.id]);
    if (result.affectedRows === 0) throw notFound("Client not found.");
    res.json({ message: "Client deleted" });
  })
);

// ============================================================
// DRIVERS
// ============================================================

// GET /drivers — supports ?branch_id=, ?client_id=, ?status=, ?type=, ?search=
router.get(
  "/drivers",
  asyncHandler(async (req, res) => {
    const { branch_id, client_id, status, type, search } = req.query;
    const { limit, offset } = getPagination(req);

    const where = [];
    const params = [];
    if (branch_id) {
      where.push("d.branch_id = ?");
      params.push(branch_id);
    }
    if (client_id) {
      where.push("d.client_id = ?");
      params.push(client_id);
    }
    if (status) {
      where.push("d.status = ?");
      params.push(status);
    }
    if (type) {
      where.push("d.type = ?");
      params.push(type);
    }
    if (search) {
      where.push("(d.name LIKE ? OR d.employee_id LIKE ? OR d.license_no LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const limitSql = limit ? "LIMIT ? OFFSET ?" : "";
    if (limit) params.push(limit, offset);

    const sql = `
      SELECT d.id, d.name, d.type,
             d.employee_id,
             d.phone,
             d.license_no,
             d.status,
             d.branch_id,
             d.client_id,
             b.name AS branch,
             c.name AS client
      FROM drivers d
      JOIN branches b ON b.id = d.branch_id
      JOIN branch_clients c ON c.id = d.client_id
      ${whereSql}
      ORDER BY d.id DESC
      ${limitSql}
    `;
    const [results] = await dbPromise.query(sql, params);
    res.json(results);
  })
);

// CREATE driver
router.post(
  "/drivers",
  asyncHandler(async (req, res) => {
    const {
      name,
      branch_id,
      client_id,
      type,
      employee_id,
      phone,
      license_no,
      status,
    } = req.body;

    const cleanName = String(name || "").trim();
    if (!cleanName) throw badRequest("Driver name is required.");
    if (!branch_id) throw badRequest("branch_id is required.");
    if (!client_id) throw badRequest("client_id is required.");
    if (!(await branchExists(branch_id))) throw notFound("Branch not found.");

    const [result] = await dbPromise.query(
      `INSERT INTO drivers
       (name, branch_id, client_id, type, employee_id, phone, license_no, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cleanName,
        branch_id,
        client_id,
        type || "Driver",
        employee_id || null,
        phone || null,
        license_no || null,
        status || "Active",
      ]
    );

    res.status(201).json({
      id: result.insertId,
      name: cleanName,
      branch_id,
      client_id,
      type: type || "Driver",
      employee_id,
      phone,
      license_no,
      status: status || "Active",
    });
  })
);

// UPDATE driver
router.put(
  "/drivers/:id",
  asyncHandler(async (req, res) => {
    const {
      employee_id,
      name,
      phone,
      license_no,
      status,
      branch_id,
      client_id,
      type,
    } = req.body;

    const cleanName = String(name || "").trim();
    if (!cleanName) throw badRequest("Driver name is required.");

    const [result] = await dbPromise.query(
      `UPDATE drivers
       SET employee_id=?, name=?, phone=?, license_no=?, status=?, branch_id=?, client_id=?, type=?
       WHERE id=?`,
      [employee_id || null, cleanName, phone || null, license_no || null, status, branch_id, client_id, type, req.params.id]
    );

    if (result.affectedRows === 0) throw notFound("Driver not found.");
    res.json({ message: "Driver updated" });
  })
);

// DELETE driver
router.delete(
  "/drivers/:id",
  asyncHandler(async (req, res) => {
    const [result] = await dbPromise.query("DELETE FROM drivers WHERE id=?", [req.params.id]);
    if (result.affectedRows === 0) throw notFound("Driver not found.");
    res.json({ message: "Driver deleted" });
  })
);

// ============================================================
// BAYS
// ============================================================

// GET all bays — supports ?branch_id= and ?search=
router.get(
  "/bays",
  asyncHandler(async (req, res) => {
    const { branch_id, search } = req.query;
    const params = [];
    const where = [];
    if (branch_id) {
      where.push("bay.branch_id = ?");
      params.push(branch_id);
    }
    if (search) {
      where.push("bay.name LIKE ?");
      params.push(`%${search}%`);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const sql = `
      SELECT bay.id, bay.name AS bayName, bay.branch_id, b.name AS branchName
      FROM bays bay
      JOIN branches b ON b.id = bay.branch_id
      ${whereSql}
      ORDER BY b.name ASC, bay.name ASC
    `;
    const [results] = await dbPromise.query(sql, params);
    res.json(results);
  })
);

// CREATE single bay (unchanged behavior — kept for backwards compatibility)
router.post(
  "/bays",
  asyncHandler(async (req, res) => {
    const name = String(req.body.name || "").trim();
    const { branch_id } = req.body;
    if (!name) throw badRequest("Bay name is required.");
    if (!branch_id) throw badRequest("branch_id is required.");
    if (!(await branchExists(branch_id))) throw notFound("Branch not found.");

    const [result] = await dbPromise.query(
      "INSERT INTO bays (name, branch_id) VALUES (?, ?)",
      [name, branch_id]
    );
    res.status(201).json({ id: result.insertId, name, branch_id });
  })
);

// BULK CREATE bays — POST /bays/bulk  { branch_id, names: ["Bay 1", "Bay 2", ...] }
// Runs as a single transaction: dedupes the incoming list, skips names that
// already exist on that branch (case-insensitive), and inserts the rest in
// one multi-row INSERT. Returns which bays were created vs skipped so the
// UI can show a clear summary instead of guessing.
router.post(
  "/bays/bulk",
  asyncHandler(async (req, res) => {
    const { branch_id } = req.body;
    const rawNames = Array.isArray(req.body.names) ? req.body.names : [];

    if (!branch_id) throw badRequest("branch_id is required.");
    if (!(await branchExists(branch_id))) throw notFound("Branch not found.");

    const candidates = sanitizeNameList(rawNames);
    if (candidates.length === 0) throw badRequest("Provide at least one bay name.");
    if (candidates.length > 200) throw badRequest("Too many bays in a single request (max 200).");

    const connection = await dbPromise.getConnection();
    try {
      await connection.beginTransaction();

      const [existingRows] = await connection.query(
        "SELECT name FROM bays WHERE branch_id = ?",
        [branch_id]
      );
      const existingLower = new Set(existingRows.map((r) => r.name.toLowerCase()));

      const toCreate = candidates.filter((n) => !existingLower.has(n.toLowerCase()));
      const skipped = candidates.filter((n) => existingLower.has(n.toLowerCase()));

      let created = [];
      if (toCreate.length > 0) {
        const values = toCreate.map((name) => [name, branch_id]);
        const [result] = await connection.query(
          "INSERT INTO bays (name, branch_id) VALUES ?",
          [values]
        );
        const firstId = result.insertId; // first id of the batch (auto_increment, contiguous)
        created = toCreate.map((name, idx) => ({ id: firstId + idx, name, branch_id }));
      }

      await connection.commit();
      res.status(201).json({
        created,
        skipped,
        message: `${created.length} bay${created.length === 1 ? "" : "s"} added${
          skipped.length ? `, ${skipped.length} skipped (already exist)` : ""
        }.`,
      });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  })
);

// UPDATE bay (new — future-proofing, e.g. renaming a bay)
router.put(
  "/bays/:id",
  asyncHandler(async (req, res) => {
    const name = String(req.body.name || "").trim();
    if (!name) throw badRequest("Bay name is required.");

    const [result] = await dbPromise.query("UPDATE bays SET name=? WHERE id=?", [name, req.params.id]);
    if (result.affectedRows === 0) throw notFound("Bay not found.");
    res.json({ message: "Bay updated" });
  })
);

// DELETE single bay
router.delete(
  "/bays/:id",
  asyncHandler(async (req, res) => {
    const [result] = await dbPromise.query("DELETE FROM bays WHERE id=?", [req.params.id]);
    if (result.affectedRows === 0) throw notFound("Bay not found.");
    res.json({ message: "Bay deleted" });
  })
);

// BULK DELETE bays — DELETE /bays/bulk  { ids: [1,2,3] }
// Pairs with a future "select multiple, delete" UI without needing N calls.
router.delete(
  "/bays/bulk",
  asyncHandler(async (req, res) => {
    const ids = Array.isArray(req.body.ids) ? req.body.ids.filter(Number.isFinite) : [];
    if (ids.length === 0) throw badRequest("Provide at least one bay id.");

    const [result] = await dbPromise.query("DELETE FROM bays WHERE id IN (?)", [ids]);
    res.json({ message: `${result.affectedRows} bay${result.affectedRows === 1 ? "" : "s"} deleted.` });
  })
);

module.exports = router;
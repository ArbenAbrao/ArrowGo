const express = require("express");
const router = express.Router();
const { dbPromise } = require("../db"); // make sure this exports a promise-based connection

// ================= BRANCHES =================

// GET branches + client count
router.get("/branches", async (req, res) => {
  const sql = `
    SELECT b.id, b.name, COUNT(bc.id) AS clientCount
    FROM branches b
    LEFT JOIN branch_clients bc ON bc.branch_id = b.id
    GROUP BY b.id
    ORDER BY b.id DESC
  `;
  try {
    const [results] = await dbPromise.query(sql);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE branch
router.post("/branches", async (req, res) => {
  const { name } = req.body;
  try {
    const [result] = await dbPromise.query(
      "INSERT INTO branches (name) VALUES (?)",
      [name]
    );
    res.json({ id: result.insertId, name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE branch
router.put("/branches/:id", async (req, res) => {
  const { name } = req.body;
  const { id } = req.params;
  try {
    await dbPromise.query("UPDATE branches SET name=? WHERE id=?", [name, id]);
    res.json({ message: "Updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE branch
router.delete("/branches/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await dbPromise.query("DELETE FROM branches WHERE id=?", [id]);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= CLIENTS =================

// GET clients
router.get("/branch-clients", async (req, res) => {
  const sql = `
    SELECT bc.id, bc.name, bc.branch_id, b.name AS branch
    FROM branch_clients bc
    JOIN branches b ON b.id = bc.branch_id
    ORDER BY bc.id DESC
  `;
  try {
    const [results] = await dbPromise.query(sql);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE client
router.post("/branch-clients", async (req, res) => {
  const { name, branch_id } = req.body;
  try {
    const [result] = await dbPromise.query(
      "INSERT INTO branch_clients (name, branch_id) VALUES (?, ?)",
      [name, branch_id]
    );
    res.json({ id: result.insertId, name, branch_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE client
router.delete("/branch-clients/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await dbPromise.query("DELETE FROM branch_clients WHERE id=?", [id]);
    res.json({ message: "Client deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET clients by branch
router.get("/branch-clients/:branchId", async (req, res) => {
  const { branchId } = req.params;
  try {
    const [results] = await dbPromise.query(
      "SELECT id, name FROM branch_clients WHERE branch_id = ? ORDER BY name ASC",
      [branchId]
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;

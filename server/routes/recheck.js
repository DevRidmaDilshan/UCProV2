// server/routes/recheck.js
const express = require('express');
const router = express.Router();
const db = require('../config/db'); 

// GET list of RegNos (and related fields) for dropdown autofill
// Adjust query to your observations table name/fields. Here we assume a table named `observations`
// If your table name/columns differ, change accordingly.
router.get('/regnos', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT regNo, obsNo, claimNo, dealer, brand, size, serialNo, obsStatus, consultantName, obsDate, techObs, treadDepth
       FROM observations`
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /api/recheck/regnos error:', err);
    res.status(500).json({ error: 'DB error fetching regnos' });
  }
});

// Add a recheck note
router.post('/add', async (req, res) => {
  try {
    const {
      recheckNo, obsNo, claimNo, dealer, brand, size, serialNo,
      obsStatus, consultantName, obsDate, reObsDate, techObs,
      reObs, treadDepth, reTreadDepth
    } = req.body;

    const sql = `INSERT INTO rechecks
      (recheckNo, obsNo, claimNo, dealer, brand, size, serialNo, obsStatus, consultantName, obsDate, reObsDate, techObs, reObs, treadDepth, reTreadDepth)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
      recheckNo, obsNo, claimNo, dealer, brand, size, serialNo,
      obsStatus, consultantName, obsDate || null, reObsDate || null, techObs, reObs, treadDepth, reTreadDepth
    ];

    const [result] = await db.query(sql, params);
    res.json({ message: 'Recheck created', insertId: result.insertId });
  } catch (err) {
    console.error('POST /api/recheck/add error:', err);
    res.status(500).json({ error: 'DB error inserting recheck', details: err.message });
  }
});

// Get all rechecks for table view
router.get('/all', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM rechecks ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('GET /api/recheck/all error:', err);
    res.status(500).json({ error: 'DB error fetching rechecks' });
  }
});

// Get single recheck by recheckNo
router.get('/:recheckNo', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM rechecks WHERE recheckNo = ?', [req.params.recheckNo]);
    res.json(rows[0] || null);
  } catch (err) {
    console.error('GET /api/recheck/:recheckNo error:', err);
    res.status(500).json({ error: 'DB error fetching recheck' });
  }
});

// Update recheck (edit)
router.put('/:recheckNo', async (req, res) => {
  try {
    const { reObs, reTreadDepth, reObsDate } = req.body;
    await db.query('UPDATE rechecks SET reObs=?, reTreadDepth=?, reObsDate=? WHERE recheckNo=?',
      [reObs, reTreadDepth, reObsDate || null, req.params.recheckNo]);
    res.json({ message: 'Recheck updated' });
  } catch (err) {
    console.error('PUT /api/recheck/:recheckNo error:', err);
    res.status(500).json({ error: 'DB error updating recheck' });
  }
});

module.exports = router;

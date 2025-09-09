const express = require('express');
const router = express.Router();
const db = require('../config/db'); // your MySQL connection

// GET dashboard stats by brand between dates
router.get('/', async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'Start date and end date are required' });
  }

  try {
    const query = `
      SELECT brand,
        COUNT(*) AS total_received,
        SUM(CASE WHEN obsStatus = 'Pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN obsStatus = 'R' THEN 1 ELSE 0 END) AS r_count,
        SUM(CASE WHEN obsStatus = 'NR' THEN 1 ELSE 0 END) AS nr_count,
        SUM(CASE WHEN obsStatus = 'SCN' THEN 1 ELSE 0 END) AS scn_count
      FROM registers
      WHERE receivedDate BETWEEN ? AND ?
      GROUP BY brand
      ORDER BY brand
    `;

    const [rows] = await db.query(query, [startDate, endDate]);

    if (!rows.length) {
      return res.status(404).json({ error: 'Register not found' });
    }

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

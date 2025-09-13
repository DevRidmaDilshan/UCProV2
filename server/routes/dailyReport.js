const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET daily stats by brand between dates
router.get('/', async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'Start date and end date are required' });
  }

  try {
    const query = `
      SELECT 
        brand,
        COUNT(*) AS total_oberved,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS total_observed_percent,
        SUM(CASE WHEN obsStatus = 'Recommended' THEN 1 ELSE 0 END) AS recommended,
        ROUND(SUM(CASE WHEN obsStatus = 'Recommended' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS recommended_percent,
        SUM(CASE WHEN obsStatus = 'Not Recommended' THEN 1 ELSE 0 END) AS nr_count,
        ROUND(SUM(CASE WHEN obsStatus = 'Not Recommended' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS nr_percent,
        SUM(CASE WHEN obsStatus = 'Forwarded for Management Decision' THEN 1 ELSE 0 END) AS scn_count,
        ROUND(SUM(CASE WHEN obsStatus = 'Forwarded for Management Decision' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS scn_percent
      FROM registers
      WHERE obsDate BETWEEN ? AND ?
      GROUP BY brand
      ORDER BY brand
    `;

    const [rows] = await db.query(query, [startDate, endDate]);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
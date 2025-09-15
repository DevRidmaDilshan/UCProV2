const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET consultant list
router.get('/consultants', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT DISTINCT consultantName FROM registers ORDER BY consultantName`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch consultants' });
  }
});

// GET dashboard stats by brand (and consultant) between dates
router.get('/', async (req, res) => {
  const { startDate, endDate, consultant } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'Start date and end date are required' });
  }

  try {
    let query = `
      SELECT 
        brand,
        COUNT(*) AS total_observed,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS total_observed_percent,
        SUM(CASE WHEN obsStatus = 'Recommended' THEN 1 ELSE 0 END) AS recommended,
        ROUND(SUM(CASE WHEN obsStatus = 'Recommended' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS recommended_percent,
        SUM(CASE WHEN obsStatus = 'Not Recommended' THEN 1 ELSE 0 END) AS nr_count,
        ROUND(SUM(CASE WHEN obsStatus = 'Not Recommended' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS nr_percent,
        SUM(CASE WHEN obsStatus = 'Forwarded for Management Decision' THEN 1 ELSE 0 END) AS scn_count,
        ROUND(SUM(CASE WHEN obsStatus = 'Forwarded for Management Decision' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS scn_percent
      FROM registers
      WHERE obsDate BETWEEN ? AND ?
    `;

    const params = [startDate, endDate];

    // ✅ If consultant selected, filter by consultant
    if (consultant && consultant !== '') {
      query += ` AND consultantName = ?`;
      params.push(consultant);
    }

    query += ` GROUP BY brand ORDER BY brand`;

    const [rows] = await db.query(query, params);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


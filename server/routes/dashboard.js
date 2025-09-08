// Backend/routes/dashboard.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Dashboard API
router.get("/", (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ message: "Start and end date required" });
  }

  const query = `
    SELECT 
      r.brand,
      COUNT(*) AS totalReceived,
      SUM(CASE WHEN r.obsStatus IS NULL OR r.obsStatus = 'Pending' THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN r.obsStatus = 'Recommended' THEN 1 ELSE 0 END) AS rCount,
      SUM(CASE WHEN r.obsStatus = 'Not Recommended' THEN 1 ELSE 0 END) AS nrCount,
      SUM(CASE WHEN r.obsStatus = 'Forwarded for Management Decision' THEN 1 ELSE 0 END) AS scnCount
    FROM registers r
    WHERE r.receivedDate BETWEEN ? AND ?
    GROUP BY r.brand
    ORDER BY r.brand ASC
  `;

  db.query(query, [startDate, endDate], (err, results) => {
    if (err) {
      console.error("Error fetching dashboard data:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json(results);
  });
});

module.exports = router;
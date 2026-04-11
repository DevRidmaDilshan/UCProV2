// server/controllers/recheck.controller.js
const db = require('../config/db');

// Helper: Get next RE integer (1, 2, 3, ...) for every recheck
const getNextReNumber = async () => {
  const [rows] = await db.query(
    "SELECT reNo FROM registers WHERE reNo IS NOT NULL ORDER BY reNo DESC LIMIT 1"
  );
  let nextNumber = 1;
  if (rows.length > 0 && rows[0].reNo) {
    nextNumber = rows[0].reNo + 1;
  }
  return nextNumber;
};

// Helper: Generate new observation number (R, NR, SCN)
const generateObservationNumber = async (type) => {
  const [rows] = await db.query(
    "SELECT obsNo FROM registers WHERE obsNo LIKE ? ORDER BY LENGTH(obsNo) DESC, obsNo DESC LIMIT 1",
    [`${type}%`]
  );
  let nextNumber = 1;
  if (rows.length > 0 && rows[0].obsNo) {
    const lastNum = parseInt(rows[0].obsNo.replace(type, ''), 10);
    nextNumber = isNaN(lastNum) ? 1 : lastNum + 1;
  }
  if (type === 'NR') {
    return `${type}${nextNumber.toString().padStart(5, '0')}`;
  } else if (type === 'SCN') {
    return `${type}${nextNumber.toString().padStart(5, '0')}`;
  } else {
    return `${type}${nextNumber.toString().padStart(5, '0')}`;
  }
};

// Get registers for dropdown
exports.getRegistersForRecheck = async (req, res) => {
  try {
    const { searchType, value } = req.query;
    let query = `SELECT id, claimNo, dealerView, brand, size, serialNo, obsNo, obsStatus, techObs, treadDepth, obsDate, consultantName 
                 FROM registers WHERE obsStatus IN ('Recommended', 'Not Recommended', 'Forwarded for Management Decision')`;
    if (searchType === 'id') {
      query += ` AND id = ?`;
    } else if (searchType === 'obsNo') {
      query += ` AND obsNo = ?`;
    }
    const [rows] = await db.query(query, [value]);
    res.json(rows[0] || null);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch register' });
  }
};

// Get list of registers for dropdown
exports.getRegisterList = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, obsNo FROM registers 
      WHERE obsStatus IN ('Recommended', 'Not Recommended', 'Forwarded for Management Decision')
      ORDER BY id DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch register list' });
  }
};

// Save new recheck (always generates a new RE number)
exports.saveRecheck = async (req, res) => {
  const { id, reObsDate, reObsStatus, reObs, reTreadDepth } = req.body;
  if (!id || !reObsDate || !reObsStatus) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Get current register details
    const [current] = await connection.query(
      'SELECT obsNo, obsStatus FROM registers WHERE id = ?',
      [id]
    );
    if (!current.length) throw new Error('Register not found');
    const originalStatus = current[0].obsStatus;
    const originalObsNo = current[0].obsNo;

    // Generate a new RE number for every recheck
    const reNo = await getNextReNumber();

    let reObsNo;
    if (reObsStatus === originalStatus) {
      // Same status: use original observation number
      reObsNo = originalObsNo;
    } else {
      // Different status: generate new observation number based on new status
      let type = '';
      switch (reObsStatus) {
        case 'Recommended': type = 'R'; break;
        case 'Not Recommended': type = 'NR'; break;
        case 'Forwarded for Management Decision': type = 'SCN'; break;
        default: type = 'R';
      }
      reObsNo = await generateObservationNumber(type);
    }

    // Update registers table
    await connection.query(
      `UPDATE registers SET reObsDate = ?, reObsStatus = ?, reObs = ?, reTreadDepth = ?, reObsNo = ?, reNo = ? WHERE id = ?`,
      [reObsDate, reObsStatus, reObs, reTreadDepth, reObsNo, reNo, id]
    );

    // Insert into rechecks table
    await connection.query(
      `INSERT INTO rechecks (id, reObsDate, reObsStatus, reObs, reTreadDepth, reObsNo) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, reObsDate, reObsStatus, reObs, reTreadDepth, reObsNo]
    );

    await connection.commit();
    res.json({ message: 'Recheck saved successfully', reObsNo, reNo });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ error: 'Failed to save recheck' });
  } finally {
    connection.release();
  }
};

// Update existing recheck (preserve existing reObsNo and reNo)
exports.updateRecheck = async (req, res) => {
  const { id } = req.params;
  const { reObsDate, reObsStatus, reObs, reTreadDepth } = req.body;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [current] = await connection.query(
      'SELECT reObsNo, reNo FROM registers WHERE id = ?',
      [id]
    );
    if (!current.length) throw new Error('Register not found');
    const { reObsNo, reNo } = current[0];

    await connection.query(
      `UPDATE registers SET reObsDate = ?, reObsStatus = ?, reObs = ?, reTreadDepth = ? WHERE id = ?`,
      [reObsDate, reObsStatus, reObs, reTreadDepth, id]
    );
    await connection.query(
      `UPDATE rechecks SET reObsDate = ?, reObsStatus = ?, reObs = ?, reTreadDepth = ? WHERE id = ?`,
      [reObsDate, reObsStatus, reObs, reTreadDepth, id]
    );
    await connection.commit();
    res.json({ message: 'Recheck updated successfully', reObsNo, reNo });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ error: 'Failed to update recheck' });
  } finally {
    connection.release();
  }
};

// Delete recheck
exports.deleteRecheck = async (req, res) => {
  const { id } = req.params;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query('DELETE FROM rechecks WHERE id = ?', [id]);
    await connection.query(
      `UPDATE registers SET reObsDate = NULL, reObsStatus = NULL, reObs = NULL, reTreadDepth = NULL, reObsNo = NULL, reNo = NULL WHERE id = ?`,
      [id]
    );
    await connection.commit();
    res.json({ message: 'Recheck deleted successfully' });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ error: 'Failed to delete recheck' });
  } finally {
    connection.release();
  }
};

// Get all rechecks
exports.getAllRechecks = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.id, r.claimNo, r.dealerView, r.brand, r.size, r.serialNo,
             r.obsNo, r.obsDate, r.techObs, r.treadDepth, r.obsStatus,
             r.reObsDate, r.reObsStatus, r.reObs, r.reTreadDepth, r.reObsNo, r.reNo
      FROM registers r
      WHERE r.reObsNo IS NOT NULL
      ORDER BY r.reObsDate DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch rechecks' });
  }
};
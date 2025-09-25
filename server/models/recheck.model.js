const db = require('../config/db');

class Recheck {
  static async getAll() {
    const [rows] = await db.query(`
      SELECT r.*, reg.claimNo, reg.dealerView, reg.brand, reg.size, reg.serialNo as treadDepth, 
             reg.techObs, reg.obsDate, reg.obsStatus
      FROM rechecks r
      LEFT JOIN registers reg ON r.id = reg.id
      ORDER BY r.recheckNo DESC
    `);
    return rows;
  }

  static async getById(recheckNo) {
    const [rows] = await db.query(`
      SELECT r.*, reg.claimNo, reg.dealerView, reg.brand, reg.size, reg.serialNo as treadDepth, 
             reg.techObs, reg.obsDate, reg.obsStatus
      FROM rechecks r
      LEFT JOIN registers reg ON r.id = reg.id
      WHERE r.recheckNo = ?
    `, [recheckNo]);
    return rows[0];
  }

  static async create(recheckData) {
    const [result] = await db.query(
      'INSERT INTO rechecks (id, reObsDate, reObs, reTreadDepth) VALUES (?, ?, ?, ?)',
      [recheckData.id, recheckData.reObsDate, recheckData.reObs, recheckData.reTreadDepth]
    );
    return result.insertId;
  }

  static async update(recheckNo, recheckData) {
    const [result] = await db.query(
      'UPDATE rechecks SET reObsDate = ?, reObs = ?, reTreadDepth = ? WHERE recheckNo = ?',
      [recheckData.reObsDate, recheckData.reObs, recheckData.reTreadDepth, recheckNo]
    );
    return result.affectedRows;
  }

  static async delete(recheckNo) {
    const [result] = await db.query('DELETE FROM rechecks WHERE recheckNo = ?', [recheckNo]);
    return result.affectedRows;
  }

  static async getNextRecheckNumber() {
    const [rows] = await db.query(
      'SELECT recheckNo FROM rechecks ORDER BY recheckNo DESC LIMIT 1'
    );
    
    let nextNumber = 1;
    if (rows.length > 0 && rows[0].recheckNo) {
      nextNumber = parseInt(rows[0].recheckNo) + 1;
    }
    
    return nextNumber;
  }
}

module.exports = Recheck;
const db = require('../config/db');

class Register {
  static async create(registerData) {
    const [result] = await db.query('INSERT INTO registers SET ?', registerData);
    return result.insertId;
  }

  static async getAll() {
    const [rows] = await db.query(`
      SELECT r.*, d.dealerName, d.dealerLocation 
      FROM registers r
      LEFT JOIN dealers d ON r.dealerCode = d.dealerCode
      ORDER BY r.receivedDate DESC
    `);
    return rows;
  }

  static async getById(id) {
    const [rows] = await db.query('SELECT * FROM registers WHERE id = ?', [id]);
    return rows[0];
  }

  static async update(id, updateData) {
    const [result] = await db.query('UPDATE registers SET ? WHERE id = ?', [updateData, id]);
    return result.affectedRows;
  }

  static async delete(id) {
    const [result] = await db.query('DELETE FROM registers WHERE id = ?', [id]);
    return result.affectedRows;
  }
}

module.exports = Register;
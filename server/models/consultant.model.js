const db = require('../config/db');

class Consultant {
  static async getAll() {
    const [rows] = await db.query('SELECT * FROM consultants ORDER BY consultantName');
    return rows;
  }
}

module.exports = Consultant;
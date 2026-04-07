const db = require('../config/db');

class Location {
  static async getAll() {
    const [rows] = await db.query('SELECT * FROM locations ORDER BY locationName');
    return rows;
  }
}

module.exports = Location;
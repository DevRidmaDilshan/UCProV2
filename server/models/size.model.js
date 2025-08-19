const db = require('../config/db');

class Size {
  static async getBrands() {
    const [rows] = await db.query('SELECT DISTINCT brand FROM sizes ORDER BY brand');
    return rows.map(row => row.brand);
  }

  static async getByBrand(brand) {
    const [rows] = await db.query('SELECT * FROM sizes WHERE brand = ? ORDER BY size', [brand]);
    return rows;
  }

  static async getBySize(size) {
    const [rows] = await db.query('SELECT * FROM sizes WHERE size = ?', [size]);
    return rows[0];
  }
}

module.exports = Size;
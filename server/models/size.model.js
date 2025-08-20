const db = require('../config/db');

class Size {
  static async getBrands() {
    try {
      const [rows] = await db.query('SELECT DISTINCT brand FROM sizes ORDER BY brand');
      return rows.map(row => row.brand);
    } catch (error) {
      console.error('Database error in getBrands:', error);
      throw error;
    }
  }

  static async getByBrand(brand) {
    try {
      const [rows] = await db.query('SELECT * FROM sizes WHERE brand = ? ORDER BY size', [brand]);
      return rows;
    } catch (error) {
      console.error('Database error in getByBrand:', error);
      throw error;
    }
  }

  static async getBySize(size) {
    try {
      const [rows] = await db.query('SELECT * FROM sizes WHERE size = ?', [size]);
      return rows[0];
    } catch (error) {
      console.error('Database error in getBySize:', error);
      throw error;
    }
  }
}

module.exports = Size;
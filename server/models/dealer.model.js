const db = require('../config/db');

class Dealer {
  static async getAll() {
    const [rows] = await db.query('SELECT * FROM dealers ORDER BY dealerName');
    return rows;
  }

  static async getByDealerView(dealerView) {
    const [rows] = await db.query('SELECT * FROM dealers WHERE dealerView = ?', [dealerView]);
    return rows[0];
  }

  static async getDealerViews() {
    const [rows] = await db.query('SELECT DISTINCT dealerView FROM dealers ORDER BY dealerView');
    return rows.map(row => row.dealerView);
  }
}

module.exports = Dealer;
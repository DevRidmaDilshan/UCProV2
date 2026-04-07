const db = require('../config/db');

class Stack {
  static async getAll() {
    const [rows] = await db.query('SELECT * FROM stacks ORDER BY stackName');
    return rows;
  }
}

module.exports = Stack;
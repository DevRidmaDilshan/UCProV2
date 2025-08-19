const db = require('../config/db');

class Register {
  static async create(registerData) {
    // Clean the data - convert empty strings to null for nullable fields
    const cleanedData = { ...registerData };
    const nullableFields = ['obsDate', 'techObs', 'treadDepth', 'consultantName', 'obsNo'];
    
    nullableFields.forEach(field => {
      if (cleanedData[field] === '') {
        cleanedData[field] = null;
      }
    });

    console.log('Inserting data:', cleanedData); // Debug log
    
    try {
      const [result] = await db.query('INSERT INTO registers SET ?', cleanedData);
      return result.insertId;
    } catch (error) {
      console.error('Database error in create:', error);
      throw error;
    }
  }

  static async getAll() {
    try {
      const [rows] = await db.query(`
        SELECT r.*, d.dealerName, d.dealerLocation 
        FROM registers r
        LEFT JOIN dealers d ON r.dealerCode = d.dealerCode
        ORDER BY r.receivedDate DESC
      `);
      return rows;
    } catch (error) {
      console.error('Database error in getAll:', error);
      throw error;
    }
  }

    static async getById(id) {
    try {
        const [rows] = await db.query('SELECT * FROM registers WHERE id = ?', [id]);
        return rows[0];
    } catch (error) {
        console.error('Database error in getById:', error);
        throw error;
    }
    }

  static async update(id, updateData) {
    // Clean the data - convert empty strings to null for nullable fields
    const cleanedData = { ...updateData };
    const nullableFields = ['obsDate', 'techObs', 'treadDepth', 'consultantName', 'obsNo'];
    
    nullableFields.forEach(field => {
      if (cleanedData[field] === '') {
        cleanedData[field] = null;
      }
    });

    console.log('Updating data:', cleanedData); // Debug log
    
    try {
      const [result] = await db.query('UPDATE registers SET ? WHERE id = ?', [cleanedData, id]);
      return result.affectedRows;
    } catch (error) {
      console.error('Database error in update:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const [result] = await db.query('DELETE FROM registers WHERE id = ?', [id]);
      return result.affectedRows;
    } catch (error) {
      console.error('Database error in delete:', error);
      throw error;
    }
  }
}

module.exports = Register;
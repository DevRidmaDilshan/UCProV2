const db = require('../config/db');

class Register {
  static async create(registerData) {
    // Clean the data - convert empty strings to null for nullable fields
    const cleanedData = { ...registerData };
    const nullableFields = ['obsDate', 'techObs', 'treadDepth', 'consultantName', 'obsNo', 'sizeCode'];
    
    nullableFields.forEach(field => {
      if (cleanedData[field] === '') {
        cleanedData[field] = null;
      }
    });

    console.log('Inserting data:', cleanedData);
    
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
      const [rows] = await db.query(`
        SELECT r.*, d.dealerName, d.dealerLocation
        FROM registers r
        LEFT JOIN dealers d ON r.dealerCode = d.dealerCode
        WHERE r.id = ?
      `, [id]);
      return rows[0];
    } catch (error) {
      console.error('Database error in getById:', error);
      throw error;
    }
  }

  static async update(id, updateData) {
    // Define the allowed fields for the registers table
    const allowedFields = [
      'receivedDate', 'claimNo', 'dealerView', 'dealerCode', 
      'sizeCode', 'brand', 'size', 'obsDate', 'techObs', 
      'treadDepth', 'consultantName', 'obsNo'
    ];
    
    // Filter the update data to only include allowed fields
    const cleanedData = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        cleanedData[field] = updateData[field] === '' ? null : updateData[field];
      }
    });

    console.log('Filtered update data:', cleanedData);
    
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
const Register = require('../models/register.model');
const Dealer = require('../models/dealer.model');
const Size = require('../models/size.model');
const Consultant = require('../models/consultant.model');
const db = require('../config/db');

// Helper function to generate observation numbers
const generateObservationNumber = async (type) => {
  try {
    // Get the last observation number for this type
    const [rows] = await db.query(
      'SELECT obsNo FROM registers WHERE obsNo LIKE ? ORDER BY LENGTH(obsNo) DESC, obsNo DESC LIMIT 1',
      [`${type}%`]
    );
    
    let nextNumber = 1;
    if (rows.length > 0 && rows[0].obsNo) {
      const lastObsNo = rows[0].obsNo;
      // Extract the number part
      const numberPart = lastObsNo.replace(type, '');
      const lastNumber = parseInt(numberPart, 10);
      nextNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;
    }
    
    // Format with leading zeros
    return `${type}${nextNumber.toString().padStart(5, '0')}`;
  } catch (error) {
    console.error('Error generating observation number:', error);
    throw error;
  }
};

exports.createRegister = async (req, res) => {
  try {
    console.log('Received data:', req.body);
    
    const registerId = await Register.create(req.body);
    res.status(201).json({ id: registerId, message: 'Register created successfully' });
  } catch (error) {
    console.error('Error creating register:', error);
    res.status(500).json({ 
      message: 'Error creating register',
      error: error.message 
    });
  }
};

exports.getAllRegisters = async (req, res) => {
  try {
    const registers = await Register.getAll();
    res.json(registers);
  } catch (error) {
    console.error('Error fetching registers:', error);
    res.status(500).json({ 
      message: 'Error fetching registers',
      error: error.message 
    });
  }
};

exports.getRegisterById = async (req, res) => {
  try {
    const register = await Register.getById(req.params.id);
    if (!register) {
      return res.status(404).json({ message: 'Register not found' });
    }
    res.json(register);
  } catch (error) {
    console.error('Error fetching register:', error);
    res.status(500).json({ 
      message: 'Error fetching register',
      error: error.message 
    });
  }
};

exports.updateRegister = async (req, res) => {
  try {
    // Format receivedDate if it exists
    if (req.body.receivedDate) {
      // Extract just the date part from ISO string or format existing date
      const date = new Date(req.body.receivedDate);
      if (!isNaN(date.getTime())) {
        req.body.receivedDate = date.toISOString().split('T')[0];
      }
    }
    
    // Similarly, format any other date fields like obsDate
    if (req.body.obsDate) {
      const date = new Date(req.body.obsDate);
      if (!isNaN(date.getTime())) {
        req.body.obsDate = date.toISOString().split('T')[0];
      }
    }

    console.log('Updating register with data:', req.body);
    
    // If obsStatus is provided, generate the appropriate observation number
    if (req.body.obsStatus) {
      switch(req.body.obsStatus) {
        case 'Recommended':
          req.body.obsNo = await generateObservationNumber('R');
          break;
        case 'Not Recommended':
          req.body.obsNo = await generateObservationNumber('NR');
          break;
        case 'Forwarded for Management Decision':
          req.body.obsNo = await generateObservationNumber('SCN');
          break;
        case 'Pending':
          req.body.obsNo = null;
          break;
      }
    }
    
    const affectedRows = await Register.update(req.params.id, req.body);
    if (affectedRows === 0) {
      return res.status(404).json({ message: 'Register not found' });
    }
    res.json({ message: 'Register updated successfully' });
  } catch (error) {
    console.error('Error updating register:', error);
    res.status(500).json({ 
      message: 'Error updating register',
      error: error.message 
    });
  }
};

exports.deleteRegister = async (req, res) => {
  try {
    const affectedRows = await Register.delete(req.params.id);
    if (affectedRows === 0) {
      return res.status(404).json({ message: 'Register not found' });
    }
    res.json({ message: 'Register deleted successfully' });
  } catch (error) {
    console.error('Error deleting register:', error);
    res.status(500).json({ 
      message: 'Error deleting register',
      error: error.message 
    });
  }
};

exports.getInitialData = async (req, res) => {
  try {
    const dealerViews = await Dealer.getDealerViews();
    const brands = await Size.getBrands();
    res.json({ dealerViews, brands });
  } catch (error) {
    console.error('Error fetching initial data:', error);
    res.status(500).json({ 
      message: 'Error fetching initial data',
      error: error.message 
    });
  }
};

exports.getDealerByView = async (req, res) => {
  try {
    const dealer = await Dealer.getByDealerView(req.params.dealerView);
    if (!dealer) {
      return res.status(404).json({ message: 'Dealer not found' });
    }
    res.json(dealer);
  } catch (error) {
    console.error('Error fetching dealer:', error);
    res.status(500).json({ 
      message: 'Error fetching dealer',
      error: error.message 
    });
  }
};

exports.getSizesByBrand = async (req, res) => {
  try {
    const sizes = await Size.getByBrand(req.params.brand);
    res.json(sizes);
  } catch (error) {
    console.error('Error fetching sizes:', error);
    res.status(500).json({ 
      message: 'Error fetching sizes',
      error: error.message 
    });
  }
};

exports.getSizeDetails = async (req, res) => {
  try {
    const size = await Size.getBySize(req.params.size);
    if (!size) {
      return res.status(404).json({ message: 'Size not found' });
    }
    res.json(size);
  } catch (error) {
    console.error('Error fetching size details:', error);
    res.status(500).json({ 
      message: 'Error fetching size details',
      error: error.message 
    });
  }
};

exports.getAllConsultants = async (req, res) => {
  try {
    const consultants = await Consultant.getAll();
    res.json(consultants);
  } catch (error) {
    console.error('Error fetching consultants:', error);
    res.status(500).json({ 
      message: 'Error fetching consultants',
      error: error.message 
    });
  }
};

exports.getObservationNumbers = async (req, res) => {
  try {
    // Generate next numbers for each type
    const nextR = await generateObservationNumber('R');
    const nextNR = await generateObservationNumber('NR');
    const nextSCN = await generateObservationNumber('SCN');
    
    res.json([
      { value: nextR, label: `Recommended (${nextR})` },
      { value: nextNR, label: `Not Recommended (${nextNR})` },
      { value: nextSCN, label: `Management Decision (${nextSCN})` }
    ]);
  } catch (error) {
    console.error('Error generating observation numbers:', error);
    res.status(500).json({ 
      message: 'Error generating observation numbers',
      error: error.message 
    });
  }
};

exports.generateReport = async (req, res) => {
  try {
    const { startDate, endDate, brand, size, consultant } = req.body;
    
    let query = `
      SELECT r.*, d.dealerName, d.dealerLocation 
      FROM registers r
      LEFT JOIN dealers d ON r.dealerCode = d.dealerCode
      WHERE 1=1
    `;
    
    const params = [];
    
    if (startDate) {
      query += ' AND r.receivedDate >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND r.receivedDate <= ?';
      params.push(endDate);
    }
    
    if (brand) {
      query += ' AND r.brand = ?';
      params.push(brand);
    }
    
    if (size) {
      query += ' AND r.size = ?';
      params.push(size);
    }
    
    if (consultant) {
      query += ' AND r.consultantName = ?';
      params.push(consultant);
    }
    
    query += ' ORDER BY r.receivedDate DESC';
    
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ 
      message: 'Error generating report',
      error: error.message 
    });
  }
};

exports.getDashboardData = async (req, res) => {
  try {
    // Get counts by status using obsStatus field
    const [statusCounts] = await db.query(`
      SELECT 
        SUM(CASE WHEN obsStatus IS NULL OR obsStatus = 'Pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN obsStatus = 'Recommended' THEN 1 ELSE 0 END) as recommended,
        SUM(CASE WHEN obsStatus = 'Not Recommended' THEN 1 ELSE 0 END) as notRecommended,
        SUM(CASE WHEN obsStatus = 'Forwarded for Management Decision' THEN 1 ELSE 0 END) as managementDecision,
        COUNT(*) as total
      FROM registers
    `);
    
    // Get counts by brand
    const [brandCounts] = await db.query(`
      SELECT brand, COUNT(*) as count
      FROM registers
      WHERE brand IS NOT NULL AND brand != ''
      GROUP BY brand
      ORDER BY count DESC
    `);
    
    // Get monthly counts
    const [monthlyCounts] = await db.query(`
      SELECT 
        DATE_FORMAT(receivedDate, '%Y-%m') as month,
        COUNT(*) as count
      FROM registers
      WHERE receivedDate IS NOT NULL
      GROUP BY DATE_FORMAT(receivedDate, '%Y-%m')
      ORDER BY month DESC
      LIMIT 6
    `);
    
    res.json({
      statusCounts: statusCounts[0] || { pending: 0, recommended: 0, notRecommended: 0, managementDecision: 0, total: 0 },
      brandCounts: brandCounts || [],
      monthlyCounts: monthlyCounts || []
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ 
      message: 'Error fetching dashboard data',
      error: error.message 
    });
  }
};

// New endpoint to get next observation number by type
exports.getNextObservationNumber = async (req, res) => {
  try {
    const { type } = req.params;
    const nextNumber = await generateObservationNumber(type);
    res.json({ nextNumber });
  } catch (error) {
    console.error('Error getting next observation number:', error);
    res.status(500).json({ 
      message: 'Error getting next observation number',
      error: error.message 
    });
  }
};

exports.generateBrandReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    
    let query = `
      SELECT 
        brand,
        COUNT(*) as totalCount,
        SUM(CASE WHEN obsStatus IS NULL OR obsStatus = 'Pending' THEN 1 ELSE 0 END) as pendingCount,
        SUM(CASE WHEN obsStatus = 'Recommended' THEN 1 ELSE 0 END) as recommendedCount,
        SUM(CASE WHEN obsStatus = 'Not Recommended' THEN 1 ELSE 0 END) as notRecommendedCount,
        SUM(CASE WHEN obsStatus = 'Forwarded for Management Decision' THEN 1 ELSE 0 END) as managementDecisionCount
      FROM registers
      WHERE 1=1
    `;
    
    const params = [];
    
    if (startDate) {
      query += ' AND receivedDate >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND receivedDate <= ?';
      params.push(endDate);
    }
    
    query += ' GROUP BY brand ORDER BY totalCount DESC';
    
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error generating brand report:', error);
    res.status(500).json({ 
      message: 'Error generating brand report',
      error: error.message 
    });
  }
};

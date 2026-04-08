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
    // 1. Format date fields if they exist
    if (req.body.receivedDate) {
      const date = new Date(req.body.receivedDate);
      if (!isNaN(date.getTime())) {
        req.body.receivedDate = date.toISOString().split('T')[0];
      }
    }
    if (req.body.obsDate) {
      const date = new Date(req.body.obsDate);
      if (!isNaN(date.getTime())) {
        req.body.obsDate = date.toISOString().split('T')[0];
      }
    }

    console.log('Updating register with data:', req.body);

    // 2. Critical Logic: Determine if a new observation number is needed
    if (req.body.obsStatus) {
      // First, get the current register data to check the existing status and obsNo
      const currentRegister = await Register.getById(req.params.id);

      if (currentRegister) {
        const currentStatus = currentRegister.obsStatus;
        const currentObsNo = currentRegister.obsNo;
        const newStatus = req.body.obsStatus;

        // Condition to generate a new number:
        // - The new status is NOT "Pending"
        // - AND EITHER:
        //   a) The status is actually being changed, OR
        //   b) There is no existing observation number
        if (newStatus !== 'Pending' && (currentStatus !== newStatus || !currentObsNo)) {
          switch (newStatus) {
            case 'Recommended':
              req.body.obsNo = await generateObservationNumber('R');
              break;
            case 'Not Recommended':
              req.body.obsNo = await generateObservationNumber('NR');
              break;
            case 'Forwarded for Management Decision':
              req.body.obsNo = await generateObservationNumber('SCN');
              break;
          }
        } else {
          // Otherwise, preserve the existing observation number
          // If new status is "Pending", explicitly set obsNo to null
          req.body.obsNo = (newStatus === 'Pending') ? null : currentObsNo;
        }
      } else {
        return res.status(404).json({ message: 'Register not found' });
      }
    }

    // 3. Proceed with the update using the modified req.body
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
        SUM(CASE WHEN obsStatus = 'Recommended' THEN 1 ELSE 0 END) as r_count,
        SUM(CASE WHEN obsStatus = 'Not Recommended' THEN 1 ELSE 0 END) as nr_count,
        SUM(CASE WHEN obsStatus = 'Forwarded for Management Decision' THEN 1 ELSE 0 END) as scn_count,
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
      statusCounts: statusCounts[0] || { pending: 0, r_count: 0, nr_count: 0, scn_count: 0, total: 0 },
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

exports.getDailyReportData = async (req, res) => {
  try {
    // Get counts by status using obsStatus field
    const [statusCounts] = await db.query(`
      SELECT 
        SUM(CASE WHEN obsStatus IS NULL OR obsStatus = 'Pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN obsStatus = 'Recommended' THEN 1 ELSE 0 END) as r_count,
        SUM(CASE WHEN obsStatus = 'Not Recommended' THEN 1 ELSE 0 END) as nr_count,
        SUM(CASE WHEN obsStatus = 'Forwarded for Management Decision' THEN 1 ELSE 0 END) as scn_count,
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
        DATE_FORMAT(obsDate, '%Y-%m') as month,
        COUNT(*) as count
      FROM registers
      WHERE obsDate IS NOT NULL
      GROUP BY DATE_FORMAT(obsDate, '%Y-%m')
      ORDER BY month DESC
      LIMIT 6
    `);
    
    res.json({
      statusCounts: statusCounts[0] || { pending: 0, r_count: 0, nr_count: 0, scn_count: 0, total: 0 },
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
        SUM(CASE WHEN obsStatus IS NULL OR obsStatus = 'Pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN obsStatus = 'Recommended' THEN 1 ELSE 0 END) as r_count,
        SUM(CASE WHEN obsStatus = 'Not Recommended' THEN 1 ELSE 0 END) as nr_count,
        SUM(CASE WHEN obsStatus = 'Forwarded for Management Decision' THEN 1 ELSE 0 END) as scn_count
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

// Add this to your register.controller.js
exports.getRegistersForDropdown = async (req, res) => {
  try {
    const query = `
      SELECT id, claimNo, dealerView, brand, size, serialNo 
      FROM registers 
      ORDER BY id DESC
    `;
    
    const [registers] = await db.query(query);
    
    // Transform the data for the dropdown
    const dropdownData = registers.map(register => ({
      id: register.id,
      claimNo: register.claimNo || 'N/A',
      dealerView: register.dealerView || 'N/A',
      brand: register.brand || 'N/A',
      size: register.size || 'N/A',
      serialNo: register.serialNo || 'N/A'
    }));
    
    res.json(dropdownData);
  } catch (error) {
    console.error('Error fetching registers for dropdown:', error);
    res.status(500).json({ 
      message: 'Error fetching registers for dropdown',
      error: error.message 
    });
  }
};

// register.controller.js

exports.getBrandReport = async (req, res) => {
  try {
    const { brand, startDate, endDate } = req.query;

    if (!brand || !startDate || !endDate) {
      return res.status(400).json({ error: 'Brand, startDate and endDate are required' });
    }

    // --------------------------------------------------------------
    // 1. Fetch registers for the brand and date range
    // --------------------------------------------------------------
    const [registers] = await db.query(
      `SELECT id, obsStatus, techObs, sizeCode 
       FROM registers 
       WHERE brand = ? AND receivedDate BETWEEN ? AND ?`,
      [brand, startDate, endDate]
    );

    // --------------------------------------------------------------
    // 2. Get size category mapping (sizeCode -> category)
    // --------------------------------------------------------------
    const [sizeRows] = await db.query(
      `SELECT sizeCode, category FROM sizes WHERE brand = ?`,
      [brand]
    );
    const sizeCategoryMap = {};
    sizeRows.forEach(row => {
      sizeCategoryMap[row.sizeCode] = row.category || 'Uncategorized';
    });

    // --------------------------------------------------------------
    // 3. Get all observations for text matching
    // --------------------------------------------------------------
    const [observations] = await db.query(`SELECT obId, observation, obsCategory FROM observations`);

    // Helper: extract the first observation text from techObs
    const extractFirstObservationText = (techObs) => {
      if (!techObs) return null;
      const lines = techObs.split('\n');
      if (lines.length === 0) return null;
      const firstLine = lines[0].trim();
      // Remove numbering like "1) " or "2) "
      const withoutNumber = firstLine.replace(/^\d+\)\s*/, '');
      return withoutNumber;
    };

    // Helper: find obsCategory by matching observation text
    const findObsCategory = (obsText, observations) => {
      if (!obsText) return null;
      // Try exact match first
      let found = observations.find(o => o.observation === obsText);
      if (found) return found.obsCategory;
      // Try case‑insensitive partial match (if needed)
      found = observations.find(o => obsText.includes(o.observation) || o.observation.includes(obsText));
      return found ? found.obsCategory : 'Uncategorized';
    };

    // --------------------------------------------------------------
    // Data structures for Recommended breakdown
    // --------------------------------------------------------------
    // rData[obsCategory][sizeCategory] = count
    const rData = new Map(); // Map<obsCategory, Map<sizeCategory, count>>
    let nrCount = 0;
    let scnCount = 0;
    let pendingCount = 0;

    // Process each register
    for (const reg of registers) {
      const status = reg.obsStatus;
      const sizeCode = reg.sizeCode;
      const sizeCategory = sizeCategoryMap[sizeCode] || 'Uncategorized';

      if (status === 'Recommended') {
        const obsText = extractFirstObservationText(reg.techObs);
        const obsCategory = findObsCategory(obsText, observations) || 'Other Defects';

        if (!rData.has(obsCategory)) {
          rData.set(obsCategory, new Map());
        }
        const sizeMap = rData.get(obsCategory);
        sizeMap.set(sizeCategory, (sizeMap.get(sizeCategory) || 0) + 1);
      } 
      else if (status === 'Not Recommended') {
        nrCount++;
      } 
      else if (status === 'Forwarded for Management Decision') {
        scnCount++;
      } 
      else {
        pendingCount++;
      }
    }

    // --------------------------------------------------------------
    // Build hierarchical breakdown: top 2 obsCategories, then top 2 sizeCategories each
    // --------------------------------------------------------------
    const obsCategoriesArray = [];
    for (const [obsCat, sizeMap] of rData.entries()) {
      let total = 0;
      const sizes = [];
      for (const [sizeCat, count] of sizeMap.entries()) {
        total += count;
        sizes.push({ name: sizeCat, count });
      }
      sizes.sort((a, b) => b.count - a.count);
      obsCategoriesArray.push({
        obsCategory: obsCat,
        total,
        sizeCategories: sizes
      });
    }
    // Sort by total descending
    obsCategoriesArray.sort((a, b) => b.total - a.total);

    // Take top 2 obsCategories
    const topObs = obsCategoriesArray.slice(0, 2);
    let othersObsTotal = 0;
    const othersSizeMap = new Map();

    for (let i = 2; i < obsCategoriesArray.length; i++) {
      const cat = obsCategoriesArray[i];
      othersObsTotal += cat.total;
      for (const size of cat.sizeCategories) {
        othersSizeMap.set(size.name, (othersSizeMap.get(size.name) || 0) + size.count);
      }
    }

    // Build "Others" obsCategory
    let othersSizesArray = [];
    for (const [sizeName, count] of othersSizeMap.entries()) {
      othersSizesArray.push({ name: sizeName, count });
    }
    othersSizesArray.sort((a, b) => b.count - a.count);
    const topOthersSizes = othersSizesArray.slice(0, 2);
    let otherSizesTotal = 0;
    for (let i = 2; i < othersSizesArray.length; i++) {
      otherSizesTotal += othersSizesArray[i].count;
    }
    const othersObsCategory = {
      obsCategory: 'Others',
      total: othersObsTotal,
      sizeCategories: [
        ...topOthersSizes,
        ...(otherSizesTotal > 0 ? [{ name: 'Other Sizes', count: otherSizesTotal }] : [])
      ]
    };

    // For each top obsCategory, take top 2 size categories + "Other Sizes"
    const finalBreakdown = topObs.map(obs => {
      const topSizes = obs.sizeCategories.slice(0, 2);
      let otherSizesTotal = 0;
      for (let i = 2; i < obs.sizeCategories.length; i++) {
        otherSizesTotal += obs.sizeCategories[i].count;
      }
      const sizeCategories = [
        ...topSizes,
        ...(otherSizesTotal > 0 ? [{ name: 'Other Sizes', count: otherSizesTotal }] : [])
      ];
      return {
        obsCategory: obs.obsCategory,
        total: obs.total,
        sizeCategories
      };
    });

    if (othersObsTotal > 0) {
      finalBreakdown.push(othersObsCategory);
    }

    // --------------------------------------------------------------
    // Response
    // --------------------------------------------------------------
    res.json({
      brand,
      period: { startDate, endDate },
      totalReceived: registers.length,
      recommended: {
        total: finalBreakdown.reduce((sum, m) => sum + m.total, 0),
        breakdown: finalBreakdown
      },
      nr: nrCount,
      scn: scnCount,
      pending: pendingCount
    });

  } catch (error) {
    console.error('Error generating brand report:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
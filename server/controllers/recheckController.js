// server/controllers/recheckController.js
const db = require('../config/db');

// Create and Save a new Recheck
exports.create = async (req, res) => {
  try {
    const { id, reObsDate, reObsStatus, reObs, reTreadDepth } = req.body;

    // Validate required fields
    if (!id || !reObsDate || !reObsStatus) {
      return res.status(400).send({
        message: "Required fields: id, reObsDate, reObsStatus"
      });
    }

    // Get next recheck number
    const [lastRecheck] = await db.promise().query(
      'SELECT reObsNo FROM rechecks ORDER BY reNo DESC LIMIT 1'
    );

    let nextReNo = 'RC0001';
    if (lastRecheck.length > 0 && lastRecheck[0].reObsNo) {
      const lastNumber = parseInt(lastRecheck[0].reObsNo.replace('RC', ''));
      nextReNo = 'RC' + (lastNumber + 1).toString().padStart(4, '0');
    }

    // Check if observation status is different from original
    const [originalRegister] = await db.promise().query(
      'SELECT obsStatus, obsNo FROM registers WHERE id = ?',
      [id]
    );

    let finalObsNo = nextReNo;
    
    if (originalRegister.length > 0 && originalRegister[0].obsStatus === reObsStatus) {
      // If status is same, use original observation number
      finalObsNo = originalRegister[0].obsNo || nextReNo;
    }

    // Create Recheck
    const [result] = await db.promise().query(
      'INSERT INTO rechecks (id, reObsDate, reObsStatus, reObs, reTreadDepth, reObsNo) VALUES (?, ?, ?, ?, ?, ?)',
      [id, reObsDate, reObsStatus, reObs || '', reTreadDepth || '', finalObsNo]
    );

    // Get the created recheck
    const [newRecheck] = await db.promise().query(
      `SELECT r.*, reg.claimNo, reg.dealerView, reg.dealerCode, reg.brand, reg.size, reg.serialNo, reg.obsNo, reg.obsStatus 
       FROM rechecks r 
       LEFT JOIN registers reg ON r.id = reg.id 
       WHERE r.reNo = ?`,
      [result.insertId]
    );

    res.send(newRecheck[0]);
  } catch (error) {
    console.error('Error creating recheck:', error);
    res.status(500).send({
      message: error.message || "Some error occurred while creating the Recheck."
    });
  }
};

// Retrieve all Rechecks from the database with Register details
exports.findAll = async (req, res) => {
  try {
    const [rechecks] = await db.promise().query(
      `SELECT r.*, reg.claimNo, reg.dealerView, reg.dealerCode, reg.brand, reg.size, reg.serialNo, reg.obsNo, reg.obsStatus 
       FROM rechecks r 
       LEFT JOIN registers reg ON r.id = reg.id 
       ORDER BY r.reNo DESC`
    );

    res.send(rechecks);
  } catch (error) {
    console.error('Error fetching rechecks:', error);
    res.status(500).send({
      message: error.message || "Some error occurred while retrieving rechecks."
    });
  }
};

// Find a single Recheck with reNo
exports.findOne = async (req, res) => {
  const reNo = req.params.reNo;

  try {
    const [recheck] = await db.promise().query(
      `SELECT r.*, reg.claimNo, reg.dealerView, reg.dealerCode, reg.brand, reg.size, reg.serialNo, reg.obsNo, reg.obsStatus 
       FROM rechecks r 
       LEFT JOIN registers reg ON r.id = reg.id 
       WHERE r.reNo = ?`,
      [reNo]
    );

    if (recheck.length > 0) {
      res.send(recheck[0]);
    } else {
      res.status(404).send({
        message: `Recheck with reNo=${reNo} was not found.`
      });
    }
  } catch (error) {
    console.error('Error finding recheck:', error);
    res.status(500).send({
      message: "Error retrieving Recheck with reNo=" + reNo
    });
  }
};

// Get next recheck number
exports.getNextNumber = async (req, res) => {
  try {
    const [lastRecheck] = await db.promise().query(
      'SELECT reObsNo FROM rechecks ORDER BY reNo DESC LIMIT 1'
    );

    let nextNumber = 'RC0001';
    if (lastRecheck.length > 0 && lastRecheck[0].reObsNo) {
      const lastNumber = parseInt(lastRecheck[0].reObsNo.replace('RC', ''));
      nextNumber = 'RC' + (lastNumber + 1).toString().padStart(4, '0');
    }

    res.send({ nextNumber });
  } catch (error) {
    console.error('Error generating next number:', error);
    res.status(500).send({
      message: error.message || "Error generating next recheck number."
    });
  }
};

// Update a Recheck by reNo
exports.update = async (req, res) => {
  const reNo = req.params.reNo;

  try {
    const { reObsDate, reObsStatus, reObs, reTreadDepth } = req.body;

    // Check if recheck exists
    const [existingRecheck] = await db.promise().query(
      'SELECT * FROM rechecks WHERE reNo = ?',
      [reNo]
    );

    if (existingRecheck.length === 0) {
      return res.status(404).send({
        message: `Recheck with reNo=${reNo} not found.`
      });
    }

    // Update recheck
    const [result] = await db.promise().query(
      'UPDATE rechecks SET reObsDate = ?, reObsStatus = ?, reObs = ?, reTreadDepth = ? WHERE reNo = ?',
      [reObsDate, reObsStatus, reObs, reTreadDepth, reNo]
    );

    if (result.affectedRows === 1) {
      res.send({
        message: "Recheck was updated successfully."
      });
    } else {
      res.status(404).send({
        message: `Cannot update Recheck with reNo=${reNo}.`
      });
    }
  } catch (error) {
    console.error('Error updating recheck:', error);
    res.status(500).send({
      message: "Error updating Recheck with reNo=" + reNo
    });
  }
};

// Delete a Recheck with the specified reNo
exports.delete = async (req, res) => {
  const reNo = req.params.reNo;

  try {
    const [result] = await db.promise().query(
      'DELETE FROM rechecks WHERE reNo = ?',
      [reNo]
    );

    if (result.affectedRows === 1) {
      res.send({
        message: "Recheck was deleted successfully!"
      });
    } else {
      res.status(404).send({
        message: `Cannot delete Recheck with reNo=${reNo}. Maybe Recheck was not found!`
      });
    }
  } catch (error) {
    console.error('Error deleting recheck:', error);
    res.status(500).send({
      message: "Could not delete Recheck with reNo=" + reNo
    });
  }
};

// Find all Rechecks by Register ID
exports.findByRegisterId = async (req, res) => {
  const id = req.params.id;

  try {
    const [rechecks] = await db.promise().query(
      `SELECT r.*, reg.claimNo, reg.dealerView, reg.dealerCode, reg.brand, reg.size, reg.serialNo, reg.obsNo, reg.obsStatus 
       FROM rechecks r 
       LEFT JOIN registers reg ON r.id = reg.id 
       WHERE r.id = ? 
       ORDER BY r.reObsDate DESC`,
      [id]
    );

    res.send(rechecks);
  } catch (error) {
    console.error('Error finding rechecks by register ID:', error);
    res.status(500).send({
      message: "Error retrieving Rechecks for register id=" + id
    });
  }
};

// server/controllers/recheckController.js


// Get all registers for dropdown
exports.getRegistersForDropdown = async (req, res) => {
  try {
    const [registers] = await db.promise().query(
      'SELECT id, claimNo FROM registers ORDER BY id DESC'
    );
    
    res.send(registers);
  } catch (error) {
    console.error('Error fetching registers for dropdown:', error);
    res.status(500).send({
      message: "Error fetching registers for dropdown"
    });
  }
};

// Get register details by ID
exports.getRegisterById = async (req, res) => {
  const id = req.params.id;
  
  try {
    const [register] = await db.promise().query(
      'SELECT * FROM registers WHERE id = ?',
      [id]
    );
    
    if (register.length > 0) {
      res.send(register[0]);
    } else {
      res.status(404).send({
        message: `Register with id=${id} was not found.`
      });
    }
  } catch (error) {
    console.error('Error finding register:', error);
    res.status(500).send({
      message: "Error retrieving Register with id=" + id
    });
  }
};
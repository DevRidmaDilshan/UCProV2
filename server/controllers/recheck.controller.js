const Recheck = require('../models/recheck.model');
const Register = require('../models/register.model');

exports.getAllRechecks = async (req, res) => {
  try {
    const rechecks = await Recheck.getAll();
    
    // Format recheck numbers to RC0001 format
    const formattedRechecks = rechecks.map(recheck => ({
      ...recheck,
      formattedRecheckNo: `RC${recheck.recheckNo.toString().padStart(4, '0')}`
    }));
    
    res.json(formattedRechecks);
  } catch (error) {
    console.error('Error fetching rechecks:', error);
    res.status(500).json({ 
      message: 'Error fetching rechecks',
      error: error.message 
    });
  }
};

exports.getRecheckById = async (req, res) => {
  try {
    const recheck = await Recheck.getById(req.params.recheckNo);
    if (!recheck) {
      return res.status(404).json({ message: 'Recheck not found' });
    }
    
    // Format recheck number
    recheck.formattedRecheckNo = `RC${recheck.recheckNo.toString().padStart(4, '0')}`;
    
    res.json(recheck);
  } catch (error) {
    console.error('Error fetching recheck:', error);
    res.status(500).json({ 
      message: 'Error fetching recheck',
      error: error.message 
    });
  }
};

exports.createRecheck = async (req, res) => {
  try {
    console.log('Creating recheck with data:', req.body);
    
    // Get next recheck number
    const nextRecheckNo = await Recheck.getNextRecheckNumber();
    req.body.recheckNo = nextRecheckNo;
    
    const recheckId = await Recheck.create(req.body);
    
    // Get the created recheck with formatted number
    const newRecheck = await Recheck.getById(recheckId);
    newRecheck.formattedRecheckNo = `RC${nextRecheckNo.toString().padStart(4, '0')}`;
    
    res.status(201).json({ 
      message: 'Recheck created successfully',
      recheck: newRecheck 
    });
  } catch (error) {
    console.error('Error creating recheck:', error);
    res.status(500).json({ 
      message: 'Error creating recheck',
      error: error.message 
    });
  }
};

exports.updateRecheck = async (req, res) => {
  try {
    console.log('Updating recheck with data:', req.body);
    
    const affectedRows = await Recheck.update(req.params.recheckNo, req.body);
    if (affectedRows === 0) {
      return res.status(404).json({ message: 'Recheck not found' });
    }
    
    // Get the updated recheck
    const updatedRecheck = await Recheck.getById(req.params.recheckNo);
    updatedRecheck.formattedRecheckNo = `RC${updatedRecheck.recheckNo.toString().padStart(4, '0')}`;
    
    res.json({ 
      message: 'Recheck updated successfully',
      recheck: updatedRecheck 
    });
  } catch (error) {
    console.error('Error updating recheck:', error);
    res.status(500).json({ 
      message: 'Error updating recheck',
      error: error.message 
    });
  }
};

exports.deleteRecheck = async (req, res) => {
  try {
    const affectedRows = await Recheck.delete(req.params.recheckNo);
    if (affectedRows === 0) {
      return res.status(404).json({ message: 'Recheck not found' });
    }
    res.json({ message: 'Recheck deleted successfully' });
  } catch (error) {
    console.error('Error deleting recheck:', error);
    res.status(500).json({ 
      message: 'Error deleting recheck',
      error: error.message 
    });
  }
};

exports.getRegisterForRecheck = async (req, res) => {
  try {
    const register = await Register.getById(req.params.id);
    if (!register) {
      return res.status(404).json({ message: 'Register not found' });
    }
    res.json(register);
  } catch (error) {
    console.error('Error fetching register for recheck:', error);
    res.status(500).json({ 
      message: 'Error fetching register data',
      error: error.message 
    });
  }
};

exports.getRegistersWithObservations = async (req, res) => {
  try {
    const registers = await Register.getAll();
    // Filter registers that have observation data
    const registersWithObs = registers.filter(reg => 
      reg.techObs && reg.techObs.trim() !== '' && 
      reg.obsStatus && reg.obsStatus !== 'Pending'
    );
    res.json(registersWithObs);
  } catch (error) {
    console.error('Error fetching registers with observations:', error);
    res.status(500).json({ 
      message: 'Error fetching registers',
      error: error.message 
    });
  }
};
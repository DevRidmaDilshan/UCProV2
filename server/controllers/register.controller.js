const Register = require('../models/register.model');
const Dealer = require('../models/dealer.model');
const Size = require('../models/size.model');
const Consultant = require('../models/consultant.model');

exports.createRegister = async (req, res) => {
  try {
    console.log('Received data:', req.body); // Debug log
    
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
    console.log('Updating register with data:', req.body); // Debug log
    
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
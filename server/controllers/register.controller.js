const Register = require('../models/register.model');
const Dealer = require('../models/dealer.model');
const Size = require('../models/size.model');

exports.createRegister = async (req, res) => {
  try {
    const registerId = await Register.create(req.body);
    res.status(201).json({ id: registerId, message: 'Register created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating register' });
  }
};

exports.getAllRegisters = async (req, res) => {
  try {
    const registers = await Register.getAll();
    res.json(registers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching registers' });
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
    console.error(error);
    res.status(500).json({ message: 'Error fetching register' });
  }
};

exports.updateRegister = async (req, res) => {
  try {
    const affectedRows = await Register.update(req.params.id, req.body);
    if (affectedRows === 0) {
      return res.status(404).json({ message: 'Register not found' });
    }
    res.json({ message: 'Register updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating register' });
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
    console.error(error);
    res.status(500).json({ message: 'Error deleting register' });
  }
};

exports.getInitialData = async (req, res) => {
  try {
    const dealerViews = await Dealer.getDealerViews();
    const brands = await Size.getBrands();
    res.json({ dealerViews, brands });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching initial data' });
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
    console.error(error);
    res.status(500).json({ message: 'Error fetching dealer' });
  }
};

exports.getSizesByBrand = async (req, res) => {
  try {
    const sizes = await Size.getByBrand(req.params.brand);
    res.json(sizes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching sizes' });
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
    console.error(error);
    res.status(500).json({ message: 'Error fetching size details' });
  }
};
const Consultant = require('../models/consultant.model');

exports.getAllConsultants = async (req, res) => {
  try {
    const consultants = await Consultant.getAll();
    res.json(consultants);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching consultants' });
  }
};
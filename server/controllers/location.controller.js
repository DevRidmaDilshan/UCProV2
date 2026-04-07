const Location = require('../models/location.model');

exports.getAllLocations = async (req, res) => {
  try {
    const locations = await Location.getAll();
    res.json(locations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching locations' });
  }
};
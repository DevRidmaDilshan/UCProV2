const Stack = require('../models/stack.model');

exports.getAllStacks = async (req, res) => {
  try {
    const stacks = await Stack.getAll();
    res.json(stacks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching stacks' });
  }
};
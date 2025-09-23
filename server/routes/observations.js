// Add this to your server routes (e.g., in routes/observations.js)
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Your database connection

// Get all observations
router.get('/', async (req, res) => {
  try {
    const [observations] = await db.execute('SELECT * FROM observations ORDER BY obId');
    res.json(observations);
  } catch (error) {
    console.error('Error fetching observations:', error);
    res.status(500).json({ error: 'Failed to fetch observations' });
  }
});

// Get observation by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [observation] = await db.execute('SELECT * FROM observations WHERE obId = ?', [id]);
    
    if (observation.length === 0) {
      return res.status(404).json({ error: 'Observation not found' });
    }
    
    res.json(observation[0]);
  } catch (error) {
    console.error('Error fetching observation:', error);
    res.status(500).json({ error: 'Failed to fetch observation' });
  }
});

// Create a new observation
router.post('/', async (req, res) => {
  try {
    const { obId, observation, obsCategory } = req.body;
    
    // Validate required fields
    if (!obId || !observation || !obsCategory) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    await db.execute(
      'INSERT INTO observations (obId, observation, obsCategory) VALUES (?, ?, ?)',
      [obId, observation, obsCategory]
    );
    
    res.status(201).json({ message: 'Observation created successfully' });
  } catch (error) {
    console.error('Error creating observation:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Observation ID already exists' });
    }
    
    res.status(500).json({ error: 'Failed to create observation' });
  }
});

// Update an observation
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { observation, obsCategory } = req.body;
    
    // Validate required fields
    if (!observation || !obsCategory) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    const [result] = await db.execute(
      'UPDATE observations SET observation = ?, obsCategory = ? WHERE obId = ?',
      [observation, obsCategory, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Observation not found' });
    }
    
    res.json({ message: 'Observation updated successfully' });
  } catch (error) {
    console.error('Error updating observation:', error);
    res.status(500).json({ error: 'Failed to update observation' });
  }
});

// Delete an observation
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await db.execute('DELETE FROM observations WHERE obId = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Observation not found' });
    }
    
    res.json({ message: 'Observation deleted successfully' });
  } catch (error) {
    console.error('Error deleting observation:', error);
    res.status(500).json({ error: 'Failed to delete observation' });
  }
});

module.exports = router;
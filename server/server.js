const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise'); // Add this import
require('dotenv').config();

// Import your routes
const registerRoutes = require('./routes/register.routes');
const dashboardRoutes = require('./routes/dashboard');
const dailyReportRoutes = require('./routes/dailyReport'); 
const observationRoutes = require('./routes/observations');
const recheckRoutes = require('./routes/recheckRoutes');

const app = express();

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Create MySQL connection pool
const createPool = () => {
  return mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'your_database_name',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
};

let pool;

// Initialize database connection
try {
  pool = createPool();
  console.log('✅ Database connection pool created');
} catch (error) {
  console.error('❌ Failed to create database connection pool:', error);
}

// Routes
app.use('/api/registers', registerRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/dailyReport', dailyReportRoutes);
app.use('/api/observations', observationRoutes);
app.use('/api/rechecks', recheckRoutes);

// ✅ FIXED: /api/sizes route with proper database connection
app.get('/api/sizes', async (req, res) => {
  console.log('✅ /api/sizes route hit');
  
  if (!pool) {
    return res.status(500).json({ 
      error: 'Database connection not available',
      suggestion: 'Check your database configuration and environment variables'
    });
  }

  try {
    console.log('✅ Attempting to fetch sizes from database...');
    
    // Use the connection pool to query the database
    const [rows] = await pool.execute(
      'SELECT sizeCode, size, brand, category FROM sizes'
    );
    
    console.log(`✅ Successfully fetched ${rows.length} sizes from database`);
    res.json(rows);
    
  } catch (error) {
    console.error('❌ Database error in /api/sizes:', error);
    
    // Provide more helpful error information
    res.status(500).json({ 
      error: 'Error fetching sizes data',
      details: error.message,
      suggestion: 'Check if the sizes table exists and has the correct structure'
    });
  }
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


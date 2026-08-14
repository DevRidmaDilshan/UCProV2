const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Database
const pool = require('./config/db');

// Routes
const registerRoutes = require('./routes/register.routes');
const dashboardRoutes = require('./routes/dashboard');
const dailyReportRoutes = require('./routes/dailyReport');
const observationRoutes = require('./routes/observations');
const recheckRoutes = require('./routes/recheck.routes');

const app = express();

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================================================
// DATABASE TEST
// =====================================================

async function testDatabaseConnection() {
  try {
    const connection = await pool.getConnection();

    console.log('====================================');
    console.log('✅ MySQL Database Connected');
    console.log(`✅ Database: ${process.env.DB_NAME}`);
    console.log('====================================');

    connection.release();
  } catch (error) {
    console.error('====================================');
    console.error('❌ MySQL Database Connection Failed');
    console.error(error.message);
    console.error('====================================');
  }
}

// =====================================================
// API ROUTES
// =====================================================

app.use('/api/registers', registerRoutes);

app.use('/api/dashboard', dashboardRoutes);

app.use('/api/dailyReport', dailyReportRoutes);

app.use('/api/observations', observationRoutes);

app.use('/api/rechecks', recheckRoutes);

// =====================================================
// SIZES
// =====================================================

app.get('/api/sizes', async (req, res) => {
  console.log('✅ /api/sizes route hit');

  try {
    const [rows] = await pool.execute(
      'SELECT sizeCode, size, brand, category FROM sizes ORDER BY brand, size'
    );

    console.log(`✅ Successfully fetched ${rows.length} sizes`);

    res.json(rows);

  } catch (error) {

    console.error('❌ Database error in /api/sizes:', error);

    res.status(500).json({
      error: 'Error fetching sizes data',
      details: error.message
    });
  }
});

// =====================================================
// LOCATIONS
// =====================================================

app.get('/api/locations', async (req, res) => {

  try {

    const [rows] = await pool.execute(
      'SELECT locationID, locationName FROM locations ORDER BY locationName'
    );

    res.json(rows);

  } catch (error) {

    console.error('❌ Error fetching locations:', error);

    res.status(500).json({
      error: 'Failed to fetch locations',
      details: error.message
    });
  }
});

// =====================================================
// STACKS
// =====================================================

app.get('/api/stacks', async (req, res) => {

  try {

    const [rows] = await pool.execute(
      'SELECT stackID, stackName FROM stacks ORDER BY stackName'
    );

    res.json(rows);

  } catch (error) {

    console.error('❌ Error fetching stacks:', error);

    res.status(500).json({
      error: 'Failed to fetch stacks',
      details: error.message
    });
  }
});

// =====================================================
// API TEST ROUTE
// =====================================================

app.get('/api', (req, res) => {
  res.json({
    message: 'UC Tyre System API is running',
    status: 'OK',
    environment: process.env.NODE_ENV || 'development'
  });
});

// =====================================================
// PRODUCTION REACT FRONTEND
// =====================================================

if (process.env.NODE_ENV === 'production') {

  const frontendPath = path.join(__dirname, 'client');

  // Serve React static files
  app.use(express.static(frontendPath));

  // React Router fallback
  app.get(/.*/, (req, res, next) => {

    // Don't handle API routes here
    if (req.path.startsWith('/api')) {
      return next();
    }

    res.sendFile(
      path.join(frontendPath, 'index.html')
    );
  });

} else {

  app.get('/', (req, res) => {
    res.send('UC Tyre System API is running...');
  });

}

// =====================================================
// 404 HANDLER
// =====================================================

app.use((req, res) => {

  res.status(404).json({
    message: 'API endpoint not found',
    path: req.originalUrl
  });

});

// =====================================================
// ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {

  console.error('❌ Server Error:', err.stack);

  res.status(500).json({
    message: 'Something went wrong!',
    error: err.message
  });

});

// =====================================================
// START SERVER
// =====================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', async () => {

  console.log('====================================');
  console.log('🚀 UC TYRE SYSTEM SERVER');
  console.log('====================================');
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Local: http://localhost:${PORT}`);
  console.log(`✅ Network: http://192.168.1.110:${PORT}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV}`);
  console.log('====================================');

  await testDatabaseConnection();
});
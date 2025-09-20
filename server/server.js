const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT;

// Import your routes
const registerRoutes = require('./routes/register.routes');  // <-- FIXED
const dashboardRoutes = require('./routes/dashboard');       // <-- FIXED
const dailyReportRoutes = require('./routes/dailyReport'); 

const app = express();

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000', // Your React app's URL
  credentials: true
}));

// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/registers', registerRoutes);   // Register API
app.use('/api/dashboard', dashboardRoutes);  // Dashboard API
app.use('/api/dailyReport', dailyReportRoutes);  // DailyReport API

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

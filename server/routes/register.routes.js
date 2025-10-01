const express = require('express');
const router = express.Router();
const registerController = require('../controllers/register.controller');
const consultantController = require('../controllers/consultant.controller');

// ------------------- Register routes -------------------
router.post('/', registerController.createRegister);
router.get('/', registerController.getAllRegisters);
router.get('/initial-data', registerController.getInitialData);
router.get('/:id', registerController.getRegisterById);
router.put('/:id', registerController.updateRegister);
router.delete('/:id', registerController.deleteRegister);

// ------------------- Dealer routes -------------------
router.get('/dealer/:dealerView', registerController.getDealerByView);

// ------------------- Size routes -------------------
router.get('/sizes/:brand', registerController.getSizesByBrand);
router.get('/size-details/:size', registerController.getSizeDetails);

// ------------------- Consultant routes -------------------
router.get('/consultants/all', consultantController.getAllConsultants);

// ------------------- Observation Number routes -------------------
router.get('/observation-numbers', registerController.getObservationNumbers);
router.get('/observation-number/:type', registerController.getNextObservationNumber);

// ------------------- Report routes -------------------
// ✅ This will accept filters: startDate, endDate, brand, consultant, obsStatus
// obsStatus mapping is handled in controller (Pending -> NULL/empty, etc.)
router.post('/reports', registerController.generateReport);

// ------------------- Dashboard routes -------------------
router.get('/dashboard', registerController.getDashboardData);
router.get('/dailyReport', registerController.getDailyReportData);

// Add this to your routes
router.post('/brand-report', registerController.generateBrandReport);

router.get('/dropdown/registers', registerController.getRegistersForDropdown);

module.exports = router;

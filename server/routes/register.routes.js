const express = require('express');
const router = express.Router();
const registerController = require('../controllers/register.controller');
const consultantController = require('../controllers/consultant.controller');
const locationController = require('../controllers/location.controller');
const stackController = require('../controllers/stack.controller');

// ------------------- Register routes -------------------
router.post('/', registerController.createRegister);
router.get('/', registerController.getAllRegisters);
router.get('/initial-data', registerController.getInitialData);

// ------------------- Dealer routes -------------------
router.get('/dealer/:dealerView', registerController.getDealerByView);

// ------------------- Size routes -------------------
router.get('/sizes/:brand', registerController.getSizesByBrand);
router.get('/size-details/:size', registerController.getSizeDetails);

// ------------------- Consultant routes -------------------
router.get('/consultants/all', consultantController.getAllConsultants);

router.get('/locations/all', locationController.getAllLocations);
router.get('/stacks/all', stackController.getAllStacks);

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
router.get('/brand-report', registerController.getBrandReport);

router.get('/:id', registerController.getRegisterById);
router.put('/:id', registerController.updateRegister);
router.delete('/:id', registerController.deleteRegister);


module.exports = router;

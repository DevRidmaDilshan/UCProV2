const express = require('express');
const router = express.Router();
const registerController = require('../controllers/register.controller');
const consultantController = require('../controllers/consultant.controller');

// Register routes
router.post('/', registerController.createRegister);
router.get('/', registerController.getAllRegisters);
router.get('/initial-data', registerController.getInitialData);
router.get('/:id', registerController.getRegisterById);
router.put('/:id', registerController.updateRegister);
router.delete('/:id', registerController.deleteRegister);

// Dealer related routes
router.get('/dealer/:dealerView', registerController.getDealerByView);

// Size related routes
router.get('/sizes/:brand', registerController.getSizesByBrand);
router.get('/size-details/:size', registerController.getSizeDetails);

// Consultant routes
router.get('/consultants/all', consultantController.getAllConsultants);

// Observation number routes
router.get('/observation-numbers', registerController.getObservationNumbers);
router.get('/observation-number/:type', registerController.getNextObservationNumber); // Add this line

// Report routes
router.post('/reports', registerController.generateReport); // Add this line

// Dashboard routes
router.get('/dashboard', registerController.getDashboardData);

module.exports = router;
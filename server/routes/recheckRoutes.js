// server/routes/recheckRoutes.js
const express = require('express');
const router = express.Router();
const recheckController = require('../controllers/recheckController');

// Recheck routes
router.post('/', recheckController.create);
router.get('/', recheckController.findAll);
router.get('/next-number', recheckController.getNextNumber);
router.get('/:reNo', recheckController.findOne);
router.put('/:reNo', recheckController.update);
router.delete('/:reNo', recheckController.delete);
router.get('/register/:id', recheckController.findByRegisterId);

router.post('/', recheckController.create);
router.get('/', recheckController.findAll);

// Register routes for dropdown
router.get('/registers/dropdown', recheckController.getRegistersForDropdown);
router.get('/registers/:id', recheckController.getRegisterById);

router.get('/registers/dropdown', recheckController.getRegistersForDropdown);
router.get('/registers/:id', recheckController.getRegisterById);

module.exports = router;
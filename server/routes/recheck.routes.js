const express = require('express');
const router = express.Router();
const recheckController = require('../controllers/recheck.controller');

router.get('/register-list', recheckController.getRegisterList);
router.get('/register-details', recheckController.getRegistersForRecheck);
router.post('/save', recheckController.saveRecheck);
router.put('/:id', recheckController.updateRecheck);
router.delete('/:id', recheckController.deleteRecheck);
router.get('/all', recheckController.getAllRechecks);

module.exports = router;
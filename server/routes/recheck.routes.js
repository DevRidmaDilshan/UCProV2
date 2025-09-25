const express = require('express');
const router = express.Router();
const recheckController = require('../controllers/recheck.controller');

router.get('/', recheckController.getAllRechecks);
router.get('/:recheckNo', recheckController.getRecheckById);
router.post('/', recheckController.createRecheck);
router.put('/:recheckNo', recheckController.updateRecheck);
router.delete('/:recheckNo', recheckController.deleteRecheck);
router.get('/register/:id', recheckController.getRegisterForRecheck);
router.get('/registers/with-observations', recheckController.getRegistersWithObservations);

module.exports = router;
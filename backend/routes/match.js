const express = require('express');
const router = express.Router();
const match = require('../controllers/matchController');

router.post('/request', match.requestRide);
router.get('/drivers', match.availableDrivers);

module.exports = router;

const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const driverAuth = require('../controllers/driverAuthController');

// Public login — only works after admin KYC approval
router.post('/login', driverAuth.driverLogin);

// Authenticated driver
router.get('/me', auth, driverAuth.me);
router.post('/online', auth, driverAuth.setOnline);
router.get('/open-rides', auth, driverAuth.openRides);

module.exports = router;

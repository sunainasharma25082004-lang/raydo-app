const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const driverAuth = require('../controllers/driverAuthController');

// POST /api/auth/send-otp  (riders)
router.post('/send-otp', authController.sendOTP);

// POST /api/auth/verify-otp  (riders)
router.post('/verify-otp', authController.verifyOTP);

// Admin login
router.post('/admin/login', driverAuth.adminLogin);

// Driver login alias
router.post('/driver/login', driverAuth.driverLogin);

module.exports = router;

const express = require('express');
const router = express.Router();
const rideController = require('../controllers/rideController');
const auth = require('../middleware/authMiddleware');

// Get current active ride
router.get('/current', auth, rideController.getCurrentRide);

// Rider requests a ride
router.post('/request', auth, rideController.requestRide);

// Driver accepts a ride
router.post('/:rideId/accept', auth, rideController.acceptRide);

// Driver updates ride status
router.put('/:rideId/status', auth, rideController.updateRideStatus);

module.exports = router;

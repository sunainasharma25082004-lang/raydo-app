const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const c = require('../controllers/platformController');

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  next();
}
function requireDriver(req, res, next) {
  if (req.user?.role !== 'driver') return res.status(403).json({ message: 'Drivers only' });
  next();
}

// Public / rider — create ride with live GPS (token optional for demo)
router.post('/rides', c.createRide);
router.get('/rides/:id', c.getRide);
router.post('/rides/:id/cancel', c.cancelRide);
router.post('/rides/rider-location', c.pushRiderLocation);

// In-ride chat (open only Accepted/Arrived — closed after pickup)
router.get('/rides/:id/chat', c.getChat);
router.post('/rides/:id/chat', c.postChat);

// Driver
router.post('/rides/:id/accept', auth, requireDriver, c.acceptRide);
router.post('/rides/:id/status', auth, requireDriver, c.updateStatus);
router.post('/driver/location', auth, requireDriver, c.pushDriverLocation);
router.get('/driver/open-rides', auth, requireDriver, c.openRides);
router.get('/driver/active-ride', auth, requireDriver, c.activeDriverRide);
router.get('/driver/wallet', auth, requireDriver, c.wallet);
router.post('/driver/withdraw', auth, requireDriver, c.requestWithdraw);

// Ratings (rider or driver)
router.post('/rides/:id/rate', c.rateRide);

// Rider pays after complete — fare goes to admin/platform
router.post('/rides/:id/pay', c.payRide);

// Admin
router.get('/admin/stats', auth, requireAdmin, c.adminStats);
router.get('/admin/rides', auth, requireAdmin, c.adminRides);
router.get('/admin/riders', auth, requireAdmin, c.adminRiders);
router.post('/admin/riders/:id/block', auth, requireAdmin, c.adminBlockRider);
router.get('/admin/payments', auth, requireAdmin, c.adminPayments);
router.get('/admin/withdrawals', auth, requireAdmin, c.adminWithdrawals);
router.post('/admin/withdrawals/:id/decide', auth, requireAdmin, c.adminDecideWithdraw);
router.post('/admin/weekly-withdraw', auth, requireAdmin, c.adminWeeklyWindow);

module.exports = router;

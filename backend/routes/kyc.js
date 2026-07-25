const express = require('express');
const router = express.Router();
const kyc = require('../controllers/kycController');
const auth = require('../middleware/authMiddleware');

// Public — driver applies before having login
router.post('/apply', kyc.applyKyc);
router.get('/status', kyc.getKycStatus);

// Admin
router.get('/admin/list', auth, requireAdmin, kyc.listPending);
router.get('/admin/stats', auth, requireAdmin, kyc.stats);
router.get('/admin/:id', auth, requireAdmin, kyc.getAdminDriver);
router.post('/admin/:id/approve', auth, requireAdmin, kyc.approve);
router.post('/admin/:id/reject', auth, requireAdmin, kyc.reject);

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

module.exports = router;

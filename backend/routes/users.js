const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');

// Get current user profile
router.get('/me', auth, (req, res) => {
  res.json({ message: 'User profile endpoint' });
});

module.exports = router;

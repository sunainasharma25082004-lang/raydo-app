const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const crypto = require('crypto');

// Razorpay Order Creation (Pan-India Payments)
router.post('/create-order', auth, async (req, res) => {
  const { amount } = req.body; // Amount in INR

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    // Fallback for development if keys aren't provided yet
    return res.status(200).json({
      id: 'order_mock_' + Math.floor(Math.random() * 1000000),
      amount: amount * 100, // Razorpay expects amount in paise
      currency: 'INR',
      receipt: 'receipt_mock_1'
    });
  }

  try {
    // Direct REST API call to Razorpay (no need for razorpay npm package)
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64')
      },
      body: JSON.stringify({
        amount: amount * 100, // convert INR to paise
        currency: 'INR',
        receipt: `receipt_${req.user.id}_${Date.now()}`
      })
    });
    
    const order = await response.json();
    res.status(200).json(order);
  } catch (error) {
    console.error('[Razorpay Error]', error);
    res.status(500).json({ message: 'Error creating payment order' });
  }
});

// Verify Payment Signature
router.post('/verify', auth, (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
    .update(body.toString())
    .digest('hex');

  if (expectedSignature === razorpay_signature || !process.env.RAZORPAY_KEY_SECRET) {
    res.status(200).json({ message: 'Payment verified successfully', success: true });
  } else {
    res.status(400).json({ message: 'Invalid payment signature', success: false });
  }
});

module.exports = router;

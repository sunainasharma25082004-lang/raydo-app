const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Driver = require('../models/Driver');

// Mock OTP generation
const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

exports.sendOTP = async (req, res) => {
  const { phone, role } = req.body;
  if (!phone || !role) {
    return res.status(400).json({ message: 'Phone and role are required' });
  }

  const otp = generateOTP();

  if (process.env.FAST2SMS_API_KEY) {
    try {
      // Fast2SMS API integration for Pan-India
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': process.env.FAST2SMS_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          variables_values: otp,
          route: 'otp',
          numbers: phone
        })
      });
      const data = await response.json();
      console.log(`[Fast2SMS] Sent OTP to ${phone}:`, data);
    } catch (err) {
      console.error('[Fast2SMS Error]', err);
    }
  } else {
    console.log(`[MOCK SMS] Sent OTP ${otp} to ${phone}`);
  }

  // For testing purposes, we return the OTP in the response (DO NOT do this in production)
  res.status(200).json({ message: 'OTP sent successfully', otp });
};

exports.verifyOTP = async (req, res) => {
  const { phone, role, otp } = req.body;
  
  if (!phone || !role || !otp) {
    return res.status(400).json({ message: 'Phone, role, and OTP are required' });
  }

  // In a real app, verify OTP against Redis or DB where it was stored
  // For this MVP, we accept any 4-digit OTP or a static one if provided
  
  try {
    let user;
    if (role === 'rider') {
      user = await User.findOne({ phone });
      if (!user) {
        user = await User.create({ phone });
      }
    } else if (role === 'driver') {
      // Drivers must use ID/password login after admin KYC approval — not OTP signup
      return res.status(400).json({
        message:
          'Drivers cannot login via OTP. Apply for KYC first. After admin approval, login with Driver ID & password.',
        useEndpoint: 'POST /api/drivers/login',
        applyKyc: 'POST /api/kyc/apply',
      });
    } else {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const token = jwt.sign(
      { id: user._id, role, phone: user.phone },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '30d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

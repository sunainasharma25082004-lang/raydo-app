const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Driver = require('../models/Driver');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// Helper function that mimics store.verifyPassword
function verifyPassword(password, hash) {
  const hashPassword = crypto.createHash('sha256').update(password).digest('hex');
  return hashPassword === hash;
}

exports.driverLogin = async (req, res) => {
  try {
    const { loginId, password } = req.body;
    if (!loginId || !password) {
      return res.status(400).json({ message: 'Driver ID and password are required' });
    }
    
    const driver = await Driver.findOne({ loginId });
    if (!driver) {
      return res.status(401).json({ message: 'Invalid Driver ID or password' });
    }
    
    if (driver.kycStatus !== 'approved') {
      const msg = driver.kycStatus === 'pending'
        ? 'KYC still pending admin approval. You cannot login yet.'
        : driver.kycStatus === 'rejected'
          ? `KYC rejected: ${driver.kycRejectionReason || 'Contact support'}`
          : 'Account not approved for login';
      return res.status(403).json({ message: msg });
    }
    
    if (!driver.passwordHash || !verifyPassword(password, driver.passwordHash)) {
      return res.status(401).json({ message: 'Invalid Driver ID or password' });
    }
    
    const token = jwt.sign(
      { id: driver._id, role: 'driver', loginId: driver.loginId, vehicleType: driver.vehicle?.type },
      JWT_SECRET,
      { expiresIn: '30d' },
    );
    
    // Return sanitized driver info
    const driverData = driver.toObject();
    delete driverData.passwordHash;
    
    res.json({
      message: 'Login successful',
      token,
      driver: driverData,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Login failed' });
  }
};

exports.adminLogin = (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }
    
    // Hardcoded admin for MongoDB migration phase (can be moved to Admin model later)
    const adminHash = crypto.createHash('sha256').update('admin123').digest('hex');
    
    if (username !== 'admin' || !verifyPassword(password, adminHash)) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }
    
    const token = jwt.sign(
      { id: 'admin-1', role: 'admin', username: 'admin' },
      JWT_SECRET,
      { expiresIn: '7d' },
    );
    res.json({ 
      message: 'Admin login successful', 
      token, 
      admin: { id: 'admin-1', username: 'admin', name: 'Raydo Admin' } 
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Login failed' });
  }
};

exports.me = async (req, res) => {
  try {
    if (req.user.role !== 'driver') {
      return res.status(403).json({ message: 'Drivers only' });
    }
    const driver = await Driver.findById(req.user.id);
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    
    const driverData = driver.toObject();
    delete driverData.passwordHash;
    
    if (driver.kycStatus !== 'approved') {
      return res.status(403).json({ message: 'KYC not approved', driver: driverData });
    }
    res.json({ driver: driverData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.setOnline = async (req, res) => {
  try {
    const { isOnline, lat, lng } = req.body;
    
    const updateData = { isOnline };
    if (lat != null && lng != null) {
      updateData.currentLocation = {
        type: 'Point',
        coordinates: [Number(lng), Number(lat)]
      };
    }
    
    const driver = await Driver.findByIdAndUpdate(
      req.user.id, 
      updateData, 
      { new: true }
    );
    
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    
    const io = req.app.get('io');
    if (io && lat != null && lng != null) {
      io.emit('driver_location_broadcast', {
        driverId: req.user.id,
        lat: Number(lat),
        lng: Number(lng),
        isOnline: !!isOnline,
      });
    }
    
    const driverData = driver.toObject();
    delete driverData.passwordHash;
    
    res.json({ message: driver.isOnline ? 'You are online' : 'You are offline', driver: driverData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.openRides = async (req, res) => {
  try {
    const driver = await Driver.findById(req.user.id);
    if (!driver || driver.kycStatus !== 'approved' || !driver.isOnline) {
      return res.json({ rides: [] });
    }
    
    // In a real app, query nearest rides based on driver location. 
    // For now, return all requested rides matching the driver's vehicle type.
    const Ride = require('../models/Ride');
    const rides = await Ride.find({
      status: 'Requested',
      vehicleType: driver.vehicle?.type
    }).populate('riderId', 'name phone rating');
    
    res.json({ rides });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

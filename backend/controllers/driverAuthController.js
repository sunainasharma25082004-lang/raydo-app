const jwt = require('jsonwebtoken');
const store = require('../store/driverStore');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

exports.driverLogin = (req, res) => {
  try {
    const { loginId, password } = req.body;
    if (!loginId || !password) {
      return res.status(400).json({ message: 'Driver ID and password are required' });
    }
    const driver = store.loginDriver(loginId, password);
    const token = jwt.sign(
      { id: driver.id, role: 'driver', loginId: driver.loginId, vehicleType: driver.vehicle?.type },
      JWT_SECRET,
      { expiresIn: '30d' },
    );
    res.json({
      message: 'Login successful',
      token,
      driver,
    });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Login failed' });
  }
};

exports.adminLogin = (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }
    const admin = store.loginAdmin(username, password);
    const token = jwt.sign(
      { id: admin.id, role: 'admin', username: admin.username },
      JWT_SECRET,
      { expiresIn: '7d' },
    );
    res.json({ message: 'Admin login successful', token, admin });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Login failed' });
  }
};

exports.me = (req, res) => {
  try {
    if (req.user.role !== 'driver') {
      return res.status(403).json({ message: 'Drivers only' });
    }
    const driver = store.findDriverById(req.user.id);
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    if (driver.kycStatus !== 'approved') {
      return res.status(403).json({ message: 'KYC not approved', driver: store.publicDriver(driver) });
    }
    res.json({ driver: store.publicDriver(driver) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.setOnline = (req, res) => {
  try {
    const platform = require('../store/platformStore');
    const { isOnline, lat, lng } = req.body;
    let driver = store.setOnline(req.user.id, isOnline);
    if (lat != null && lng != null) {
      driver = platform.updateDriverLocation(req.user.id, lat, lng, isOnline);
    }
    const io = req.app.get('io');
    if (io && lat != null && lng != null) {
      io.emit('driver_location_broadcast', {
        driverId: req.user.id,
        lat: Number(lat),
        lng: Number(lng),
        isOnline: !!isOnline,
      });
    }
    res.json({ message: driver.isOnline ? 'You are online' : 'You are offline', driver });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

exports.openRides = (req, res) => {
  try {
    const platform = require('../store/platformStore');
    const rides = platform.openRidesForDriver(req.user.id);
    res.json({ rides });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

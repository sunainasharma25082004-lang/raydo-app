const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DRIVERS_FILE = path.join(DATA_DIR, 'drivers.json');
const ADMINS_FILE = path.join(DATA_DIR, 'admins.json');
const RIDES_FILE = path.join(DATA_DIR, 'rides.json');
const COUNTERS_FILE = path.join(DATA_DIR, 'counters.json');

function ensureFiles() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DRIVERS_FILE)) fs.writeFileSync(DRIVERS_FILE, '[]');
  if (!fs.existsSync(RIDES_FILE)) fs.writeFileSync(RIDES_FILE, '[]');
  if (!fs.existsSync(COUNTERS_FILE)) {
    fs.writeFileSync(COUNTERS_FILE, JSON.stringify({ driverSeq: 1000 }, null, 2));
  }
  if (!fs.existsSync(ADMINS_FILE)) {
    const admin = {
      id: 'admin-1',
      username: 'admin',
      // password: admin123
      passwordHash: hashPassword('admin123'),
      name: 'Raydo Admin',
      createdAt: new Date().toISOString(),
    };
    fs.writeFileSync(ADMINS_FILE, JSON.stringify([admin], null, 2));
  }
}

function readJson(file) {
  ensureFiles();
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, data) {
  ensureFiles();
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function hashPassword(password) {
  const salt = 'raydo-kyc-v1';
  return crypto.scryptSync(String(password), salt, 32).toString('hex');
}

function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}

function generateId() {
  return crypto.randomBytes(8).toString('hex');
}

function nextLoginId() {
  const counters = readJson(COUNTERS_FILE);
  counters.driverSeq = (counters.driverSeq || 1000) + 1;
  writeJson(COUNTERS_FILE, counters);
  return `RAYD${counters.driverSeq}`;
}

function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

/** Normalize rider request vehicle → matching group */
function vehicleGroup(type) {
  const t = String(type || '').toLowerCase();
  if (t === 'bike' || t === 'scooty' || t === 'scooter' || t === 'two-wheeler' || t === 'twowheeler') {
    return 'two_wheeler';
  }
  if (t === 'auto' || t === 'auto-rickshaw' || t === 'erickshaw' || t === 'e-rickshaw') {
    return 'auto';
  }
  if (t === 'car' || t === 'cab' || t === 'sedan' || t === 'suv') {
    return 'car';
  }
  return t;
}

function vehicleMatches(driverType, requestedType) {
  return vehicleGroup(driverType) === vehicleGroup(requestedType);
}

function publicDriver(driver, { includeSecrets = false } = {}) {
  if (!driver) return null;
  const copy = { ...driver };
  delete copy.passwordHash;
  if (!includeSecrets) {
    delete copy.tempPassword;
  }
  // Always expose wallet + live location to clients
  if (typeof copy.walletBalance !== 'number') copy.walletBalance = 0;
  if (typeof copy.lifetimeEarnings !== 'number') copy.lifetimeEarnings = 0;
  return copy;
}

function listDrivers() {
  return readJson(DRIVERS_FILE);
}

function saveDrivers(list) {
  writeJson(DRIVERS_FILE, list);
}

function findDriverById(id) {
  return listDrivers().find((d) => d.id === id) || null;
}

function findDriverByLoginId(loginId) {
  return listDrivers().find((d) => d.loginId && d.loginId.toLowerCase() === String(loginId).toLowerCase()) || null;
}

function findDriverByPhone(phone) {
  const p = String(phone).replace(/\D/g, '').slice(-10);
  return listDrivers().find((d) => String(d.phone || '').replace(/\D/g, '').slice(-10) === p) || null;
}

function applyKyc(payload) {
  const phone = String(payload.phone || '').replace(/\D/g, '').slice(-10);
  if (!phone || phone.length !== 10) {
    const err = new Error('Valid 10-digit phone is required');
    err.status = 400;
    throw err;
  }
  if (!payload.name || !payload.vehicle?.type || !payload.vehicle?.registrationNumber) {
    const err = new Error('Name, vehicle type and registration number are required');
    err.status = 400;
    throw err;
  }
  if (!payload.documents?.licenseNumber) {
    const err = new Error('Driving licence number is required');
    err.status = 400;
    throw err;
  }

  const allowed = ['Bike', 'Scooty', 'Auto', 'Car'];
  if (!allowed.includes(payload.vehicle.type)) {
    const err = new Error(`Vehicle type must be one of: ${allowed.join(', ')}`);
    err.status = 400;
    throw err;
  }

  const list = listDrivers();
  let existing = list.find((d) => String(d.phone || '').replace(/\D/g, '').slice(-10) === phone);

  if (existing && existing.kycStatus === 'approved') {
    const err = new Error('This phone is already approved. Login with Driver ID & password from admin.');
    err.status = 400;
    throw err;
  }

  const base = {
    phone,
    name: payload.name.trim(),
    email: (payload.email || '').trim(),
    city: (payload.city || 'Bengaluru').trim(),
    vehicle: {
      type: payload.vehicle.type,
      registrationNumber: String(payload.vehicle.registrationNumber).toUpperCase().trim(),
      model: (payload.vehicle.model || '').trim(),
      color: (payload.vehicle.color || '').trim(),
      year: payload.vehicle.year || '',
    },
    documents: {
      licenseNumber: String(payload.documents.licenseNumber).toUpperCase().trim(),
      licenseStatus: 'Pending',
      rcNumber: (payload.documents.rcNumber || payload.vehicle.registrationNumber || '').toUpperCase().trim(),
      rcStatus: 'Pending',
      aadhaarNumber: (payload.documents.aadhaarNumber || '').replace(/\D/g, ''),
      aadhaarStatus: 'Pending',
      insuranceNumber: (payload.documents.insuranceNumber || '').trim(),
      insuranceStatus: 'Pending',
      photoStatus: 'Pending',
    },
    kycStatus: 'pending',
    kycRejectionReason: '',
    kycSubmittedAt: new Date().toISOString(),
    isOnline: false,
    rating: existing?.rating || 5,
    totalRides: existing?.totalRides || 0,
    years: existing?.years || 0,
    updatedAt: new Date().toISOString(),
  };

  if (existing) {
    Object.assign(existing, base, {
      id: existing.id,
      loginId: existing.loginId || null,
      passwordHash: existing.kycStatus === 'approved' ? existing.passwordHash : null,
      createdAt: existing.createdAt,
    });
  } else {
    existing = {
      id: generateId(),
      loginId: null,
      passwordHash: null,
      tempPassword: null,
      createdAt: new Date().toISOString(),
      ...base,
    };
    list.push(existing);
  }

  saveDrivers(list);
  return publicDriver(existing);
}

function approveKyc(driverId, adminUsername) {
  const list = listDrivers();
  const driver = list.find((d) => d.id === driverId);
  if (!driver) {
    const err = new Error('Driver not found');
    err.status = 404;
    throw err;
  }
  if (driver.kycStatus === 'approved' && driver.loginId) {
    return {
      driver: publicDriver(driver, { includeSecrets: true }),
      credentials: {
        loginId: driver.loginId,
        password: driver.tempPassword || '(already issued — ask driver to reset if lost)',
        note: 'Already approved',
      },
    };
  }

  const loginId = driver.loginId || nextLoginId();
  const password = generateTempPassword();

  driver.loginId = loginId;
  driver.passwordHash = hashPassword(password);
  driver.tempPassword = password; // shown once to admin; keep for demo
  driver.kycStatus = 'approved';
  driver.kycRejectionReason = '';
  driver.approvedAt = new Date().toISOString();
  driver.approvedBy = adminUsername || 'admin';
  driver.documents = {
    ...driver.documents,
    licenseStatus: 'Approved',
    rcStatus: 'Approved',
    aadhaarStatus: 'Approved',
    insuranceStatus: 'Approved',
    photoStatus: 'Approved',
  };
  driver.updatedAt = new Date().toISOString();

  saveDrivers(list);

  return {
    driver: publicDriver(driver, { includeSecrets: true }),
    credentials: {
      loginId,
      password,
      note: 'Share these credentials with the driver. They can login only after this approval.',
    },
  };
}

function rejectKyc(driverId, reason, adminUsername) {
  const list = listDrivers();
  const driver = list.find((d) => d.id === driverId);
  if (!driver) {
    const err = new Error('Driver not found');
    err.status = 404;
    throw err;
  }

  driver.kycStatus = 'rejected';
  driver.kycRejectionReason = reason || 'Documents incomplete or invalid';
  driver.rejectedAt = new Date().toISOString();
  driver.rejectedBy = adminUsername || 'admin';
  driver.loginId = null;
  driver.passwordHash = null;
  driver.tempPassword = null;
  driver.documents = {
    ...driver.documents,
    licenseStatus: 'Rejected',
    rcStatus: 'Rejected',
    aadhaarStatus: 'Rejected',
    insuranceStatus: 'Rejected',
    photoStatus: 'Rejected',
  };
  driver.updatedAt = new Date().toISOString();
  saveDrivers(list);
  return publicDriver(driver);
}

function loginDriver(loginId, password) {
  const driver = findDriverByLoginId(loginId);
  if (!driver) {
    const err = new Error('Invalid Driver ID or password');
    err.status = 401;
    throw err;
  }
  if (driver.kycStatus !== 'approved') {
    const err = new Error(
      driver.kycStatus === 'pending'
        ? 'KYC still pending admin approval. You cannot login yet.'
        : driver.kycStatus === 'rejected'
          ? `KYC rejected: ${driver.kycRejectionReason || 'Contact support'}`
          : 'Account not approved for login',
    );
    err.status = 403;
    throw err;
  }
  if (!driver.passwordHash || !verifyPassword(password, driver.passwordHash)) {
    const err = new Error('Invalid Driver ID or password');
    err.status = 401;
    throw err;
  }
  return publicDriver(driver);
}

function loginAdmin(username, password) {
  const admins = readJson(ADMINS_FILE);
  const admin = admins.find((a) => a.username === username);
  if (!admin || !verifyPassword(password, admin.passwordHash)) {
    const err = new Error('Invalid admin credentials');
    err.status = 401;
    throw err;
  }
  return { id: admin.id, username: admin.username, name: admin.name };
}

function setOnline(driverId, isOnline) {
  const list = listDrivers();
  const driver = list.find((d) => d.id === driverId);
  if (!driver) {
    const err = new Error('Driver not found');
    err.status = 404;
    throw err;
  }
  if (driver.kycStatus !== 'approved') {
    const err = new Error('Only approved drivers can go online');
    err.status = 403;
    throw err;
  }
  driver.isOnline = !!isOnline;
  driver.updatedAt = new Date().toISOString();
  saveDrivers(list);
  return publicDriver(driver);
}

function listOnlineDriversByVehicle(requestedType) {
  return listDrivers()
    .filter(
      (d) =>
        d.kycStatus === 'approved' &&
        d.isOnline &&
        vehicleMatches(d.vehicle?.type, requestedType),
    )
    .map((d) => publicDriver(d));
}

function getKycStats() {
  const list = listDrivers();
  return {
    total: list.length,
    pending: list.filter((d) => d.kycStatus === 'pending').length,
    approved: list.filter((d) => d.kycStatus === 'approved').length,
    rejected: list.filter((d) => d.kycStatus === 'rejected').length,
    online: list.filter((d) => d.isOnline).length,
  };
}

function listRides() {
  return readJson(RIDES_FILE);
}

function saveRides(list) {
  writeJson(RIDES_FILE, list);
}

function createRideRequest({ riderName, pickup, drop, vehicleType, fare, distanceKm }) {
  const rides = listRides();
  const ride = {
    id: generateId(),
    riderName: riderName || 'Rider',
    pickup: pickup || 'Pickup',
    drop: drop || 'Drop',
    vehicleType,
    vehicleGroup: vehicleGroup(vehicleType),
    fare: fare || 0,
    distanceKm: distanceKm || 0,
    status: 'Requested',
    driverId: null,
    createdAt: new Date().toISOString(),
  };
  rides.unshift(ride);
  saveRides(rides);
  return ride;
}

function getOpenRidesForDriver(driverId) {
  const driver = findDriverById(driverId);
  if (!driver || driver.kycStatus !== 'approved') return [];
  return listRides().filter(
    (r) =>
      r.status === 'Requested' &&
      vehicleMatches(driver.vehicle?.type, r.vehicleType),
  );
}

module.exports = {
  hashPassword,
  verifyPassword,
  vehicleGroup,
  vehicleMatches,
  publicDriver,
  listDrivers,
  findDriverById,
  findDriverByLoginId,
  findDriverByPhone,
  applyKyc,
  approveKyc,
  rejectKyc,
  loginDriver,
  loginAdmin,
  setOnline,
  listOnlineDriversByVehicle,
  getKycStats,
  createRideRequest,
  getOpenRidesForDriver,
  listRides,
  ensureFiles,
};

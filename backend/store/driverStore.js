const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DRIVERS_FILE = path.join(DATA_DIR, 'drivers.json');
const ADMINS_FILE = path.join(DATA_DIR, 'admins.json');
const RIDES_FILE = path.join(DATA_DIR, 'rides.json');
const COUNTERS_FILE = path.join(DATA_DIR, 'counters.json');

function ensureFiles() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
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

/**
 * Save a KYC document image from data URL or keep existing path/URL.
 * Returns public path like /api/kyc/docs/{driverId}/license.jpg
 */
function saveDocPhoto(driverId, key, input) {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();
  if (!trimmed) return '';

  // Already a stored path or remote URL
  if (
    trimmed.startsWith('/api/kyc/docs/') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://')
  ) {
    return trimmed;
  }

  const match = trimmed.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    // Unknown string — ignore rather than store junk
    return '';
  }

  const mime = match[1].toLowerCase();
  const b64 = match[2].replace(/\s/g, '');
  let ext = 'jpg';
  if (mime.includes('png')) ext = 'png';
  else if (mime.includes('webp')) ext = 'webp';
  else if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';

  const dir = path.join(UPLOADS_DIR, driverId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // Remove previous extensions for this key
  for (const e of ['jpg', 'jpeg', 'png', 'webp']) {
    const old = path.join(dir, `${key}.${e}`);
    if (fs.existsSync(old)) {
      try {
        fs.unlinkSync(old);
      } catch {
        /* ignore */
      }
    }
  }

  const fileName = `${key}.${ext}`;
  fs.writeFileSync(path.join(dir, fileName), Buffer.from(b64, 'base64'));
  return `/api/kyc/docs/${driverId}/${fileName}`;
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
  if (!id) return null;
  const clean = String(id).trim();
  const phoneDigits = clean.replace(/\D/g, '').slice(-10);
  const list = listDrivers();
  return (
    list.find(
      (d) =>
        d.id === clean ||
        (d._id && String(d._id) === clean) ||
        (d.loginId && String(d.loginId).toLowerCase() === clean.toLowerCase()) ||
        (phoneDigits.length === 10 && String(d.phone || '').replace(/\D/g, '').slice(-10) === phoneDigits)
    ) || null
  );
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
  if (!payload.documents?.aadhaarNumber || String(payload.documents.aadhaarNumber).replace(/\D/g, '').length !== 12) {
    const err = new Error('Valid 12-digit Aadhaar number is required');
    err.status = 400;
    throw err;
  }
  if (!payload.documents?.panNumber || String(payload.documents.panNumber).trim().length < 10) {
    const err = new Error('Valid PAN number is required');
    err.status = 400;
    throw err;
  }

  const docsIn = payload.documents || {};
  const requiredPhotos = [
    ['licensePhoto', 'Driving licence photo'],
    ['aadhaarPhoto', 'Aadhaar photo'],
    ['panPhoto', 'PAN card photo'],
    ['rcPhoto', 'RC photo'],
  ];
  for (const [key, label] of requiredPhotos) {
    if (!docsIn[key] || String(docsIn[key]).trim().length < 20) {
      const err = new Error(`${label} is required — upload a clear image`);
      err.status = 400;
      throw err;
    }
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

  const driverId = existing?.id || generateId();

  const licensePhoto = saveDocPhoto(driverId, 'license', docsIn.licensePhoto);
  const aadhaarPhoto = saveDocPhoto(driverId, 'aadhaar', docsIn.aadhaarPhoto);
  const panPhoto = saveDocPhoto(driverId, 'pan', docsIn.panPhoto);
  const rcPhoto = saveDocPhoto(driverId, 'rc', docsIn.rcPhoto);
  const profilePhoto = docsIn.profilePhoto
    ? saveDocPhoto(driverId, 'profile', docsIn.profilePhoto)
    : existing?.documents?.profilePhoto || '';

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
      licenseNumber: String(docsIn.licenseNumber).toUpperCase().trim(),
      licensePhoto,
      licenseStatus: 'Pending',
      rcNumber: (docsIn.rcNumber || payload.vehicle.registrationNumber || '').toUpperCase().trim(),
      rcPhoto,
      rcStatus: 'Pending',
      aadhaarNumber: String(docsIn.aadhaarNumber || '').replace(/\D/g, ''),
      aadhaarPhoto,
      aadhaarStatus: 'Pending',
      panNumber: String(docsIn.panNumber || '').toUpperCase().trim(),
      panPhoto,
      panStatus: 'Pending',
      insuranceNumber: (docsIn.insuranceNumber || '').trim(),
      insuranceStatus: 'Pending',
      profilePhoto,
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
      id: driverId,
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
  const driver = findDriverById(driverId);
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
    panStatus: 'Approved',
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
  const driver = findDriverById(driverId);
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
    panStatus: 'Rejected',
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

/** Earth distance in km between two GPS points */
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (d) => (Number(d) * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Nearest online drivers for a rider pickup GPS.
 * - Same vehicle group only (Scooty/Bike, Auto, Car)
 * - Must have live location
 * - Within radiusKm (default 12 km)
 * - Sorted nearest → farthest
 * - Cap at limit (default 10)
 */
function listNearestOnlineDrivers(
  requestedType,
  lat,
  lng,
  { limit = 10, radiusKm = 12, maxLocationAgeMs = 30 * 60 * 1000 } = {},
) {
  const latN = Number(lat);
  const lngN = Number(lng);
  if (!Number.isFinite(latN) || !Number.isFinite(lngN)) {
    return [];
  }

  const now = Date.now();
  const max = Math.max(1, Math.min(Number(limit) || 10, 10)); // hard cap 10
  const radius = Math.max(0.5, Number(radiusKm) || 12);

  return listDrivers()
    .filter((d) => {
      if (d.kycStatus !== 'approved' || !d.isOnline) return false;
      if (!vehicleMatches(d.vehicle?.type, requestedType)) return false;
      const loc = d.location;
      if (!loc || loc.lat == null || loc.lng == null) return false;
      if (!Number.isFinite(Number(loc.lat)) || !Number.isFinite(Number(loc.lng))) return false;
      // Optional: skip very stale GPS (still allow if no timestamp)
      if (loc.updatedAt && maxLocationAgeMs > 0) {
        const age = now - new Date(loc.updatedAt).getTime();
        if (Number.isFinite(age) && age > maxLocationAgeMs) return false;
      }
      return true;
    })
    .map((d) => {
      const distanceKm =
        Math.round(
          haversineKm(latN, lngN, Number(d.location.lat), Number(d.location.lng)) * 100,
        ) / 100;
      return {
        ...publicDriver(d),
        distanceKm,
      };
    })
    .filter((d) => d.distanceKm <= radius)
    .sort((a, b) => a.distanceKm - b.distanceKm || String(a.name).localeCompare(String(b.name)))
    .slice(0, max);
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
  haversineKm,
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
  listNearestOnlineDrivers,
  getKycStats,
  createRideRequest,
  getOpenRidesForDriver,
  listRides,
  ensureFiles,
  MAX_NEARBY_DRIVERS: 10,
  DEFAULT_MATCH_RADIUS_KM: 12,
};

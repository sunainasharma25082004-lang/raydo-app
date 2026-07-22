/**
 * Production platform store — real rides, live locations, weekly withdrawals.
 * Uses JSON files so everything works without Mongo dependency.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const driverStore = require('./driverStore');

const DATA_DIR = path.join(__dirname, '..', 'data');
const RIDES_FILE = path.join(DATA_DIR, 'rides.json');
const WITHDRAWALS_FILE = path.join(DATA_DIR, 'withdrawals.json');
const RIDERS_FILE = path.join(DATA_DIR, 'riders.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

function ensure() {
  driverStore.ensureFiles();
  if (!fs.existsSync(WITHDRAWALS_FILE)) fs.writeFileSync(WITHDRAWALS_FILE, '[]');
  if (!fs.existsSync(RIDERS_FILE)) fs.writeFileSync(RIDERS_FILE, '[]');
  if (!fs.existsSync(SETTINGS_FILE)) {
    fs.writeFileSync(
      SETTINGS_FILE,
      JSON.stringify(
        {
          // Admin must enable weekly withdrawal window
          weeklyWithdrawOpen: false,
          weeklyWithdrawNote: 'Closed — admin will open every week',
          updatedAt: new Date().toISOString(),
        },
        null,
        2,
      ),
    );
  }
}

function read(file) {
  ensure();
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function write(file, data) {
  ensure();
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function id() {
  return crypto.randomBytes(8).toString('hex');
}

function getSettings() {
  return read(SETTINGS_FILE);
}

function setWeeklyWithdraw(open, note, adminUsername) {
  const s = getSettings();
  s.weeklyWithdrawOpen = !!open;
  s.weeklyWithdrawNote = note || (open ? 'Weekly withdrawals open' : 'Weekly withdrawals closed');
  s.updatedAt = new Date().toISOString();
  s.updatedBy = adminUsername || 'admin';
  write(SETTINGS_FILE, s);
  return s;
}

// ——— Drivers wallet helpers ———
function ensureWallet(driver) {
  if (typeof driver.walletBalance !== 'number') driver.walletBalance = 0;
  if (typeof driver.lifetimeEarnings !== 'number') driver.lifetimeEarnings = 0;
  if (!driver.location) driver.location = null;
  return driver;
}

function updateDriverLocation(driverId, lat, lng, isOnline) {
  const list = driverStore.listDrivers();
  // listDrivers returns public without secrets - need raw
  const raw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'drivers.json'), 'utf8'));
  const driver = raw.find((d) => d.id === driverId);
  if (!driver) {
    const err = new Error('Driver not found');
    err.status = 404;
    throw err;
  }
  ensureWallet(driver);
  driver.location = {
    lat: Number(lat),
    lng: Number(lng),
    updatedAt: new Date().toISOString(),
  };
  if (typeof isOnline === 'boolean') driver.isOnline = isOnline;
  driver.updatedAt = new Date().toISOString();
  write(path.join(DATA_DIR, 'drivers.json'), raw);
  return driverStore.publicDriver(driver);
}

function creditDriver(driverId, amount, meta = {}) {
  const raw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'drivers.json'), 'utf8'));
  const driver = raw.find((d) => d.id === driverId);
  if (!driver) return null;
  ensureWallet(driver);
  const n = Number(amount) || 0;
  driver.walletBalance = Math.round((driver.walletBalance + n) * 100) / 100;
  driver.lifetimeEarnings = Math.round((driver.lifetimeEarnings + n) * 100) / 100;
  driver.totalRides = (driver.totalRides || 0) + (meta.countRide ? 1 : 0);
  driver.updatedAt = new Date().toISOString();
  write(path.join(DATA_DIR, 'drivers.json'), raw);
  return driver;
}

// ——— Rides ———
function listRides() {
  return read(RIDES_FILE);
}

function saveRides(list) {
  write(RIDES_FILE, list);
}

function createRide({
  riderId,
  riderName,
  riderPhone,
  pickup,
  drop,
  pickupLat,
  pickupLng,
  dropLat,
  dropLng,
  vehicleType,
  fare,
  distanceKm,
}) {
  if (!vehicleType) {
    const err = new Error('vehicleType required');
    err.status = 400;
    throw err;
  }
  if (pickupLat == null || pickupLng == null) {
    const err = new Error('pickupLat and pickupLng (live GPS) required');
    err.status = 400;
    throw err;
  }

  const rides = listRides();
  const ride = {
    id: id(),
    riderId: riderId || id(),
    riderName: riderName || 'Rider',
    riderPhone: riderPhone || '',
    pickup: pickup || 'Current location',
    drop: drop || 'Destination',
    pickupLat: Number(pickupLat),
    pickupLng: Number(pickupLng),
    dropLat: dropLat != null ? Number(dropLat) : null,
    dropLng: dropLng != null ? Number(dropLng) : null,
    vehicleType,
    vehicleGroup: driverStore.vehicleGroup(vehicleType),
    fare: Number(fare) || estimateFare(distanceKm, vehicleType),
    distanceKm: Number(distanceKm) || 0,
    status: 'Requested',
    driverId: null,
    driverSnapshot: null,
    driverLocation: null,
    riderLocation: { lat: Number(pickupLat), lng: Number(pickupLng), updatedAt: new Date().toISOString() },
    otp: String(Math.floor(1000 + Math.random() * 9000)),
    createdAt: new Date().toISOString(),
    acceptedAt: null,
    completedAt: null,
    timeline: [{ status: 'Requested', at: new Date().toISOString() }],
  };
  rides.unshift(ride);
  saveRides(rides);
  return ride;
}

function estimateFare(distanceKm, vehicleType) {
  const d = Number(distanceKm) || 5;
  const base = { Scooty: 25, Bike: 30, Auto: 40, Car: 80 };
  const perKm = { Scooty: 8, Bike: 10, Auto: 14, Car: 22 };
  const b = base[vehicleType] || 40;
  const p = perKm[vehicleType] || 14;
  return Math.round(b + d * p);
}

function getRide(rideId) {
  return listRides().find((r) => r.id === rideId) || null;
}

function acceptRide(rideId, driverId) {
  const rides = listRides();
  const ride = rides.find((r) => r.id === rideId);
  if (!ride) {
    const err = new Error('Ride not found');
    err.status = 404;
    throw err;
  }
  if (ride.status !== 'Requested') {
    const err = new Error('Ride no longer available');
    err.status = 400;
    throw err;
  }
  const driver = driverStore.findDriverById(driverId);
  if (!driver || driver.kycStatus !== 'approved') {
    const err = new Error('Driver not approved');
    err.status = 403;
    throw err;
  }
  if (!driverStore.vehicleMatches(driver.vehicle?.type, ride.vehicleType)) {
    const err = new Error(
      `Vehicle mismatch: rider wants ${ride.vehicleType}, you drive ${driver.vehicle?.type}`,
    );
    err.status = 400;
    throw err;
  }

  ride.driverId = driverId;
  ride.status = 'Accepted';
  ride.acceptedAt = new Date().toISOString();
  ride.driverSnapshot = {
    id: driver.id,
    name: driver.name,
    phone: driver.phone,
    loginId: driver.loginId,
    rating: driver.rating,
    vehicle: driver.vehicle,
    location: driver.location || null,
  };
  ride.driverLocation = driver.location
    ? { ...driver.location }
    : null;
  ride.timeline.push({ status: 'Accepted', at: ride.acceptedAt });
  saveRides(rides);
  return ride;
}

function updateRideStatus(rideId, driverId, status, otp) {
  const rides = listRides();
  const ride = rides.find((r) => r.id === rideId);
  if (!ride) {
    const err = new Error('Ride not found');
    err.status = 404;
    throw err;
  }
  if (ride.driverId !== driverId) {
    const err = new Error('Not your ride');
    err.status = 403;
    throw err;
  }
  const allowed = ['Arrived', 'In_Progress', 'Completed', 'Cancelled'];
  if (!allowed.includes(status)) {
    const err = new Error('Invalid status');
    err.status = 400;
    throw err;
  }
  if (status === 'In_Progress' && ride.otp && otp && String(otp) !== String(ride.otp)) {
    const err = new Error('Invalid trip OTP');
    err.status = 400;
    throw err;
  }
  ride.status = status;
  ride.timeline.push({ status, at: new Date().toISOString() });
  if (status === 'Completed') {
    ride.completedAt = new Date().toISOString();
    creditDriver(driverId, ride.fare, { countRide: true });
  }
  saveRides(rides);
  return ride;
}

function updateRideDriverLocation(rideId, driverId, lat, lng) {
  const rides = listRides();
  const ride = rides.find((r) => r.id === rideId);
  if (!ride) return null;
  if (ride.driverId && ride.driverId !== driverId) return null;
  ride.driverLocation = {
    lat: Number(lat),
    lng: Number(lng),
    updatedAt: new Date().toISOString(),
  };
  saveRides(rides);
  // also update driver profile location
  try {
    updateDriverLocation(driverId, lat, lng);
  } catch {
    /* ignore */
  }
  return ride;
}

function updateRideRiderLocation(rideId, lat, lng) {
  const rides = listRides();
  const ride = rides.find((r) => r.id === rideId);
  if (!ride) return null;
  ride.riderLocation = {
    lat: Number(lat),
    lng: Number(lng),
    updatedAt: new Date().toISOString(),
  };
  saveRides(rides);
  return ride;
}

function openRidesForDriver(driverId) {
  const driver = driverStore.findDriverById(driverId);
  if (!driver || driver.kycStatus !== 'approved') return [];
  return listRides().filter(
    (r) =>
      r.status === 'Requested' &&
      driverStore.vehicleMatches(driver.vehicle?.type, r.vehicleType),
  );
}

function activeRideForDriver(driverId) {
  return (
    listRides().find(
      (r) =>
        r.driverId === driverId &&
        ['Accepted', 'Arrived', 'In_Progress'].includes(r.status),
    ) || null
  );
}

function activeRideForRider(riderId) {
  return (
    listRides().find(
      (r) =>
        r.riderId === riderId &&
        ['Requested', 'Accepted', 'Arrived', 'In_Progress'].includes(r.status),
    ) || null
  );
}

function cancelRide(rideId, by) {
  const rides = listRides();
  const ride = rides.find((r) => r.id === rideId);
  if (!ride) {
    const err = new Error('Ride not found');
    err.status = 404;
    throw err;
  }
  if (['Completed', 'Cancelled'].includes(ride.status)) {
    const err = new Error('Cannot cancel');
    err.status = 400;
    throw err;
  }
  ride.status = 'Cancelled';
  ride.cancelledBy = by || 'user';
  ride.timeline.push({ status: 'Cancelled', at: new Date().toISOString() });
  saveRides(rides);
  return ride;
}

// ——— Withdrawals (weekly, admin permission) ———
function listWithdrawals() {
  return read(WITHDRAWALS_FILE);
}

function saveWithdrawals(list) {
  write(WITHDRAWALS_FILE, list);
}

function requestWithdrawal(driverId, amount, upiId) {
  const settings = getSettings();
  if (!settings.weeklyWithdrawOpen) {
    const err = new Error(
      settings.weeklyWithdrawNote ||
        'Weekly withdrawals are closed. Wait for admin to open this week’s window.',
    );
    err.status = 403;
    throw err;
  }
  const driver = driverStore.findDriverById(driverId);
  if (!driver || driver.kycStatus !== 'approved') {
    const err = new Error('Driver not approved');
    err.status = 403;
    throw err;
  }
  // re-read raw for wallet
  const raw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'drivers.json'), 'utf8'));
  const d = raw.find((x) => x.id === driverId);
  ensureWallet(d);
  const amt = Number(amount);
  if (!amt || amt < 100) {
    const err = new Error('Minimum withdrawal is ₹100');
    err.status = 400;
    throw err;
  }
  if (amt > d.walletBalance) {
    const err = new Error(`Insufficient balance. Available ₹${d.walletBalance}`);
    err.status = 400;
    throw err;
  }
  if (!upiId || String(upiId).trim().length < 3) {
    const err = new Error('UPI ID required');
    err.status = 400;
    throw err;
  }

  // hold amount
  d.walletBalance = Math.round((d.walletBalance - amt) * 100) / 100;
  write(path.join(DATA_DIR, 'drivers.json'), raw);

  const list = listWithdrawals();
  const w = {
    id: id(),
    driverId,
    driverName: d.name,
    loginId: d.loginId,
    phone: d.phone,
    amount: amt,
    upiId: String(upiId).trim(),
    status: 'pending_admin', // admin must approve
    createdAt: new Date().toISOString(),
    decidedAt: null,
    decidedBy: null,
    note: '',
  };
  list.unshift(w);
  saveWithdrawals(list);
  return w;
}

function decideWithdrawal(withdrawalId, decision, adminUsername, note) {
  const list = listWithdrawals();
  const w = list.find((x) => x.id === withdrawalId);
  if (!w) {
    const err = new Error('Withdrawal not found');
    err.status = 404;
    throw err;
  }
  if (w.status !== 'pending_admin') {
    const err = new Error('Already decided');
    err.status = 400;
    throw err;
  }
  if (decision === 'approve') {
    w.status = 'paid';
    w.note = note || 'Paid by admin';
  } else if (decision === 'reject') {
    w.status = 'rejected';
    w.note = note || 'Rejected by admin';
    // refund
    const raw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'drivers.json'), 'utf8'));
    const d = raw.find((x) => x.id === w.driverId);
    if (d) {
      ensureWallet(d);
      d.walletBalance = Math.round((d.walletBalance + w.amount) * 100) / 100;
      write(path.join(DATA_DIR, 'drivers.json'), raw);
    }
  } else {
    const err = new Error('decision must be approve or reject');
    err.status = 400;
    throw err;
  }
  w.decidedAt = new Date().toISOString();
  w.decidedBy = adminUsername || 'admin';
  saveWithdrawals(list);
  return w;
}

function driverWallet(driverId) {
  const raw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'drivers.json'), 'utf8'));
  const d = raw.find((x) => x.id === driverId);
  if (!d) return null;
  ensureWallet(d);
  const withdrawals = listWithdrawals().filter((w) => w.driverId === driverId);
  const completed = listRides().filter((r) => r.driverId === driverId && r.status === 'Completed');
  return {
    walletBalance: d.walletBalance,
    lifetimeEarnings: d.lifetimeEarnings,
    totalRides: d.totalRides || 0,
    completedTrips: completed.length,
    withdrawals,
    weeklyWithdrawOpen: getSettings().weeklyWithdrawOpen,
    weeklyWithdrawNote: getSettings().weeklyWithdrawNote,
  };
}

function adminStats() {
  const kyc = driverStore.getKycStats();
  const rides = listRides();
  const w = listWithdrawals();
  return {
    ...kyc,
    ridesTotal: rides.length,
    ridesActive: rides.filter((r) =>
      ['Requested', 'Accepted', 'Arrived', 'In_Progress'].includes(r.status),
    ).length,
    withdrawalsPending: w.filter((x) => x.status === 'pending_admin').length,
    weeklyWithdrawOpen: getSettings().weeklyWithdrawOpen,
  };
}

module.exports = {
  ensure,
  getSettings,
  setWeeklyWithdraw,
  updateDriverLocation,
  createRide,
  getRide,
  acceptRide,
  updateRideStatus,
  updateRideDriverLocation,
  updateRideRiderLocation,
  openRidesForDriver,
  activeRideForDriver,
  activeRideForRider,
  cancelRide,
  listRides,
  requestWithdrawal,
  decideWithdrawal,
  listWithdrawals,
  driverWallet,
  adminStats,
  estimateFare,
};

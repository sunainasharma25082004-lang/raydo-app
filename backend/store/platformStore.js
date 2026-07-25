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
const PAYMENTS_FILE = path.join(DATA_DIR, 'payments.json');

function ensure() {
  driverStore.ensureFiles();
  if (!fs.existsSync(WITHDRAWALS_FILE)) fs.writeFileSync(WITHDRAWALS_FILE, '[]');
  if (!fs.existsSync(RIDERS_FILE)) fs.writeFileSync(RIDERS_FILE, '[]');
  if (!fs.existsSync(PAYMENTS_FILE)) fs.writeFileSync(PAYMENTS_FILE, '[]');
  if (!fs.existsSync(SETTINGS_FILE)) {
    fs.writeFileSync(
      SETTINGS_FILE,
      JSON.stringify(
        {
          // Admin must enable weekly withdrawal window
          weeklyWithdrawOpen: false,
          weeklyWithdrawNote: 'Closed — admin will open every week',
          // All ride fares are collected by admin/platform
          platformBalance: 0,
          platformCurrency: 'INR',
          updatedAt: new Date().toISOString(),
        },
        null,
        2,
      ),
    );
  } else {
    // migrate older settings
    try {
      const s = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
      if (typeof s.platformBalance !== 'number') {
        s.platformBalance = 0;
        s.platformCurrency = s.platformCurrency || 'INR';
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(s, null, 2));
      }
    } catch {
      /* ignore */
    }
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

function listStoredRiders() {
  return read(RIDERS_FILE);
}

function saveStoredRiders(list) {
  write(RIDERS_FILE, list);
}

function upsertRiderProfile({ id: riderId, name, phone }) {
  if (!riderId) return null;
  const list = listStoredRiders();
  let rider = list.find((r) => r.id === riderId);
  if (!rider) {
    rider = {
      id: riderId,
      name: name || 'Rider',
      phone: phone || '',
      blocked: false,
      blockReason: '',
      blockedAt: null,
      blockedBy: null,
      createdAt: new Date().toISOString(),
    };
    list.push(rider);
  } else {
    if (name) rider.name = name;
    if (phone) rider.phone = phone;
  }
  rider.updatedAt = new Date().toISOString();
  saveStoredRiders(list);
  return rider;
}

function getRiderRecord(riderId) {
  return listStoredRiders().find((r) => r.id === riderId) || null;
}

function isRiderBlocked(riderId) {
  const r = getRiderRecord(riderId);
  return !!(r && r.blocked);
}

function setRiderBlocked(riderId, blocked, reason, adminUsername) {
  if (!riderId) {
    const err = new Error('Rider id required');
    err.status = 400;
    throw err;
  }
  const list = listStoredRiders();
  let rider = list.find((r) => r.id === riderId);
  if (!rider) {
    // create from ride history if missing
    const sample = listRides().find((r) => r.riderId === riderId);
    rider = {
      id: riderId,
      name: sample?.riderName || 'Rider',
      phone: sample?.riderPhone || '',
      blocked: false,
      blockReason: '',
      blockedAt: null,
      blockedBy: null,
      createdAt: sample?.createdAt || new Date().toISOString(),
    };
    list.push(rider);
  }
  rider.blocked = !!blocked;
  rider.blockReason = blocked ? String(reason || 'Blocked by admin') : '';
  rider.blockedAt = blocked ? new Date().toISOString() : null;
  rider.blockedBy = blocked ? adminUsername || 'admin' : null;
  rider.updatedAt = new Date().toISOString();
  saveStoredRiders(list);
  return publicRider(rider);
}

function publicRider(rider) {
  if (!rider) return null;
  return {
    id: rider.id,
    name: rider.name || 'Rider',
    phone: rider.phone || '',
    blocked: !!rider.blocked,
    blockReason: rider.blockReason || '',
    blockedAt: rider.blockedAt || null,
    blockedBy: rider.blockedBy || null,
    createdAt: rider.createdAt,
  };
}

/** Aggregate riders from stored profiles + ride history */
function listRidersAdmin() {
  const stored = listStoredRiders();
  const rides = listRides();
  const byId = new Map();

  for (const r of stored) {
    byId.set(r.id, { ...r });
  }

  for (const ride of rides) {
    const rid = ride.riderId;
    if (!rid) continue;
    if (!byId.has(rid)) {
      byId.set(rid, {
        id: rid,
        name: ride.riderName || 'Rider',
        phone: ride.riderPhone || '',
        blocked: false,
        blockReason: '',
        blockedAt: null,
        blockedBy: null,
        createdAt: ride.createdAt,
      });
    } else {
      const cur = byId.get(rid);
      if ((!cur.name || cur.name === 'Rider') && ride.riderName) cur.name = ride.riderName;
      if (!cur.phone && ride.riderPhone) cur.phone = ride.riderPhone;
    }
  }

  const riders = Array.from(byId.values()).map((rider) => {
    const riderRides = rides.filter((r) => r.riderId === rider.id);
    const completed = riderRides.filter((r) => r.status === 'Completed');
    // Prefer riderRating (driver rates rider); fall back to rating on trip
    const ratings = riderRides
      .map((r) => (typeof r.riderRating === 'number' ? r.riderRating : r.rating))
      .filter((n) => typeof n === 'number' && n >= 1 && n <= 5);
    const goodReviews = ratings.filter((n) => n >= 4).length;
    const badReviews = ratings.filter((n) => n <= 2).length;
    const neutralReviews = ratings.filter((n) => n === 3).length;
    const avgRating =
      ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : null;

    return {
      ...publicRider(rider),
      totalRides: riderRides.length,
      completedRides: completed.length,
      cancelledRides: riderRides.filter((r) => r.status === 'Cancelled').length,
      activeRides: riderRides.filter((r) =>
        ['Requested', 'Accepted', 'Arrived', 'In_Progress'].includes(r.status),
      ).length,
      reviewCount: ratings.length,
      goodReviews,
      badReviews,
      neutralReviews,
      avgRating,
      lastRideAt: riderRides[0]?.createdAt || null,
    };
  });

  riders.sort((a, b) => {
    if (a.blocked !== b.blocked) return a.blocked ? -1 : 1;
    return String(b.lastRideAt || '').localeCompare(String(a.lastRideAt || ''));
  });

  return riders;
}

function riderAdminStats() {
  const riders = listRidersAdmin();
  return {
    ridersTotal: riders.length,
    ridersBlocked: riders.filter((r) => r.blocked).length,
    ridesByRiders: riders.reduce((s, r) => s + r.totalRides, 0),
    goodReviewsTotal: riders.reduce((s, r) => s + r.goodReviews, 0),
    badReviewsTotal: riders.reduce((s, r) => s + r.badReviews, 0),
    reviewsTotal: riders.reduce((s, r) => s + r.reviewCount, 0),
  };
}

function rateRide(rideId, { rating, comment, by } = {}) {
  const rides = listRides();
  const ride = rides.find((r) => r.id === rideId);
  if (!ride) {
    const err = new Error('Ride not found');
    err.status = 404;
    throw err;
  }
  const stars = Number(rating);
  if (!stars || stars < 1 || stars > 5) {
    const err = new Error('rating must be 1–5');
    err.status = 400;
    throw err;
  }
  // by === 'driver' → rates the rider; otherwise rider rates driver/trip
  if (by === 'driver') {
    ride.riderRating = stars;
    ride.riderRatingComment = comment || '';
    ride.riderRatedAt = new Date().toISOString();
  } else {
    ride.rating = stars;
    ride.ratingComment = comment || '';
    ride.ratedAt = new Date().toISOString();
  }
  saveRides(rides);
  return ride;
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

  const resolvedRiderId = riderId || id();
  if (isRiderBlocked(resolvedRiderId)) {
    const rec = getRiderRecord(resolvedRiderId);
    const err = new Error(
      rec?.blockReason
        ? `Account blocked: ${rec.blockReason}`
        : 'Your account is blocked. Contact Raydo support.',
    );
    err.status = 403;
    throw err;
  }

  upsertRiderProfile({
    id: resolvedRiderId,
    name: riderName || 'Rider',
    phone: riderPhone || '',
  });

  const rides = listRides();
  const ride = {
    id: id(),
    riderId: resolvedRiderId,
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
    // Filled by attachMatchedDrivers — only these nearest drivers get the request
    matchedDriverIds: [],
    matchedDriversSnapshot: [],
    matchRadiusKm: driverStore.DEFAULT_MATCH_RADIUS_KM || 12,
    otp: String(Math.floor(1000 + Math.random() * 9000)),
    rating: null,
    riderRating: null,
    createdAt: new Date().toISOString(),
    acceptedAt: null,
    completedAt: null,
    timeline: [{ status: 'Requested', at: new Date().toISOString() }],
  };
  rides.unshift(ride);
  saveRides(rides);
  return ride;
}

/** Save the nearest drivers (max 10) who should receive this ride request */
function attachMatchedDrivers(rideId, matchedDrivers = []) {
  const rides = listRides();
  const ride = rides.find((r) => r.id === rideId);
  if (!ride) return null;
  const list = Array.isArray(matchedDrivers) ? matchedDrivers.slice(0, 10) : [];
  ride.matchedDriverIds = list.map((d) => d.id).filter(Boolean);
  ride.matchedDriversSnapshot = list.map((d) => ({
    id: d.id,
    name: d.name,
    phone: d.phone,
    rating: d.rating,
    vehicle: d.vehicle,
    location: d.location || null,
    distanceKm: d.distanceKm,
  }));
  ride.matchRadiusKm = ride.matchRadiusKm || driverStore.DEFAULT_MATCH_RADIUS_KM || 12;
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
    const want = driverStore.vehicleGroup(ride.vehicleType);
    const have = driverStore.vehicleGroup(driver.vehicle?.type);
    const err = new Error(
      `Vehicle mismatch: rider requested ${ride.vehicleType} (${want}), you drive ${driver.vehicle?.type} (${have}). Only same type can accept.`,
    );
    err.status = 400;
    throw err;
  }

  // Only the nearest matched drivers (max 10) may accept
  if (Array.isArray(ride.matchedDriverIds) && ride.matchedDriverIds.length > 0) {
    if (!ride.matchedDriverIds.includes(driverId)) {
      const err = new Error(
        'This request was only sent to the nearest drivers near the rider. You are outside the match radius.',
      );
      err.status = 403;
      throw err;
    }
  } else if (
    driver.location?.lat != null &&
    ride.pickupLat != null &&
    ride.pickupLng != null
  ) {
    const dist = driverStore.haversineKm(
      Number(driver.location.lat),
      Number(driver.location.lng),
      Number(ride.pickupLat),
      Number(ride.pickupLng),
    );
    const radius = ride.matchRadiusKm || driverStore.DEFAULT_MATCH_RADIUS_KM || 12;
    if (dist > radius) {
      const err = new Error(
        `Too far from pickup (${dist.toFixed(1)} km). Only drivers within ${radius} km can accept.`,
      );
      err.status = 403;
      throw err;
    }
  }

  ride.driverId = driverId;
  ride.status = 'Accepted';
  ride.acceptedAt = new Date().toISOString();
  ride.chatEnabled = true; // open until pickup / trip start
  ride.chatClosedAt = null;
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

/** Attach ETA + WhatsApp notify result after accept */
function setRideAcceptMeta(rideId, meta = {}) {
  const rides = listRides();
  const ride = rides.find((r) => r.id === rideId);
  if (!ride) return null;
  if (meta.pickupEtaMinutes != null) ride.pickupEtaMinutes = meta.pickupEtaMinutes;
  if (meta.pickupDistanceKm != null) ride.pickupDistanceKm = meta.pickupDistanceKm;
  if (meta.etaSource) ride.etaSource = meta.etaSource;
  if (meta.whatsappNotify) ride.whatsappNotify = meta.whatsappNotify;
  if (typeof meta.chatEnabled === 'boolean') ride.chatEnabled = meta.chatEnabled;
  ride.updatedAt = new Date().toISOString();
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
  // Chat only until pickup/trip start — close after In_Progress / Completed / Cancelled
  if (status === 'In_Progress' || status === 'Completed' || status === 'Cancelled') {
    ride.chatEnabled = false;
    ride.chatClosedAt = new Date().toISOString();
  } else if (status === 'Arrived') {
    // Still at pickup — chat stays open
    ride.chatEnabled = true;
  }
  if (status === 'Completed') {
    ride.completedAt = new Date().toISOString();
    // Driver earnings tracked for weekly payout; rider payment is collected by admin/platform
    creditDriver(driverId, ride.fare, { countRide: true });
    ride.paymentStatus = ride.paymentStatus || 'pending';
    ride.paymentDestination = 'admin';
    // Create admin payment record (awaiting rider pay if not already paid)
    try {
      recordRidePaymentForAdmin(ride, {
        status: ride.paymentStatus === 'paid' ? 'received' : 'pending',
        method: ride.paymentMethod || 'upi',
        note: 'Auto-created on trip complete — fare goes to admin/platform',
      });
    } catch (err) {
      console.warn('[Payments] record on complete failed:', err.message);
    }
  }
  saveRides(rides);
  return ride;
}

// ——— Payments (all ride fares → admin / platform) ———
function listPayments() {
  return read(PAYMENTS_FILE);
}

function savePayments(list) {
  write(PAYMENTS_FILE, list);
}

function getPlatformBalance() {
  const s = getSettings();
  return typeof s.platformBalance === 'number' ? s.platformBalance : 0;
}

function addPlatformBalance(amount) {
  const s = getSettings();
  const n = Number(amount) || 0;
  s.platformBalance = Math.round(((s.platformBalance || 0) + n) * 100) / 100;
  s.updatedAt = new Date().toISOString();
  write(SETTINGS_FILE, s);
  return s.platformBalance;
}

/**
 * Every completed ride creates a payment owned by admin.
 * Idempotent per rideId (one payment row per ride).
 */
function recordRidePaymentForAdmin(ride, { status = 'pending', method = 'upi', note = '' } = {}) {
  if (!ride?.id) return null;
  const list = listPayments();
  const existing = list.find((p) => p.rideId === ride.id);
  if (existing) {
    // refresh fare / meta if still pending
    if (existing.status === 'pending' && ride.fare != null) {
      existing.amount = Number(ride.fare) || existing.amount;
    }
    existing.updatedAt = new Date().toISOString();
    savePayments(list);
    return existing;
  }

  const payment = {
    id: id(),
    rideId: ride.id,
    amount: Number(ride.fare) || 0,
    currency: 'INR',
    // Always admin / platform — never direct to driver wallet as "customer payment"
    destination: 'admin',
    status, // pending | received | failed | refunded
    method, // upi | cash | card | razorpay | other
    riderId: ride.riderId || null,
    riderName: ride.riderName || 'Rider',
    riderPhone: ride.riderPhone || '',
    driverId: ride.driverId || null,
    driverName: ride.driverSnapshot?.name || null,
    driverLoginId: ride.driverSnapshot?.loginId || null,
    vehicleType: ride.vehicleType || '',
    pickup: ride.pickup || '',
    drop: ride.drop || '',
    note: note || 'Ride fare collected by Raydo admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    paidAt: status === 'received' ? new Date().toISOString() : null,
  };
  list.unshift(payment);
  savePayments(list);
  return payment;
}

/**
 * Rider pays after trip — amount is credited to admin platform balance.
 */
function collectRiderPayment(rideId, { method = 'upi', transactionId = '', note = '' } = {}) {
  const rides = listRides();
  const ride = rides.find((r) => r.id === rideId);
  if (!ride) {
    const err = new Error('Ride not found');
    err.status = 404;
    throw err;
  }
  if (ride.status !== 'Completed') {
    const err = new Error('Payment only after ride is completed');
    err.status = 400;
    throw err;
  }

  let payment = listPayments().find((p) => p.rideId === rideId);
  if (!payment) {
    payment = recordRidePaymentForAdmin(ride, { status: 'pending', method });
  }

  // Already received — return same (idempotent)
  if (payment.status === 'received') {
    return { payment, ride, alreadyPaid: true, platformBalance: getPlatformBalance() };
  }

  const amount = Number(ride.fare) || Number(payment.amount) || 0;
  payment.amount = amount;
  payment.status = 'received';
  payment.method = method || payment.method || 'upi';
  payment.transactionId = transactionId || `pay_${Date.now()}`;
  payment.paidAt = new Date().toISOString();
  payment.updatedAt = payment.paidAt;
  payment.destination = 'admin';
  if (note) payment.note = note;

  const list = listPayments();
  const idx = list.findIndex((p) => p.id === payment.id);
  if (idx >= 0) list[idx] = payment;
  else list.unshift(payment);
  savePayments(list);

  // Credit admin platform balance
  const platformBalance = addPlatformBalance(amount);

  ride.paymentStatus = 'paid';
  ride.paymentMethod = payment.method;
  ride.paymentId = payment.id;
  ride.paidAt = payment.paidAt;
  ride.paymentDestination = 'admin';
  saveRides(rides);

  return { payment, ride, alreadyPaid: false, platformBalance };
}

function listPaymentsAdmin(status = 'all') {
  let list = listPayments();
  if (status && status !== 'all') {
    list = list.filter((p) => p.status === status);
  }
  list.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  const received = listPayments().filter((p) => p.status === 'received');
  const pending = listPayments().filter((p) => p.status === 'pending');
  const sum = (arr) =>
    Math.round(arr.reduce((s, p) => s + (Number(p.amount) || 0), 0) * 100) / 100;
  return {
    payments: list,
    stats: {
      totalPayments: listPayments().length,
      receivedCount: received.length,
      pendingCount: pending.length,
      totalReceived: sum(received),
      totalPending: sum(pending),
      platformBalance: getPlatformBalance(),
    },
  };
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
  const driverType = driver.vehicle?.type;
  if (!driverType) return [];

  const radiusKm = driverStore.DEFAULT_MATCH_RADIUS_KM || 12;
  const dLat = driver.location?.lat;
  const dLng = driver.location?.lng;
  const hasDriverGps =
    dLat != null && dLng != null && Number.isFinite(Number(dLat)) && Number.isFinite(Number(dLng));

  return listRides()
    .filter((r) => {
      if (r.status !== 'Requested') return false;
      if (r.driverId) return false;
      // Strict: Scooty/Bike ↔ two_wheeler only; Auto ↔ auto; Car ↔ car
      if (!driverStore.vehicleMatches(driverType, r.vehicleType)) return false;

      // Prefer explicit nearest-match list (max 10) stored at request time
      if (Array.isArray(r.matchedDriverIds) && r.matchedDriverIds.length > 0) {
        return r.matchedDriverIds.includes(driverId);
      }

      // Fallback for older rides: only if driver is near pickup
      if (!hasDriverGps) return false;
      if (r.pickupLat == null || r.pickupLng == null) return false;
      const dist = driverStore.haversineKm(
        Number(dLat),
        Number(dLng),
        Number(r.pickupLat),
        Number(r.pickupLng),
      );
      return dist <= (r.matchRadiusKm || radiusKm);
    })
    .map((r) => {
      let distanceKmFromDriver = null;
      if (hasDriverGps && r.pickupLat != null && r.pickupLng != null) {
        distanceKmFromDriver =
          Math.round(
            driverStore.haversineKm(
              Number(dLat),
              Number(dLng),
              Number(r.pickupLat),
              Number(r.pickupLng),
            ) * 100,
          ) / 100;
      } else if (Array.isArray(r.matchedDriversSnapshot)) {
        const snap = r.matchedDriversSnapshot.find((x) => x.id === driverId);
        if (snap?.distanceKm != null) distanceKmFromDriver = snap.distanceKm;
      }
      return { ...r, distanceKmFromDriver };
    })
    .sort((a, b) => {
      const da = a.distanceKmFromDriver ?? 9999;
      const db = b.distanceKmFromDriver ?? 9999;
      return da - db;
    });
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
  ride.chatEnabled = false;
  ride.chatClosedAt = new Date().toISOString();
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
  const riderStats = riderAdminStats();
  const pay = listPaymentsAdmin('all');
  return {
    ...kyc,
    ridesTotal: rides.length,
    ridesActive: rides.filter((r) =>
      ['Requested', 'Accepted', 'Arrived', 'In_Progress'].includes(r.status),
    ).length,
    ridesCompleted: rides.filter((r) => r.status === 'Completed').length,
    withdrawalsPending: w.filter((x) => x.status === 'pending_admin').length,
    weeklyWithdrawOpen: getSettings().weeklyWithdrawOpen,
    paymentsTotal: pay.stats.totalPayments,
    paymentsReceived: pay.stats.totalReceived,
    paymentsPending: pay.stats.totalPending,
    paymentsPendingCount: pay.stats.pendingCount,
    platformBalance: pay.stats.platformBalance,
    ...riderStats,
  };
}

module.exports = {
  ensure,
  getSettings,
  setWeeklyWithdraw,
  updateDriverLocation,
  createRide,
  attachMatchedDrivers,
  getRide,
  acceptRide,
  setRideAcceptMeta,
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
  listRidersAdmin,
  setRiderBlocked,
  isRiderBlocked,
  getRiderRecord,
  rateRide,
  riderAdminStats,
  upsertRiderProfile,
  listPayments,
  listPaymentsAdmin,
  recordRidePaymentForAdmin,
  collectRiderPayment,
  getPlatformBalance,
};

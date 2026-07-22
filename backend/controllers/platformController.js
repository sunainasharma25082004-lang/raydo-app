const platform = require('../store/platformStore');
const driverStore = require('../store/driverStore');

exports.createRide = (req, res) => {
  try {
    const ride = platform.createRide(req.body);
    const group = ride.vehicleGroup || driverStore.vehicleGroup(ride.vehicleType);
    const matched = driverStore.listOnlineDriversByVehicle(ride.vehicleType);
    const io = req.app.get('io');
    if (io) {
      // ONLY matching vehicle drivers (no global broadcast — avoids Auto seeing Scooty etc.)
      matched.forEach((d) => {
        io.to(`driver:${d.id}`).emit('new_ride_request', {
          ride,
          vehicleGroup: group,
        });
      });
      // Room for drivers who joined their vehicle group (Scooty/Bike → two_wheeler)
      io.to(`vehicle:${group}`).emit('new_ride_request', {
        ride,
        vehicleGroup: group,
      });
    }
    res.status(201).json({
      message: 'Ride requested — only matching vehicle drivers notified',
      ride,
      vehicleGroup: group,
      matchRule:
        group === 'two_wheeler'
          ? 'Scooty/Bike drivers only'
          : group === 'auto'
            ? 'Auto drivers only'
            : group === 'car'
              ? 'Car drivers only'
              : `${ride.vehicleType} only`,
      matchedDriversCount: matched.length,
      matchedDrivers: matched.map((d) => ({
        id: d.id,
        name: d.name,
        vehicle: d.vehicle,
        location: d.location,
        rating: d.rating,
      })),
    });
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
};

exports.getRide = (req, res) => {
  const ride = platform.getRide(req.params.id);
  if (!ride) return res.status(404).json({ message: 'Ride not found' });
  res.json({ ride });
};

exports.acceptRide = (req, res) => {
  try {
    const ride = platform.acceptRide(req.params.id, req.user.id);
    const io = req.app.get('io');
    if (io) {
      io.to(`rider:${ride.riderId}`).emit('ride_accepted', { ride });
      io.emit('ride_updated', { ride });
    }
    res.json({ message: 'Ride accepted', ride });
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
};

exports.updateStatus = (req, res) => {
  try {
    const ride = platform.updateRideStatus(
      req.params.id,
      req.user.id,
      req.body.status,
      req.body.otp,
    );
    const io = req.app.get('io');
    if (io) {
      io.to(`rider:${ride.riderId}`).emit('ride_status_updated', {
        status: ride.status,
        ride,
      });
      io.emit('ride_updated', { ride });
    }
    res.json({ message: `Status → ${ride.status}`, ride });
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
};

exports.cancelRide = (req, res) => {
  try {
    const ride = platform.cancelRide(req.params.id, req.body.by || req.user?.role || 'user');
    const io = req.app.get('io');
    if (io) io.emit('ride_updated', { ride });
    res.json({ message: 'Cancelled', ride });
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
};

exports.pushDriverLocation = (req, res) => {
  try {
    const { lat, lng, isOnline, rideId } = req.body;
    if (lat == null || lng == null) {
      return res.status(400).json({ message: 'lat and lng required' });
    }
    const driver = platform.updateDriverLocation(req.user.id, lat, lng, isOnline);
    let ride = null;
    if (rideId) {
      ride = platform.updateRideDriverLocation(rideId, req.user.id, lat, lng);
    } else {
      const active = platform.activeRideForDriver(req.user.id);
      if (active) {
        ride = platform.updateRideDriverLocation(active.id, req.user.id, lat, lng);
      }
    }
    const io = req.app.get('io');
    if (io && ride) {
      io.to(`rider:${ride.riderId}`).emit('live_tracking_update', {
        rideId: ride.id,
        lat: Number(lat),
        lng: Number(lng),
        status: ride.status,
        driver: ride.driverSnapshot,
        updatedAt: new Date().toISOString(),
      });
    }
    if (io) {
      io.emit('driver_location_broadcast', {
        driverId: req.user.id,
        lat: Number(lat),
        lng: Number(lng),
        isOnline: driver.isOnline,
      });
    }
    res.json({ message: 'Location updated', driver, ride });
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
};

exports.pushRiderLocation = (req, res) => {
  try {
    const { rideId, lat, lng } = req.body;
    if (!rideId || lat == null || lng == null) {
      return res.status(400).json({ message: 'rideId, lat, lng required' });
    }
    const ride = platform.updateRideRiderLocation(rideId, lat, lng);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    const io = req.app.get('io');
    if (io && ride.driverId) {
      io.to(`driver:${ride.driverId}`).emit('rider_location_update', {
        rideId,
        lat: Number(lat),
        lng: Number(lng),
      });
    }
    res.json({ message: 'Rider location updated', ride });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.openRides = (req, res) => {
  const driver = driverStore.findDriverById(req.user.id);
  const rides = platform.openRidesForDriver(req.user.id);
  res.json({
    rides,
    driverVehicle: driver?.vehicle?.type || null,
    vehicleGroup: driverStore.vehicleGroup(driver?.vehicle?.type),
    matchNote:
      'Only rides matching your vehicle group are listed (Scooty/Bike share two-wheeler).',
  });
};

exports.activeDriverRide = (req, res) => {
  res.json({ ride: platform.activeRideForDriver(req.user.id) });
};

exports.wallet = (req, res) => {
  const wallet = platform.driverWallet(req.user.id);
  if (!wallet) return res.status(404).json({ message: 'Not found' });
  res.json(wallet);
};

exports.requestWithdraw = (req, res) => {
  try {
    const w = platform.requestWithdrawal(req.user.id, req.body.amount, req.body.upiId);
    res.status(201).json({
      message: 'Withdrawal submitted — waiting for admin approval',
      withdrawal: w,
    });
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
};

// Admin
exports.adminWithdrawals = (req, res) => {
  const status = req.query.status || 'pending_admin';
  let list = platform.listWithdrawals();
  if (status !== 'all') list = list.filter((w) => w.status === status);
  res.json({ withdrawals: list, settings: platform.getSettings() });
};

exports.adminDecideWithdraw = (req, res) => {
  try {
    const w = platform.decideWithdrawal(
      req.params.id,
      req.body.decision,
      req.user.username,
      req.body.note,
    );
    res.json({ message: `Withdrawal ${w.status}`, withdrawal: w });
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
};

exports.adminWeeklyWindow = (req, res) => {
  const s = platform.setWeeklyWithdraw(
    req.body.open,
    req.body.note,
    req.user.username,
  );
  res.json({ message: s.weeklyWithdrawOpen ? 'Weekly withdrawals OPEN' : 'Weekly withdrawals CLOSED', settings: s });
};

exports.adminStats = (req, res) => {
  res.json(platform.adminStats());
};

exports.adminRides = (req, res) => {
  res.json({ rides: platform.listRides().slice(0, 100) });
};

exports.adminRiders = (req, res) => {
  const filter = String(req.query.status || 'all').toLowerCase();
  let riders = platform.listRidersAdmin();
  if (filter === 'blocked') riders = riders.filter((r) => r.blocked);
  if (filter === 'active') riders = riders.filter((r) => !r.blocked);
  res.json({
    riders,
    stats: platform.riderAdminStats(),
  });
};

exports.adminBlockRider = (req, res) => {
  try {
    const blocked = req.body.blocked !== false && req.body.blocked !== 'false';
    const rider = platform.setRiderBlocked(
      req.params.id,
      blocked,
      req.body.reason,
      req.user?.username || 'admin',
    );
    res.json({
      message: blocked ? 'Rider blocked' : 'Rider unblocked',
      rider,
    });
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
};

exports.rateRide = (req, res) => {
  try {
    const ride = platform.rateRide(req.params.id, {
      rating: req.body.rating,
      comment: req.body.comment,
      by: req.body.by || req.user?.role,
    });
    res.json({ message: 'Rating saved', ride });
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
};

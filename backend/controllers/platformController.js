const platform = require('../store/platformStore');
const driverStore = require('../store/driverStore');

exports.createRide = (req, res) => {
  try {
    const ride = platform.createRide(req.body);
    const group = ride.vehicleGroup || driverStore.vehicleGroup(ride.vehicleType);
    const radiusKm = driverStore.DEFAULT_MATCH_RADIUS_KM || 12;
    const limit = driverStore.MAX_NEARBY_DRIVERS || 10;

    // Nearest online drivers only (same vehicle type, within radius, max 10)
    const matched = driverStore.listNearestOnlineDrivers(
      ride.vehicleType,
      ride.pickupLat,
      ride.pickupLng,
      { limit, radiusKm },
    );

    const fullRide = platform.attachMatchedDrivers(ride.id, matched) || ride;
    const payloadRide = {
      ...fullRide,
      matchedDriversSnapshot: matched.map((d) => ({
        id: d.id,
        name: d.name,
        vehicle: d.vehicle,
        location: d.location,
        rating: d.rating,
        distanceKm: d.distanceKm,
      })),
    };

    const io = req.app.get('io');
    if (io) {
      // ONLY the nearest matched drivers — never broadcast to all of vehicle group
      matched.forEach((d) => {
        io.to(`driver:${d.id}`).emit('new_ride_request', {
          ride: payloadRide,
          vehicleGroup: group,
          distanceKm: d.distanceKm,
          matchRank: matched.findIndex((x) => x.id === d.id) + 1,
          matchedTotal: matched.length,
        });
      });
    }

    res.status(201).json({
      message:
        matched.length > 0
          ? `Ride requested — sent to ${matched.length} nearest driver(s) within ${radiusKm} km`
          : `No online ${ride.vehicleType} drivers within ${radiusKm} km of your pickup`,
      ride: payloadRide,
      vehicleGroup: group,
      matchRule: {
        vehicle:
          group === 'two_wheeler'
            ? 'Scooty/Bike only'
            : group === 'auto'
              ? 'Auto only'
              : group === 'car'
                ? 'Car only'
                : `${ride.vehicleType} only`,
        maxDrivers: limit,
        radiusKm,
        sort: 'nearest_first',
      },
      matchedDriversCount: matched.length,
      matchedDrivers: matched.map((d) => ({
        id: d.id,
        name: d.name,
        vehicle: d.vehicle,
        location: d.location,
        rating: d.rating,
        distanceKm: d.distanceKm,
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

exports.acceptRide = async (req, res) => {
  try {
    let ride = platform.acceptRide(req.params.id, req.user.id);

    // Calculate ETA driver → pickup
    const { estimatePickupEtaMinutes } = require('../services/eta');
    const { notifyRiderDriverComing } = require('../services/notify');

    const fromLat = ride.driverLocation?.lat ?? ride.driverSnapshot?.location?.lat;
    const fromLng = ride.driverLocation?.lng ?? ride.driverSnapshot?.location?.lng;
    const eta = await estimatePickupEtaMinutes({
      fromLat,
      fromLng,
      toLat: ride.pickupLat,
      toLng: ride.pickupLng,
      vehicleType: ride.vehicleType,
    });

    const whatsappNotify = await notifyRiderDriverComing({
      phone: ride.riderPhone,
      driverName: ride.driverSnapshot?.name,
      vehicleType: ride.vehicleType || ride.driverSnapshot?.vehicle?.type,
      vehicleReg: ride.driverSnapshot?.vehicle?.registrationNumber,
      etaMinutes: eta.etaMinutes,
      distanceKm: eta.distanceKm,
      otp: ride.otp,
    });

    ride =
      platform.setRideAcceptMeta(ride.id, {
        pickupEtaMinutes: eta.etaMinutes,
        pickupDistanceKm: eta.distanceKm,
        etaSource: eta.source,
        whatsappNotify: {
          ...whatsappNotify,
          at: new Date().toISOString(),
        },
        chatEnabled: true,
      }) || ride;

    const io = req.app.get('io');
    if (io) {
      const payload = {
        ride,
        chatEnabled: true,
        pickupEtaMinutes: eta.etaMinutes,
        pickupDistanceKm: eta.distanceKm,
        whatsappNotify,
      };
      io.to(`rider:${ride.riderId}`).emit('ride_accepted', payload);
      io.to(`ride:${ride.id}`).emit('ride_accepted', payload);
      io.to(`chat:${ride.id}`).emit('chat_opened', { rideId: ride.id, chatEnabled: true });
      io.emit('ride_updated', { ride });
    }

    res.json({
      message: 'Ride accepted — rider notified, chat open until pickup',
      ride,
      chatEnabled: true,
      pickupEtaMinutes: eta.etaMinutes,
      pickupDistanceKm: eta.distanceKm,
      whatsappNotify,
    });
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
      io.to(`ride:${ride.id}`).emit('ride_status_updated', {
        status: ride.status,
        ride,
      });
      // Close chat for both after pickup / trip start
      if (ride.chatEnabled === false) {
        io.to(`chat:${ride.id}`).emit('chat_closed', {
          rideId: ride.id,
          status: ride.status,
          reason: 'Chat closed after pickup',
        });
        io.to(`rider:${ride.riderId}`).emit('chat_closed', {
          rideId: ride.id,
          status: ride.status,
        });
        if (ride.driverId) {
          io.to(`driver:${ride.driverId}`).emit('chat_closed', {
            rideId: ride.id,
            status: ride.status,
          });
        }
      }
      io.emit('ride_updated', { ride });
    }
    res.json({
      message: `Status → ${ride.status}`,
      ride,
      chatEnabled: !!ride.chatEnabled,
    });
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
};

/** GET chat history for a ride */
exports.getChat = (req, res) => {
  try {
    const chatStore = require('../store/chatStore');
    const ride = platform.getRide(req.params.id);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    const messages = chatStore.getMessages(ride.id);
    res.json({
      rideId: ride.id,
      chatEnabled: ride.chatEnabled !== false && chatStore.isChatOpen(ride.status),
      status: ride.status,
      messages,
    });
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
};

/** POST a chat message (rider or driver) */
exports.postChat = (req, res) => {
  try {
    const chatStore = require('../store/chatStore');
    const ride = platform.getRide(req.params.id);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });

    const senderRole = req.body.senderRole || req.user?.role;
    const senderId = req.body.senderId || req.user?.id || '';
    if (senderRole !== 'rider' && senderRole !== 'driver') {
      return res.status(400).json({ message: 'senderRole must be rider or driver' });
    }
    // Basic membership check
    if (senderRole === 'driver' && ride.driverId && req.user?.id && ride.driverId !== req.user.id) {
      return res.status(403).json({ message: 'Not your ride' });
    }

    const msg = chatStore.addMessage({
      rideId: ride.id,
      senderRole,
      senderId,
      text: req.body.text || req.body.message,
      rideStatus: ride.chatEnabled === false ? 'In_Progress' : ride.status,
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`chat:${ride.id}`).emit('receive_chat_message', msg);
      io.to(`ride:${ride.id}`).emit('receive_chat_message', msg);
      io.to(`rider:${ride.riderId}`).emit('receive_chat_message', msg);
      if (ride.driverId) io.to(`driver:${ride.driverId}`).emit('receive_chat_message', msg);
    }

    res.status(201).json({ message: 'Sent', msg, chatEnabled: true });
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

/**
 * Rider pays after trip complete — money goes to admin/platform balance.
 */
exports.payRide = (req, res) => {
  try {
    const result = platform.collectRiderPayment(req.params.id, {
      method: req.body.method || 'upi',
      transactionId: req.body.transactionId || '',
      note: req.body.note || '',
    });
    // optional rating in same call
    if (req.body.rating != null) {
      try {
        platform.rateRide(req.params.id, {
          rating: req.body.rating,
          comment: req.body.comment || '',
          by: 'rider',
        });
      } catch {
        /* ignore rating errors */
      }
    }
    const io = req.app.get('io');
    if (io) {
      io.emit('payment_received', {
        payment: result.payment,
        platformBalance: result.platformBalance,
      });
      if (result.ride?.driverId) {
        io.to(`driver:${result.ride.driverId}`).emit('payment_received', {
          rideId: result.ride.id,
          amount: result.payment.amount,
        });
      }
    }
    res.json({
      message: result.alreadyPaid
        ? 'Payment already received by admin'
        : 'Payment successful — amount credited to Raydo admin',
      ...result,
    });
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
};

/** Admin: all payments (destination = admin) */
exports.adminPayments = (req, res) => {
  const status = req.query.status || 'all';
  res.json(platform.listPaymentsAdmin(status));
};

/** Mock nearby drivers for Rapido UX */
exports.getNearbyDrivers = (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);

  if (!lat || !lng) return res.json([]);

  const drivers = [];
  const now = Date.now();

  for (let i = 0; i < 12; i++) {
    const driftX = Math.sin((now / 15000) + i) * 0.003;
    const driftY = Math.cos((now / 15000) + i) * 0.003;
    const baseX = Math.sin(i * 4.5) * 0.008;
    const baseY = Math.cos(i * 4.5) * 0.008;

    drivers.push({
      id: 'mock-driver-' + i,
      latitude: lat + baseX + driftX,
      longitude: lng + baseY + driftY,
      vehicleType: i % 3 === 0 ? 'Auto' : (i % 2 === 0 ? 'Scooty' : 'Bike'),
      heading: (Math.atan2(driftY, driftX) * 180 / Math.PI + 360) % 360
    });
  }
  res.json(drivers);
};

const store = require('../store/driverStore');
const platform = require('../store/platformStore');

const MAX = store.MAX_NEARBY_DRIVERS || 10;
const RADIUS = store.DEFAULT_MATCH_RADIUS_KM || 12;

/**
 * Rider requests a vehicle — only nearest same-type online drivers (max 10).
 * Body: vehicleType, pickupLat, pickupLng, pickup, drop, riderName, fare, distanceKm
 */
exports.requestRide = (req, res) => {
  try {
    const {
      vehicleType,
      pickup,
      drop,
      riderName,
      fare,
      distanceKm,
      pickupLat,
      pickupLng,
      riderId,
      riderPhone,
    } = req.body;

    if (!vehicleType) {
      return res.status(400).json({ message: 'vehicleType is required (Bike, Scooty, Auto, Car)' });
    }

    const lat = pickupLat != null ? Number(pickupLat) : null;
    const lng = pickupLng != null ? Number(pickupLng) : null;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({
        message: 'pickupLat and pickupLng are required for nearest-driver matching',
      });
    }

    // Prefer platform ride (full GPS + matched list)
    const ride = platform.createRide({
      riderId,
      riderName,
      riderPhone,
      pickup,
      drop,
      pickupLat: lat,
      pickupLng: lng,
      vehicleType,
      fare,
      distanceKm,
    });

    const matched = store.listNearestOnlineDrivers(vehicleType, lat, lng, {
      limit: MAX,
      radiusKm: RADIUS,
    });
    const fullRide = platform.attachMatchedDrivers(ride.id, matched) || ride;
    const group = store.vehicleGroup(vehicleType);

    const io = req.app.get('io');
    if (io) {
      matched.forEach((d, idx) => {
        io.to(`driver:${d.id}`).emit('new_ride_request', {
          ride: fullRide,
          vehicleGroup: group,
          distanceKm: d.distanceKm,
          matchRank: idx + 1,
          matchedTotal: matched.length,
        });
      });
    }

    res.status(201).json({
      message:
        matched.length > 0
          ? `Ride requested — ${matched.length} nearest driver(s) notified`
          : `No online ${vehicleType} drivers within ${RADIUS} km`,
      ride: fullRide,
      matchedDriversCount: matched.length,
      matchedDrivers: matched.map((d) => ({
        id: d.id,
        name: d.name,
        vehicle: d.vehicle,
        rating: d.rating,
        location: d.location,
        distanceKm: d.distanceKm,
      })),
      matchingRule: {
        vehicle: 'same type only',
        maxDrivers: MAX,
        radiusKm: RADIUS,
        sort: 'nearest_first',
      },
    });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

/**
 * GET /api/match/drivers?vehicleType=Auto&lat=28.65&lng=77.23
 * Preview up to 10 nearest online drivers for a location.
 */
exports.availableDrivers = (req, res) => {
  try {
    const vehicleType = req.query.vehicleType;
    if (!vehicleType) {
      return res.status(400).json({ message: 'vehicleType query required' });
    }

    const lat = req.query.lat != null ? Number(req.query.lat) : null;
    const lng = req.query.lng != null ? Number(req.query.lng) : null;

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({
        message: 'lat and lng query params required for nearest drivers',
        example: '/api/match/drivers?vehicleType=Auto&lat=28.6506&lng=77.2303',
      });
    }

    const drivers = store.listNearestOnlineDrivers(vehicleType, lat, lng, {
      limit: MAX,
      radiusKm: RADIUS,
    });

    res.json({
      vehicleType,
      group: store.vehicleGroup(vehicleType),
      pickup: { lat, lng },
      radiusKm: RADIUS,
      maxDrivers: MAX,
      count: drivers.length,
      drivers: drivers.map((d) => ({
        id: d.id,
        name: d.name,
        phone: d.phone,
        rating: d.rating,
        vehicle: d.vehicle,
        location: d.location,
        distanceKm: d.distanceKm,
        isOnline: d.isOnline,
      })),
      matchingRule:
        'Only online drivers of the same vehicle type, sorted by distance, max 10 within radius',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

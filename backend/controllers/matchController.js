const Ride = require('../models/Ride');
const Driver = require('../models/Driver');

const MAX = 10;
const RADIUS_KM = 12;

// Helper to calculate haversine distance in km
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Rider requests a vehicle — only nearest same-type online drivers (max 10).
 * Body: vehicleType, pickupLat, pickupLng, pickup, drop, riderName, fare, distanceKm
 */
exports.requestRide = async (req, res) => {
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
    } = req.body;
    
    const riderId = req.user?.id || req.body.riderId;

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

    // 1. Create the ride in MongoDB
    const ride = await Ride.create({
      riderId,
      pickupLocation: { address: pickup || 'Pickup', lat, lng },
      dropoffLocation: { address: drop || 'Drop', lat: null, lng: null }, // Optional drop lat/lng
      vehicleType,
      distance: distanceKm || 0,
      fare: fare || 0,
      otp: Math.floor(1000 + Math.random() * 9000).toString(),
      status: 'Requested'
    });

    // 2. Find nearest online drivers
    const maxDistanceInMeters = RADIUS_KM * 1000;
    const matchedDrivers = await Driver.find({
      isOnline: true,
      kycStatus: 'approved',
      'vehicle.type': vehicleType,
      currentLocation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: maxDistanceInMeters
        }
      }
    }).limit(MAX);
    
    // Process matched drivers
    const matched = matchedDrivers.map(d => {
      const dLng = d.currentLocation.coordinates[0];
      const dLat = d.currentLocation.coordinates[1];
      const dist = haversineKm(lat, lng, dLat, dLng);
      return {
        id: d._id,
        name: d.name,
        vehicle: d.vehicle,
        rating: d.rating,
        location: { lat: dLat, lng: dLng },
        distanceKm: Number(dist.toFixed(2)),
      };
    });

    const io = req.app.get('io');
    if (io) {
      matched.forEach((d, idx) => {
        io.to(`driver:${d.id}`).emit('new_ride_request', {
          ride,
          vehicleGroup: vehicleType,
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
          : `No online ${vehicleType} drivers within ${RADIUS_KM} km`,
      ride,
      matchedDriversCount: matched.length,
      matchedDrivers: matched,
      matchingRule: {
        vehicle: 'same type only',
        maxDrivers: MAX,
        radiusKm: RADIUS_KM,
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
exports.availableDrivers = async (req, res) => {
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

    const maxDistanceInMeters = RADIUS_KM * 1000;
    const driversDb = await Driver.find({
      isOnline: true,
      kycStatus: 'approved',
      'vehicle.type': vehicleType,
      currentLocation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: maxDistanceInMeters
        }
      }
    }).limit(MAX);
    
    const drivers = driversDb.map(d => {
      const dLng = d.currentLocation?.coordinates[0] || 0;
      const dLat = d.currentLocation?.coordinates[1] || 0;
      const dist = haversineKm(lat, lng, dLat, dLng);
      return {
        id: d._id,
        name: d.name,
        phone: d.phone,
        rating: d.rating,
        vehicle: d.vehicle,
        location: { lat: dLat, lng: dLng },
        distanceKm: Number(dist.toFixed(2)),
        isOnline: d.isOnline,
      };
    });

    res.json({
      vehicleType,
      group: vehicleType,
      pickup: { lat, lng },
      radiusKm: RADIUS_KM,
      maxDrivers: MAX,
      count: drivers.length,
      drivers: drivers,
      matchingRule:
        'Only online drivers of the same vehicle type, sorted by distance, max 10 within radius',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

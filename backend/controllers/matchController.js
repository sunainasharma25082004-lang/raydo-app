const store = require('../store/driverStore');

/** Rider requests a vehicle — only same type (group) online drivers */
exports.requestRide = (req, res) => {
  try {
    const { vehicleType, pickup, drop, riderName, fare, distanceKm } = req.body;
    if (!vehicleType) {
      return res.status(400).json({ message: 'vehicleType is required (Bike, Scooty, Auto, Car)' });
    }

    const matchedDrivers = store.listOnlineDriversByVehicle(vehicleType);
    const ride = store.createRideRequest({
      riderName,
      pickup,
      drop,
      vehicleType,
      fare,
      distanceKm,
    });

    // Notify only matching vehicle group
    const io = req.app.get('io');
    if (io) {
      matchedDrivers.forEach((d) => {
        io.to(`driver:${d.id}`).emit('new_ride_request', { ride });
      });
      // Also broadcast with filter payload for clients listening generally
      io.emit('new_ride_request_filtered', {
        ride,
        vehicleGroup: store.vehicleGroup(vehicleType),
      });
    }

    res.status(201).json({
      message: 'Ride requested',
      ride,
      matchedDriversCount: matchedDrivers.length,
      matchedDrivers: matchedDrivers.map((d) => ({
        id: d.id,
        name: d.name,
        vehicle: d.vehicle,
        rating: d.rating,
      })),
      matchingRule:
        'Scooty/Bike → two-wheeler only · Auto → auto only · Car → car only',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.availableDrivers = (req, res) => {
  try {
    const vehicleType = req.query.vehicleType;
    if (!vehicleType) {
      return res.status(400).json({ message: 'vehicleType query required' });
    }
    const drivers = store.listOnlineDriversByVehicle(vehicleType);
    res.json({
      vehicleType,
      group: store.vehicleGroup(vehicleType),
      count: drivers.length,
      drivers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

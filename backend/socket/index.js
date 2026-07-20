const Driver = require('../models/Driver');
const Ride = require('../models/Ride');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Riders join a room based on their user ID to receive direct updates
    socket.on('join_rider', (riderId) => {
      socket.join(riderId);
      console.log(`Rider ${riderId} joined room`);
    });

    // Drivers join a room based on their user ID to receive direct ride requests
    socket.on('join_driver', (driverId) => {
      socket.join(driverId);
      console.log(`Driver ${driverId} joined room`);
    });

    // Driver goes online and starts sharing location
    socket.on('driver_update_location', async (data) => {
      const { driverId, lat, lng, isOnline } = data;
      
      try {
        await Driver.findByIdAndUpdate(driverId, {
          isOnline: isOnline,
          currentLocation: {
            type: 'Point',
            coordinates: [lng, lat]
          }
        });

        // Broadcast to all active riders nearby (simplified for MVP)
        io.emit('driver_location_broadcast', { driverId, lat, lng });
      } catch (err) {
        console.error('Error updating driver location:', err);
      }
    });

    // Ride live tracking during a trip
    socket.on('trip_location_update', (data) => {
      const { rideId, riderId, lat, lng } = data;
      // Send location directly to the specific rider
      io.to(riderId).emit('live_tracking_update', { lat, lng });
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};

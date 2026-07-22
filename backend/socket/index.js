const platform = require('../store/platformStore');
const driverStore = require('../store/driverStore');

module.exports = (io) => {
  platform.ensure();

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('join_rider', (riderId) => {
      socket.join(`rider:${riderId}`);
      socket.join(String(riderId));
      console.log(`Rider room: rider:${riderId}`);
    });

    socket.on('join_driver', (driverId) => {
      socket.join(`driver:${driverId}`);
      socket.join(String(driverId));
      console.log(`Driver room: driver:${driverId}`);
    });

    socket.on('join_ride', (rideId) => {
      socket.join(`ride:${rideId}`);
    });

    // Live driver GPS (real phone location)
    socket.on('driver_update_location', (data) => {
      try {
        const { driverId, lat, lng, isOnline, rideId } = data || {};
        if (!driverId || lat == null || lng == null) return;

        platform.updateDriverLocation(driverId, lat, lng, isOnline);

        let ride = null;
        if (rideId) {
          ride = platform.updateRideDriverLocation(rideId, driverId, lat, lng);
        } else {
          const active = platform.activeRideForDriver(driverId);
          if (active) {
            ride = platform.updateRideDriverLocation(active.id, driverId, lat, lng);
          }
        }

        io.emit('driver_location_broadcast', { driverId, lat, lng, isOnline });

        if (ride) {
          io.to(`rider:${ride.riderId}`).emit('live_tracking_update', {
            rideId: ride.id,
            lat: Number(lat),
            lng: Number(lng),
            status: ride.status,
            driver: ride.driverSnapshot,
            updatedAt: new Date().toISOString(),
          });
          io.to(`ride:${ride.id}`).emit('live_tracking_update', {
            rideId: ride.id,
            lat: Number(lat),
            lng: Number(lng),
            status: ride.status,
          });
        }
      } catch (err) {
        console.error('driver_update_location', err.message);
      }
    });

    // Alias used by older clients
    socket.on('trip_location_update', (data) => {
      const { rideId, riderId, driverId, lat, lng } = data || {};
      if (lat == null || lng == null) return;
      if (driverId) {
        try {
          platform.updateDriverLocation(driverId, lat, lng);
          if (rideId) platform.updateRideDriverLocation(rideId, driverId, lat, lng);
        } catch {
          /* ignore */
        }
      }
      if (riderId) {
        io.to(`rider:${riderId}`).emit('live_tracking_update', { rideId, lat, lng });
      }
      if (rideId) {
        io.to(`ride:${rideId}`).emit('live_tracking_update', { rideId, lat, lng });
      }
    });

    socket.on('rider_update_location', (data) => {
      const { rideId, lat, lng } = data || {};
      if (!rideId || lat == null || lng == null) return;
      const ride = platform.updateRideRiderLocation(rideId, lat, lng);
      if (ride?.driverId) {
        io.to(`driver:${ride.driverId}`).emit('rider_location_update', {
          rideId,
          lat: Number(lat),
          lng: Number(lng),
        });
      }
    });

    socket.on('send_chat_message', (data) => {
      const { receiverId, message, senderId, senderRole } = data || {};
      if (!receiverId || !message) return;
      const payload = {
        message,
        senderId,
        senderRole,
        timestamp: new Date().toISOString(),
      };
      io.to(String(receiverId)).emit('receive_chat_message', payload);
      io.to(`rider:${receiverId}`).emit('receive_chat_message', payload);
      io.to(`driver:${receiverId}`).emit('receive_chat_message', payload);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};

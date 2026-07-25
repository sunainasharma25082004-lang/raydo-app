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

    socket.on('join_driver', (payload) => {
      // payload: driverId string OR { driverId, vehicleType }
      const driverId =
        typeof payload === 'string' ? payload : payload?.driverId || payload?.id;
      const vehicleType =
        typeof payload === 'object' && payload
          ? payload.vehicleType || payload.vehicle?.type
          : null;

      if (!driverId) return;
      socket.join(`driver:${driverId}`);
      socket.join(String(driverId));

      let group = vehicleType ? driverStore.vehicleGroup(vehicleType) : null;
      if (!group) {
        const d = driverStore.findDriverById(driverId);
        if (d?.vehicle?.type) group = driverStore.vehicleGroup(d.vehicle.type);
      }
      if (group) {
        socket.join(`vehicle:${group}`);
        console.log(`Driver room: driver:${driverId} + vehicle:${group}`);
      } else {
        console.log(`Driver room: driver:${driverId}`);
      }
    });

    // Explicit vehicle room (client can re-join after login)
    socket.on('join_vehicle_group', (vehicleTypeOrGroup) => {
      const g = String(vehicleTypeOrGroup || '');
      const group = g.startsWith('two_') || g === 'auto' || g === 'car'
        ? g
        : driverStore.vehicleGroup(g);
      if (!group || group === 'other') return;
      socket.join(`vehicle:${group}`);
      console.log(`Socket ${socket.id} joined vehicle:${group}`);
    });

    socket.on('join_ride', (rideId) => {
      socket.join(`ride:${rideId}`);
      if (rideId) socket.join(`chat:${rideId}`);
    });

    socket.on('join_chat', (rideId) => {
      if (!rideId) return;
      socket.join(`chat:${rideId}`);
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
      try {
        const chatStore = require('../store/chatStore');
        const {
          rideId,
          receiverId,
          message,
          text,
          senderId,
          senderRole,
        } = data || {};
        const body = text || message;
        if (!body) return;

        // Prefer ride-scoped chat with status guard
        if (rideId) {
          const ride = platform.getRide(rideId);
          if (!ride) return;
          const open =
            ride.chatEnabled !== false && chatStore.isChatOpen(ride.status);
          if (!open) {
            socket.emit('chat_error', {
              rideId,
              message: 'Chat closed after pickup. Messaging is not allowed now.',
            });
            return;
          }
          const msg = chatStore.addMessage({
            rideId,
            senderRole: senderRole === 'driver' ? 'driver' : 'rider',
            senderId: senderId || '',
            text: body,
            rideStatus: ride.status,
          });
          io.to(`chat:${rideId}`).emit('receive_chat_message', msg);
          io.to(`ride:${rideId}`).emit('receive_chat_message', msg);
          io.to(`rider:${ride.riderId}`).emit('receive_chat_message', msg);
          if (ride.driverId) {
            io.to(`driver:${ride.driverId}`).emit('receive_chat_message', msg);
          }
          return;
        }

        // Legacy peer-to-peer fallback
        if (!receiverId) return;
        const payload = {
          id: `${Date.now()}`,
          text: body,
          message: body,
          senderId,
          senderRole,
          createdAt: new Date().toISOString(),
        };
        io.to(String(receiverId)).emit('receive_chat_message', payload);
        io.to(`rider:${receiverId}`).emit('receive_chat_message', payload);
        io.to(`driver:${receiverId}`).emit('receive_chat_message', payload);
      } catch (err) {
        socket.emit('chat_error', { message: err.message || 'Chat failed' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};

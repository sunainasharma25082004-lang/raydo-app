const Ride = require('../models/Ride');
const Driver = require('../models/Driver');

// Request a new ride
exports.requestRide = async (req, res) => {
  try {
    const { pickupLocation, dropoffLocation, vehicleType, distance, fare } = req.body;
    const riderId = req.user.id; // From JWT middleware

    const ride = await Ride.create({
      riderId,
      pickupLocation,
      dropoffLocation,
      vehicleType,
      distance,
      fare,
      otp: Math.floor(1000 + Math.random() * 9000).toString(),
      status: 'Requested'
    });

    // In a real app, you would use GeoQueries to find nearby drivers 
    // and emit a socket event to them. We will handle that in the socket logic.

    res.status(201).json({ message: 'Ride requested successfully', ride });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error requesting ride' });
  }
};

// Driver accepts a ride
exports.acceptRide = async (req, res) => {
  try {
    const { rideId } = req.params;
    const driverId = req.user.id;

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    if (ride.status !== 'Requested') return res.status(400).json({ message: 'Ride is no longer available' });

    ride.driverId = driverId;
    ride.status = 'Accepted';
    await ride.save();

    // Emit socket event to the rider that driver accepted
    req.app.get('io').to(ride.riderId.toString()).emit('ride_accepted', { ride });

    res.status(200).json({ message: 'Ride accepted', ride });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error accepting ride' });
  }
};

// Update ride status (Arrived, In_Progress, Completed)
exports.updateRideStatus = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { status, otp } = req.body;
    const driverId = req.user.id;

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    if (ride.driverId.toString() !== driverId) return res.status(403).json({ message: 'Unauthorized' });

    if (status === 'In_Progress') {
      if (ride.otp !== otp) {
        return res.status(400).json({ message: 'Invalid OTP' });
      }
    }

    if (status === 'Completed') {
      ride.completedAt = new Date();
    }

    ride.status = status;
    await ride.save();

    // Notify Rider
    req.app.get('io').to(ride.riderId.toString()).emit('ride_status_updated', { status, ride });

    res.status(200).json({ message: `Ride status updated to ${status}`, ride });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating ride status' });
  }
};

// Get current ride for user/driver
exports.getCurrentRide = async (req, res) => {
  try {
    const { id, role } = req.user;
    
    let query = { status: { $in: ['Requested', 'Accepted', 'Arrived', 'In_Progress'] } };
    if (role === 'rider') query.riderId = id;
    if (role === 'driver') query.driverId = id;

    const ride = await Ride.findOne(query).populate('driverId').populate('riderId');
    if (!ride) return res.status(404).json({ message: 'No active ride found' });

    res.status(200).json({ ride });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching current ride' });
  }
};

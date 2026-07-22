const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  riderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
  },
  pickupLocation: {
    address: String,
    lat: Number,
    lng: Number
  },
  dropoffLocation: {
    address: String,
    lat: Number,
    lng: Number
  },
  status: {
    type: String,
    enum: ['Requested', 'Accepted', 'Arrived', 'In_Progress', 'Completed', 'Cancelled'],
    default: 'Requested'
  },
  vehicleType: {
    type: String,
    enum: ['Bike', 'Scooty', 'Auto', 'Car', 'E-Rickshaw'],
    required: true
  },
  distance: Number, // in km
  fare: Number, // in INR
  otp: String, // to start the ride
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed'],
    default: 'Pending'
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'UPI', 'Card', 'Wallet']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date
});

module.exports = mongoose.model('Ride', rideSchema);

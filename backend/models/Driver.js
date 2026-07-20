const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    default: '',
  },
  email: {
    type: String,
    default: '',
  },
  vehicle: {
    type: { type: String, enum: ['Bike', 'Auto', 'E-Rickshaw'], default: 'Auto' },
    registrationNumber: String,
    model: String,
  },
  documents: {
    license: { url: String, status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' } },
    rc: { url: String, status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' } },
    aadhaar: { url: String, status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' } },
  },
  isOnline: {
    type: Boolean,
    default: false,
  },
  currentLocation: {
    type: { type: String, default: 'Point' },
    coordinates: [Number] // [longitude, latitude]
  },
  rating: {
    type: Number,
    default: 5.0,
  },
  totalRides: {
    type: Number,
    default: 0,
  },
  walletBalance: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Index for geospatial queries
driverSchema.index({ currentLocation: '2dsphere' });

module.exports = mongoose.model('Driver', driverSchema);

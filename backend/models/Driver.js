const mongoose = require('mongoose');

const docStatus = {
  type: String,
  enum: ['Pending', 'Approved', 'Rejected'],
  default: 'Pending',
};

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
  city: {
    type: String,
    default: 'Bengaluru',
  },
  // Issued only after admin approves KYC
  loginId: {
    type: String,
    unique: true,
    sparse: true,
  },
  passwordHash: {
    type: String,
    default: null,
  },
  kycStatus: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected'],
    default: 'draft',
  },
  kycRejectionReason: {
    type: String,
    default: '',
  },
  vehicle: {
    type: {
      type: String,
      enum: ['Bike', 'Scooty', 'Auto', 'Car'],
      default: 'Auto',
    },
    registrationNumber: String,
    model: String,
    color: String,
    year: String,
  },
  documents: {
    licenseNumber: String,
    license: { url: String, status: docStatus },
    rc: { url: String, status: docStatus },
    aadhaar: { url: String, status: docStatus },
    insurance: { url: String, status: docStatus },
  },
  isOnline: {
    type: Boolean,
    default: false,
  },
  currentLocation: {
    type: { type: String, default: 'Point' },
    coordinates: [Number], // [longitude, latitude]
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
  approvedAt: Date,
  approvedBy: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for geospatial queries
driverSchema.index({ currentLocation: '2dsphere' });
driverSchema.index({ 'vehicle.type': 1, isOnline: 1, kycStatus: 1 });

module.exports = mongoose.model('Driver', driverSchema);

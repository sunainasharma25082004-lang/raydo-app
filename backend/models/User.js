const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
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
  rating: {
    type: Number,
    default: 5.0,
  },
  savedAddresses: [{
    label: String,
    address: String,
    lat: Number,
    lng: Number
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('User', userSchema);

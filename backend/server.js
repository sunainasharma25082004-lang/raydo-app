const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});
app.set('io', io);

// Middleware — large JSON limit for KYC document photos (base64)
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(morgan('dev'));

// Serve KYC document images saved under data/uploads
const path = require('path');
app.use(
  '/api/kyc/docs',
  express.static(path.join(__dirname, 'data', 'uploads'), {
    maxAge: '1d',
    fallthrough: true,
  }),
);

// Optional MongoDB — most Raydo flows use local JSON stores (data/*.json).
// Atlas IP whitelist / network issues must NOT kill the API.
if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
    })
    .then(() => console.log('MongoDB Connected Successfully'))
    .catch((err) => {
      console.warn(
        '[MongoDB] Optional connection failed — continuing with local JSON data store.',
      );
      console.warn(
        `[MongoDB] ${err.message?.split('\n')[0] || err}`,
      );
      console.warn(
        '[MongoDB] Tip: whitelist your IP in Atlas, or leave Mongo unused for local demo.',
      );
    });
} else {
  console.log('[MongoDB] MONGO_URI not set — using local JSON data only.');
}

// Socket.io integration
require('./socket')(io);

// Ensure local data files exist (KYC, rides, withdrawals)
require('./store/driverStore').ensureFiles();
require('./store/platformStore').ensure();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rides', require('./routes/rides'));
app.use('/api/users', require('./routes/users'));
app.use('/api/drivers', require('./routes/drivers'));
app.use('/api/kyc', require('./routes/kyc'));
app.use('/api/match', require('./routes/match'));
app.use('/api/platform', require('./routes/platform'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/map', require('./routes/map'));

// Basic route for testing
app.get('/', (req, res) => {
  res.json({
    ok: true,
    message: 'Raydo API is running',
    store: 'json',
    features: [
      'KYC + admin credentials',
      'Rider list / search / block',
      'Live GPS location',
      'Live trip tracking',
      'Vehicle-type matching',
      'Weekly withdrawals (admin permission)',
    ],
  });
});

// Helpful 404 for unknown API paths
app.use('/api', (req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    hint: 'Restart backend after pulling latest routes (e.g. GET /api/platform/admin/riders)',
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Admin riders: GET /api/platform/admin/riders');
});

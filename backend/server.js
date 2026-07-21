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

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Database Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected Successfully'))
.catch((err) => console.error('MongoDB Connection Error:', err));

// Socket.io integration
require('./socket')(io);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rides', require('./routes/rides'));
app.use('/api/users', require('./routes/users'));
app.use('/api/drivers', require('./routes/drivers'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/map', require('./routes/map'));

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Raydo API is running');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

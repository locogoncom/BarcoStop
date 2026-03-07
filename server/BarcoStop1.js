require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysqlDb = require('./database/db');
const sqliteDb = require('./database/sqlite-db');

const app = express();
const PORT = process.env.PORT || 5000;

// middlewares
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`\n📥 ${req.method} ${req.path}`);
  if (Object.keys(req.query).length > 0) {
    console.log('   Query:', JSON.stringify(req.query));
  }
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('   Body:', JSON.stringify(req.body));
  }
  
  const originalSend = res.send;
  res.send = function(data) {
    if (res.statusCode >= 400) {
      console.error(`❌ ${req.method} ${req.path} → ${res.statusCode}`);
      console.error('   Response:', typeof data === 'string' ? data : JSON.stringify(data));
    } else {
      console.log(`✅ ${req.method} ${req.path} → ${res.statusCode}`);
    }
    originalSend.call(this, data);
  };
  next();
});

// simple root
app.get('/', (req, res) => {
  res.send({ status: 'ok', message: 'BarcoStop API running' });
});

// route imports
const userRoutes = require('./routes/users');
const tripRoutes = require('./routes/trips');
const boatRoutes = require('./routes/boats');
const reservationRoutes = require('./routes/reservations');
const messageRoutes = require('./routes/messages');
const trackingRoutes = require('./routes/tracking');
const ratingRoutes = require('./routes/ratings');
const favoriteRoutes = require('./routes/favorites');
const donationRoutes = require('./routes/donations');
const tripCheckpointRoutes = require('./routes/trip-checkpoints');

// mount routes
app.use('/api/users', userRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/boats', boatRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/trip-checkpoints', tripCheckpointRoutes);

// Global error handler middleware (must be after all routes)
app.use((err, req, res, next) => {
  console.error('\n🔥 ERROR CAPTURADO:');
  console.error(`   Ruta: ${req.method} ${req.path}`);
  console.error(`   Mensaje: ${err.message}`);
  console.error(`   Stack:\n${err.stack}`);
  
  res.status(err.status || 500).send({
    error: err.message || 'Internal server error',
    path: req.path
  });
});

// Error handlers
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  console.error(err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// connect to selected DB and start server
const startServer = async () => {
  try {
    const dbType = (process.env.DB_TYPE || 'sqlite').toLowerCase();
    const dbModule = dbType === 'mysql' ? mysqlDb : sqliteDb;
    const connectedOk = await dbModule.testConnection();
    
    if (!connectedOk) {
      console.error(`Failed to connect to ${dbType.toUpperCase()}. Server not started.`);
      process.exit(1);
    }

    if (dbType === 'sqlite') {
      dbModule.createTables();
    }
    
    const server = app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT} using ${dbType.toUpperCase()}`);
    });

    server.on('error', (err) => {
      console.error('Server error:', err);
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

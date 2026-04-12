require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const db = require('./database');
const {startTripCleanup} = require('./jobs/tripCleanup');
const {initRealtime} = require('./realtime');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const verboseRequestLogs = /^(1|true|yes)$/i.test(String(process.env.VERBOSE_REQUEST_LOGS || 'false'));
const uploadsCacheMaxAgeMs = Number.parseInt(process.env.UPLOADS_CACHE_MAX_AGE_MS || `${7 * 24 * 60 * 60 * 1000}`, 10);
const rawCorsOrigin = String(process.env.CORS_ORIGIN || '*').trim();
const allowedCorsOrigins = rawCorsOrigin === '*' ? [] : rawCorsOrigin.split(',').map(item => item.trim()).filter(Boolean);

// middlewares
app.use(cors({
  origin: (origin, callback) => {
    if (rawCorsOrigin === '*' || !origin) {
      callback(null, true);
      return;
    }

    callback(allowedCorsOrigins.includes(origin) ? null : new Error('Origen no permitido por CORS'), allowedCorsOrigins.includes(origin));
  },
  credentials: true,
}));
app.use(express.json({limit: '1mb'}));
app.use((req, res, next) => {
  // Endurece respuestas HTTP para requisitos basicos de seguridad.
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: Number.isFinite(uploadsCacheMaxAgeMs) ? uploadsCacheMaxAgeMs : 7 * 24 * 60 * 60 * 1000,
  immutable: true,
  etag: true,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', `public, max-age=${Math.max(0, Math.floor((Number.isFinite(uploadsCacheMaxAgeMs) ? uploadsCacheMaxAgeMs : 7 * 24 * 60 * 60 * 1000) / 1000))}, immutable`);
  },
}));

// Request logging middleware
app.use((req, res, next) => {
  if (!verboseRequestLogs) {
    next();
    return;
  }

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
const keepPlayingRoutes = require('./routes/keepplaying');
const supportMessageRoutes = require('./routes/support-messages');

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
app.use('/api/keepplaying', keepPlayingRoutes);
app.use('/api/support-messages', supportMessageRoutes);

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
    const dbType = db.dbType;
    const connectedOk = await db.testConnection();
    
    if (!connectedOk) {
      console.error(`Failed to connect to ${dbType.toUpperCase()}. Server not started.`);
      process.exit(1);
    }

    if (dbType === 'sqlite' || dbType === 'mysql') {
      await db.createTables();
    }

    // Cleanup automático de viajes caducados (libera espacio).
    startTripCleanup(db, dbType, {
      hours: process.env.TRIP_CLEANUP_HOURS || 8,
      intervalMs: process.env.TRIP_CLEANUP_INTERVAL_MS || 60 * 60 * 1000,
    });
    
    initRealtime(server);

    server.listen(PORT, () => {
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

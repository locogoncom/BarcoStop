const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const {randomUUID} = require('crypto');
const Trip = require('../models/Trip');
const requireAuth = require('../middleware/requireAuth');

const tripUploadDir = path.join(__dirname, '..', 'uploads', 'trips');
fs.mkdirSync(tripUploadDir, {recursive: true});

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, tripUploadDir),
  filename: (_req, file, cb) => {
    const extByMime = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
    };
    const ext = extByMime[file.mimetype] || path.extname(file.originalname || '') || '.jpg';
    cb(null, `${Date.now()}-${randomUUID()}${ext}`);
  },
});

const uploadTripImage = multer({
  storage,
  limits: {fileSize: 7 * 1024 * 1024},
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      cb(new Error('Formato de imagen no permitido. Usa JPG, PNG o WEBP.'));
      return;
    }
    cb(null, true);
  },
});

const getActorId = (req) => {
  const fromAuth = req.auth?.userId;
  const fromHeader = req.headers['x-user-id'];
  const fromBody = req.body?.actorId;
  const fromQuery = req.query?.actorId;
  return String(fromAuth || fromHeader || fromBody || fromQuery || '').trim();
};

router.post('/upload-image', requireAuth, uploadTripImage.single('image'), async (req, res) => {
  try {
    if (!req.auth?.userId) {
      if (req.file?.path) {
        fs.unlink(req.file.path, () => {});
      }
      return res.status(401).json({error: 'No autorizado para subir imagen'});
    }

    if (!req.file) {
      return res.status(400).json({error: 'No se recibio imagen'});
    }

    return res.status(201).json({image: `/uploads/trips/${req.file.filename}`});
  } catch (err) {
    if (req.file?.path) {
      fs.unlink(req.file.path, () => {});
    }
    return res.status(400).json({error: err.message});
  }
});

// create trip
router.post('/', requireAuth, async (req, res) => {
  console.log('creating trip with body', req.body);
  try {
    const actorId = getActorId(req);
    if (actorId && req.body?.patronId && String(req.body.patronId) !== actorId) {
      return res.status(403).json({ error: 'No autorizado para crear viajes con otro patrón' });
    }

    const trip = await Trip.create(req.body);
    res.status(201).json(trip);
  } catch (err) {
    console.error('trip creation error', err);
    res.status(400).json({ error: err.message });
  }
});

// list trips
router.get('/', async (req, res) => {
  try {
    const filters = {};
    if (req.query.patronId) filters.patronId = req.query.patronId;
    if (req.query.origin) filters.origin = req.query.origin;
    if (req.query.destination) filters.destination = req.query.destination;
    if (req.query.status) filters.status = req.query.status;
    if (req.query.departureDate) filters.departureDate = req.query.departureDate;
    
    const trips = await Trip.findAll(filters);
    res.json(trips);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// get single
router.get('/:id', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.sendStatus(404);
    res.json(trip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// update trip
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const actorId = getActorId(req);
    if (!actorId) {
      return res.status(401).json({ error: 'actorId requerido para actualizar viaje' });
    }

    const existingTrip = await Trip.findById(req.params.id);
    if (!existingTrip) return res.sendStatus(404);

    if (String(existingTrip.patronId) !== actorId) {
      return res.status(403).json({ error: 'No autorizado para modificar este viaje' });
    }

    const trip = await Trip.update(req.params.id, req.body);
    res.json(trip);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// delete trip
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const actorId = getActorId(req);
    if (!actorId) {
      return res.status(401).json({ error: 'actorId requerido para eliminar viaje' });
    }

    const existingTrip = await Trip.findById(req.params.id);
    if (!existingTrip) return res.sendStatus(404);

    if (String(existingTrip.patronId) !== actorId) {
      return res.status(403).json({ error: 'No autorizado para eliminar este viaje' });
    }

    await Trip.delete(req.params.id);
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
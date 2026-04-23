const express = require('express');
const router = express.Router();
const TripCheckpoint = require('../models/TripCheckpoint');
const Trip = require('../models/Trip');
const requireAuth = require('../middleware/requireAuth');

router.post('/', requireAuth, async (req, res) => {
  try {
    const { tripId, userId, checkpointType, note } = req.body;
    if (String(req.auth?.userId || '') !== String(userId || '')) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Viaje no encontrado' });
    }
    if (String(trip.patronId || '') !== String(userId || '')) {
      return res.status(403).json({ error: 'Solo el capitan del viaje puede marcar checkpoints' });
    }


    if (!tripId || !userId || !checkpointType) {
      return res.status(400).json({ error: 'tripId, userId y checkpointType son obligatorios' });
    }

    if (!['start', 'mid', 'arrival', 'event'].includes(checkpointType)) {
      return res.status(400).json({ error: 'checkpointType inválido' });
    }

    const checkpoint = await TripCheckpoint.create({
      tripId,
      userId,
      checkpointType,
      note,
    });

    res.status(201).json(checkpoint);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', requireAuth, async (req, res) => {
  try {
    const { tripId, limit } = req.query;
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Viaje no encontrado' });
    }
    const actorId = String(req.auth?.userId || '');
    if (actorId !== String(trip.patronId || '')) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    if (!tripId) {
      return res.status(400).json({ error: 'tripId query requerido' });
    }

    const checkpoints = await TripCheckpoint.findByTripId(tripId, limit ? parseInt(limit, 10) : 100);
    res.json(checkpoints);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

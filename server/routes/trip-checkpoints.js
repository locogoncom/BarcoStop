const express = require('express');
const router = express.Router();
const TripCheckpoint = require('../models/TripCheckpoint');

router.post('/', async (req, res) => {
  try {
    const { tripId, userId, checkpointType, note } = req.body;

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

router.get('/', async (req, res) => {
  try {
    const { tripId, limit } = req.query;
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

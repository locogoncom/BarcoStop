const express = require('express');
const router = express.Router();
const TripTracking = require('../models/TripTracking');

// create tracking point
router.post('/', async (req, res) => {
  try {
    const tracking = await TripTracking.create(req.body);
    res.json(tracking);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// get tracking by trip
router.get('/', async (req, res) => {
  try {
    const { tripId, limit } = req.query;
    if (!tripId) {
      return res.status(400).json({ error: 'tripId query required' });
    }
    
    const trackings = await TripTracking.findByTrip(tripId, limit ? parseInt(limit) : 100);
    res.json(trackings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// get last position
router.get('/:tripId/last', async (req, res) => {
  try {
    const tracking = await TripTracking.getLastPosition(req.params.tripId);
    if (!tracking) return res.sendStatus(404);
    res.json(tracking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
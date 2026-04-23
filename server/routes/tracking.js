const express = require('express');
const router = express.Router();
const TripTracking = require('../models/TripTracking');
const Trip = require('../models/Trip');
const requireAuth = require('../middleware/requireAuth');

// create tracking point
router.post('/', requireAuth, async (req, res) => {
  try {
    const tripId = req.body?.tripId;
    if (!tripId) {
      return res.status(400).json({ error: 'tripId is required' });
    }
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    if (String(req.auth?.userId || '') !== String(trip.patronId || '')) {
      return res.status(403).json({ error: 'Not authorized for trip tracking' });
    }
    const tracking = await TripTracking.create(req.body);
    res.json(tracking);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// get tracking by trip
router.get('/', requireAuth, async (req, res) => {
  try {
    const { tripId, limit } = req.query;
    if (!tripId) {
      return res.status(400).json({ error: 'tripId query required' });
    }
    
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    if (String(req.auth?.userId || '') !== String(trip.patronId || '')) {
      return res.status(403).json({ error: 'Not authorized for trip tracking' });
    }
    
    const trackings = await TripTracking.findByTrip(tripId, limit ? parseInt(limit) : 100);
    res.json(trackings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// get last position
router.get('/:tripId/last', requireAuth, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    if (String(req.auth?.userId || '') !== String(trip.patronId || '')) {
      return res.status(403).json({ error: 'Not authorized for trip tracking' });
    }
    const tracking = await TripTracking.getLastPosition(req.params.tripId);
    if (!tracking) return res.sendStatus(404);
    res.json(tracking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
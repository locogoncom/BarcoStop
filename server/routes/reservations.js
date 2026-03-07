const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');
const Trip = require('../models/Trip');

// create
router.post('/', async (req, res) => {
  try {
    const {tripId, userId, seats = 1} = req.body;

    // Validar que existe el viaje
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({error: 'Viaje no encontrado'});
    }

    // Validar que hay asientos disponibles
    if (trip.availableSeats < seats) {
      return res.status(400).json({error: 'No hay asientos disponibles'});
    }

    // Verificar que no existe ya una reservación del mismo usuario para este viaje
    const exists = await Reservation.checkExists(tripId, userId);
    if (exists) {
      return res.status(400).json({error: 'Ya tienes una solicitud para este viaje'});
    }

    const reservation = await Reservation.create({
      tripId,
      userId,
      seats,
      status: 'pending'
    });
    res.status(201).json(reservation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// list for trip or user
router.get('/', async (req, res) => {
  try {
    if (req.query.tripId) {
      const reservations = await Reservation.findByTripId(req.query.tripId);
      return res.json(reservations);
    }
    if (req.query.userId) {
      const reservations = await Reservation.findByUserId(req.query.userId);
      return res.json(reservations);
    }
    res.json([]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// get single reservation
router.get('/:id', async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.sendStatus(404);
    res.json(reservation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// update reservation
router.patch('/:id', async (req, res) => {
  try {
    const {status} = req.body;
    if (!['pending', 'approved', 'rejected', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({error: 'Estado inválido'});
    }

    const statusMap = {
      approved: 'confirmed',
      rejected: 'cancelled'
    };
    const dbStatus = statusMap[status] || status;
    
    const updated = await Reservation.updateStatus(req.params.id, dbStatus);
    if (!updated) return res.sendStatus(404);
    
    const reservation = await Reservation.findById(req.params.id);
    res.json(reservation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// delete reservation
router.delete('/:id', async (req, res) => {
  try {
    await Reservation.delete(req.params.id);
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
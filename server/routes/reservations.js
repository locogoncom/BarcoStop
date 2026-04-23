const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');
const Trip = require('../models/Trip');
const requireAuth = require('../middleware/requireAuth');

// create
router.post('/', requireAuth, async (req, res) => {
  try {
    const {tripId, userId, seats = 1} = req.body;
    if (String(req.auth?.userId || '') !== String(userId || '')) {
      return res.status(403).json({error: 'No autorizado'});
    }

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
router.get('/', requireAuth, async (req, res) => {
  try {
    if (req.query.tripId) {
      const trip = await Trip.findById(req.query.tripId);
      if (!trip) return res.status(404).json({error: 'Viaje no encontrado'});
      const actorId = String(req.auth?.userId || '');
      if (actorId !== String(trip.patronId || '')) {
        return res.status(403).json({error: 'No autorizado'});
      }
      const reservations = await Reservation.findByTripId(req.query.tripId);
      return res.json(reservations);
    }
    if (req.query.userId) {
      if (String(req.auth?.userId || '') !== String(req.query.userId || '')) {
        return res.status(403).json({error: 'No autorizado'});
      }
      const reservations = await Reservation.findByUserId(req.query.userId);
      return res.json(reservations);
    }
    res.json([]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// get single reservation
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.sendStatus(404);
    const actorId = String(req.auth?.userId || '');
    const requesterId = String(reservation.userId || '');
    const trip = reservation.tripId ? await Trip.findById(reservation.tripId) : null;
    const patronId = String(trip?.patronId || '');
    if (actorId !== requesterId && actorId !== patronId) {
      return res.status(403).json({error: 'No autorizado'});
    }
    res.json(reservation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// update reservation
router.patch('/:id', requireAuth, async (req, res) => {
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
    
    const current = await Reservation.findById(req.params.id);
    if (!current) return res.sendStatus(404);

    const actorId = String(req.auth?.userId || '');
    const requesterId = String(current.userId || current.user_id || '');
    const ownerTripId = String(current.tripId || current.trip_id || '');
    const trip = ownerTripId ? await Trip.findById(ownerTripId) : null;
    const patronId = String(trip?.patronId || '');
    const isOwner = actorId === requesterId;
    const isPatron = actorId === patronId;

    if (!isOwner && !isPatron) {
      return res.status(403).json({error: 'No autorizado'});
    }
    if (isOwner && !['cancelled'].includes(dbStatus)) {
      return res.status(403).json({error: 'Solo el capitan puede aprobar/rechazar/completar'});
    }

    const updated = await Reservation.updateStatus(req.params.id, dbStatus);
    if (!updated) return res.sendStatus(404);
    
    const reservation = await Reservation.findById(req.params.id);
    res.json(reservation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// delete reservation
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const current = await Reservation.findById(req.params.id);
    if (!current) return res.sendStatus(404);
    const actorId = String(req.auth?.userId || '');
    const requesterId = String(current.userId || current.user_id || '');
    if (actorId !== requesterId) {
      return res.status(403).json({error: 'No autorizado'});
    }
    await Reservation.delete(req.params.id);
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
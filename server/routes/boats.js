const express = require('express');
const router = express.Router();
const Boat = require('../models/Boat');
const requireAuth = require('../middleware/requireAuth');

const getActorId = (req) => {
  const fromAuth = req.auth?.userId;
  const fromHeader = req.headers['x-user-id'];
  const fromBody = req.body?.actorId;
  const fromQuery = req.query?.actorId;
  return String(fromAuth || fromHeader || fromBody || fromQuery || '').trim();
};

// Create boat
router.post('/', requireAuth, async (req, res) => {
  console.log('Creating boat with body:', req.body);
  try {
    const actorId = getActorId(req);
    if (actorId && req.body?.patronId && String(req.body.patronId) !== actorId) {
      return res.status(403).json({ error: 'No autorizado para crear barcos con otro patrón' });
    }

    const boat = await Boat.create(req.body);
    res.status(201).json(boat);
  } catch (err) {
    console.error('Boat creation error:', err);
    res.status(400).json({ error: err.message });
  }
});

// List boats
router.get('/', async (req, res) => {
  try {
    const filters = {};
    if (req.query.patronId) filters.patronId = req.query.patronId;
    if (req.query.status) filters.status = req.query.status;
    if (req.query.type) filters.type = req.query.type;
    
    const boats = await Boat.findAll(filters);
    res.json(boats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single boat
router.get('/:id', async (req, res) => {
  try {
    const boat = await Boat.findById(req.params.id);
    if (!boat) return res.sendStatus(404);
    res.json(boat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update boat
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const actorId = getActorId(req);
    if (!actorId) {
      return res.status(401).json({ error: 'actorId requerido para actualizar barco' });
    }

    const existingBoat = await Boat.findById(req.params.id);
    if (!existingBoat) return res.sendStatus(404);

    if (String(existingBoat.patronId) !== actorId) {
      return res.status(403).json({ error: 'No autorizado para modificar este barco' });
    }

    const boat = await Boat.update(req.params.id, req.body);
    res.json(boat);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete boat
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const actorId = getActorId(req);
    if (!actorId) {
      return res.status(401).json({ error: 'actorId requerido para eliminar barco' });
    }

    const existingBoat = await Boat.findById(req.params.id);
    if (!existingBoat) return res.sendStatus(404);

    if (String(existingBoat.patronId) !== actorId) {
      return res.status(403).json({ error: 'No autorizado para eliminar este barco' });
    }

    const deleted = await Boat.delete(req.params.id);
    if (!deleted) return res.sendStatus(404);
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

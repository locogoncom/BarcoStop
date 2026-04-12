const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const SupportMessage = require('../models/SupportMessage');

router.get('/user/:userId', requireAuth, async (req, res) => {
  try {
    if (String(req.auth?.userId || '') !== String(req.params.userId || '')) {
      return res.status(403).json({error: 'No autorizado'});
    }

    const messages = await SupportMessage.findByUserId(req.params.userId);
    return res.json(messages);
  } catch (err) {
    return res.status(500).json({error: err.message});
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = String(req.body?.userId || '').trim();
    const message = String(req.body?.message || '').trim();

    if (!userId || String(req.auth?.userId || '') !== userId) {
      return res.status(403).json({error: 'No autorizado'});
    }

    if (!message) {
      return res.status(400).json({error: 'Escribe un mensaje antes de enviarlo'});
    }

    if (message.length > 1500) {
      return res.status(400).json({error: 'El mensaje es demasiado largo. Maximo 1500 caracteres.'});
    }

    const created = await SupportMessage.create({userId, message});
    return res.status(201).json(created);
  } catch (err) {
    return res.status(400).json({error: err.message});
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const deleted = await SupportMessage.deleteByUser(req.params.id, String(req.auth?.userId || ''));
    if (!deleted) {
      return res.status(404).json({error: 'Mensaje no encontrado'});
    }
    return res.sendStatus(204);
  } catch (err) {
    return res.status(500).json({error: err.message});
  }
});

module.exports = router;
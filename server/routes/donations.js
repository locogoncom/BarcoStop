const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');
const requireAuth = require('../middleware/requireAuth');

// Crear donación
router.post('/', requireAuth, async (req, res) => {
  try {
    const { userId, amount, paypalTransactionId } = req.body;
    if (String(req.auth?.userId || '') !== String(userId)) {
      return res.status(403).json({ error: 'No autorizado' });
    }


    if (!userId || !amount || amount < 2.50) {
      return res.status(400).json({ error: 'Monto mínimo €2.50 requerido' });
    }

    const donation = await Donation.create({
      userId,
      amount: parseFloat(amount),
      paypalTransactionId,
      status: 'completed'
    });

    res.status(201).json(donation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Obtener donaciones del usuario
router.get('/user/:userId', requireAuth, async (req, res) => {
  try {
    if (String(req.auth?.userId || '') !== String(req.params.userId || '')) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    const donations = await Donation.findByUserId(req.params.userId);
    const total = await Donation.getTotalByUser(req.params.userId);
    
    res.json({
      donations,
      total: parseFloat(total),
      count: donations.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener total donado por usuario
router.get('/total/:userId', requireAuth, async (req, res) => {
  try {
    if (String(req.auth?.userId || '') !== String(req.params.userId || '')) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    const total = await Donation.getTotalByUser(req.params.userId);
    res.json({ total: parseFloat(total) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

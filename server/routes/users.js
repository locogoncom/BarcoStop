const express = require('express');
const router = express.Router();
const User = require('../models/User');
const {createToken} = require('../utils/token');

// register new user
router.post('/', async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    console.error('User creation error:', err);
    res.status(400).json({ error: err.message });
  }
});

// list users
router.get('/', async (req, res) => {
  try {
    const filters = {};
    if (req.query.role) filters.role = req.query.role;
    const users = await User.findAll(filters);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// login user
router.post('/login', async (req, res) => {
  try {
    const { email, role } = req.body || {};

    if (!email) {
      return res.status(400).json({ error: 'Email es requerido' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (role && user.role !== role) {
      return res.status(400).json({ error: 'Rol no coincide con el usuario' });
    }

    return res.json({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      token: createToken({
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }),
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// get single user
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.sendStatus(404);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// update user
router.patch('/:id', async (req, res) => {
  try {
    const user = await User.update(req.params.id, req.body);
    if (!user) return res.sendStatus(404);
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// delete user
router.delete('/:id', async (req, res) => {
  try {
    await User.delete(req.params.id);
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// add rating to user
router.post('/:id/ratings', async (req, res) => {
  try {
    const user = await User.addRating(req.params.id, req.body);
    if (!user) return res.sendStatus(404);
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
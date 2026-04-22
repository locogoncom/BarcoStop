const express = require('express');
const router = express.Router();
const Favorite = require('../models/Favorite');
const requireAuth = require('../middleware/requireAuth');

// Obtener favoritos de un usuario
router.get('/:userId', requireAuth, async (req, res) => {
  try {
    const {userId} = req.params;
    if (String(req.auth?.userId || '') !== String(userId)) {
      return res.status(403).json({error: 'No autorizado'});
    }

    if (!userId) {
      return res.status(400).json({error: 'userId is required'});
    }

    const favorites = await Favorite.findByUserId(userId);
    res.json(favorites);
  } catch (err) {
    console.error('Error fetching favorites:', err);
    res.status(500).json({error: 'Failed to fetch favorites'});
  }
});

// Agregar a favoritos
router.post('/', requireAuth, async (req, res) => {
  try {
    const {userId, favoriteUserId} = req.body;
    if (String(req.auth?.userId || '') !== String(userId)) {
      return res.status(403).json({error: 'No autorizado'});
    }


    if (!userId || !favoriteUserId) {
      return res.status(400).json({error: 'userId and favoriteUserId are required'});
    }

    if (userId === favoriteUserId) {
      return res.status(400).json({error: 'Cannot add yourself to favorites'});
    }

    // Verificar si ya existe
    const exists = await Favorite.exists(userId, favoriteUserId);
    if (exists) {
      return res.status(400).json({error: 'User already in favorites'});
    }

    const id = await Favorite.add(userId, favoriteUserId);
    res.status(201).json({id, message: 'Added to favorites'});
  } catch (err) {
    console.error('Error adding favorite:', err);
    res.status(500).json({error: 'Failed to add favorite'});
  }
});

// Eliminar de favoritos
router.delete('/:userId/:favoriteUserId', requireAuth, async (req, res) => {
  try {
    const {userId, favoriteUserId} = req.params;
    if (String(req.auth?.userId || '') !== String(userId)) {
      return res.status(403).json({error: 'No autorizado'});
    }


    if (!userId || !favoriteUserId) {
      return res.status(400).json({error: 'userId and favoriteUserId are required'});
    }

    const removed = await Favorite.remove(userId, favoriteUserId);
    if (!removed) {
      return res.status(404).json({error: 'Favorite not found'});
    }

    res.json({message: 'Removed from favorites'});
  } catch (err) {
    console.error('Error removing favorite:', err);
    res.status(500).json({error: 'Failed to remove favorite'});
  }
});

// Verificar si es favorito
router.get('/:userId/:favoriteUserId/check', requireAuth, async (req, res) => {
  try {
    const {userId, favoriteUserId} = req.params;
    if (String(req.auth?.userId || '') !== String(userId)) {
      return res.status(403).json({error: 'No autorizado'});
    }


    if (!userId || !favoriteUserId) {
      return res.status(400).json({error: 'userId and favoriteUserId are required'});
    }

    const isFavorite = await Favorite.exists(userId, favoriteUserId);
    res.json({isFavorite});
  } catch (err) {
    console.error('Error checking favorite:', err);
    res.status(500).json({error: 'Failed to check favorite status'});
  }
});

module.exports = router;

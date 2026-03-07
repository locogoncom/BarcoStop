const express = require('express');
const router = express.Router();
const Rating = require('../models/Rating');
const User = require('../models/User');

// Create rating
router.post('/', async (req, res) => {
  console.log('Creating rating with body:', req.body);
  try {
    // Validate input
    if (!req.body.userId || !req.body.ratedBy || !req.body.rating) {
      return res.status(400).json({ 
        error: 'userId, ratedBy, and rating are required' 
      });
    }

    if (req.body.rating < 1 || req.body.rating > 5) {
      return res.status(400).json({ 
        error: 'rating must be between 1 and 5' 
      });
    }

    // Check if rating already exists
    const exists = await Rating.existsRating(req.body.userId, req.body.ratedBy);
    if (exists) {
      return res.status(400).json({ 
        error: 'Rating already exists between these users' 
      });
    }

    const rating = await Rating.create(req.body);
    
    // Update average rating for the rated user
    const avgRating = await Rating.getAverageRating(req.body.userId);
    await User.updateAverageRating(req.body.userId, avgRating.averageRating);

    res.status(201).json(rating);
  } catch (err) {
    console.error('Rating creation error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Get ratings by user
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const ratings = await Rating.findByUserId(userId);
    const avgRatingData = await Rating.getAverageRating(userId);
    
    res.json({
      ratings: Array.isArray(ratings) ? ratings : [],
      averageRating: avgRatingData?.averageRating || 0,
      reviewCount: avgRatingData?.reviewCount || 0
    });
  } catch (err) {
    console.error('Error fetching ratings:', err);
    // Devolver array vacío en caso de error en lugar de error 500
    res.json({
      ratings: [],
      averageRating: 0,
      reviewCount: 0
    });
  }
});

// Get ratings given by user
router.get('/from/:userId', async (req, res) => {
  try {
    const ratings = await Rating.findByRatedBy(req.params.userId);
    res.json(Array.isArray(ratings) ? ratings : []);
  } catch (err) {
    console.error('Error fetching ratings from user:', err);
    res.json([]);
  }
});

// Get single rating
router.get('/:id', async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({ error: 'Rating ID is required' });
    }
    const rating = await Rating.findById(req.params.id);
    if (!rating) return res.status(404).json({ error: 'Rating not found' });
    res.json(rating);
  } catch (err) {
    console.error('Error fetching rating:', err);
    res.status(500).json({ error: 'Failed to fetch rating' });
  }
});

// Delete rating
router.delete('/:id', async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({ error: 'Rating ID is required' });
    }
    const deleted = await Rating.delete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Rating not found' });
    res.sendStatus(204);
  } catch (err) {
    console.error('Error deleting rating:', err);
    res.status(500).json({ error: 'Failed to delete rating' });
  }
});

module.exports = router;

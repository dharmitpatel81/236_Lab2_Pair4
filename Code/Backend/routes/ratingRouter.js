const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const { authenticateCustomer } = require('../middleware/auth');

// Public routes
router.get('/restaurant/:restaurantId', ratingController.getRestaurantRatings);

// Recompute ratings
router.post('/recompute/:restaurantId', authenticateCustomer, ratingController.recompute);

// Customer routes
router.post('/restaurant/:restaurantId', authenticateCustomer, ratingController.createRating);
router.put('/:ratingId', authenticateCustomer, ratingController.updateRating);
router.delete('/:ratingId', authenticateCustomer, ratingController.deleteRating);

module.exports = router;

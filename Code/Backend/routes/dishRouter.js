const express = require('express');
const router = express.Router();
const dishController = require('../controllers/dishController');
const { authenticateRestaurant } = require('../middleware/auth');

// Protected routes - only for authenticated restaurants
router.post('/', authenticateRestaurant, dishController.createDish);
router.put('/:dishId', authenticateRestaurant, dishController.updateDish);
router.delete('/:dishId', authenticateRestaurant, dishController.deleteDish);
router.patch('/:dishId/availability', authenticateRestaurant, dishController.toggleAvailability);


// Public routes - accessible to everyone
router.get('/:dishId', dishController.getDishById);

module.exports = router;

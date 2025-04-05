const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController');
const { authenticateRestaurant } = require('../middleware/auth');

// Public routes
router.post('/register', restaurantController.register);
router.post('/login', restaurantController.login);
router.get('/check-auth', restaurantController.checkAuth);
router.get('/', restaurantController.getAllRestaurants);


// Protected routes
router.post('/logout', authenticateRestaurant, restaurantController.logout);
router.get('/profile', authenticateRestaurant, restaurantController.getRestaurantProfile);
router.put('/profile', authenticateRestaurant, restaurantController.updateRestaurantProfile);
router.put('/operating-hours', authenticateRestaurant, restaurantController.updateOperatingHours);
router.put('/status', authenticateRestaurant, restaurantController.toggleStatus);
router.put('/delivery', authenticateRestaurant, restaurantController.toggleDelivery);
router.put('/pickup', authenticateRestaurant, restaurantController.togglePickup);
router.delete('/account', authenticateRestaurant, restaurantController.deleteRestaurant);


// Order management
router.get('/orders', authenticateRestaurant, restaurantController.getRestaurantOrders);
router.get('/orders/:orderId', authenticateRestaurant, restaurantController.getRestaurantOrderDetails);
router.put('/orders/:orderId/status', authenticateRestaurant, restaurantController.updateOrderStatus);

// Public Get restaurant by ID
router.get('/:id', restaurantController.getRestaurantById);


module.exports = router;

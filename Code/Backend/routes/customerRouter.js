const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const favoriteController = require('../controllers/favoriteController');
const { authenticateCustomer } = require('../middleware/auth');

// Public routes
router.post('/register', customerController.register);
router.post('/login', customerController.login);
router.get('/check-auth', customerController.checkAuth);

// Protected routes
router.get('/profile', authenticateCustomer, customerController.getProfile);
router.put('/profile', authenticateCustomer, customerController.updateProfile);
router.post('/logout', authenticateCustomer, customerController.logout);

// Favorite routes
router.post('/favorites/add', authenticateCustomer, favoriteController.addFavorite);
router.post('/favorites/remove', authenticateCustomer, favoriteController.removeFavorite);
router.get('/favorites', authenticateCustomer, favoriteController.getFavorites);

// Address management
router.post('/address', authenticateCustomer, customerController.addAddress);
router.put('/address/:addressId', authenticateCustomer, customerController.updateAddress);
router.delete('/address/:addressId', authenticateCustomer, customerController.deleteAddress);

// Account deletion
router.delete('/account', authenticateCustomer, customerController.deleteAccount);

// Order management
router.post('/orders/create/:restaurantId', authenticateCustomer, customerController.createOrder);
router.get('/orders', authenticateCustomer, customerController.getCustomerOrders);
router.get('/orders/:orderId', authenticateCustomer, customerController.getOrderDetails);
router.put('/orders/:orderId/cancel', authenticateCustomer, customerController.cancelOrder);

module.exports = router;

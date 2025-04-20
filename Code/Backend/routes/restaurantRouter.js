const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController');
const { authenticateRestaurant } = require('../middleware/auth');
const { uploadImage } = require('../utils/imageUpload');

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

// Image upload route
router.post('/upload-image', async (req, res) => {
  try {
    if (!req.files || !req.files.image) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }

    // Check if multiple files were uploaded
    if (Array.isArray(req.files.image)) {
      return res.status(400).json({ message: 'Multiple file upload is not allowed. Please upload a single image.' });
    }

    const file = req.files.image;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ 
        message: 'Invalid file type. Only JPG, JPEG, and PNG images are allowed' 
      });
    }

    const imageUrl = await uploadImage(file, 'restaurants');
    res.json({ imageUrl });
  } catch (error) {
    console.error('Error uploading restaurant image:', error);
    res.status(500).json({ message: 'Error uploading image' });
  }
});

// Order management
router.get('/orders', authenticateRestaurant, restaurantController.getRestaurantOrders);
router.get('/orders/:orderId', authenticateRestaurant, restaurantController.getRestaurantOrderDetails);
router.put('/orders/:orderId/status', authenticateRestaurant, restaurantController.updateOrderStatus);

// Public Get restaurant by ID
router.get('/:id', restaurantController.getRestaurantById);

module.exports = router;

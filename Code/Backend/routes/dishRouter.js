const express = require('express');
const router = express.Router();
const dishController = require('../controllers/dishController');
const { authenticateRestaurant } = require('../middleware/auth');
const { uploadImage } = require('../utils/imageUpload');

// Protected routes - only for authenticated restaurants
router.post('/', authenticateRestaurant, dishController.createDish);
router.put('/:id', authenticateRestaurant, dishController.updateDish);
router.delete('/:id', authenticateRestaurant, dishController.deleteDish);
router.patch('/:id/availability', authenticateRestaurant, dishController.toggleAvailability);

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

    const imageUrl = await uploadImage(file, 'dishes');
    res.json({ imageUrl });
  } catch (error) {
    console.error('Error uploading dish image:', error);
    res.status(500).json({ message: 'Error uploading image' });
  }
});

// Public routes - accessible to everyone
router.get('/:dishId', dishController.getDishById);

module.exports = router;

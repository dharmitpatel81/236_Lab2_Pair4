const Dish = require('../models/dish');
const Restaurant = require('../models/restaurant');

// Create a new dish
exports.createDish = async (req, res) => {
  try {
    const { name, description, sizes, category, ingredients, imageUrl, isAvailable } = req.body;
    const restaurantId = req.session.userId;

    // Validate required fields
    if (!name || !sizes || !Array.isArray(sizes) || sizes.length === 0 || !category) {
      return res.status(400).json({ message: 'Name, at least one size with price, and category are required' });
    }
    
    // Validate each size in the sizes array
    for (const sizeObj of sizes) {
      if (!sizeObj.size || !sizeObj.price) {
        return res.status(400).json({ message: 'Each size must have both size name and price' });
      }
    }
    
    // Check for duplicate dish name for this restaurant
    const existingDish = await Dish.findOne({ 
      restaurantId, 
      name: { $regex: new RegExp('^' + name + '$', 'i') } // Case-insensitive match
    });
    
    if (existingDish) {
      return res.status(400).json({ 
        message: 'A dish with this name already exists for your restaurant' 
      });
    }

    // Create new dish
    const dish = new Dish({
      restaurantId,
      name,
      description: description || null,
      sizes,
      category,
      ingredients: ingredients || [],
      imageUrl: imageUrl || null,
      isAvailable: isAvailable !== undefined ? isAvailable : true
    });

    await dish.save();

    res.status(201).json({
      message: 'Dish created successfully',
      dish
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating dish', error: error.message });
  }
};

// // Get all dishes for a restaurant
// exports.getRestaurantDishes = async (req, res) => {
//   try {
//     const restaurantId = req.params.restaurantId;
    
//     const dishes = await Dish.find({ restaurantId })
//       .sort({ category: 1, name: 1 });
    
//     res.json(dishes);
//   } catch (error) {
//     res.status(500).json({ message: 'Error fetching dishes', error: error.message });
//   }
// };

// Get a specific dish by ID
exports.getDishById = async (req, res) => {
  try {
    const dishId = req.params.dishId;
    
    const dish = await Dish.findById(dishId);
    
    if (!dish) {
      return res.status(404).json({ message: 'Dish not found' });
    }
    
    res.json(dish);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dish', error: error.message });
  }
};

// Update a dish
exports.updateDish = async (req, res) => {
  try {
    const dishId = req.params.dishId;
    const restaurantId = req.session.userId;
    const updates = req.body;
    
    // Find the dish
    const dish = await Dish.findById(dishId);
    
    if (!dish) {
      return res.status(404).json({ message: 'Dish not found' });
    }
    
    // Check if the dish belongs to the restaurant
    if (dish.restaurantId.toString() !== restaurantId) {
      return res.status(403).json({ message: 'Not authorized to update this dish' });
    }
    
    // Update the dish
    Object.keys(updates).forEach(key => {
      if (key !== 'restaurantId') { // Prevent changing restaurantId
        dish[key] = updates[key];
      }
    });
    
    await dish.save();
    
    // Check if this update made the dish unavailable
    if (updates.isAvailable === false) {
      // Check if all dishes for this restaurant are now unavailable
      const availableDishes = await Dish.countDocuments({ 
        restaurantId, 
        isAvailable: true 
      });
      
      // If no available dishes remain, set restaurant status to inactive
      if (availableDishes === 0) {
        const restaurant = await Restaurant.findById(restaurantId);
        if (restaurant && restaurant.status === 'active') {
          restaurant.status = 'inactive';
          await restaurant.save();
        }
      }
    }
    
    res.json({
      message: 'Dish updated successfully',
      dish
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating dish', error: error.message });
  }
};

// Delete a dish
exports.deleteDish = async (req, res) => {
  try {
    const dishId = req.params.dishId;
    const restaurantId = req.session.userId;
    
    // Find the dish
    const dish = await Dish.findById(dishId);
    
    if (!dish) {
      return res.status(404).json({ message: 'Dish not found' });
    }
    
    // Check if the dish belongs to the restaurant
    if (dish.restaurantId.toString() !== restaurantId) {
      return res.status(403).json({ message: 'Not authorized to delete this dish' });
    }
    
    await Dish.findByIdAndDelete(dishId);
    
    // Check if restaurant has any dishes left
    const dishCount = await Dish.countDocuments({ restaurantId });
    
    // If no dishes left, set restaurant status to inactive
    if (dishCount === 0) {
      const restaurant = await Restaurant.findById(restaurantId);
      if (restaurant) {
        restaurant.status = 'inactive';
        await restaurant.save();
      }
    }
    
    res.json({ message: 'Dish deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting dish', error: error.message });
  }
};

// Toggle dish availability
exports.toggleAvailability = async (req, res) => {
  try {
    const dishId = req.params.dishId;
    const restaurantId = req.session.userId;
    
    // Find the dish
    const dish = await Dish.findById(dishId);
    
    if (!dish) {
      return res.status(404).json({ message: 'Dish not found' });
    }
    
    // Check if the dish belongs to the restaurant
    if (dish.restaurantId.toString() !== restaurantId) {
      return res.status(403).json({ message: 'Not authorized to update this dish' });
    }
    
    // Toggle availability
    dish.isAvailable = !dish.isAvailable;
    
    await dish.save();
    
    // Check if restaurant has any dishes left
    const dishCount = await Dish.countDocuments({ restaurantId });
    
    // If no dishes left, set restaurant status to inactive
    if (dishCount === 0) {
      const restaurant = await Restaurant.findById(restaurantId);
      if (restaurant) {
        restaurant.status = 'inactive';
        await restaurant.save();
      }
    }

    res.json({
      message: `Dish ${dish.isAvailable ? 'available' : 'unavailable'} for ordering`,
      dish
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating dish availability', error: error.message });
  }
};

const mongoose = require('mongoose');

const dishSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  sizes: [
    {
      size: {
        type: String,
        required: true
      },
      price: {
        type: Number,
        required: true
      }
    }
  ],
  category: {
    type: String,
    required: true,
    enum: ['appetizer', 'salad', 'main_course', 'dessert', 'beverage', 'side']
  },
  ingredients: {
    type: [String],
    default: []
  },
  imageUrl: {
    type: String,
    default: null
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Dish = mongoose.model('Dish', dishSchema);
module.exports = Dish;
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Import Routes
const restaurantRoutes = require('./routes/restaurantRouter');
const customerRoutes = require('./routes/customerRouter');
const ratingRoutes = require('./routes/ratingRouter');
const dishRoutes = require('./routes/dishRouter');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 24 * 60 * 60, // Session Time-To-Live in seconds (24 hours)
    autoRemove: 'native' // Use MongoDB's TTL index
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24hrs in milliseconds
  }
}));

app.use('/uploads', express.static('public/uploads'));



// Routes
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/dishes', dishRoutes);
app.use('/api/ratings', ratingRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

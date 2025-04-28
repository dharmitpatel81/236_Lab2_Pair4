const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
const fileUpload = require('express-fileupload');
const cloudinary = require('./config/cloudinary');
const customerRouter = require('./routes/customerRouter');
const restaurantRouter = require('./routes/restaurantRouter');
const dishRouter = require('./routes/dishRouter');
const ratingRouter = require('./routes/ratingRouter');
const addressRouter = require('./routes/addressRouter');


const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/',
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
}));

// Allow any frontend during Minikube testing
app.use(cors({
    origin: function (origin, callback) {
        callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma']
}));

// Passport JWT authentication setup
const { configurePassport } = require('./utils/passport');
configurePassport();
app.use(passport.initialize());

// Routes
app.use('/api/customers', customerRouter);
app.use('/api/restaurants', restaurantRouter);
app.use('/api/dishes', dishRouter);
app.use('/api/ratings', ratingRouter);
app.use('/api/location', addressRouter);

// Initializing services and starting our backend server
// Import and start the restaurant Kafka consumer so it runs with the backend server
const { startRestaurantOrderConsumer } = require('./restaurantOrderConsumer');

Promise.all([
    // Testing connections
    mongoose.connect(process.env.MONGODB_URI),
    cloudinary.api.ping()
])
.then(() => {
    console.log('Connected to MongoDB');
    console.log('Connected to Cloudinary');

    // Start the Kafka consumer to automatically update new orders to 'received'
    startRestaurantOrderConsumer()
      .then(() => console.log('Restaurant Kafka consumer started'))
      .catch((err) => console.error('Failed to start restaurant Kafka consumer:', err));

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server is running on port ${PORT}`);
    });
})
.catch((error) => {
    console.error('Startup error:', error.message || error);
    process.exit(1); // Exit app if MongoDB, Cloudinary, or Kafka Consumer fail to connect
});

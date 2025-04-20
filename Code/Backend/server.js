const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const fileUpload = require('express-fileupload');
const cloudinary = require('./config/cloudinary');
const customerRouter = require('./routes/customerRouter');
const restaurantRouter = require('./routes/restaurantRouter');
const dishRouter = require('./routes/dishRouter');
const ratingRouter = require('./routes/ratingRouter');
const addressRouter = require('./routes/addressRouter');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/',
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
}));
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma']
}));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        collectionName: 'sessions'
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax'
    }
}));

// Routes
app.use('/api/customers', customerRouter);
app.use('/api/restaurants', restaurantRouter);
app.use('/api/dishes', dishRouter);
app.use('/api/ratings', ratingRouter);
app.use('/api/location', addressRouter);

// Initializing services and starting our backend server
Promise.all([
    // Testing connections
    mongoose.connect(process.env.MONGODB_URI),
    cloudinary.api.ping()
])
.then(() => {
    console.log('Connected to MongoDB');
    console.log('Connected to Cloudinary');
    
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
})
.catch((error) => {
    console.error('Startup error:', error);
    process.exit(1); // Exit app if MongoDB or Cloudinary fail to connect
});

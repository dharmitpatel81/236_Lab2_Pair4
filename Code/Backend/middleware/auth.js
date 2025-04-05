// Authentication middleware
const authenticateCustomer = (req, res, next) => {
    if (!req.session.userId || req.session.role !== 'customer') {
        return res.status(401).json({
            status: 'error',
            message: 'Access denied. Not authenticated.',
            details: 'Please log in as a customer to access this resource'
        });
    }
    next();
};

const authenticateRestaurant = (req, res, next) => {
    if (!req.session.userId || req.session.role !== 'restaurant') {
        return res.status(401).json({
            status: 'error',
            message: 'Access denied. Not authenticated.',
            details: 'Please log in as a restaurant to access this resource'
        });
    }
    next();
};

module.exports = {
    authenticateCustomer,
    authenticateRestaurant
};

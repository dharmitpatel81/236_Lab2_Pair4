const Customer = require('../models/customer');
const Order = require('../models/order');
const Restaurant = require('../models/restaurant');
const Dish = require('../models/dish');

const bcrypt = require('bcryptjs');

// Tax rates by state (in percentage)
const STATE_TAX_RATES = {
  'AL': 4.0,  // Alabama
  'AK': 0.0,  // Alaska
  'AZ': 5.6,  // Arizona
  'AR': 6.5,  // Arkansas
  'CA': 7.25, // California
  'CO': 2.9,  // Colorado
  'CT': 6.35, // Connecticut
  'DE': 0.0,  // Delaware
  'FL': 6.0,  // Florida
  'GA': 4.0,  // Georgia
  'HI': 4.0,  // Hawaii
  'ID': 6.0,  // Idaho
  'IL': 6.25, // Illinois
  'IN': 7.0,  // Indiana
  'IA': 6.0,  // Iowa
  'KS': 6.5,  // Kansas
  'KY': 6.0,  // Kentucky
  'LA': 4.45, // Louisiana
  'ME': 5.5,  // Maine
  'MD': 6.0,  // Maryland
  'MA': 6.25, // Massachusetts
  'MI': 6.0,  // Michigan
  'MN': 6.875,// Minnesota
  'MS': 7.0,  // Mississippi
  'MO': 4.225,// Missouri
  'MT': 0.0,  // Montana
  'NE': 5.5,  // Nebraska
  'NV': 6.85, // Nevada
  'NH': 0.0,  // New Hampshire
  'NJ': 6.625,// New Jersey
  'NM': 5.125,// New Mexico
  'NY': 4.0,  // New York
  'NC': 4.75, // North Carolina
  'ND': 5.0,  // North Dakota
  'OH': 5.75, // Ohio
  'OK': 4.5,  // Oklahoma
  'OR': 0.0,  // Oregon
  'PA': 6.0,  // Pennsylvania
  'RI': 7.0,  // Rhode Island
  'SC': 6.0,  // South Carolina
  'SD': 4.5,  // South Dakota
  'TN': 7.0,  // Tennessee
  'TX': 6.25, // Texas
  'UT': 6.1,  // Utah
  'VT': 6.0,  // Vermont
  'VA': 5.3,  // Virginia
  'WA': 6.5,  // Washington
  'WV': 6.0,  // West Virginia
  'WI': 5.0,  // Wisconsin
  'WY': 4.0,  // Wyoming
  'DC': 6.0   // District of Columbia
};

// Default tax rate if state is not found
const DEFAULT_TAX_RATE = 5.0;

// Get tax rate for a given state
const getTaxRate = (state) => {
  if (!state) return DEFAULT_TAX_RATE;
  
  const stateCode = state.toUpperCase();
  return STATE_TAX_RATES[stateCode] || DEFAULT_TAX_RATE;
};

// Generate a unique order number
const generateOrderNumber = async () => {
  let isUnique = false;
  let orderNumber;
  
  while (!isUnique) {
    // Generate a random 7-digit number
    const randomNum = Math.floor(1000000 + Math.random() * 9000000);
    orderNumber = `O${randomNum}`;
    
    // Check if this order number already exists
    const existingOrder = await Order.findOne({ orderNumber });
    if (!existingOrder) {
      isUnique = true;
    }
  }
  
  return orderNumber;
};

// Validation functions
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone) => {
  const phoneRegex = /^\+?[1-9]\d{9,14}$/;
  return phoneRegex.test(phone);
};

const validatePassword = (password) => {
  const errors = [];
  if (!password || password.length < 6) errors.push('Password must be at least 6 characters long');
  if (!/[A-Z]/.test(password)) errors.push('Password must contain at least one uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('Password must contain at least one lowercase letter');
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('Password must contain at least one symbol (!@#$%^&*(),.?":{}|<>)');
  return errors;
};

const validateZipCode = (zipCode) => {
  const zipRegex = /^[0-9]{5,6}$/;
  return zipRegex.test(zipCode);
};

const validateName = (name) => {
  return name && name.length >= 1 && name.length <= 50 && /^[a-zA-Z\s-']+$/.test(name);
};

const validateAddress = (address) => {
  const errors = [];
  
  if (!address) {
    return ['Address object is required'];
  }

  const { street, city, state, country, zipCode } = address;

  if (!street || street.length < 5) errors.push('Street address must be at least 5 characters. Example: 123 Main Street');
  if (!city || city.length < 2) errors.push('City must be at least 2 characters and contain only letters, spaces, or hyphens');
  if (!state || state.length < 2) errors.push('State must be at least 2 characters and contain only letters, spaces, or hyphens');
  if (!country || country.length < 2) errors.push('Country must be at least 2 characters and contain only letters, spaces, or hyphens');
  if (!validateZipCode(zipCode)) errors.push('Zip code must be 5-6 digits. Example: 12345');

  return errors;
};


// Controller functions
exports.register = async (req, res) => {
  try {
    // Validate all fields
    const validationErrors = [];

    if (!validateName(req.body.firstName)) validationErrors.push('First name must be 2-50 characters and contain only letters, spaces, hyphens, or apostrophes');
    if (!validateName(req.body.lastName)) validationErrors.push('Last name must be 2-50 characters and contain only letters, spaces, hyphens, or apostrophes');
    if (!validateEmail(req.body.email)) validationErrors.push('Invalid email format. Example: user@domain.com');
    validationErrors.push(...validatePassword(req.body.password));
    if (!validatePhone(req.body.phone)) validationErrors.push('Phone number must be 10-15 digits with optional + prefix. Example: +1234567890');

    const addressErrors = validateAddress(req.body.address);
    validationErrors.push(...addressErrors);

    if (validationErrors.length > 0) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      phone, 
      dateOfBirth,
      imageUrl,
      address: {
        label,
        street,
        city,
        state,
        country,
        zipCode
      } = {}
    } = req.body;

    // Validate address fields are provided
    if (!street || !city || !state || !country || !zipCode) {
      return res.status(400).json({ message: 'All address fields are required' });
    }
    
    // Check if customer already exists
    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(400).json({ message: 'Customer already exists' });
    }

    // Create new customer - password will be hashed in pre-save hook
    const customer = new Customer({
      firstName,
      lastName,
      email,
      password,
      phone,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      imageUrl: imageUrl || null,
      addresses: [{
        label: label || 'Home',
        street,
        city,
        state,
        country,
        zipCode,
        isPrimary: true
      }],
      favorites: []
    });

    await customer.save();

    res.status(201).json({
        message: 'Customer registered successfully',
        customer: {
          id: customer._id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone,
          imageUrl: customer.imageUrl
        }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error registering customer', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);

    // Find customer
    const customer = await Customer.findOne({ email });
    if (!customer) {
      console.log('Customer not found with email:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    console.log('Customer found:', { id: customer._id, email: customer.email });

    // Check password using model method
    const isValidPassword = await customer.comparePassword(password);
    
    if (!isValidPassword) {
      console.log('Password verification failed for customer:', customer._id);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Set up session
    req.session.userId = customer._id;
    req.session.role = 'customer';

    res.json({
        message: 'Login successful',
        customer: {
          id: customer._id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone,
          imageUrl: customer.imageUrl
        }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const customerId = req.session.userId;
    console.log('Fetching profile for customer ID:', customerId);
    
    const customer = await Customer.findById(customerId).select('-password');
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    console.error('Error in getProfile:', error);
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const customerId = req.session.userId;
    const { firstName, lastName, email, phone, dateOfBirth, imageUrl } = req.body;

    // Validate email format if provided
    if (email && !validateEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate phone format if provided
    if (phone && !validatePhone(phone)) {
      return res.status(400).json({ message: 'Invalid phone number format' });
    }

    // Find customer by ID
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Check if email is already in use by another customer
    if (email && email !== customer.email) {
      const existingCustomer = await Customer.findOne({ email });
      if (existingCustomer) {
        return res.status(400).json({ message: 'Email already in use by another customer' });
      }
    }

    // Update customer fields
    if (firstName) customer.firstName = firstName;
    if (lastName) customer.lastName = lastName;
    if (email) customer.email = email;
    if (phone) customer.phone = phone;
    if (dateOfBirth) customer.dateOfBirth = new Date(dateOfBirth);
    if (imageUrl) customer.imageUrl = imageUrl;

    await customer.save();

    res.json({
      message: 'Profile updated successfully',
      customer: {
        id: customer._id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        imageUrl: customer.imageUrl
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};

exports.addAddress = async (req, res) => {
  try {
    const addressErrors = validateAddress(req.body);
    
    if (addressErrors.length > 0) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: addressErrors
      });
    }
    const { label, street, city, state, country, zipCode, isPrimary } = req.body;
    const customerId = req.session.userId;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Check if an address with this label already exists
    const existingAddress = customer.addresses.find(addr => addr.label.toLowerCase() === label.toLowerCase());
    if (existingAddress) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: [`An address with label '${label}' already exists. Please use a different label.`]
      });
    }

    // Handle primary address logic
    const isNewAddressPrimary = isPrimary === true || isPrimary === 'true';
    
    // Only modify other addresses if new address is explicitly set as primary
    if (isNewAddressPrimary) {
      customer.addresses.forEach(addr => addr.isPrimary = false);
    }

    // Add new address
    customer.addresses.push({
      label,
      street,
      city,
      state,
      country,
      zipCode,
      isPrimary: isNewAddressPrimary
    });

    await customer.save();

    res.json({
      message: 'Address added successfully',
      addresses: customer.addresses
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding address', error: error.message });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const addressErrors = validateAddress(req.body);
    
    if (addressErrors.length > 0) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: addressErrors
      });
    }
    const { addressId } = req.params;
    const { label, street, city, state, country, zipCode, isPrimary } = req.body;
    const customerId = req.session.userId;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const address = customer.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // Check if another address has the same label (excluding the current address)
    const existingAddress = customer.addresses.find(
      addr => addr._id.toString() !== addressId && 
      addr.label.toLowerCase() === label.toLowerCase()
    );
    if (existingAddress) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: [`An address with label '${label}' already exists. Please use a different label.`]
      });
    }

    // Handle primary address logic for update
    const isBeingSetAsPrimary = isPrimary === true || isPrimary === 'true';
    const isBeingSetAsNonPrimary = isPrimary === false || isPrimary === 'false';
    
    // If trying to set a primary address to non-primary, prevent it
    if (address.isPrimary && isBeingSetAsNonPrimary) {
      return res.status(400).json({
        message: 'Cannot set primary address to non-primary',
        errors: ['Please mark another address as primary first to automatically change this address to non-primary']
      });
    }
    
    // If this address is being set as primary and wasn't primary before, update others to be non-primary
    if (isBeingSetAsPrimary && !address.isPrimary) {
      customer.addresses.forEach(addr => addr.isPrimary = false);
    }

    // Update address
    address.label = label;
    address.street = street;
    address.city = city;
    address.state = state;
    address.country = country;
    address.zipCode = zipCode;
    address.isPrimary = isBeingSetAsPrimary || address.isPrimary; // Keep existing primary status if not explicitly set to true

    await customer.save();

    res.json({
      message: 'Address updated successfully',
      addresses: customer.addresses
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating address', error: error.message });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const customerId = req.session.userId;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const address = customer.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // Check if trying to delete a primary address
    if (address.isPrimary === true || address.isPrimary === 'true') {
      return res.status(400).json({
        message: 'Cannot delete primary address',
        errors: ['Please set another address as primary first before deleting this address']
      });
    }

    // Remove address using pull()
    customer.addresses.pull({ _id: addressId });
    await customer.save();

    res.json({
      message: 'Address deleted successfully. Find your current addresses below:',
      addresses: customer.addresses
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting address', error: error.message });
  }
};

// Logout customer
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Error destroying session', error: err.message });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
};

// Delete customer account
exports.deleteAccount = async (req, res) => {
  try {
    const customerId = req.session.userId;

    // Find and delete the customer
    const deletedCustomer = await Customer.findByIdAndDelete(customerId);

    if (!deletedCustomer) {
      return res.status(404).json({ message: `Customer with id ${customerId} not found` });
    }

    res.status(200).json({ message: `Customer account named ${deletedCustomer.firstName} ${deletedCustomer.lastName} deleted successfully` });
  } catch (error) {
    console.error('Error deleting customer account:', error);
    res.status(500).json({ message: 'Error deleting customer account', error: error.message });
  }
};



// Order-related functions

// Create a new order
exports.createOrder = async (req, res) => {
  try {
    const { items, isDelivery, addressId } = req.body;
    const customerId = req.session.userId;
    const restaurantId = req.params.restaurantId;

    // Validate items array
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }
    
    // Validate quantities are whole numbers and filter out items with quantity of 0
    const invalidItems = items.filter(item => item.quantity && (!Number.isInteger(item.quantity) || item.quantity < 0));
    if (invalidItems.length > 0) {
      return res.status(400).json({ 
        message: 'All item quantities must be whole numbers greater than or equal to 0',
        invalidItems: invalidItems.map(item => ({ dishId: item.dishId, quantity: item.quantity }))
      });
    }
    
    // Filter out items with quantity of 0
    const validItems = items.filter(item => item.quantity > 0);
    
    // Check if there are any valid items left after filtering
    if (validItems.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item with quantity greater than 0' });
    }

    // Validate and fetch all dishes
    const dishIds = validItems.map(item => item.dishId);
    
    // Get unique dish IDs to handle multiple orders of the same dish with different sizes
    const uniqueDishIds = [...new Set(dishIds.map(id => id.toString()))];
    
    const dishes = await Dish.find({
      _id: { $in: uniqueDishIds },
      restaurantId: restaurantId,
      isAvailable: true
    });
    
    // Check if all unique dishes were found and available
    const foundDishIds = dishes.map(dish => dish._id.toString());
    const unavailableDishIds = uniqueDishIds.filter(id => !foundDishIds.includes(id));
    
    if (unavailableDishIds.length > 0) {
      return res.status(400).json({ 
        message: 'One or more dishes are unavailable',
        unavailableDishIds
      });
    }

    // Get customer details
    const customer = await Customer.findById(customerId)
      .select('firstName lastName email phone');
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Get restaurant details
    const restaurantDetails = await Restaurant.findById(restaurantId)
      .select('name address phone email');
    if (!restaurantDetails) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    // Ensure address is properly structured
    if (!restaurantDetails.address || typeof restaurantDetails.address !== 'object') {
      return res.status(400).json({ message: 'Restaurant address information is invalid' });
    }

    // Calculate total and store dish details
    const itemsWithDetails = validItems.map(item => {
      const dish = dishes.find(d => d._id.toString() === item.dishId.toString());
      
      // Find the selected size from the sizes array
      if (!item.sizeId) {
        throw new Error(`Size ID is required for dish: ${dish.name}`);
      }
      
      const selectedSize = dish.sizes.find(s => s._id.toString() === item.sizeId.toString());
      if (!selectedSize) {
        throw new Error(`Invalid size selected for dish: ${dish.name}`);
      }
      
      return {
        dishId: dish._id,
        name: dish.name,
        size: selectedSize.size,
        price: selectedSize.price,
        quantity: item.quantity,
        totalPrice: selectedSize.price * item.quantity,
        category: dish.category,
        ingredients: dish.ingredients,
        imageUrl: dish.imageUrl
      };
    });

    // Calculate subtotal from items
    const subtotal = itemsWithDetails.reduce((sum, item) => sum + item.totalPrice, 0);
    
    // Determine which state to use for tax calculation
    let taxState;
    if (isDelivery && addressId) {
      // For delivery, use the customer's delivery address state
      const customer = await Customer.findById(customerId);
      const selectedAddress = customer.addresses.find(addr => addr._id.toString() === addressId);
      taxState = selectedAddress ? selectedAddress.state : null;
    } else {
      // For pickup, use the restaurant's state
      taxState = restaurantDetails.address.state;
    }
    
    // Calculate tax
    const taxRate = getTaxRate(taxState);
    const taxAmount = parseFloat(((subtotal * taxRate) / 100).toFixed(2));
    
    // Calculate total amount
    const totalAmount = parseFloat((subtotal + taxAmount).toFixed(2));

    // If delivery, validate the given address by customer
    let deliveryAddress;
    if (isDelivery) {
      if (!addressId) {
        return res.status(400).json({ message: 'An address is required for delivery orders' });
      }

      const customer = await Customer.findById(customerId);
      const selectedAddress = customer.addresses.find(addr => addr._id.toString() === addressId);

      if (!selectedAddress) {
        return res.status(400).json({ message: 'Invalid address selected' });
      }

      deliveryAddress = {
        label: selectedAddress.label,
        street: selectedAddress.street,
        city: selectedAddress.city,
        state: selectedAddress.state,
        country: selectedAddress.country,
        zipCode: selectedAddress.zipCode
      };
    }

    // Generate a unique order number
    const orderNumber = await generateOrderNumber();
    
    const order = new Order({
      orderNumber,
      customerId: customerId,
      customerDetails: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone
      },
      restaurantId: restaurantId,
      restaurantDetails: {
        name: restaurantDetails.name,
        address: {
          street: restaurantDetails.address.street || '',
          city: restaurantDetails.address.city || '',
          state: restaurantDetails.address.state || '',
          country: restaurantDetails.address.country || '',
          zipCode: restaurantDetails.address.zipCode || ''
        },
        phone: restaurantDetails.phone,
        email: restaurantDetails.email
      },
      items: itemsWithDetails,
      customerNote: req.body.customerNote || '',
      subtotal,
      taxRate,
      taxAmount,
      totalAmount,
      isDelivery,
      deliveryAddress,
      status: 'new'
    });

    await order.save();

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
};

// Get all orders for a customer
exports.getCustomerOrders = async (req, res) => {
  try {
    const customerId = req.session.userId;
    
    // Get customer details to display name in message
    const customer = await Customer.findById(customerId).select('firstName lastName');
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    // Get only the necessary fields for the orders list
    const orders = await Order.find({ customerId: customerId })
      .select({
        orderNumber: 1,
        'restaurantDetails.name': 1,
        items: { $slice: 3 }, // Limit to first 3 items to reduce payload size
        status: 1,
        isDelivery: 1,
        totalAmount: 1,
        createdAt: 1,
        updatedAt: 1
      })
      .populate({
        path: 'items.dishId',
        select: 'name'
      })
      .sort({ createdAt: -1 });

    // Check if customer has any orders
    if (orders.length === 0) {
      return res.json({
        message: `No orders yet for ${customer.firstName} ${customer.lastName}`,
        orders: [],
        count: 0
      });
    }

    // Transform the data to a more frontend-friendly format
    // Ensure we maintain the descending order by createdAt
    const simplifiedOrders = orders.map(order => ({
      id: order._id,
      orderNumber: order.orderNumber,
      restaurantName: order.restaurantDetails.name,
      items: order.items.map(item => ({
        name: item.name,
        quantity: item.quantity
      })),
      totalItems: order.items.length,
      status: order.status,
      deliveryType: order.isDelivery ? 'Delivery' : 'Pickup',
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }));

    res.json({
      orders: simplifiedOrders,
      count: simplifiedOrders.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

// Get order details for a customer
exports.getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const customerId = req.session.userId;

    const order = await Order.findOne({
      _id: orderId,
      customerId: customerId
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching order details', error: error.message });
  }
};

// Cancel an order
exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const customerId = req.session.userId;

    const order = await Order.findOne({
      _id: orderId,
      customerId: customerId
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order is in 'received' status
    if (order.status !== 'received') {
      return res.status(400).json({ 
        message: 'Order has been processed already and cannot be cancelled. Please contact the restaurant for support.'
      });
    }

    order.status = 'cancelled';
    await order.save();

    res.json({
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling order', error: error.message });
  }
};

// Check customer authentication status
exports.checkAuth = async (req, res) => {
  try {
    // Check if user is authenticated via session
    if (req.session.userId && req.session.role === 'customer') {
      // Find the customer to verify they exist in the database
      const customer = await Customer.findById(req.session.userId);
      
      if (customer) {
        return res.json({
          isCustomerAuthenticated: true,
          customer: {
            id: customer._id,
            firstName: customer.firstName,
            lastName: customer.lastName,
            email: customer.email,
            phone: customer.phone,
            imageUrl: customer.imageUrl
          }
        });
      }
    }
    
    // If no valid session or customer not found
    return res.json({
      isCustomerAuthenticated: false
    });
  } catch (error) {
    console.error('Error checking authentication:', error);
    return res.status(500).json({ 
      message: 'Error checking authentication status', 
      error: error.message 
    });
  }
};

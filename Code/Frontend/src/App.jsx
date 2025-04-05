import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { checkCustomerAuth, checkRestaurantAuth } from './redux/slices/auth/authSlice';
import { useDispatch, useSelector } from 'react-redux';

import LandingPage from './components/Landing/Landing';

// Customer
import CustomerSignup from './components/Auth/CustomerSignup';
import CustomerLogin from './components/Auth/CustomerLogin';
import CustomerHome from './components/Customer/CustomerHome';
import RestaurantDetail from './components/Customer/RestaurantDetail';
import CustomerEditProfile from './components/Customer/CustomerProfile';
import Cart from './components/Customer/Cart';
import CustomerOrders from './components/Customer/CustomerOrders';
import CustomerFavorites from './components/Customer/CustomerFavorites';


// Restaurant
import RestaurantSignup from './components/Auth/RestaurantSignup';
import RestaurantLogin from './components/Auth/RestaurantLogin';
import RestaurantList from './components/Owner/OwnerRestaurantList';
import RestaurantOrders from './components/Owner/RestaurantOrders';
import RestaurantEditProfile from './components/Owner/OwnerProfile';

import './App.css';

// Protected route component for customers
const CustomerProtectedRoute = ({ children }) => {
  const { isCustomerAuthenticated, loading } = useSelector((state) => state.auth);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const dispatch = useDispatch();
  
  useEffect(() => {
    const checkAuth = async () => {
      await dispatch(checkCustomerAuth());
      setInitialCheckDone(true);
    };
    
    if (!isCustomerAuthenticated) {
      checkAuth();
    } else {
      setInitialCheckDone(true);
    }
  }, [dispatch, isCustomerAuthenticated]);
  
  if (!initialCheckDone || loading) {
    return <div className="d-flex justify-content-center mt-5"><div className="spinner-border" role="status"></div></div>;
  }
  
  return isCustomerAuthenticated ? children : <Navigate to="/customer/login" state={{ signedOut: true }} />;
};

// Protected route component for restaurants
const RestaurantProtectedRoute = ({ children }) => {
  const { isRestaurantAuthenticated, loading } = useSelector((state) => state.auth);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const dispatch = useDispatch();
  
  useEffect(() => {
    const checkAuth = async () => {
      await dispatch(checkRestaurantAuth());
      setInitialCheckDone(true);
    };
    
    if (!isRestaurantAuthenticated) {
      checkAuth();
    } else {
      setInitialCheckDone(true);
    }
  }, [dispatch, isRestaurantAuthenticated]);
  
  if (!initialCheckDone || loading) {
    return <div className="d-flex justify-content-center mt-5"><div className="spinner-border" role="status"></div></div>;
  }
  
  return isRestaurantAuthenticated ? children : <Navigate to="/restaurant/login" state={{ signedOut: true }} />;
};

function App() {
  const dispatch = useDispatch();
  const [authChecked, setAuthChecked] = useState(false);
  const { isCustomerAuthenticated, isRestaurantAuthenticated } = useSelector((state) => state.auth);

  // Check customer and restaurant authentication when the app loads
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Run both auth checks in parallel
        await Promise.all([
          dispatch(checkCustomerAuth()),
          dispatch(checkRestaurantAuth())
        ]);
      } catch (error) {
        console.error("Error checking authentication:", error);
      } finally {
        setAuthChecked(true);
      }
    };
    
    checkAuth();
  }, [dispatch]);

  if (!authChecked) {
    return <div className="d-flex justify-content-center mt-5"><div className="spinner-border" role="status"></div></div>;
  }

  return (
    <Router>
      <Routes>
        {/* Landing */}
        <Route path="/" element={<LandingPage />} />

        {/* Customer */}
        <Route path="/customer/signup" element={<CustomerSignup />} />
        <Route path="/customer/login" element={<CustomerLogin />} />
        <Route path="/customer/profile/:id" element={<CustomerEditProfile />} />
        <Route path="/customer/home" element={
          <CustomerProtectedRoute>
            <CustomerHome />
          </CustomerProtectedRoute>
        } />
        <Route path="/restaurant/:id" element={
          <CustomerProtectedRoute>
            <RestaurantDetail />
          </CustomerProtectedRoute>
        } />
        <Route path="/cart" element={<Cart />} />
        <Route path="/customer/orders" element={<CustomerOrders />} />
        <Route path="/customer/favorites" element={<CustomerFavorites />} />


        {/* Restaurant */}
        <Route path="/restaurant/signup" element={<RestaurantSignup />} />
        <Route path="/restaurant/login" element={<RestaurantLogin />} />
        <Route path="/restaurant/home" element={
          <RestaurantProtectedRoute>
            <RestaurantList />
          </RestaurantProtectedRoute>
        } />
        <Route path="/restaurant/restaurants/:restaurantId/orders" element={
          <RestaurantProtectedRoute>
            <RestaurantOrders />
          </RestaurantProtectedRoute>
        } />
        <Route path="/restaurant/profile/:id" element={<RestaurantEditProfile />} />


      </Routes>
    </Router>
  );
}

export default App;

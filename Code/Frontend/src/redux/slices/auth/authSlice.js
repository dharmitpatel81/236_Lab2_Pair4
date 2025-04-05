import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Set axios defaults
axios.defaults.withCredentials = true;
axios.defaults.headers.common['Cache-Control'] = 'no-cache';
axios.defaults.headers.common['Pragma'] = 'no-cache';

// Create a global axios instance with consistent settings
const api = axios.create({
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  }
});

// Login Customer
export const loginUser = createAsyncThunk(
  "customerAuth/loginUser",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post(
        "/api/customers/login",
        credentials
      );

      console.log("Login API Response:", response.data);
      
      // Store in localStorage as backup
      localStorage.setItem('customerAuth', JSON.stringify({
        isCustomerAuthenticated: true,
        customer: response.data.customer
      }));

      return response.data.customer;
    } catch (error) {
      console.error("Login Error:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data.error || "Invalid email or password");
    }
  }
);


// Check Customer Authentication
export const checkCustomerAuth = createAsyncThunk(
  "customerAuth/checkAuth",
  async (_, { rejectWithValue }) => {
    try {
      // First try to get from server
      const response = await api.get(
        "/api/customers/check-auth"
      );
      
      console.log("Check Customer Auth Response:", response.data);
      
      if (response.data.isCustomerAuthenticated) {
        return {
          isCustomerAuthenticated: true,
          customer: response.data.customer
        };
      }
      
      // If server says not authenticated, try backup from localStorage
      const storedAuth = localStorage.getItem('customerAuth');
      if (storedAuth) {
        const parsedAuth = JSON.parse(storedAuth);
        if (parsedAuth.isCustomerAuthenticated) {
          return parsedAuth;
        }
      }
      
      return { isCustomerAuthenticated: false };
    } catch (error) {
      console.error("Check Customer Auth Error:", error.response?.data || error.message);
      
      // If server request fails, try backup from localStorage
      const storedAuth = localStorage.getItem('customerAuth');
      if (storedAuth) {
        return JSON.parse(storedAuth);
      }
      
      return rejectWithValue(error.response?.data || "Something went wrong");
    }
  }
);

// Logout Customer
export const logoutUser = createAsyncThunk(
  "customerAuth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      await api.post(
        "/api/customers/logout"
      );
      
      // Clear localStorage on logout
      localStorage.removeItem('customerAuth');
      
      return null;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Something went wrong");
    }
  }
);


// Restaurant Login
export const loginRestaurant = createAsyncThunk(
  "restaurantAuth/loginRestaurant",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post(
        "/api/restaurants/login",
        credentials
      );
      
      // Store in localStorage as backup
      localStorage.setItem('restaurantAuth', JSON.stringify({
        isRestaurantAuthenticated: true,
        restaurant: response.data.restaurant
      }));
      
      return response.data.restaurant;
    } catch (error) {
      return rejectWithValue(error.response?.data.error || "Invalid email or password");
    }
  }
);

// Check Restaurant Authentication
export const checkRestaurantAuth = createAsyncThunk(
  "restaurantAuth/checkRestaurantAuth",
  async (_, { rejectWithValue }) => {
    try {
      // First try to get from server
      const response = await api.get(
        "/api/restaurants/check-auth"
      );
      
      console.log("Check Restaurant Auth Response:", response.data);
      
      if (response.data.isRestaurantAuthenticated) {
        return {
          isRestaurantAuthenticated: true,
          restaurant: response.data.restaurant
        };
      }
      
      // If server says not authenticated, try backup from localStorage
      const storedAuth = localStorage.getItem('restaurantAuth');
      if (storedAuth) {
        const parsedAuth = JSON.parse(storedAuth);
        if (parsedAuth.isRestaurantAuthenticated) {
          return parsedAuth;
        }
      }
      
      return { isRestaurantAuthenticated: false };
    } catch (error) {
      console.error("Check Restaurant Auth Error:", error.response?.data || error.message);
      
      // If server request fails, try backup from localStorage
      const storedAuth = localStorage.getItem('restaurantAuth');
      if (storedAuth) {
        return JSON.parse(storedAuth);
      }
      
      return rejectWithValue(error.response?.data || "Something went wrong");
    }
  }
);

// Logout Restaurant
export const logoutRestaurant = createAsyncThunk(
  "restaurantAuth/logoutRestaurant",
  async (_, { rejectWithValue }) => {
    try {
      await api.post(
        "/api/restaurants/logout"
      );
      
      // Clear localStorage on logout
      localStorage.removeItem('restaurantAuth');
      
      return null;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Something went wrong");
    }
  }
);


const authSlice = createSlice({
  name: "auth",
  initialState: {
    customer: null,
    restaurant: null,
    isCustomerAuthenticated: false,
    isRestaurantAuthenticated: false,
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Customer Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isCustomerAuthenticated = true;
        state.customer = action.payload;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.isCustomerAuthenticated = false;
        state.customer = null;
        state.error = action.payload;
      })
      
      // Check Customer Auth
      .addCase(checkCustomerAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkCustomerAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.isCustomerAuthenticated = action.payload.isCustomerAuthenticated;
        state.customer = action.payload.customer || null;
      })
      .addCase(checkCustomerAuth.rejected, (state, action) => {
        state.loading = false;
        state.isCustomerAuthenticated = false;
        state.customer = null;
        state.error = action.payload;
      })
      
      // Customer Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.isCustomerAuthenticated = false;
        state.customer = null;
      })
      
      // Restaurant Login
      .addCase(loginRestaurant.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginRestaurant.fulfilled, (state, action) => {
        state.loading = false;
        state.isRestaurantAuthenticated = true;
        state.restaurant = action.payload;
        state.error = null;
      })
      .addCase(loginRestaurant.rejected, (state, action) => {
        state.loading = false;
        state.isRestaurantAuthenticated = false;
        state.restaurant = null;
        state.error = action.payload;
      })
      
      // Check Restaurant Auth
      .addCase(checkRestaurantAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkRestaurantAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.isRestaurantAuthenticated = action.payload.isRestaurantAuthenticated;
        state.restaurant = action.payload.restaurant || null;
        state.error = null;
      })
      .addCase(checkRestaurantAuth.rejected, (state, action) => {
        state.loading = false;
        state.isRestaurantAuthenticated = false;
        state.restaurant = null;
        state.error = action.payload;
      })
      
      // Restaurant Logout
      .addCase(logoutRestaurant.fulfilled, (state) => {
        state.isRestaurantAuthenticated = false;
        state.restaurant = null;
      });
  },
});

export default authSlice.reducer;
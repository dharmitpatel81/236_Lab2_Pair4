import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../../config/axios";

// Initial state
const initialState = {
    // Single restaurant management (for restaurant owners)
    restaurant: null,
    loading: false,
    error: null,
    
    // Restaurant browsing (for customers)
    restaurantList: [],
    dishes: [],
    listStatus: "idle", // idle | loading | succeeded | failed
    listError: null,
    
    // Restaurant details status
    detailsStatus: "idle", // idle | loading | succeeded | failed
    detailsError: null
};

// Async thunk to create a Restaurant
export const createRestaurant = createAsyncThunk(
    "restaurant/createRestaurant",
    async (restaurantData, { rejectWithValue }) => {
        try {
            const response = await axios.post("/api/restaurants", restaurantData, {
                headers: { "Content-Type": "application/json" },
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || "Something went wrong");
        }
    }
);

// Async thunk to fetch a Restaurant by ID
export const fetchRestaurant = createAsyncThunk(
    "restaurant/fetchRestaurant",
    async (restaurantId, { rejectWithValue }) => {
        try {
            const response = await axios.get(`/api/restaurants/${restaurantId}`);
            
            if (!response.data) {
                return rejectWithValue("Restaurant not found");
            }
            
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || "Failed to fetch restaurant");
        }
    }
);

// Async thunk to update a Restaurant
export const updateRestaurant = createAsyncThunk(
    "restaurant/updateRestaurant",
    async ({ restaurantId, restaurantData }, { rejectWithValue }) => {
        try {
            const response = await axios.put(`/api/restaurants/${restaurantId}`, restaurantData, {
                headers: { "Content-Type": "application/json" },
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || "Something went wrong");
        }
    }
);

// Async thunk to fetch all restaurants (for customer browsing)
export const fetchRestaurants = createAsyncThunk(
    "restaurant/fetchRestaurants",
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get("/api/restaurants");
            return response.data; // Returns an array of restaurants
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || "Failed to fetch restaurants");
        }
    }
);

// Create the slice
const restaurantSlice = createSlice({
    name: "restaurant",
    initialState,
    reducers: {
        clearRestaurant: (state) => {
            state.restaurant = null;
            state.dishes = [];
            state.loading = false;
            state.error = null;
            state.detailsStatus = "idle";
            state.detailsError = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Create Restaurant
            .addCase(createRestaurant.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createRestaurant.fulfilled, (state, action) => {
                state.loading = false;
                state.restaurant = action.payload;
            })
            .addCase(createRestaurant.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            
            // Fetch Restaurant
            .addCase(fetchRestaurant.pending, (state) => {
                state.detailsStatus = "loading";
                state.detailsError = null;
            })
            .addCase(fetchRestaurant.fulfilled, (state, action) => {
                state.detailsStatus = "succeeded";
                state.restaurant = action.payload;
                state.dishes = action.payload.dishes || [];
            })
            .addCase(fetchRestaurant.rejected, (state, action) => {
                state.detailsStatus = "failed";
                state.detailsError = action.payload;
            })
            
            // Update Restaurant
            .addCase(updateRestaurant.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateRestaurant.fulfilled, (state, action) => {
                state.loading = false;
                state.restaurant = action.payload;
            })
            .addCase(updateRestaurant.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            
            // Fetch all restaurants (for customer browsing)
            .addCase(fetchRestaurants.pending, (state) => {
                state.listStatus = "loading";
                state.listError = null;
            })
            .addCase(fetchRestaurants.fulfilled, (state, action) => {
                state.listStatus = "succeeded";
                state.restaurantList = action.payload || []; // Ensure it's always an array
            })
            .addCase(fetchRestaurants.rejected, (state, action) => {
                state.listStatus = "failed";
                state.listError = action.payload;
            });
    }
});

export const { clearRestaurant } = restaurantSlice.actions;
export default restaurantSlice.reducer;
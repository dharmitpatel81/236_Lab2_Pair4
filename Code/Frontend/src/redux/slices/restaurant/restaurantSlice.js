import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
axios.defaults.withCredentials = true;


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


// Async thunk to fetch a Restaurant by ID for Profile Edit
export const fetchRestaurant = createAsyncThunk(
    "restaurant/fetchRestaurant",
    async (restaurantId, { rejectWithValue }) => {
        try {
            const response = await axios.get(`/api/restaurants/${restaurantId}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || "Something went wrong while fetching restaurant details");
        }
    }
);


// Async thunk to update a Restaurant by ID for Profile Edit
export const updateRestaurant = createAsyncThunk(
    "restaurant/updateRestaurant",
    async ({ restaurantId, restaurantData }, { rejectWithValue }) => {
        try {
            const response = await axios.put(`/api/restaurants/${restaurantId}`, restaurantData, {
                headers: { "Content-Type": "application/json" },
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || "Something went wrong while updating restaurant details");
        }
    }
);


const restaurantSlice = createSlice({
    name: "restaurant",
    initialState: {
        loading: false,
        success: false,
        error: null,
        restaurant: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(createRestaurant.pending, (state) => {
                state.loading = true;
                state.success = false;
                state.error = null;
            })
            .addCase(createRestaurant.fulfilled, (state) => {
                state.loading = false;
                state.success = true;
                state.error = null;
            })
            .addCase(createRestaurant.rejected, (state, action) => {
                state.loading = false;
                state.success = false;
                state.error = action.payload;
            })
            .addCase(fetchRestaurant.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchRestaurant.fulfilled, (state, action) => {
                state.loading = false;
                state.restaurant = action.payload;
            })
            .addCase(fetchRestaurant.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(updateRestaurant.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateRestaurant.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.restaurant = action.payload;
            })
            .addCase(updateRestaurant.rejected, (state, action) => {
                state.loading = false;
                state.success = false;
                state.error = action.payload;
            });
    },
});

export default restaurantSlice.reducer;
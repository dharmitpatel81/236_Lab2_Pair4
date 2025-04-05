import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
axios.defaults.withCredentials = true;


// Async thunk to create a Restaurant Owner
export const createRestaurantOwner = createAsyncThunk(
    "restaurantOwner/createRestaurantOwner",
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


// Async thunk to fetch a Restaurant Owner by ID for Profile Edit
export const fetchOwner = createAsyncThunk(
    "restaurantOwner/fetchOwner",
    async (restaurantId, { rejectWithValue }) => {
        try {
            const response = await axios.get(`/api/restaurants/${restaurantId}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || "Something went wrong while fetching restaurant details");
        }
    }
);


// Async thunk to update a Restaurant Owner by ID for Profile Edit
export const updateOwner = createAsyncThunk(
    "restaurantOwner/updateOwner",
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


const restaurantOwnerSlice = createSlice({
    name: "restaurantOwner",
    initialState: {
        loading: false,
        success: false,
        error: null,
        owner: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(createRestaurantOwner.pending, (state) => {
                state.loading = true;
                state.success = false;
                state.error = null;
            })
            .addCase(createRestaurantOwner.fulfilled, (state) => {
                state.loading = false;
                state.success = true;
                state.error = null;
            })
            .addCase(createRestaurantOwner.rejected, (state, action) => {
                state.loading = false;
                state.success = false;
                state.error = action.payload;
            })
            .addCase(fetchOwner.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchOwner.fulfilled, (state, action) => {
                state.loading = false;
                state.owner = action.payload;
            })
            .addCase(fetchOwner.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(updateOwner.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateOwner.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.owner = action.payload;
            })
            .addCase(updateOwner.rejected, (state, action) => {
                state.loading = false;
                state.success = false;
                state.error = action.payload;
            });
    },
});

export default restaurantOwnerSlice.reducer;
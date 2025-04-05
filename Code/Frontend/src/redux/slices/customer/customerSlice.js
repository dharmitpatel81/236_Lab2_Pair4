import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
axios.defaults.withCredentials = true;

// Async thunk to create a customer
export const createCustomer = createAsyncThunk(
    "customers/createCustomer",
    async (customerData, { rejectWithValue }) => {
        try {
            const response = await axios.post("/api/customers", customerData, {
                headers: { "Content-Type": "application/json" },
            });
            return response.data; // Assuming backend returns the created customer
        } catch (error) {
            return rejectWithValue(error.response?.data || "Something went wrong");
        }
    }
);

// Async thunk to update customer details
export const updateCustomer = createAsyncThunk(
    "customers/updateCustomer",
    async ({ customerId, customerData }, { rejectWithValue }) => {
        try {
            console.log(`Sending update to API for customer ID: ${customerId}`);
            console.log('Data being sent:', customerData);
            
            // Add validation for required fields
            const requiredFields = ['firstName', 'lastName', 'email', 'phone'];
            const missingFields = requiredFields.filter(field => !customerData[field]);
            
            if (missingFields.length > 0) {
                return rejectWithValue(`Missing required fields: ${missingFields.join(', ')}`);
            }
            
            const response = await axios.put(`/api/customers/${customerId}`, customerData, {
                headers: { 
                    "Content-Type": "application/json"
                },
                withCredentials: true
            });
            
            console.log('Update response:', response.data);
            
            // Return the customer object from the response
            return response.data.customer || response.data.updatedCustomer || response.data;
        } catch (error) {
            console.error('Update error:', error);
            // Extract the most specific error message
            const errorMessage = 
                error.response?.data?.error || 
                error.response?.data?.message || 
                error.message || 
                "Failed to update customer data";
                
            console.error('Error detail:', errorMessage);
            return rejectWithValue(errorMessage);
        }
    }
);

// Async thunk to fetch customer details by ID
export const fetchCustomer = createAsyncThunk(
    "customers/fetchCustomer",
    async (customerId, { rejectWithValue }) => {
        try {
            const response = await axios.get(`/api/customers/${customerId}`);
            return response.data; // Assuming backend returns customer data
        } catch (error) {
            return rejectWithValue(error.response?.data || "Failed to fetch customer data");
        }
    }
);


const customerSlice = createSlice({
    name: "customers",
    initialState: {
        customer: null,
        loading: false,
        success: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Create Customer cases
            .addCase(createCustomer.pending, (state) => {
                state.loading = true;
                state.success = false;
                state.error = null;
            })
            .addCase(createCustomer.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.error = null;
                state.customer = action.payload; // Store customer in Redux state
            })
            .addCase(createCustomer.rejected, (state, action) => {
                state.loading = false;
                state.success = false;
                state.error = action.payload;
            })
            
            // Fetch Customer cases
            .addCase(fetchCustomer.pending, (state) => {
                state.loading = true;
                state.success = false;
                state.error = null;
            })
            .addCase(fetchCustomer.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.error = null;
                state.customer = action.payload;
            })
            .addCase(fetchCustomer.rejected, (state, action) => {
                state.loading = false;
                state.success = false;
                state.error = action.payload;
            })
            
            // Update Customer cases
            .addCase(updateCustomer.pending, (state) => {
                state.loading = true;
                state.success = false;
                state.error = null;
            })
            .addCase(updateCustomer.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.error = null;
                state.customer = action.payload;
            })
            .addCase(updateCustomer.rejected, (state, action) => {
                state.loading = false;
                state.success = false;
                state.error = action.payload;
            });
    },
});

export default customerSlice.reducer;

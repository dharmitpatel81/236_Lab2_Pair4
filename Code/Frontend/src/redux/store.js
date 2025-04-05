import { configureStore } from "@reduxjs/toolkit";
import customerReducer from "./slices/customer/customerSlice";
import authReducer from "./slices/auth/authSlice";
import restaurantReducer from "./slices/restaurant/restaurantSlice"; 
import customerRestaurantReducer from "./slices/customer/restaurantSlice";
import ownerRestaurantReducer from "./slices/owner/ownerRestaurantSlice";
import orderReducer from "./slices/customer/orderSlice";
import cartReducer from "./slices/customer/cartSlice";
import favoriteReducer from "./slices/customer/favoriteSlice";


const store = configureStore({
    reducer: {
        auth: authReducer, 
        customer: customerReducer,
        cart: cartReducer,
        order: orderReducer,
        restaurant: restaurantReducer, 
        restaurants: customerRestaurantReducer,
        ownerRestaurants: ownerRestaurantReducer,
        favorites: favoriteReducer
    },
});

export default store;

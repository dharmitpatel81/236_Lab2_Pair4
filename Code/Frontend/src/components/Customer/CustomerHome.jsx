import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { fetchRestaurants, clearRestaurantDetails } from "../../redux/slices/customer/restaurantSlice";
import { checkCustomerAuth } from "../../redux/slices/auth/authSlice";
import "bootstrap/dist/css/bootstrap.min.css";
import NavbarDark from "../Common/NavbarDark";
import { resetOrderStatus } from "../../redux/slices/customer/orderSlice";
import { fetchFavorites, addFavorite, removeFavorite } from "../../redux/slices/customer/favoriteSlice";
import { useNavigate } from "react-router-dom";

const CustomerHome = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    const { restaurants, status, error } = useSelector((state) => state.restaurants);
    const { isCustomerAuthenticated, customer, loading } = useSelector((state) => state.auth);
    const { favoriteRestaurants } = useSelector((state) => state.favorites);
    
    const orderStatus = useSelector((state) => state.order.orderStatus);

    useEffect(() => {
        dispatch(clearRestaurantDetails());
        if (orderStatus === "succeeded") {
            dispatch(resetOrderStatus());
        }
    }, [orderStatus, dispatch]);

    useEffect(() => {
        if (status === "idle" && !loading) {
            if (!isCustomerAuthenticated) {
                dispatch(checkCustomerAuth());
            } else {
                dispatch(fetchRestaurants());
            }
        }
    }, [isCustomerAuthenticated, status, dispatch, loading]);

    useEffect(() => {
        if (!loading && !isCustomerAuthenticated) {
            navigate("/customer/login", { state: { signedOut: true } });
        }
    }, [isCustomerAuthenticated, navigate, loading]);

    useEffect(() => {
        if (customer) {
            dispatch(fetchFavorites(customer.id));
        }
    }, [customer, dispatch]);

    const handleRestaurantClick = (restaurantId) => {
        navigate(`/restaurant/${restaurantId}`);
    };

    const toggleFavorite = (restaurantId) => {
        if (!customer) return;
        if (favoriteRestaurants.includes(restaurantId)) {
            dispatch(removeFavorite({ customerId: customer.id, restaurantId }));
        } else {
            dispatch(addFavorite({ customerId: customer.id, restaurantId }));
        }
    };

    return (
        <>
            <NavbarDark />
            <h2 className="mb-4 fw-bold ms-5">Restaurants</h2>
            <div className="container mt-4">
                {status === "loading" && <p>Loading restaurants...</p>}
                {status === "failed" && <p className="text-danger">{error}</p>}
                {status === "succeeded" && restaurants.length === 0 && (
                    <p className="text-warning">No Restaurants Available</p>
                )}

                <div className="row">
                    {restaurants.map((restaurant) => (
                        <div 
                            key={restaurant.id} 
                            className="col-12 col-sm-6 col-md-4 col-lg-3 mb-4" 
                            style={{ cursor: "pointer", position: "relative" }}
                        >
                            <div 
                                className="card border-0" 
                                style={{ boxShadow: "0px 0px 5px rgba(0, 0, 0, 0.2)" }}
                                onClick={() => handleRestaurantClick(restaurant.id)}
                            >
                                <img
                                    src={
                                        restaurant.image_url 
                                            ? `http://localhost:3000${restaurant.image_url}` 
                                            : `http://localhost:3000/uploads/blank_post.png`
                                    }
                                    className="card-img-top"
                                    alt={restaurant.name}
                                    style={{ height: "160px", objectFit: "cover" }}
                                />
                                <div className="card-body p-2 ms-3">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <p className="card-title fw-bold fs-6 my-0">{restaurant.name}</p>
                                        <div className="text-end">
                                            <span className="badge text-black ms-0">Pickup: {restaurant.offers_pickup ? <i className="bi bi-check-circle-fill text-success ms-1"></i> : <i className="bi bi-x-circle-fill text-danger ms-1"></i>}</span>
                                            <span className="badge text-black ms-0">Delivery: {restaurant.offers_delivery ? <i className="bi bi-check-circle-fill text-success ms-1"></i> : <i className="bi bi-x-circle-fill text-danger ms-1"></i>}</span>
                                        </div>
                                    </div>
                                    <p className="card-text my-0">
                                        <strong>☆</strong> {restaurant.ratings}
                                    </p>
                                </div>
                            </div>
                            {/* Heart Icon for Favorites */}
                            <i
                                className={`bi ${favoriteRestaurants.includes(restaurant.id) ? "bi-heart-fill text-danger" : "bi-heart text-secondary"}`}
                                style={{
                                    position: "absolute",
                                    bottom: "5px",
                                    right: "24px",
                                    fontSize: "1.2rem",
                                    cursor: "pointer",
                                    transition: "color 0.5s ease-in-out"
                                }}
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent clicking on card
                                    toggleFavorite(restaurant.id);
                                }}
                            ></i>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

export default CustomerHome;
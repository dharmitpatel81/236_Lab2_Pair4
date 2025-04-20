import React, { useEffect, useMemo, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { fetchRestaurants, clearRestaurant } from "../../redux/slices/restaurant/restaurantSlice";
import "bootstrap/dist/css/bootstrap.min.css";
import NavbarDark from "../Common/NavbarDark";
import { resetOrderStatus } from "../../redux/slices/customer/orderSlice";
import { fetchFavorites, addFavorite, removeFavorite } from "../../redux/slices/customer/favoriteSlice";
import { useNavigate } from "react-router-dom";
import { selectOrderPreference } from "../../redux/slices/customer/cartSlice";

const DEFAULT_IMAGE_PLACEHOLDER = "https://res.cloudinary.com/dvylvq84d/image/upload/v1744151036/ImagePlaceholder_gg1xob.png";

const CustomerHome = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    // Get restaurants from Redux store
    const { restaurantList, listStatus, listError } = useSelector((state) => state.restaurant);
    const { customer } = useSelector((state) => state.auth);
    const { favoriteRestaurants } = useSelector((state) => state.favorites);
    
    const orderStatus = useSelector((state) => state.order.orderStatus);
    // Get current order preference (delivery or pickup)
    const orderPreference = useSelector(selectOrderPreference);

    // State for sort and filter dropdowns
    const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
    const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
    const [sortOption, setSortOption] = useState(null);
    const [filterRating, setFilterRating] = useState(null);
    
    // Refs for dropdown elements
    const sortDropdownRef = useRef(null);
    const filterDropdownRef = useRef(null);

    useEffect(() => {
        dispatch(clearRestaurant());
        if (orderStatus === "succeeded") {
            dispatch(resetOrderStatus());
        }
    }, [orderStatus, dispatch]);

    useEffect(() => {
        if (listStatus === "idle") {
            dispatch(fetchRestaurants());
        }
    }, [listStatus, dispatch]);

    useEffect(() => {
        if (customer) {
            dispatch(fetchFavorites(customer.id));
        }
    }, [customer, dispatch]);

    // Add handler for clicks outside dropdowns
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
                setSortDropdownOpen(false);
            }
            if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
                setFilterDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Filter and sort restaurants based on selected options
    const processedRestaurants = useMemo(() => {
        if (!restaurantList || restaurantList.length === 0) return [];
        
        // First filter by order preference
        let processed = restaurantList.filter(restaurant => {
            if (orderPreference === "delivery") {
                return restaurant.offersDelivery;
            } else if (orderPreference === "pickup") {
                return restaurant.offersPickup;
            }
            return true; // Show all if no preference
        });
        
        // Then filter by rating if applicable
        if (filterRating) {
            processed = processed.filter(restaurant => {
                const rating = parseFloat(restaurant.rating || 0);
                return rating >= filterRating;
            });
        }
        
        // Then sort if applicable
        if (sortOption) {
            processed.sort((a, b) => {
                const ratingA = parseFloat(a.rating || 0);
                const ratingB = parseFloat(b.rating || 0);
                
                if (sortOption === 'low-high') {
                    return ratingA - ratingB;
                } else {
                    return ratingB - ratingA;
                }
            });
        }
        
        return processed;
    }, [restaurantList, orderPreference, sortOption, filterRating]);

    const handleRestaurantClick = (restaurantId) => {
        navigate(`/restaurant/${restaurantId}`);
    };

    const toggleFavorite = (restaurantId) => {
        if (!customer) return;
        
        // Check if restaurantId is in favorites array
        const isCurrentlyFavorite = Array.isArray(favoriteRestaurants) && 
            favoriteRestaurants.some(id => id === restaurantId || 
                (typeof id === 'object' && id !== null && (id._id === restaurantId || id.id === restaurantId)));
        
        if (isCurrentlyFavorite) {
            console.log("Removing from favorites:", restaurantId);
            dispatch(removeFavorite({ customerId: customer.id, restaurantId }));
        } else {
            console.log("Adding to favorites:", restaurantId);
            dispatch(addFavorite({ customerId: customer.id, restaurantId }));
        }
    };

    // Helper function to check if a restaurant is in favorites
    const isRestaurantFavorite = (restaurantId) => {
        return Array.isArray(favoriteRestaurants) && 
            favoriteRestaurants.some(id => id === restaurantId || 
                (typeof id === 'object' && id !== null && (id._id === restaurantId || id.id === restaurantId)));
    };

    return (
        <>
            <NavbarDark />
            <div className="d-flex justify-content-start align-items-center ms-5 me-5 mb-3">
                <h2 className="fw-bold me-3">Restaurants</h2>
                
                <div className="d-flex">
                    {/* Sort Dropdown */}
                    <div className="position-relative me-2" ref={sortDropdownRef}>
                        <button 
                            className="btn text-dark rounded-pill py-1 px-3"
                            onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                            style={{ fontSize: '0.9rem', background: '#f0f0f0' }}
                        >
                            <span>Sort: {sortOption ? (sortOption === 'high-low' ? 'High → Low' : 'Low → High') : 'By Rating'}</span>
                            <i className={`bi bi-caret-${sortDropdownOpen ? 'up' : 'down'}-fill ms-2`} style={{ fontSize: '0.7rem' }}></i>
                        </button>
                        
                        {sortDropdownOpen && (
                            <div className="position-absolute mt-1 bg-white shadow rounded p-2" style={{ right: 0, zIndex: 1000, minWidth: '150px' }}>
                                <div 
                                    className={`py-1 px-2 rounded ${sortOption === 'high-low' ? 'bg-light fw-bold' : 'hover-bg-light'}`}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => {
                                        setSortOption('high-low');
                                        setSortDropdownOpen(false);
                                    }}
                                >
                                    High → Low
                                </div>
                                <div 
                                    className={`py-1 px-2 rounded ${sortOption === 'low-high' ? 'bg-light fw-bold' : 'hover-bg-light'}`}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => {
                                        setSortOption('low-high');
                                        setSortDropdownOpen(false);
                                    }}
                                >
                                    Low → High
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Filter Dropdown */}
                    <div className="position-relative" ref={filterDropdownRef}>
                        <button 
                            className="btn text-dark rounded-pill py-1 px-3"
                            onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                            style={{ fontSize: '0.9rem', background: '#f0f0f0' }}
                        >
                            <span>Filter: {filterRating ? `${filterRating}★ & up` : 'By Rating'}</span>
                            <i className={`bi bi-caret-${filterDropdownOpen ? 'up' : 'down'}-fill ms-2`} style={{ fontSize: '0.7rem' }}></i>
                        </button>
                        
                        {filterDropdownOpen && (
                            <div className="position-absolute mt-1 bg-white shadow rounded p-2" style={{ right: 0, zIndex: 1000, minWidth: '150px' }}>
                                {[1, 2, 3, 4].map(rating => (
                                    <div 
                                        key={rating}
                                        className={`py-1 px-2 rounded ${filterRating === rating ? 'bg-light fw-bold' : 'hover-bg-light'}`}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => {
                                            setFilterRating(rating);
                                            setFilterDropdownOpen(false);
                                        }}
                                    >
                                        {[...Array(rating)].map((_, i) => (
                                            <i key={i} className="bi bi-star-fill" style={{ color: '#000', fontSize: '0.85rem' }}></i>
                                        ))}
                                        {rating < 4 ? ' and up' : ' +'}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    {/* Clear All option */}
                    {(sortOption || filterRating) && (
                        <div className="ms-3 d-flex align-items-center">
                            <span 
                                className="text-decoration-underline" 
                                style={{ cursor: 'pointer', fontSize: '0.9rem' }}
                                onClick={() => {
                                    setSortOption(null);
                                    setFilterRating(null);
                                }}
                            >
                                Clear all
                            </span>
                        </div>
                    )}
                </div>
            </div>
            <div className="container mt-4">
                {listStatus === "loading" && <p>Loading restaurants...</p>}
                {listStatus === "failed" && <p className="text-danger">{listError}</p>}
                {listStatus === "succeeded" && processedRestaurants.length === 0 && (
                    <div className="alert alert-light w-75">
                        No restaurants for display. 
                        Try switching to {orderPreference === "delivery" ? "pickup" : "delivery"} mode instead, or modify your sort/filter selection.
                    </div>
                )}

                <div key="restaurant-row" className="row">
                    {processedRestaurants.map((restaurant) => (
                        <div 
                            key={restaurant.id} 
                            className="col-12 col-sm-6 col-md-4 col-lg-3 mb-4" 
                            style={{ cursor: "pointer", position: "relative" }}
                        >
                            <div 
                                className="card border-0 no-hover" 
                                style={{ overflow: "hidden" }}
                                onClick={() => handleRestaurantClick(restaurant.id)}
                            >
                                <img
                                    key={`img-${restaurant.id}`}
                                    src={restaurant.imageUrl || DEFAULT_IMAGE_PLACEHOLDER}
                                    className="card-img-top"
                                    alt={restaurant.name}
                                    style={{ 
                                        height: "140px", 
                                        objectFit: "cover",
                                        borderRadius: "16px"
                                    }}
                                    onError={(e) => {
                                        e.target.onerror = null; // Prevent infinite loop
                                        e.target.src = DEFAULT_IMAGE_PLACEHOLDER;
                                    }}
                                />
                                <div className="card-body ms-0 p-0 mt-2 position-relative">
                                    <i
                                        key={`heart-${restaurant.id}`}
                                        className={`bi ${isRestaurantFavorite(restaurant.id) ? "bi-heart-fill text-danger" : "bi-heart text-secondary"}`}
                                        style={{
                                            position: "absolute",
                                            right: "20px",
                                            top: "5px",
                                            fontSize: "1.4rem",
                                            cursor: "pointer",
                                            transition: "color 0.5s ease-in-out"
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent clicking on card
                                            toggleFavorite(restaurant.id);
                                        }}
                                    ></i>
                                    
                                    <p key={`name-${restaurant.id}`} className="card-title fw-bold">{restaurant.name}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

export default CustomerHome;
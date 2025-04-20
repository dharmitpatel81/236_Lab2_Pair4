import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchRestaurant } from '../../redux/slices/restaurant/restaurantSlice';
import UpdateRestaurantForm from './UpdateRestaurantForm';
import UpdateRestaurantDishForm from './UpdateRestaurantDishForm';
import NavbarDark from '../Common/NavbarDark';
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { useNavigate } from "react-router-dom";

const RestaurantDashboard = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { restaurant, loading, error } = useSelector((state) => state.restaurant);
    const restaurantId = useSelector((state) => state.auth.restaurant?.id);

    const [showUpdateForm, setShowUpdateForm] = useState(false);
    const [showDishUpdateForm, setShowDishUpdateForm] = useState(false);

    useEffect(() => {
        if (restaurantId) {
            dispatch(fetchRestaurant(restaurantId));
        }
    }, [dispatch, restaurantId]);

    const handleUpdateSuccess = (updatedRestaurant) => {
        setShowUpdateForm(false);
        if (restaurantId) {
            dispatch(fetchRestaurant(restaurantId));
        }
    };

    const handleUpdateDishSuccess = () => {
        setShowDishUpdateForm(false);
    };

    const handleUpdateClick = () => {
        setShowUpdateForm(true);
    };

    const handleUpdateDishClick = () => {
        setShowDishUpdateForm(true);
    };

    if (loading) {
        return (
            <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container-fluid py-4">
                <div className="alert alert-danger m-0" role="alert">
                    Error: {error}
                </div>
            </div>
        );
    }

    if (showUpdateForm && restaurant) {
        return <UpdateRestaurantForm 
            restaurant={restaurant}
            onSuccess={handleUpdateSuccess} 
            onCancel={() => {
                setShowUpdateForm(false);
            }} 
        />;
    }

    if (showDishUpdateForm && restaurant) {
        return <UpdateRestaurantDishForm 
            restaurant={restaurant}
            onSuccess={handleUpdateDishSuccess} 
            onCancel={() => {
                setShowDishUpdateForm(false);
            }} 
        />;
    }

    // If no restaurant data is available
    if (!restaurant) {
        return (
            <>
                <NavbarDark />
                <div className="container-fluid py-4">
                    <div className="row justify-content-center">
                        <div className="col-12 col-md-8 text-center py-5">
                            <div className="card border-0">
                                <div className="card-body py-5">
                                    <h3 className="mb-4">Restaurant Information Not Found</h3>
                                    <p className="text-muted mb-4">There was a problem loading your restaurant information. Please contact support.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <NavbarDark />
            <div className="container-fluid py-4">
                <div className="container">
                    <div className="row align-items-center mb-4">
                        <div className="col-8">
                            <h2 className="mb-0 fw-bold">My Restaurant</h2>
                        </div>
                    </div>
                    
                    <div className="row">
                        <div className="col-12 col-md-8 mx-auto">
                            <div className="card h-100 border-0 shadow-sm">
                                <div className="position-relative">
                                    <img 
                                        src={restaurant.image_url ? `http://127.0.0.1:3000${restaurant.image_url}` : 'http://127.0.0.1:3000/uploads/blank_post.png'}
                                        alt={restaurant.name}
                                        className="card-img-top"
                                        style={{ height: '250px', objectFit: 'cover' }}
                                    />
                                </div>
                                <div className="card-body">
                                    <h3 className="card-title mb-3"><strong>{restaurant.name}</strong></h3>
                                    <p className="card-text mb-3">{restaurant.description}</p>
                                    <div className="mb-3">
                                        <p className="card-text mb-2">
                                            <i className="bi bi-geo-alt me-2"></i>
                                            {restaurant.address}
                                        </p>
                                        <p className="card-text mb-2">
                                            <i className="bi bi-envelope me-2"></i>
                                            {restaurant.email}
                                        </p>
                                        <p className="card-text">
                                            <i className="bi bi-telephone me-2"></i>
                                            {restaurant.phone}
                                        </p>
                                    </div>
                                    <div className="d-flex gap-2 mb-3">
                                        <span className="badge bg-light text-dark">
                                            Pickup 
                                            {restaurant.offers_pickup ? (
                                                <i className="bi bi-check-circle-fill text-success ms-1"></i>
                                            ) : (
                                                <i className="bi bi-x-circle-fill text-danger ms-1"></i>
                                            )}
                                        </span>

                                        <span className="badge bg-light text-dark">
                                            Delivery 
                                            {restaurant.offers_delivery ? (
                                                <i className="bi bi-check-circle-fill text-success ms-1"></i>
                                            ) : (
                                                <i className="bi bi-x-circle-fill text-danger ms-1"></i>
                                            )}
                                        </span>
                                        
                                        <span className="badge bg-light text-dark">
                                            <i className="bi bi-star-fill text-warning me-1"></i>
                                            {restaurant.ratings || '0.0'}
                                        </span>
                                    </div>
                                </div>
                                <div className="card-footer bg-transparent border-0 pb-3">
                                    <div className="d-grid gap-2">
                                        <Link 
                                            to={`/restaurant/orders`}
                                            className="btn btn-dark rounded-2 text-white"
                                        >
                                            View Orders
                                        </Link>
                                        <button 
                                            className="btn btn-outline-dark rounded-2"
                                            onClick={handleUpdateClick}
                                        >
                                            Update Restaurant Info
                                        </button>
                                        <button 
                                            className="btn btn-outline-dark rounded-2"
                                            onClick={handleUpdateDishClick}
                                        >
                                            Manage Menu Items
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default RestaurantDashboard;
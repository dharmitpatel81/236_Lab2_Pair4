import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchRestaurant, updateRestaurant } from '../../redux/slices/restaurant/restaurantSlice';
import NavbarDark from '../Common/NavbarDark';
import "bootstrap/dist/css/bootstrap.min.css";

const RestaurantProfile = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    // Get restaurant data from Redux store
    const { restaurant, loading, error } = useSelector((state) => state.restaurant);
    const restaurantId = useSelector((state) => state.auth.restaurant?.id);
    const isRestaurantAuthenticated = useSelector((state) => state.auth.isRestaurantAuthenticated);
    
    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        email: '',
        phone: '',
        address: '',
        offers_pickup: false,
        offers_delivery: false
    });
    
    const [isEditing, setIsEditing] = useState(false);
    const [updateSuccess, setUpdateSuccess] = useState(false);
    const [updateError, setUpdateError] = useState(null);
    
    // Redirect if not authenticated
    useEffect(() => {
        if (!isRestaurantAuthenticated) {
            navigate("/restaurant/login");
        }
    }, [isRestaurantAuthenticated, navigate]);
    
    // Fetch restaurant data
    useEffect(() => {
        if (restaurantId) {
            dispatch(fetchRestaurant({ restaurantId }));
        }
    }, [dispatch, restaurantId]);
    
    // Update form data when restaurant data is loaded
    useEffect(() => {
        if (restaurant) {
            setFormData({
                name: restaurant.name || '',
                description: restaurant.description || '',
                email: restaurant.email || '',
                phone: restaurant.phone || '',
                address: restaurant.address || '',
                offers_pickup: restaurant.offers_pickup || false,
                offers_delivery: restaurant.offers_delivery || false
            });
        }
    }, [restaurant]);
    
    // Handle form input changes
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };
    
    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            await dispatch(updateRestaurant({ 
                restaurantId: restaurant.id, 
                restaurantData: formData 
            })).unwrap();
            
            setUpdateSuccess(true);
            setUpdateError(null);
            setIsEditing(false);
            
            // Clear success message after 3 seconds
            setTimeout(() => {
                setUpdateSuccess(false);
            }, 3000);
        } catch (err) {
            setUpdateError(err.message || "Failed to update profile");
            setUpdateSuccess(false);
        }
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
    
    return (
        <>
            <NavbarDark />
            <div className="container py-5">
                <div className="row justify-content-center">
                    <div className="col-md-8">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-dark text-white">
                                <h4 className="mb-0">Restaurant Profile</h4>
                            </div>
                            <div className="card-body p-4">
                                {updateSuccess && (
                                    <div className="alert alert-success">
                                        Profile updated successfully!
                                    </div>
                                )}
                                
                                {updateError && (
                                    <div className="alert alert-danger">
                                        {updateError}
                                    </div>
                                )}
                                
                                {!isEditing ? (
                                    // View Mode
                                    <div>
                                        <div className="d-flex justify-content-between align-items-center mb-4">
                                            <h5 className="mb-0">Restaurant Information</h5>
                                            <button 
                                                className="btn btn-outline-dark"
                                                onClick={() => setIsEditing(true)}
                                            >
                                                Edit Profile
                                            </button>
                                        </div>
                                        
                                        <div className="mb-4 text-center">
                                            <img 
                                                src={restaurant.image_url || 'http://localhost:3000/uploads/blank_post.png'} 
                                                alt={restaurant.name}
                                                className="rounded-circle"
                                                style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                                            />
                                        </div>
                                        
                                        <div className="row mb-3">
                                            <div className="col-md-6">
                                                <p className="mb-1"><strong>Name:</strong></p>
                                                <p>{restaurant.name}</p>
                                            </div>
                                            <div className="col-md-6">
                                                <p className="mb-1"><strong>Email:</strong></p>
                                                <p>{restaurant.email}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="row mb-3">
                                            <div className="col-md-6">
                                                <p className="mb-1"><strong>Phone:</strong></p>
                                                <p>{restaurant.phone}</p>
                                            </div>
                                            <div className="col-md-6">
                                                <p className="mb-1"><strong>Address:</strong></p>
                                                <p>{restaurant.address}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="row mb-3">
                                            <div className="col-md-12">
                                                <p className="mb-1"><strong>Description:</strong></p>
                                                <p>{restaurant.description}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="row">
                                            <div className="col-md-6">
                                                <p className="mb-1"><strong>Offers Pickup:</strong></p>
                                                <p>{restaurant.offers_pickup ? 'Yes' : 'No'}</p>
                                            </div>
                                            <div className="col-md-6">
                                                <p className="mb-1"><strong>Offers Delivery:</strong></p>
                                                <p>{restaurant.offers_delivery ? 'Yes' : 'No'}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    // Edit Mode
                                    <form onSubmit={handleSubmit}>
                                        <div className="mb-3">
                                            <label htmlFor="name" className="form-label">Restaurant Name</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        
                                        <div className="mb-3">
                                            <label htmlFor="email" className="form-label">Email</label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                id="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        
                                        <div className="mb-3">
                                            <label htmlFor="phone" className="form-label">Phone</label>
                                            <input
                                                type="tel"
                                                className="form-control"
                                                id="phone"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        
                                        <div className="mb-3">
                                            <label htmlFor="address" className="form-label">Address</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="address"
                                                name="address"
                                                value={formData.address}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        
                                        <div className="mb-3">
                                            <label htmlFor="description" className="form-label">Description</label>
                                            <textarea
                                                className="form-control"
                                                id="description"
                                                name="description"
                                                rows="3"
                                                value={formData.description}
                                                onChange={handleChange}
                                            ></textarea>
                                        </div>
                                        
                                        <div className="mb-3 form-check">
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                id="offers_pickup"
                                                name="offers_pickup"
                                                checked={formData.offers_pickup}
                                                onChange={handleChange}
                                            />
                                            <label className="form-check-label" htmlFor="offers_pickup">Offers Pickup</label>
                                        </div>
                                        
                                        <div className="mb-4 form-check">
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                id="offers_delivery"
                                                name="offers_delivery"
                                                checked={formData.offers_delivery}
                                                onChange={handleChange}
                                            />
                                            <label className="form-check-label" htmlFor="offers_delivery">Offers Delivery</label>
                                        </div>
                                        
                                        <div className="d-flex justify-content-end">
                                            <button 
                                                type="button" 
                                                className="btn btn-outline-secondary me-2"
                                                onClick={() => setIsEditing(false)}
                                            >
                                                Cancel
                                            </button>
                                            <button type="submit" className="btn btn-dark">
                                                Save Changes
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default RestaurantProfile;
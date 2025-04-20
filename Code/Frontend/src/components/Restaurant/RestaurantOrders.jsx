import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import NavbarDark from "../Common/NavbarDark";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const RestaurantOrders = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    // Get restaurant data from Redux store
    const restaurantId = useSelector((state) => state.auth.restaurant?.id);
    const isRestaurantAuthenticated = useSelector((state) => state.auth.isRestaurantAuthenticated);
    
    // State for orders
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    
    // Status options for order management
    const statusOptions = [
        'Pending', 'Processing', 'Out for Delivery', 'Cancelled', 'Delivered'
    ];   
    
    // Redirect if not authenticated
    useEffect(() => {
        if (!isRestaurantAuthenticated) {
            navigate("/restaurant/login"); // Redirect to restaurant login page if not logged in
        }
    }, [isRestaurantAuthenticated, navigate]);

    // Fetch orders for this restaurant
    useEffect(() => {
        if (restaurantId) {
            setLoading(true);
            axios.get(`/api/restaurants/${restaurantId}/orders`)
                .then(response => {
                    setOrders(response.data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Error fetching orders:", err);
                    setError("Failed to load orders. Please try again.");
                    setLoading(false);
                });
        }
    }, [restaurantId]);

    // Handle status update
    const handleStatusUpdate = (orderId, newStatus) => {
        axios.put(`/api/orders/${orderId}/status`, { status: newStatus })
            .then(response => {
                // Update the order in the local state
                setOrders(prevOrders => 
                    prevOrders.map(order => 
                        order.id === orderId ? { ...order, status: newStatus } : order
                    )
                );
                
                // If we're viewing a specific order, update it too
                if (selectedOrder && selectedOrder.id === orderId) {
                    setSelectedOrder({ ...selectedOrder, status: newStatus });
                }
            })
            .catch(err => {
                console.error("Error updating order status:", err);
                alert("Failed to update order status. Please try again.");
            });
    };

    // Handle back button
    const handleBack = () => {
        if (selectedOrder) {
            setSelectedOrder(null); // Clear selectedOrder to go back to the orders list
        } else {
            navigate('/restaurant/home'); // Navigate to home if no order is selected
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

    // Render order details if an order is selected
    if (selectedOrder) {
        return (
            <>
                <NavbarDark />
                <div className="container py-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <button className="btn btn-outline-dark" onClick={handleBack}>
                            <i className="bi bi-arrow-left me-2"></i>Back to Orders
                        </button>
                        <h2 className="mb-0">Order #{selectedOrder.id}</h2>
                    </div>
                    
                    <div className="row">
                        <div className="col-md-8">
                            <div className="card mb-4">
                                <div className="card-header bg-dark text-white">
                                    <h5 className="mb-0">Order Items</h5>
                                </div>
                                <div className="card-body">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Item</th>
                                                <th>Quantity</th>
                                                <th className="text-end">Price</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedOrder.items.map((item, index) => (
                                                <tr key={index}>
                                                    <td>{item.name}</td>
                                                    <td>{item.quantity}</td>
                                                    <td className="text-end">${item.price.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                            <tr className="table-light">
                                                <td colSpan="2" className="text-end fw-bold">Subtotal:</td>
                                                <td className="text-end">${selectedOrder.subtotal.toFixed(2)}</td>
                                            </tr>
                                            <tr className="table-light">
                                                <td colSpan="2" className="text-end fw-bold">Tax:</td>
                                                <td className="text-end">${selectedOrder.tax.toFixed(2)}</td>
                                            </tr>
                                            <tr className="table-light">
                                                <td colSpan="2" className="text-end fw-bold">Total:</td>
                                                <td className="text-end fw-bold">${selectedOrder.total.toFixed(2)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        
                        <div className="col-md-4">
                            <div className="card mb-4">
                                <div className="card-header bg-dark text-white">
                                    <h5 className="mb-0">Customer Information</h5>
                                </div>
                                <div className="card-body">
                                    <p><strong>Name:</strong> {selectedOrder.customer.name}</p>
                                    <p><strong>Email:</strong> {selectedOrder.customer.email}</p>
                                    <p><strong>Phone:</strong> {selectedOrder.customer.phone}</p>
                                </div>
                            </div>
                            
                            <div className="card mb-4">
                                <div className="card-header bg-dark text-white">
                                    <h5 className="mb-0">Order Details</h5>
                                </div>
                                <div className="card-body">
                                    <p><strong>Order Date:</strong> {new Date(selectedOrder.created_at).toLocaleString()}</p>
                                    <p><strong>Order Type:</strong> {selectedOrder.order_type}</p>
                                    <p><strong>Payment Method:</strong> {selectedOrder.payment_method}</p>
                                    <p><strong>Special Instructions:</strong> {selectedOrder.special_instructions || 'None'}</p>
                                    
                                    <div className="mt-4">
                                        <label className="form-label fw-bold">Status:</label>
                                        <div className="d-flex">
                                            <select 
                                                className="form-select me-2" 
                                                value={selectedOrder.status}
                                                onChange={(e) => handleStatusUpdate(selectedOrder.id, e.target.value)}
                                            >
                                                {statusOptions.map(option => (
                                                    <option key={option} value={option}>{option}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // Render orders list
    return (
        <>
            <NavbarDark />
            <div className="container py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="mb-0">Orders</h2>
                    <button className="btn btn-outline-dark" onClick={handleBack}>
                        <i className="bi bi-house me-2"></i>Back to Dashboard
                    </button>
                </div>
                
                {orders.length === 0 ? (
                    <div className="alert alert-info">
                        No orders found.
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead className="table-dark">
                                <tr>
                                    <th>Order #</th>
                                    <th>Date</th>
                                    <th>Customer</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(order => (
                                    <tr key={order.id}>
                                        <td>{order.id}</td>
                                        <td>{new Date(order.created_at).toLocaleDateString()}</td>
                                        <td>{order.customer.name}</td>
                                        <td>${order.total.toFixed(2)}</td>
                                        <td>
                                            <span className={`badge ${
                                                order.status === 'Delivered' ? 'bg-success' :
                                                order.status === 'Cancelled' ? 'bg-danger' :
                                                order.status === 'Processing' ? 'bg-primary' :
                                                order.status === 'Out for Delivery' ? 'bg-info' :
                                                'bg-warning'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td>
                                            <button 
                                                className="btn btn-sm btn-outline-dark"
                                                onClick={() => setSelectedOrder(order)}
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
};

export default RestaurantOrders;
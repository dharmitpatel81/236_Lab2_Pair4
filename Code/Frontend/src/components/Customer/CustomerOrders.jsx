import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrdersByCustomer, fetchOrderDetails } from "../../redux/slices/customer/orderSlice"; 
import { useNavigate } from "react-router-dom";
import NavbarDark from '../Common/NavbarDark';
import "bootstrap/dist/css/bootstrap.min.css"; // Ensure Bootstrap is imported
import "bootstrap-icons/font/bootstrap-icons.css"; // Import Bootstrap Icons
import { Link } from "react-router-dom";
import axios from "../../config/axios"; // Use the configured axios instance
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

const DEFAULT_IMAGE_PLACEHOLDER = "https://res.cloudinary.com/dvylvq84d/image/upload/v1744151036/ImagePlaceholder_gg1xob.png";

const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
        case 'new':
        case 'received':
            return 'bg-info';
        case 'preparing':
            return 'bg-primary';
        case 'pickup_ready':
        case 'on_the_way':
            return 'bg-warning';
        case 'delivered':
        case 'picked_up':
            return 'bg-success';
        case 'cancelled':
            return 'bg-danger';
        default:
            return 'bg-secondary';
    }
};

const getOrderTypeIcon = (orderType) => {
    return orderType.toLowerCase() === "pickup" 
        ? <i className="bi bi-box-seam me-2"></i>  // Pickup icon
        : <i className="bi bi-truck me-2"></i>;  // Delivery icon
};

// Function to format restaurant address
const formatRestaurantAddress = (address) => {
    if (!address) return null;
    return {
        street: address.street || "",
        city: address.city || "",
        state: address.state || "",
        zipCode: address.zipCode || ""
    };
};

const CustomerOrders = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    const customerId = useSelector((state) => state.auth.customer?.id);
    const customerOrders = useSelector((state) => state.order.customerOrders);
    const loadingCustomerOrders = useSelector((state) => state.order.loadingCustomerOrders);
    const orderError = useSelector((state) => state.order.orderError);
    
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [orderDetails, setOrderDetails] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [sortOption, setSortOption] = useState("latest");
    const [cancellingOrder, setCancellingOrder] = useState(false);
    const [cancelError, setCancelError] = useState(null);
    
    // Ref for dropdown element
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (customerId) {
            dispatch(fetchOrdersByCustomer(customerId));
        }
    }, [dispatch, customerId]);

    // Initialize Bootstrap dropdown
    useEffect(() => {
        // Check if the dropdown element exists in the DOM
        if (dropdownRef.current) {
            // Import Bootstrap JS dynamically to ensure it's loaded
            import('bootstrap/dist/js/bootstrap.bundle.min.js')
                .then(() => {
                    // Access the global bootstrap object
                    if (window.bootstrap) {
                        // Initialize the dropdown
                        const dropdownElement = dropdownRef.current;
                        new window.bootstrap.Dropdown(dropdownElement);
                    }
                })
                .catch(err => console.error('Failed to load Bootstrap JS:', err));
        }
    }, [customerOrders]); // Re-initialize when orders change

    // // For debugging
    // useEffect(() => {
    //     if (customerOrders) {
    //         console.log("Customer Orders:", customerOrders);
    //     }
    // }, [customerOrders]);

    const handleViewDetails = (orderId) => {
        setSelectedOrderId(orderId);
        setLoadingDetails(true);
        setShowModal(true);
        
            dispatch(fetchOrderDetails(orderId))
            .then((response) => {
                setOrderDetails(response.payload);
                setLoadingDetails(false);
            })
            .catch((error) => {
                console.error("Failed to fetch order details:", error);
                setLoadingDetails(false);
            });
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedOrderId(null);
            setOrderDetails(null);
    };

    const formatDate = (dateString) => {
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit', 
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // Sort orders based on the selected sort option
    const getSortedOrders = () => {
        if (!customerOrders?.orders || !customerOrders.orders.length) return [];
        
        const ordersToSort = [...customerOrders.orders];
        
        switch (sortOption) {
            case "oldest":
                return ordersToSort.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            case "latest":
            default:
                return ordersToSort.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
    };

    // Get the sorted orders
    const sortedOrders = getSortedOrders();

    // Function to check if order can be cancelled
    const canCancelOrder = (status) => {
        const nonCancellableStatuses = ['preparing', 'on_the_way', 'pickup_ready', 'delivered', 'picked_up', 'cancelled'];
        return !nonCancellableStatuses.includes(status?.toLowerCase());
    };

    // Handle order cancellation
    const handleCancelOrder = async (orderId) => {
        if (!orderId || !canCancelOrder(orderDetails?.status)) return;
        
        if (window.confirm("Are you sure you want to cancel this order?")) {
            try {
                setCancellingOrder(true);
                setCancelError(null);
                const response = await axios.put(`/api/customers/orders/${orderId}/cancel`);
                
                // Update the local state with the updated order
                // The API might return the order directly or nested in an 'order' property
                const updatedOrder = response.data.order || response.data;
                if (updatedOrder) {
                    setOrderDetails(updatedOrder);
                    
                    // Also update the order in the list
                    if (customerOrders && customerOrders.orders) {
                        const updatedOrders = customerOrders.orders.map(order => 
                            order.id === orderId 
                                ? {...order, status: 'cancelled'} 
                                : order
                        );
                        
                        // Create a new copy of customerOrders with updated orders array
                        const updatedCustomerOrders = {
                            ...customerOrders,
                            orders: updatedOrders
                        };
                        
                        // Update Redux store by dispatching action
                        dispatch({ 
                            type: 'order/updateOrdersAfterCancel', 
                            payload: updatedCustomerOrders 
                        });
                    }
                    
                    // Force refresh orders from the backend to ensure everything is in sync
                    if (customerId) {
                        dispatch(fetchOrdersByCustomer(customerId));
                    }
                    
                    // Show success alert
                    window.alert("Your order has been successfully cancelled.");
                }
                
                setCancellingOrder(false);
            } catch (error) {
                console.error("Failed to cancel order:", error);
                setCancelError(error.response?.data?.message || "Failed to cancel order. Please try again.");
                setCancellingOrder(false);
            }
        }
    };

    return (
        <>
        <NavbarDark />
        <button
            className="btn text-dark border-0 d-flex ms-5 align-items-center mt-3 ms-3 fw-bold"
            style={{ backgroundColor: 'transparent' }}
            onClick={() => navigate('/restaurants')}
        >
            <span className="fs-5 me-1">←</span><u>Back to Restaurants</u>
        </button>
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold ms-0 px-0 mb-0">Your Orders</h2>

                {customerOrders && customerOrders.orders && customerOrders.orders.length > 0 && (
                    <div className="dropdown">
                        <button 
                            className="btn btn-outline-dark rounded-pill dropdown-toggle py-1 px-3" 
                            type="button"
                            ref={dropdownRef}
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                        >
                            Sort: {sortOption === "latest" ? "By Latest" : "By Oldest"}
                        </button>
                        <ul 
                            className="dropdown-menu shadow-sm rounded-3"
                            style={{ 
                                minWidth: "150px", 
                                fontSize: "0.9rem",
                                transition: "transform 0.2s ease-out, opacity 0.2s ease-out"
                            }}
                        >
                            <li>
                                <button 
                                    className={`dropdown-item rounded-3 ${sortOption === "latest" ? "fw-bold text-dark" : ""}`}
                                    onClick={() => setSortOption("latest")}
                                >
                                    By Latest
                                </button>
                            </li>
                            <li>
                                <button 
                                    className={`dropdown-item rounded-3 ${sortOption === "oldest" ? "fw-bold text-dark" : ""}`}
                                    onClick={() => setSortOption("oldest")}
                                >
                                    By Oldest
                                </button>
                            </li>
                        </ul>
                    </div>
                )}
            </div>
            
            {loadingCustomerOrders ? (
                <div className="text-center py-5">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Loading your orders...</p>
                </div>
            ) : orderError ? (
                <div className="alert alert-danger" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    Error: {orderError}
                </div>
            ) : (
            <div className="orders-list">
                    {!customerOrders || !sortedOrders.length ? (
                        <div className="text-center py-5">
                            <p className="text-muted">You haven't placed any orders yet. <Link to="/restaurants" className="text-dark">Explore Restaurants</Link>.</p>
                        </div>
                ) : (
                    <div className="row">
                            {sortedOrders.map((order) => (
                                <div key={order.id} className="col-md-6 mb-4">
                                    <div 
                                        className="card rounded-4 h-100 pb-2" 
                                        onClick={() => handleViewDetails(order.id)}
                                        style={{ 
                                            cursor: 'pointer', 
                                            transition: 'transform 0.2s, box-shadow 0.2s',
                                            overflow: 'hidden'
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-5px)';
                                            e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '';
                                        }}
                                    >
                                        <div className="card-header mb-0 bg-white border-bottom-0 py-0 pt-2 px-3">
                                            <div className="d-flex flex-wrap justify-content-between align-items-center">
                                                <h5 className="card-title fw-bold mb-0 me-auto">#{order.orderNumber}</h5>
                                                <div>
                                                    <span className="badge text-dark rounded-2 px-2 py-1 me-1" style={{border: '1px solid lightgray'}}>
                                                        {order.deliveryType.toLowerCase() === "delivery" ? 
                                                            <><i className="bi bi-truck me-1"></i> Delivery</> : 
                                                            <><i className="bi bi-person-walking me-1"></i> Pickup</>
                                                        }
                                            </span>
                                                    <span className={`badge ${getStatusBadgeClass(order.status)} rounded-2 px-2 py-1`}>
                                                        {order.status.toUpperCase().replace('_', ' ')}
                                            </span>
                                                </div>
                                            </div>
                                            <p className="text-muted small mb-1 mt-1 fst-italic">
                                                Placed on: {formatDate(order.createdAt)}
                                            </p>
                                        </div>
                                        
                                        <div className="card-body my-0 py-0 px-3">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <div className="d-flex align-items-center">
                                                    <img 
                                                        src={order.restaurantImage || DEFAULT_IMAGE_PLACEHOLDER}
                                                        alt={order.restaurantName}
                                                        className="rounded-circle me-2"
                                                        style={{ width: '35px', height: '35px', objectFit: 'cover', border: '1px solid #eee' }}
                                                    />
                                                    <h6 className="mb-0 fw-bold">{order.restaurantName}</h6>
                                                </div>
                                                <span className="fs-5 fw-bold">${order.totalAmount.toFixed(2)}</span>
                                            </div>
                                            
                                            {order.deliveryType.toLowerCase() === "delivery" && order.deliveryAddress && (
                                                <div className="mb-2">
                                                    <p className="mb-1 small">
                                                        <i className="bi bi-geo-alt me-1"></i>
                                                        <span className="text-muted">Delivery to: </span>
                                                        {order.deliveryAddress.street}, {order.deliveryAddress.city}
                                                    </p>
                                                </div>
                                            )}
                                            
                                            {order.deliveryType.toLowerCase() === "pickup" && order.restaurantAddress && (
                                                <div className="mb-0">
                                                    <p className="mb-0 small">
                                                        <i className="bi bi-shop me-1"></i>
                                                        <span className="text-muted">Pickup from: </span>
                                                        {order.restaurantAddress.street}, {order.restaurantAddress.city}
                                                    </p>
                                                </div>
                                            )}
                                            
                                            {/* Order Items Overview */}
                                            <div className="order-items pt-0 mt-0">
                                                <div className="row">
                                                    <div className="col-md-8">
                                                        <ul className="list-unstyled small mb-0">
                                                            {order.items.slice(0, 2).map((item, idx) => (
                                                                <li key={idx} className="mb-1">
                                                                    • {item.name}{item.size ? ` (${item.size})` : ''} × {item.quantity}
                                                                </li>
                                                            ))}
                                                            {order.items.length > 2 && (
                                                                <li className="text-muted">
                                                                    +{order.items.length - 2} more item(s)
                                                                </li>
                                                            )}
                                                        </ul>
                                                    </div>
                                                    <div className="col-md-4 d-flex align-items-center justify-content-end">
                                                        <span className="text-muted small">
                                                            <i className="bi bi-info-circle me-1"></i>
                                                            View Details
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Order Details Modal */}
            <Modal 
                show={showModal} 
                onHide={handleCloseModal}
                size="lg"
                aria-labelledby="order-details-modal"
                centered
                contentClassName="rounded-5 border-0 px-4 py-2"
            >
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title id="order-details-modal" className="fw-bold">
                        {orderDetails ? `Order #${orderDetails.orderNumber}` : 'Order Details'}
                        <p className="fw-light fs-6 fst-italic">Placed on: {formatDate(orderDetails?.createdAt)}</p>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-0 mt-2">
                    {loadingDetails ? (
                        <div className="text-center py-4">
                            <div className="spinner-border" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-2">Loading order details...</p>
                        </div>
                    ) : orderDetails ? (
                        <div className="order-details-container">
                            {/* Order Header - Status and Type */}
                            <div className="order-status-header p-3 bg-light rounded-3 mb-4">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <span className="fw-medium">Order Status:</span>
                                        <span className={`badge ${getStatusBadgeClass(orderDetails.status)} rounded-2 px-2 py-1 ms-2`}>
                                            {orderDetails.status.toUpperCase().replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="fw-medium me-2">Order Type:</span>
                                        <span className="badge border border-dark text-dark bg-transparent px-2 py-1 rounded-2">
                                            {orderDetails.isDelivery ? 
                                                <><i className="bi bi-truck me-1"></i> Delivery</> : 
                                                <><i className="bi bi-box-seam me-1"></i> Pickup</>
                                            }
                                        </span>
                                    </div>
                                </div>
                                {orderDetails.customerNote && (
                                    <div className="mt-3 pt-2 border-top">
                                        <p className="mb-0">
                                            <i className="bi bi-chat-left-text me-2"></i>
                                            <strong>Special Instructions:</strong>
                                            <em className="ms-2">{orderDetails.customerNote}</em>
                                        </p>
                                    </div>
                                )}
                            </div>
                            
                            {/* Locations Section - Restaurant Contact Details */}
                            <div className="row mb-4">
                                {/* Restaurant Information Column - Full Width */}
                                <div className="col-12">
                                    <div className="h-100 border-0 rounded-3">
                                        <div className="card-body">
                                            <h6 className="fw-bold mb-3">
                                                Restaurant Contact Details
                                            </h6>
                                            <div className="d-flex align-items-center mb-3">
                                                <img 
                                                    src={orderDetails.restaurantDetails.imageUrl || DEFAULT_IMAGE_PLACEHOLDER}
                                                    alt={orderDetails.restaurantDetails.name}
                                                    className="rounded-circle me-3"
                                                    style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                                                />
                                                <div>
                                                    <h6 className="mb-1">{orderDetails.restaurantDetails.name}</h6>
                                                    <div className="d-flex flex-wrap contact-details">
                                                        <p className="mb-0 me-4">
                                                            <i className="bi bi-telephone me-2"></i>
                                                            {orderDetails.restaurantDetails.phone}
                                                        </p>
                                                        <p className="mb-0">
                                                            <i className="bi bi-envelope me-2"></i>
                                                            {orderDetails.restaurantDetails.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Order Journey Visualization */}
                            <div className="order-journey mb-4 position-relative">
                                <div className="d-flex justify-content-between align-items-center">
                                    {/* First Side (Restaurant for delivery, Customer for pickup) */}
                                    <div className="journey-point text-center" style={{ width: "35%" }}>
                                        <div className="icon-container bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-2" 
                                             style={{ width: "48px", height: "48px" }}>
                                            {orderDetails.isDelivery ? (
                                                <i className="bi bi-shop fs-4"></i>
                                            ) : (
                                                <i className="bi bi-person fs-4"></i>
                                            )}
                                        </div>
                                        <p className="mb-0 fw-bold small">
                                            {orderDetails.isDelivery ? orderDetails.restaurantDetails.name : "You"}
                                        </p>
                                        <p className="mb-0 text-muted small">
                                            {orderDetails.isDelivery ? 
                                                `${orderDetails?.restaurantDetails?.address?.street}, ${orderDetails?.restaurantDetails?.address?.city}, ${orderDetails?.restaurantDetails?.address?.state}` : 
                                                `${orderDetails.customerDetails.firstName} ${orderDetails.customerDetails.lastName}`
                                            }
                                        </p>
                                    </div>
                                    
                                    {/* Delivery or Pickup Icon */}
                                    <div className="journey-method text-center position-relative" style={{ width: "20%" }}>
                                        <div className="icon-container mb-0 p-0 mt-0 d-inline-flex align-items-center justify-content-center">
                                            {orderDetails.isDelivery ? (
                                                <i className="bi bi-truck fs-5 mt-0"></i>
                                            ) : (
                                                <i className="bi bi-person-walking mt-1 fs-5"></i>
                                            )}
                                        </div>
                                        <p className="mb-0 text-muted small mt-0">
                                            {orderDetails.isDelivery ? "Delivery" : "Pickup"}
                                        </p>
                                    </div>
                                    
                                    {/* Second Side (Customer for delivery, Restaurant for pickup) */}
                                    <div className="journey-point text-center" style={{ width: "35%" }}>
                                        <div className="icon-container bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-2" 
                                             style={{ width: "48px", height: "48px" }}>
                                            {orderDetails.isDelivery ? (
                                                <i className="bi bi-house-door fs-4"></i>
                                            ) : (
                                                <i className="bi bi-shop fs-4"></i>
                                            )}
                                        </div>
                                        <p className="mb-0 fw-bold small">
                                            {orderDetails.isDelivery ? 
                                                `${orderDetails.deliveryAddress.label}` : 
                                                orderDetails.restaurantDetails.name
                                            }
                                        </p>
                                        <p className="mb-0 text-muted small">
                                            {orderDetails.isDelivery ? 
                                                `${orderDetails?.deliveryAddress.street}, ${orderDetails?.deliveryAddress.city}, ${orderDetails?.deliveryAddress.state}` : 
                                                `${orderDetails?.restaurantDetails?.address?.street}, ${orderDetails?.restaurantDetails?.address?.city}, ${orderDetails?.restaurantDetails?.address?.state}`
                                            }
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Dotted line connecting the points */}
                                <div className="dotted-line position-absolute" 
                                     style={{ 
                                         top: "24px", 
                                         left: "24%", 
                                         right: "24%",
                                         height: "2px",
                                         borderTop: "2px dashed #dee2e6",
                                         zIndex: "0"
                                     }}>
                                </div>
                            </div>

                            {/* Order Items Table */}
                            <div className="border-0 rounded-3 mb-4">
                                                                    <div className="card-body">
                                    <h6 className="fw-bold mb-3">
                                        Order Items
                                    </h6>
                                    <div className="table-responsive ms-2">
                                        <table className="table table-hover">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Item</th>
                                                    <th>Size</th>
                                                    <th>Price</th>
                                                    <th>Quantity</th>
                                                    <th className="text-end">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {orderDetails.items.map((item, index) => (
                                                    <tr key={index}>
                                                        <td>{item.name}</td>
                                                        <td>{item.size || '-'}</td>
                                                        <td>${item.price.toFixed(2)}</td>
                                                        <td>{item.quantity}</td>
                                                        <td className="text-end">${item.totalPrice.toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                                                    </div>
                                                                </div>
                                                            </div>
                            
                            {/* Order Summary Card */}
                            <div className="order-summary">
                                <div className="row justify-content-end">
                                    <div className="col-md-5">
                                        <div className="card shadow-sm border-0 rounded-3">
                                            <div className="card-body">
                                                <h6 className="fw-bold mb-3">
                                                    <i className="bi bi-receipt me-2"></i>
                                                    Order Summary
                                                </h6>
                                                <div className="d-flex justify-content-between mb-2">
                                                    <span>Subtotal:</span>
                                                    <span>${orderDetails.subtotal.toFixed(2)}</span>
                                                </div>
                                                <div className="d-flex justify-content-between mb-2">
                                                    <span>Tax ({orderDetails.taxRate}%):</span>
                                                    <span>${orderDetails.taxAmount.toFixed(2)}</span>
                                                </div>
                                                {orderDetails.deliveryFee !== null && (
                                                    <div className="d-flex justify-content-between mb-2">
                                                        <span>
                                                            Delivery Fee
                                                            {orderDetails.deliveryFee === 0 && (
                                                                <span className="badge bg-success ms-2 small">FREE</span>
                                                            )}
                                                        </span>
                                                        <span>${orderDetails.deliveryFee.toFixed(2)}</span>
                                                    </div>
                                                )}
                                                <hr className="my-2" />
                                                <div className="d-flex justify-content-between fw-bold">
                                                    <span>Total:</span>
                                                    <span>${orderDetails.totalAmount.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {cancelError && (
                                <div className="alert alert-danger mt-3">
                                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                    {cancelError}
                    </div>
                )}
            </div>
                    ) : (
                        <p className="text-center py-3">No order details available</p>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-0">
                    {orderDetails && canCancelOrder(orderDetails.status) && (
                        <Button 
                            variant="outline-danger" 
                            className=""
                            onClick={() => handleCancelOrder(orderDetails.id)}
                            disabled={cancellingOrder}
                        >
                            {cancellingOrder ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Cancelling...
                                </>
                            ) : (
                                <>
                                    Cancel Order
                                </>
                            )}
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>
        </div>
        </>
    );
};

export default CustomerOrders;
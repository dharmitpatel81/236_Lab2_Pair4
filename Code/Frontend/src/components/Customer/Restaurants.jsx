import { useDispatch, useSelector } from "react-redux";
import { selectOrderPreference } from "../../redux/slices/customer/cartSlice";

const Restaurants = () => {
    const dispatch = useDispatch();
    // Get order preference from Redux store
    const orderPreference = useSelector(selectOrderPreference);
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        const fetchRestaurants = async () => {
            try {
                setLoading(true);
                const response = await axios.get('/api/restaurants');
                
                // Filter restaurants based on delivery/pickup preference
                let filteredRestaurants = response.data;
                if (orderPreference === "delivery") {
                    filteredRestaurants = response.data.filter(restaurant => restaurant.offersDelivery);
                } else if (orderPreference === "pickup") {
                    filteredRestaurants = response.data.filter(restaurant => restaurant.offersPickup);
                }
                
                setRestaurants(filteredRestaurants);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching restaurants:", error);
                setError("Failed to load restaurants. Please try again later.");
                setLoading(false);
            }
        };
        
        fetchRestaurants();
    }, [orderPreference]); // Re-fetch when orderPreference changes
    
    return (
        <>
            <NavbarDark />
            <div className="container mt-4">
                <h2 className="fw-bold mb-4">Restaurants</h2>
                
                {/* Show preference-based message */}
                <div className="mb-4">
                    <p className="fs-5">
                        {orderPreference === "delivery" ? (
                            <span><i className="bi bi-truck me-2"></i>Showing restaurants that offer delivery</span>
                        ) : (
                            <span><i className="bi bi-box-seam me-2"></i>Showing restaurants that offer pickup</span>
                        )}
                    </p>
                </div>
                
                {loading ? (
                    <div className="d-flex justify-content-center my-5">
                        <div className="spinner-border" role="status">
                            <span className="visually-hidden">Loading restaurants...</span>
                        </div>
                    </div>
                ) : error ? (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                ) : restaurants.length === 0 ? (
                    <div className="alert alert-info" role="alert">
                        <i className="bi bi-info-circle me-2"></i>
                        No restaurants found that offer {orderPreference === "delivery" ? "delivery" : "pickup"}. 
                        Try switching to {orderPreference === "delivery" ? "pickup" : "delivery"} mode using the toggle in the navigation bar.
                    </div>
                ) : (
                    <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                        {restaurants.map(restaurant => (
                            <div key={restaurant._id || restaurant.id} className="col">
                                <Link to={`/restaurants/${restaurant._id || restaurant.id}`} className="text-decoration-none">
                                    <div className="card h-100 shadow-sm">
                                        <img 
                                            src={restaurant.imageUrl || DEFAULT_IMAGE_PLACEHOLDER} 
                                            className="card-img-top" 
                                            alt={restaurant.name}
                                            style={{ height: "200px", objectFit: "cover" }}
                                        />
                                        <div className="card-body">
                                            <div className="d-flex justify-content-between align-items-start">
                                                <h5 className="card-title fw-bold mb-1">{restaurant.name}</h5>
                                                <div>
                                                    {restaurant.rating > 0 && (
                                                        <span className="badge bg-success rounded-pill me-1">
                                                            <i className="bi bi-star-fill me-1"></i>
                                                            {restaurant.rating.toFixed(1)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="card-text text-muted mb-1 small">
                                                {restaurant.cuisine && restaurant.cuisine.join(", ")}
                                            </p>
                                            <div className="d-flex mt-2 small">
                                                {restaurant.offersDelivery && (
                                                    <span className={`me-3 ${orderPreference === "delivery" ? "fw-bold" : ""}`}>
                                                        <i className="bi bi-truck me-1"></i>Delivery
                                                    </span>
                                                )}
                                                {restaurant.offersPickup && (
                                                    <span className={orderPreference === "pickup" ? "fw-bold" : ""}>
                                                        <i className="bi bi-box-seam me-1"></i>Pickup
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default Restaurants; 
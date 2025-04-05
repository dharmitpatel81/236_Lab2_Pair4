import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { createRestaurantOwner } from "../../redux/slices/owner/ownerSlice"; //
import NavbarDark from "../Common/NavbarDark";
import { validateEmail, validatePhone } from "../../utils/validation";

const OwnerSignup = () => {
    const [restaurant, setRestaurant] = useState({
        name: "",
        email: "",
        password: "",
        description: "",
        phone: "",
        address: {
            street: "",
            city: "",
            state: "",
            country: "USA",
            zipCode: ""
        },
        imageUrl: null,
        operatingHours: {
            monday: { open: "09:00", close: "21:00" },
            tuesday: { open: "09:00", close: "21:00" },
            wednesday: { open: "09:00", close: "21:00" },
            thursday: { open: "09:00", close: "21:00" },
            friday: { open: "09:00", close: "21:00" },
            saturday: { open: "09:00", close: "21:00" },
            sunday: { open: "09:00", close: "21:00" }
        },
        offersDelivery: true,
        offersPickup: true
    });

    const [validationErrors, setValidationErrors] = useState({
        email: "",
        phone: ""
    });

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error } = useSelector((state) => state.restaurantOwner);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Handle nested properties
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setRestaurant({
                ...restaurant,
                [parent]: {
                    ...restaurant[parent],
                    [child]: value
                }
            });
        } else {
            setRestaurant({ ...restaurant, [name]: value });
        }
        
        // Clear validation errors when user types
        if (name === 'email' || name === 'phone') {
            setValidationErrors({
                ...validationErrors,
                [name]: ""
            });
        }
    };

    // Handle Pictures through our upload route using multer
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
    
        const formData = new FormData();
        formData.append("image_url", file);
    
        try {
            const response = await axios.post("http://127.0.0.1:3000/api/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setRestaurant({ ...restaurant, imageUrl: response.data.filePath }); // Storing file path
        } catch (error) {
            console.error("File upload failed", error);
        }
    };

    // Sending json data to reducer
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate email and phone before submission
        let isValid = true;
        const newValidationErrors = { email: "", phone: "" };
        
        if (!validateEmail(restaurant.email)) {
            newValidationErrors.email = "Please enter a valid email address";
            isValid = false;
        }
        
        if (!validatePhone(restaurant.phone)) {
            newValidationErrors.phone = "Please enter a valid 10-digit phone number";
            isValid = false;
        }
        
        if (!isValid) {
            setValidationErrors(newValidationErrors);
            return;
        }
        
        console.log("Submitting restaurant data:", restaurant);
        await dispatch(createRestaurantOwner(restaurant));
        navigate("/owner/login", { state: { accountCreated: true } });
    };

    return (
        <div className="container-fluid px-0">
            <NavbarDark />
            {/* Back Button */}
            <button className="btn text-dark border-0 d-flex align-items-center mt-3 ms-3 fw-bold" 
                style={{ backgroundColor: 'transparent' }} 
                onClick={() => navigate('/')}>
                <span className="fs-5 me-1">←</span><u>Back to Home</u>
            </button>
            <h3 className="text-center mt-4 mb-4 fw-bold">Create a Restaurant Account</h3>
            {loading && <p className="text-center text-primary">Loading...</p>}
            {error && <p className="text-center text-danger">{error.message || "An error occurred"}</p>}

            <form onSubmit={handleSubmit} className="w-50 mx-auto">
                <div className="row">
                    <div className="col-md-6">
                        <div className="mb-3">
                            <label htmlFor="name" className="form-label my-0">
                                Restaurant Name <span className="text-danger">*</span>
                            </label>
                            <input type="text" className="form-control" name="name" value={restaurant.name} onChange={handleChange} required />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="phone" className="form-label my-0">
                                Phone <span className="text-danger">*</span>
                            </label>
                            <input 
                                type="tel" 
                                className="form-control" 
                                name="phone" 
                                value={restaurant.phone} 
                                onChange={handleChange} 
                                pattern="[0-9]*" 
                                inputMode="numeric"
                                required 
                            />
                            {validationErrors.phone && <div className="text-danger">{validationErrors.phone}</div>}
                        </div>
                        <div className="mb-3">
                            <label htmlFor="email" className="form-label my-0">
                                Email <span className="text-danger">*</span>
                            </label>
                            <input type="email" className="form-control" name="email" value={restaurant.email} onChange={handleChange} required />
                            {validationErrors.email && <div className="text-danger">{validationErrors.email}</div>}
                        </div>
                        <div className="mb-3">
                            <label htmlFor="password" className="form-label my-0">
                                Password <span className="text-danger">*</span>
                            </label>
                            <input type="password" className="form-control" name="password" value={restaurant.password} onChange={handleChange} required />
                        </div>
                    </div>

                    <div className="col-md-6">
                        <div className="mb-3">
                            <label htmlFor="description" className="form-label my-0">
                                Description <span className="text-danger">*</span>
                            </label>
                            <input type="text" className="form-control" name="description" value={restaurant.description} onChange={handleChange} required />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="address.street" className="form-label my-0">
                                Street <span className="text-danger">*</span>
                            </label>
                            <input type="text" className="form-control" name="address.street" value={restaurant.address.street} onChange={handleChange} required />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="address.city" className="form-label my-0">
                                City <span className="text-danger">*</span>
                            </label>
                            <input type="text" className="form-control" name="address.city" value={restaurant.address.city} onChange={handleChange} required />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="address.state" className="form-label my-0">
                                State <span className="text-danger">*</span>
                            </label>
                            <input type="text" className="form-control" name="address.state" value={restaurant.address.state} onChange={handleChange} required />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="address.zipCode" className="form-label my-0">
                                Zip Code <span className="text-danger">*</span>
                            </label>
                            <input type="text" className="form-control" name="address.zipCode" value={restaurant.address.zipCode} onChange={handleChange} required />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="imageUrl" className="form-label my-0">
                                Upload a Profile Picture (Optional)
                            </label>
                            <input type="file" className="form-control" name="imageUrl" onChange={handleFileChange} />
                        </div>
                    </div>
                </div>

                <div className="d-flex justify-content-center">
                    <button type="submit" className="btn btn-dark ms-2 rounded-1 p-2 w-20">
                        {loading ? "Signing Up..." : "Sign Up"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default OwnerSignup;

import axios from 'axios';

// Set default base URL
axios.defaults.baseURL = 'http://127.0.0.1:3000';

// Attaching JWT to requests for authorization
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axios; 
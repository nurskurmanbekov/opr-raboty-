import axios from 'axios';

// Smart API URL detection for local network access
const getApiUrl = () => {
  // 1. If environment variable is set - use it (highest priority)
  if (import.meta.env.VITE_API_URL) {
    console.log('🔧 [axios.js] Using VITE_API_URL from .env:', import.meta.env.VITE_API_URL);
    return import.meta.env.VITE_API_URL;
  }

  // 2. If accessing via localhost/127.0.0.1 - use localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🏠 [axios.js] Accessing via localhost - using localhost API');
    return 'http://localhost:5000/api';
  }

  // 3. If accessing via IP address - use the same IP for API (network access)
  const hostname = window.location.hostname;
  const apiUrl = `http://${hostname}:5000/api`;
  console.log('🌐 [axios.js] Accessing via network IP - using:', apiUrl);
  return apiUrl;
};

const API_URL = getApiUrl();
console.log('✅ [axios.js] Final API_URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor для добавления токена
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ВАЖНО: Замените на ваш IP адрес!
const API_URL = 'http://10.99.7.91:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor для добавления токена
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
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
      // Токен истек - очистить хранилище
      AsyncStorage.clear();
    }
    return Promise.reject(error);
  }
);

export default api;
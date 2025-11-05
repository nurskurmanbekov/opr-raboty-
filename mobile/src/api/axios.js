import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ВАЖНО: Замените на IP адрес вашего компьютера!
// Для поиска IP:
// - Windows: ipconfig (найдите IPv4 Address)
// - Mac/Linux: ifconfig (найдите inet)
// - Не используйте localhost или 127.0.0.1!
const API_URL = 'http://192.168.1.100:5000/api'; // <-- ЗАМЕНИТЕ НА ВАШ IP!

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 секунд
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
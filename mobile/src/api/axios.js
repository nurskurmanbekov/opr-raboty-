import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// НАСТРОЙКА API URL:
//
// Для Android Эмулятора используйте: 10.0.2.2
// Для реального устройства: найдите IP адрес вашего компьютера
//   - Windows: откройте CMD и введите: ipconfig
//     Найдите "IPv4 Address" (например: 192.168.1.5)
//   - Mac/Linux: откройте Terminal и введите: ifconfig | grep "inet "
//
// ВАЖНО: Компьютер и телефон должны быть в одной WiFi сети!

const getApiUrl = () => {
  // Для Android эмулятора используем специальный адрес
  if (Platform.OS === 'android' && !__DEV__) {
    return 'http://10.0.2.2:5000/api';
  }

  // ВАШ IP АДРЕС ЗДЕСЬ (замените на свой!)
  // Пример: return 'http://192.168.1.5:5000/api';
  return 'http://10.0.2.2:5000/api'; // <-- ИЗМЕНИТЕ ЕСЛИ ИСПОЛЬЗУЕТЕ РЕАЛЬНОЕ УСТРОЙСТВО!
};

const API_URL = getApiUrl();

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
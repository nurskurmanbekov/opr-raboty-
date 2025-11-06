import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// НАСТРОЙКА API URL:
//
// Использует переменную окружения EXPO_PUBLIC_API_URL из .env файла
// Или автоматически определяет IP для эмулятора/реального устройства
//
// Для реального устройства: создайте файл mobile/.env:
//   EXPO_PUBLIC_API_URL=http://10.99.7.91:5000/api
//
// ВАЖНО: Компьютер и телефон должны быть в одной WiFi сети!

const getApiUrl = () => {
  // Приоритет 1: Переменная окружения из .env файла
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Приоритет 2: Для реального устройства используем ваш локальный IP
  // IP адрес компьютера в локальной сети
  const LOCAL_IP = '10.99.7.91'; // <-- Ваш IP адрес

  // Для Android эмулятора используем специальный адрес
  if (Platform.OS === 'android' && __DEV__) {
    // В dev режиме проверяем тип устройства
    return `http://10.0.2.2:5000/api`; // Для эмулятора
  }

  // Для всех остальных случаев (реальное устройство iOS/Android)
  return `http://${LOCAL_IP}:5000/api`;
};

const API_URL = getApiUrl();

// Debug: показываем используемый URL в консоли
console.log('📡 Mobile API URL:', API_URL);

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
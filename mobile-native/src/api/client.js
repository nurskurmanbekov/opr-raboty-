/**
 * API Client for Mobile Application
 * Connects to: http://85.113.27.42:8090/api
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://85.113.27.42:8090/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  async config => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  response => response.data,
  async error => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
    }

    return Promise.reject(error.response?.data || error);
  },
);

// ============ AUTH API ============
export const authAPI = {
  login: (email, password) =>
    apiClient.post('/auth/login', {email, password}),
  register: data => apiClient.post('/auth/register', data),
  getCurrentUser: () => apiClient.get('/auth/me'),
  logout: () => apiClient.post('/auth/logout'),
  refreshToken: () => apiClient.post('/auth/refresh'),
};

// ============ WORK SESSIONS API ============
export const workSessionsAPI = {
  getWorkSessions: params => apiClient.get('/work-sessions', {params}),
  getWorkSession: id => apiClient.get(`/work-sessions/${id}`),
  createWorkSession: data => apiClient.post('/work-sessions', data),
  startWorkSession: data => apiClient.post('/work-sessions/start', data),
  endWorkSession: (id, data) =>
    apiClient.put(`/work-sessions/${id}/end`, data),
  updateWorkSession: (id, data) =>
    apiClient.put(`/work-sessions/${id}`, data),
  uploadPhoto: (workSessionId, formData) =>
    apiClient.post(`/work-sessions/${workSessionId}/photos`, formData, {
      headers: {'Content-Type': 'multipart/form-data'},
    }),
  updateLocation: (workSessionId, data) =>
    apiClient.post(`/work-sessions/${workSessionId}/location`, data),
};

// ============ CLIENTS API ============
export const clientsAPI = {
  getClients: params => apiClient.get('/clients', {params}),
  getClient: id => apiClient.get(`/clients/${id}`),
  getAssignedClients: () => apiClient.get('/clients/assigned'),
  updateClient: (id, data) => apiClient.put(`/clients/${id}`, data),
};

// ============ GPS/GEOFENCE API ============
export const gpsAPI = {
  updateLocation: data => apiClient.post('/gps/location', data),
  checkGeofence: data => apiClient.post('/geofences/check', data),
  getViolations: params => apiClient.get('/geofences/violations', {params}),
};

// ============ NOTIFICATIONS API ============
export const notificationsAPI = {
  registerDevice: data => apiClient.post('/notifications/device-token', data),
  unregisterDevice: data =>
    apiClient.delete('/notifications/device-token', {data}),
  getNotifications: params => apiClient.get('/notifications', {params}),
  getUnreadCount: () => apiClient.get('/notifications/unread-count'),
  markAsRead: id => apiClient.put(`/notifications/${id}/read`),
  markAllAsRead: () => apiClient.put('/notifications/read-all'),
};

// ============ PROFILE API ============
export const profileAPI = {
  getProfile: () => apiClient.get('/profile/me'),
  updateProfile: data => apiClient.put('/profile/me', data),
  changePassword: data => apiClient.put('/profile/password', data),
  uploadPhoto: formData =>
    apiClient.post('/profile/photo', formData, {
      headers: {'Content-Type': 'multipart/form-data'},
    }),
};

// ============ FACE VERIFICATION API ============
export const faceVerificationAPI = {
  verifyFace: formData =>
    apiClient.post('/face-verification/verify', formData, {
      headers: {'Content-Type': 'multipart/form-data'},
    }),
  registerFace: formData =>
    apiClient.post('/face-verification/register', formData, {
      headers: {'Content-Type': 'multipart/form-data'},
    }),
};

// ============ SYNC API ============
export const syncAPI = {
  batchSync: data => apiClient.post('/sync/batch', data),
  getPendingItems: params => apiClient.get('/sync/pending', {params}),
  getQueueStatus: params => apiClient.get('/sync/status', {params}),
};

export default apiClient;

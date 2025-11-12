/**
 * API Client for Mobile App
 * Centralized API communication layer with offline support
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';

// Production API URL - внешний IP с NAT на MikroTik
// 85.113.27.42:8090 -> 10.99.7.91:5000
const API_URL = 'http://85.113.27.42:8090/api';
console.log('📡 Mobile API Client URL:', API_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Network status
let isConnected = true;

NetInfo.addEventListener(state => {
  isConnected = state.isConnected;
});

// Request interceptor - add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token
      await AsyncStorage.removeItem('token');
      // Navigation should be handled by the app
    }

    return Promise.reject(error.response?.data || error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  getCurrentUser: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout')
};

// Clients API
export const clientsAPI = {
  getClients: (params) => api.get('/clients', { params }),
  getClient: (id) => api.get(`/clients/${id}`),
  createClient: (data) => api.post('/clients', data),
  updateClient: (id, data) => api.put(`/clients/${id}`, data)
};

// Work Sessions API
export const workSessionsAPI = {
  getWorkSessions: (params) => api.get('/work-sessions', { params }),
  getWorkSession: (id) => api.get(`/work-sessions/${id}`),
  createWorkSession: (data) => api.post('/work-sessions', data),
  startWorkSession: (data) => api.post('/work-sessions/start', data),
  endWorkSession: (id, data) => api.put(`/work-sessions/${id}/end`, data),
  uploadPhoto: (workSessionId, formData) =>
    api.post(`/work-sessions/${workSessionId}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  updateLocation: (workSessionId, data) =>
    api.post(`/work-sessions/${workSessionId}/location`, data)
};

// Profile API
export const profileAPI = {
  getProfile: () => api.get('/profile/me'),
  updateProfile: (data) => api.put('/profile/me', data),
  changePassword: (data) => api.put('/profile/password', data),
  uploadPhoto: (formData) =>
    api.post('/profile/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
};

// Geofences API
export const geofencesAPI = {
  getGeofences: (params) => api.get('/geofences', { params }),
  checkGeofence: (data) => api.post('/geofences/check', data),
  getViolations: (params) => api.get('/geofences/violations', { params })
};

// Notifications API
export const notificationsAPI = {
  registerDevice: (data) => api.post('/notifications/device-token', data),
  unregisterDevice: (data) => api.delete('/notifications/device-token', { data }),
  getNotifications: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all')
};

// Face Verification API
export const faceVerificationAPI = {
  registerFace: (formData) =>
    api.post('/face-verification/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  verifyFace: (formData) =>
    api.post('/face-verification/verify', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  getHistory: (params) => api.get('/face-verification/history', { params }),
  getStats: (params) => api.get('/face-verification/stats', { params })
};

// Sync API
export const syncAPI = {
  batchSync: (data) => api.post('/sync/batch', data),
  processQueue: (params) => api.post('/sync/process', null, { params }),
  getQueueStatus: (params) => api.get('/sync/status', { params }),
  getPendingItems: (params) => api.get('/sync/pending', { params }),
  getConflicts: (params) => api.get('/sync/conflicts', { params }),
  resolveConflict: (id, resolution) =>
    api.put(`/sync/conflicts/${id}/resolve`, { resolution }),
  clearCompleted: (params) => api.delete('/sync/completed', { params }),
  retryFailed: (params) => api.post('/sync/retry-failed', null, { params })
};

// Analytics API
export const analyticsAPI = {
  getOverallStats: (params) => api.get('/analytics/overall', { params }),
  getClientPerformance: (clientId, params) =>
    api.get(`/analytics/client/${clientId}`, { params }),
  getTimeSeriesData: (type, params) =>
    api.get(`/analytics/timeseries/${type}`, { params })
};

// Check if device is online
export const checkConnection = async () => {
  const state = await NetInfo.fetch();
  return state.isConnected;
};

// Get connection type
export const getConnectionType = async () => {
  const state = await NetInfo.fetch();
  return state.type;
};

export { isConnected };
export default api;

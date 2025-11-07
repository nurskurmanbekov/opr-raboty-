/**
 * API Client
 * Centralized API communication layer
 */

import axios from 'axios';

// Vite uses import.meta.env instead of process.env
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - add auth token
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

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    return Promise.reject(error.response?.data || error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  getCurrentUser: () => api.get('/auth/me'),
  refreshToken: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout')
};

// Users API
export const usersAPI = {
  getUsers: (params) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  createUser: (data) => api.post('/users', data),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  updateUserRole: (id, role) => api.put(`/users/${id}/role`, { role }),
  assignDistrict: (id, district) => api.put(`/users/${id}/district`, { district }),
  deactivateUser: (id) => api.put(`/users/${id}/deactivate`),
  activateUser: (id) => api.put(`/users/${id}/activate`)
};

// Clients API
export const clientsAPI = {
  getClients: (params) => api.get('/clients', { params }),
  getClient: (id) => api.get(`/clients/${id}`),
  createClient: (data) => api.post('/clients', data),
  updateClient: (id, data) => api.put(`/clients/${id}`, data),
  deleteClient: (id) => api.delete(`/clients/${id}`)
};

// Work Sessions API
export const workSessionsAPI = {
  getWorkSessions: (params) => api.get('/work-sessions', { params }),
  getWorkSession: (id) => api.get(`/work-sessions/${id}`),
  createWorkSession: (data) => api.post('/work-sessions', data),
  updateWorkSession: (id, data) => api.put(`/work-sessions/${id}`, data),
  deleteWorkSession: (id) => api.delete(`/work-sessions/${id}`),
  startWorkSession: (data) => api.post('/work-sessions/start', data),
  endWorkSession: (id, data) => api.put(`/work-sessions/${id}/end`, data),
  verifyWorkSession: (id, data) => api.put(`/work-sessions/${id}/verify`, data),
  rejectWorkSession: (id, data) => api.put(`/work-sessions/${id}/reject`, data),
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
  getGeofence: (id) => api.get(`/geofences/${id}`),
  createGeofence: (data) => api.post('/geofences', data),
  updateGeofence: (id, data) => api.put(`/geofences/${id}`, data),
  deleteGeofence: (id) => api.delete(`/geofences/${id}`),
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
  markAllAsRead: () => api.put('/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
  sendNotification: (data) => api.post('/notifications/send', data),
  testNotification: () => api.post('/notifications/test')
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
  getHistoryByUser: (userId, params) =>
    api.get(`/face-verification/history/${userId}`, { params }),
  getStats: (params) => api.get('/face-verification/stats', { params }),
  getStatsByUser: (userId, params) =>
    api.get(`/face-verification/stats/${userId}`, { params }),
  getVerification: (id) => api.get(`/face-verification/${id}`),
  deleteFaceRegistration: (userId) =>
    api.delete(`/face-verification/${userId}`)
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
  retryFailed: (params) => api.post('/sync/retry-failed', null, { params }),
  deleteQueueItem: (id) => api.delete(`/sync/${id}`)
};

// Analytics API
export const analyticsAPI = {
  getOverallStats: (params) => api.get('/analytics/overall', { params }),
  getClientPerformance: (clientId, params) =>
    api.get(`/analytics/client/${clientId}`, { params }),
  getOfficerPerformance: (officerId, params) =>
    api.get(`/analytics/officer/${officerId}`, { params }),
  getDistrictStats: (district, params) =>
    api.get(`/analytics/district/${district}`, { params }),
  getTimeSeriesData: (type, params) =>
    api.get(`/analytics/timeseries/${type}`, { params }),
  exportToExcel: (params) =>
    api.get('/analytics/export/excel', {
      params,
      responseType: 'blob'
    }),
  exportToPDF: (params) =>
    api.get('/analytics/export/pdf', {
      params,
      responseType: 'blob'
    })
};

// МРУ API
export const mruAPI = {
  getAllMRU: (params) => api.get('/mru', { params }),
  getMRU: (id) => api.get(`/mru/${id}`),
  getMRUStats: (id) => api.get(`/mru/${id}/stats`),
  createMRU: (data) => api.post('/mru', data),
  updateMRU: (id, data) => api.put(`/mru/${id}`, data),
  deleteMRU: (id) => api.delete(`/mru/${id}`)
};

// Districts API
export const districtsAPI = {
  getAllDistricts: (params) => api.get('/districts', { params }),
  getDistrict: (id) => api.get(`/districts/${id}`),
  getDistrictStats: (id) => api.get(`/districts/${id}/stats`),
  createDistrict: (data) => api.post('/districts', data),
  updateDistrict: (id, data) => api.put(`/districts/${id}`, data),
  deleteDistrict: (id) => api.delete(`/districts/${id}`)
};

// Approvals API
export const approvalsAPI = {
  getAllApprovals: (params) => api.get('/approvals', { params }),
  getApproval: (id) => api.get(`/approvals/${id}`),
  createOfficerApproval: (data) => api.post('/approvals/officer', data),
  createClientApproval: (data) => api.post('/approvals/client', data),
  approveApproval: (id, data) => api.post(`/approvals/${id}/approve`, data),
  rejectApproval: (id, data) => api.post(`/approvals/${id}/reject`, data)
};

// Client Reassignment API
export const reassignmentAPI = {
  reassignClient: (clientId, data) => api.post(`/clients/${clientId}/reassign`, data),
  getAssignmentHistory: (clientId) => api.get(`/clients/${clientId}/assignment-history`),
  reassignAllClients: (officerId, data) => api.post(`/officers/${officerId}/reassign-all-clients`, data)
};

// Auditor API
export const auditorAPI = {
  setPermissions: (userId, data) => api.post(`/auditors/${userId}/permissions`, data),
  getPermissions: (userId) => api.get(`/auditors/${userId}/permissions`),
  getOverviewStatistics: (params) => api.get('/auditors/statistics/overview', { params }),
  getStatisticsByMRU: (params) => api.get('/auditors/statistics/by-mru', { params }),
  getStatisticsByDistrict: (params) => api.get('/auditors/statistics/by-district', { params })
};

// Export API
export const exportAPI = {
  exportStatisticsToExcel: (params) =>
    api.get('/export/statistics/excel', {
      params,
      responseType: 'blob'
    }),
  exportClientsToExcel: (params) =>
    api.get('/export/clients/excel', {
      params,
      responseType: 'blob'
    })
};

export default api;

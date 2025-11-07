/**
 * Storage Service - AsyncStorage Wrapper
 * Handles offline data persistence and sync queue
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

class StorageService {
  // ============ AUTH STORAGE ============
  async setAuthToken(token) {
    try {
      await AsyncStorage.setItem('authToken', token);
    } catch (error) {
      console.error('Error saving auth token:', error);
    }
  }

  async getAuthToken() {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  async removeAuthToken() {
    try {
      await AsyncStorage.removeItem('authToken');
    } catch (error) {
      console.error('Error removing auth token:', error);
    }
  }

  // ============ USER STORAGE ============
  async setUser(user) {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      console.error('Error saving user:', error);
    }
  }

  async getUser() {
    try {
      const user = await AsyncStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  async removeUser() {
    try {
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Error removing user:', error);
    }
  }

  // ============ OFFLINE QUEUE ============
  async queueOfflineAction(action) {
    try {
      const queue = await this.getOfflineQueue();
      queue.push({
        ...action,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
      });
      await AsyncStorage.setItem('offlineQueue', JSON.stringify(queue));
      console.log('Action queued for offline sync:', action.type);
    } catch (error) {
      console.error('Error queuing offline action:', error);
    }
  }

  async getOfflineQueue() {
    try {
      const queue = await AsyncStorage.getItem('offlineQueue');
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      console.error('Error getting offline queue:', error);
      return [];
    }
  }

  async clearOfflineQueue() {
    try {
      await AsyncStorage.setItem('offlineQueue', JSON.stringify([]));
    } catch (error) {
      console.error('Error clearing offline queue:', error);
    }
  }

  async removeFromQueue(actionId) {
    try {
      const queue = await this.getOfflineQueue();
      const filtered = queue.filter(item => item.id !== actionId);
      await AsyncStorage.setItem('offlineQueue', JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing from queue:', error);
    }
  }

  // ============ ACTIVE SESSION STORAGE ============
  async setActiveSession(session) {
    try {
      await AsyncStorage.setItem('activeSession', JSON.stringify(session));
    } catch (error) {
      console.error('Error saving active session:', error);
    }
  }

  async getActiveSession() {
    try {
      const session = await AsyncStorage.getItem('activeSession');
      return session ? JSON.parse(session) : null;
    } catch (error) {
      console.error('Error getting active session:', error);
      return null;
    }
  }

  async removeActiveSession() {
    try {
      await AsyncStorage.removeItem('activeSession');
    } catch (error) {
      console.error('Error removing active session:', error);
    }
  }

  // ============ CACHED DATA ============
  async setCachedClients(clients) {
    try {
      await AsyncStorage.setItem('cachedClients', JSON.stringify(clients));
    } catch (error) {
      console.error('Error caching clients:', error);
    }
  }

  async getCachedClients() {
    try {
      const clients = await AsyncStorage.getItem('cachedClients');
      return clients ? JSON.parse(clients) : [];
    } catch (error) {
      console.error('Error getting cached clients:', error);
      return [];
    }
  }

  async setCachedSessions(sessions) {
    try {
      await AsyncStorage.setItem('cachedSessions', JSON.stringify(sessions));
    } catch (error) {
      console.error('Error caching sessions:', error);
    }
  }

  async getCachedSessions() {
    try {
      const sessions = await AsyncStorage.getItem('cachedSessions');
      return sessions ? JSON.parse(sessions) : [];
    } catch (error) {
      console.error('Error getting cached sessions:', error);
      return [];
    }
  }

  // ============ SETTINGS ============
  async setSetting(key, value) {
    try {
      await AsyncStorage.setItem(`setting_${key}`, JSON.stringify(value));
    } catch (error) {
      console.error(`Error saving setting ${key}:`, error);
    }
  }

  async getSetting(key, defaultValue = null) {
    try {
      const value = await AsyncStorage.getItem(`setting_${key}`);
      return value ? JSON.parse(value) : defaultValue;
    } catch (error) {
      console.error(`Error getting setting ${key}:`, error);
      return defaultValue;
    }
  }

  // ============ CLEAR ALL DATA ============
  async clearAll() {
    try {
      await AsyncStorage.clear();
      console.log('All storage cleared');
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }

  // ============ GET STORAGE INFO ============
  async getStorageInfo() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const items = await AsyncStorage.multiGet(keys);

      let totalSize = 0;
      items.forEach(([key, value]) => {
        totalSize += value ? value.length : 0;
      });

      return {
        itemCount: keys.length,
        totalSize: totalSize,
        keys: keys,
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return {itemCount: 0, totalSize: 0, keys: []};
    }
  }
}

export default new StorageService();

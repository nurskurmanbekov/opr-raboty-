/**
 * Sync Service - Offline Data Synchronization
 * Handles syncing queued actions when connection is restored
 */

import NetInfo from '@react-native-community/netinfo';
import {syncAPI, workSessionsAPI} from '../api/client';
import StorageService from './storage';

class SyncService {
  constructor() {
    this.isSyncing = false;
    this.syncInterval = null;
    this.isOnline = true;

    // Listen to network changes
    this.setupNetworkListener();
  }

  // Setup network state listener
  setupNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected;

      console.log('Network status:', {
        isConnected: state.isConnected,
        type: state.type,
      });

      // If just came back online, sync
      if (wasOffline && this.isOnline) {
        console.log('Connection restored, starting sync...');
        this.syncNow();
      }
    });
  }

  // Start periodic sync (every 5 minutes when online)
  startPeriodicSync() {
    if (this.syncInterval) {
      return;
    }

    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.syncNow();
      }
    }, 5 * 60 * 1000); // 5 minutes

    console.log('Periodic sync started');
  }

  // Stop periodic sync
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('Periodic sync stopped');
    }
  }

  // Check if online
  async checkConnection() {
    const state = await NetInfo.fetch();
    this.isOnline = state.isConnected;
    return this.isOnline;
  }

  // Sync now
  async syncNow() {
    if (this.isSyncing) {
      console.log('Sync already in progress');
      return;
    }

    const isOnline = await this.checkConnection();
    if (!isOnline) {
      console.log('Cannot sync - offline');
      return;
    }

    this.isSyncing = true;

    try {
      const queue = await StorageService.getOfflineQueue();

      if (queue.length === 0) {
        console.log('No items to sync');
        this.isSyncing = false;
        return;
      }

      console.log(`Syncing ${queue.length} queued items...`);

      let successCount = 0;
      let failCount = 0;

      // Process each queued action
      for (const action of queue) {
        try {
          await this.processAction(action);
          await StorageService.removeFromQueue(action.id);
          successCount++;
        } catch (error) {
          console.error('Failed to sync action:', action.type, error);
          failCount++;
        }
      }

      console.log(
        `Sync completed: ${successCount} success, ${failCount} failed`,
      );
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  // Process individual action
  async processAction(action) {
    switch (action.type) {
      case 'UPDATE_LOCATION':
        await workSessionsAPI.updateLocation(action.sessionId, action.data);
        break;

      case 'START_SESSION':
        await workSessionsAPI.startWorkSession(action.data);
        break;

      case 'END_SESSION':
        await workSessionsAPI.endWorkSession(action.sessionId, action.data);
        break;

      case 'UPLOAD_PHOTO':
        await workSessionsAPI.uploadPhoto(action.sessionId, action.formData);
        break;

      case 'UPDATE_SESSION':
        await workSessionsAPI.updateWorkSession(action.sessionId, action.data);
        break;

      default:
        console.warn('Unknown action type:', action.type);
    }
  }

  // Get sync status
  async getSyncStatus() {
    const queue = await StorageService.getOfflineQueue();
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      queueLength: queue.length,
      pendingActions: queue,
    };
  }

  // Force sync
  async forceSyncNow() {
    console.log('Force sync requested');
    await this.syncNow();
  }

  // Clear failed items
  async clearFailedItems() {
    await StorageService.clearOfflineQueue();
    console.log('Offline queue cleared');
  }

  // Batch sync (send multiple items at once)
  async batchSync() {
    if (!this.isOnline) {
      console.log('Cannot batch sync - offline');
      return;
    }

    try {
      const queue = await StorageService.getOfflineQueue();

      if (queue.length === 0) {
        return;
      }

      // Group actions by type
      const batches = {
        locations: [],
        photos: [],
        sessions: [],
      };

      queue.forEach(action => {
        if (action.type === 'UPDATE_LOCATION') {
          batches.locations.push(action.data);
        } else if (action.type === 'UPLOAD_PHOTO') {
          batches.photos.push(action);
        } else {
          batches.sessions.push(action);
        }
      });

      // Send batch sync request
      await syncAPI.batchSync(batches);

      // Clear queue on success
      await StorageService.clearOfflineQueue();

      console.log('Batch sync completed successfully');
    } catch (error) {
      console.error('Batch sync failed:', error);
      throw error;
    }
  }
}

export default new SyncService();

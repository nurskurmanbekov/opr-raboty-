/**
 * Auto Sync Service
 * Автоматическая синхронизация оффлайн данных
 *
 * Отслеживает интернет соединение и автоматически синхронизирует
 * GPS координаты, фото и другие данные когда появляется интернет
 */

import NetInfo from '@react-native-community/netinfo';
import offlineQueue from './offlineQueue';
import { workSessionsAPI } from '../api/api';

const SYNC_INTERVAL = 60000; // Проверять каждую минуту
const MAX_RETRIES = 5; // Максимум попыток отправки

class AutoSync {
  constructor() {
    this.isRunning = false;
    this.isSyncing = false;
    this.syncInterval = null;
    this.netInfoUnsubscribe = null;
    this.listeners = [];
  }

  /**
   * Запустить автосинхронизацию
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ Auto sync already running');
      return;
    }

    console.log('🚀 Starting auto sync service');
    this.isRunning = true;

    // Подписаться на изменения сети
    this.netInfoUnsubscribe = NetInfo.addEventListener(state => {
      console.log('📡 Network state changed:', state.isConnected ? 'Online' : 'Offline');

      // Если появился интернет - запустить синхронизацию
      if (state.isConnected && !this.isSyncing) {
        console.log('✅ Internet restored, starting sync...');
        this.syncNow();
      }
    });

    // Периодическая синхронизация (раз в минуту если онлайн)
    this.syncInterval = setInterval(async () => {
      const state = await NetInfo.fetch();
      if (state.isConnected && !this.isSyncing) {
        const stats = await offlineQueue.getStats();
        if (stats.pending > 0) {
          console.log(`🔄 Periodic sync: ${stats.pending} pending items`);
          this.syncNow();
        }
      }
    }, SYNC_INTERVAL);

    // Первоначальная синхронизация при старте
    this.syncNow();
  }

  /**
   * Остановить автосинхронизацию
   */
  stop() {
    console.log('🛑 Stopping auto sync service');
    this.isRunning = false;

    if (this.netInfoUnsubscribe) {
      this.netInfoUnsubscribe();
      this.netInfoUnsubscribe = null;
    }

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Добавить слушатель событий синхронизации
   */
  addListener(listener) {
    this.listeners.push(listener);
  }

  /**
   * Удалить слушатель
   */
  removeListener(listener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * Уведомить слушателей
   */
  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Error in sync listener:', error);
      }
    });
  }

  /**
   * Синхронизировать сейчас
   */
  async syncNow() {
    // Проверить интернет
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      console.log('📵 No internet connection, skipping sync');
      return { success: false, message: 'No internet' };
    }

    // Если уже синхронизируется
    if (this.isSyncing) {
      console.log('⏳ Sync already in progress, skipping');
      return { success: false, message: 'Sync in progress' };
    }

    this.isSyncing = true;
    this.notifyListeners('sync_started', {});

    try {
      const stats = await offlineQueue.getStats();
      console.log(`🔄 Starting sync: ${stats.pending} pending items`);

      if (stats.pending === 0) {
        console.log('✅ Nothing to sync');
        this.notifyListeners('sync_completed', { synced: 0, failed: 0 });
        return { success: true, synced: 0, failed: 0 };
      }

      let syncedCount = 0;
      let failedCount = 0;

      // Получить пачку элементов (по 50)
      const batch = await offlineQueue.getBatch(50);

      console.log(`📦 Processing batch of ${batch.length} items`);

      // Обработать каждый элемент
      for (const item of batch) {
        try {
          // Отметить как обрабатываемый
          await offlineQueue.markAsProcessing(item.id);

          // Выполнить операцию
          await this.processItem(item);

          // Отметить как выполненный
          await offlineQueue.markAsCompleted(item.id);
          syncedCount++;

          console.log(`✅ Synced: ${item.operation} (${item.id})`);

          // Уведомить о прогрессе
          this.notifyListeners('sync_progress', {
            current: syncedCount + failedCount,
            total: batch.length,
            item
          });

        } catch (error) {
          console.error(`❌ Failed to sync: ${item.operation}`, error);

          // Отметить как неудачный
          await offlineQueue.markAsFailed(item.id, error);
          failedCount++;

          // Если превышен лимит попыток - удалить из очереди
          if (item.retryCount >= MAX_RETRIES) {
            console.warn(`🗑️ Max retries exceeded, removing: ${item.id}`);
            await offlineQueue.removeItem(item.id);
          }
        }
      }

      console.log(`✅ Sync completed: ${syncedCount} synced, ${failedCount} failed`);

      this.notifyListeners('sync_completed', {
        synced: syncedCount,
        failed: failedCount
      });

      // Очистить старые выполненные элементы
      await offlineQueue.clearCompleted(7);

      return {
        success: true,
        synced: syncedCount,
        failed: failedCount
      };

    } catch (error) {
      console.error('❌ Sync error:', error);
      this.notifyListeners('sync_error', { error });
      return {
        success: false,
        error: error.message
      };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Обработать один элемент очереди
   */
  async processItem(item) {
    const { operation, data } = item;

    switch (operation) {
      case 'update_location':
        // Отправить GPS координаты
        return await workSessionsAPI.updateLocation(
          data.workSessionId,
          {
            latitude: data.latitude,
            longitude: data.longitude,
            accuracy: data.accuracy,
            altitude: data.altitude,
            speed: data.speed,
            heading: data.heading,
            timestamp: data.timestamp || item.timestamp
          }
        );

      case 'create_work_session':
        // Создать рабочую сессию
        return await workSessionsAPI.startWorkSession(data);

      case 'update_work_session':
        // Обновить рабочую сессию (например, завершить)
        return await workSessionsAPI.endWorkSession(
          data.workSessionId,
          data
        );

      case 'upload_photo':
        // Загрузить фото
        const formData = new FormData();
        formData.append('photo', {
          uri: data.photoUri,
          name: 'photo.jpg',
          type: 'image/jpeg'
        });
        return await workSessionsAPI.uploadPhoto(
          data.workSessionId,
          formData
        );

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  /**
   * Получить статус синхронизации
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      isSyncing: this.isSyncing
    };
  }
}

// Singleton instance
const autoSync = new AutoSync();

export default autoSync;

// Удобные функции
export const startAutoSync = () => autoSync.start();
export const stopAutoSync = () => autoSync.stop();
export const syncNow = () => autoSync.syncNow();
export const addSyncListener = (listener) => autoSync.addListener(listener);
export const removeSyncListener = (listener) => autoSync.removeListener(listener);
export const getSyncStatus = () => autoSync.getStatus();

/**
 * Offline Queue Service
 * Надежное хранение данных в оффлайн режиме
 *
 * Сохраняет GPS координаты, фото и другие данные локально
 * когда нет интернета, и автоматически синхронизирует при подключении
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = '@offline_queue';
const MAX_QUEUE_SIZE = 10000; // Максимум 10000 записей
const BATCH_SIZE = 50; // Отправлять по 50 записей за раз

/**
 * Структура элемента очереди:
 * {
 *   id: string (timestamp + random)
 *   operation: 'update_location' | 'upload_photo' | 'create_work_session' | 'update_work_session'
 *   data: object (данные для отправки)
 *   timestamp: number (когда создан)
 *   retryCount: number (сколько раз пробовали отправить)
 *   status: 'pending' | 'processing' | 'failed' | 'completed'
 * }
 */

class OfflineQueue {
  constructor() {
    this.queue = [];
    this.isLoaded = false;
    this.isSyncing = false;
  }

  /**
   * Инициализация - загрузить очередь из хранилища
   */
  async init() {
    if (this.isLoaded) return;

    try {
      const stored = await AsyncStorage.getItem(QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        console.log(`📦 Offline Queue loaded: ${this.queue.length} items`);
      } else {
        this.queue = [];
      }
      this.isLoaded = true;
    } catch (error) {
      console.error('❌ Error loading offline queue:', error);
      this.queue = [];
      this.isLoaded = true;
    }
  }

  /**
   * Сохранить очередь в хранилище
   */
  async save() {
    try {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
      console.log(`💾 Offline Queue saved: ${this.queue.length} items`);
    } catch (error) {
      console.error('❌ Error saving offline queue:', error);
    }
  }

  /**
   * Добавить элемент в очередь
   */
  async addToQueue(operation, data) {
    await this.init();

    // Проверка размера очереди
    if (this.queue.length >= MAX_QUEUE_SIZE) {
      console.warn('⚠️ Queue is full, removing oldest items');
      // Удаляем старые выполненные записи
      this.queue = this.queue.filter(item => item.status !== 'completed');

      // Если всё ещё переполнена, удаляем самые старые
      if (this.queue.length >= MAX_QUEUE_SIZE) {
        this.queue = this.queue.slice(-MAX_QUEUE_SIZE + 100);
      }
    }

    const item = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      operation,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending'
    };

    this.queue.push(item);
    await this.save();

    console.log(`➕ Added to queue: ${operation} (Queue size: ${this.queue.length})`);

    return item.id;
  }

  /**
   * Получить все ожидающие элементы
   */
  async getPendingItems() {
    await this.init();
    return this.queue.filter(item => item.status === 'pending');
  }

  /**
   * Получить статистику очереди
   */
  async getStats() {
    await this.init();

    const pending = this.queue.filter(item => item.status === 'pending').length;
    const processing = this.queue.filter(item => item.status === 'processing').length;
    const failed = this.queue.filter(item => item.status === 'failed').length;
    const completed = this.queue.filter(item => item.status === 'completed').length;

    return {
      total: this.queue.length,
      pending,
      processing,
      failed,
      completed
    };
  }

  /**
   * Отметить элемент как обрабатываемый
   */
  async markAsProcessing(id) {
    await this.init();
    const item = this.queue.find(i => i.id === id);
    if (item) {
      item.status = 'processing';
      await this.save();
    }
  }

  /**
   * Отметить элемент как выполненный
   */
  async markAsCompleted(id) {
    await this.init();
    const item = this.queue.find(i => i.id === id);
    if (item) {
      item.status = 'completed';
      item.completedAt = Date.now();
      await this.save();
    }
  }

  /**
   * Отметить элемент как неудачный
   */
  async markAsFailed(id, error) {
    await this.init();
    const item = this.queue.find(i => i.id === id);
    if (item) {
      item.status = 'failed';
      item.retryCount += 1;
      item.lastError = error?.message || 'Unknown error';
      item.lastAttempt = Date.now();
      await this.save();
    }
  }

  /**
   * Сбросить статус неудачных элементов для повторной попытки
   */
  async retryFailed() {
    await this.init();
    let count = 0;

    this.queue.forEach(item => {
      if (item.status === 'failed' && item.retryCount < 5) {
        item.status = 'pending';
        count++;
      }
    });

    if (count > 0) {
      await this.save();
      console.log(`🔄 Reset ${count} failed items to pending`);
    }

    return count;
  }

  /**
   * Очистить выполненные элементы (старше 7 дней)
   */
  async clearCompleted(olderThanDays = 7) {
    await this.init();
    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);

    const beforeCount = this.queue.length;
    this.queue = this.queue.filter(item => {
      if (item.status === 'completed' && item.completedAt) {
        return item.completedAt > cutoffTime;
      }
      return true;
    });

    const removed = beforeCount - this.queue.length;

    if (removed > 0) {
      await this.save();
      console.log(`🗑️ Cleaned up ${removed} completed items`);
    }

    return removed;
  }

  /**
   * Получить элементы пачкой для синхронизации
   */
  async getBatch(size = BATCH_SIZE) {
    await this.init();
    const pending = this.queue.filter(item => item.status === 'pending');
    return pending.slice(0, size);
  }

  /**
   * Удалить элемент из очереди
   */
  async removeItem(id) {
    await this.init();
    this.queue = this.queue.filter(item => item.id !== id);
    await this.save();
  }

  /**
   * Очистить всю очередь (только для отладки!)
   */
  async clearAll() {
    this.queue = [];
    await this.save();
    console.log('🗑️ Queue cleared');
  }

  /**
   * Получить размер очереди в байтах
   */
  async getStorageSize() {
    try {
      const stored = await AsyncStorage.getItem(QUEUE_KEY);
      if (stored) {
        return new Blob([stored]).size;
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Экспорт очереди для отладки
   */
  async export() {
    await this.init();
    return {
      timestamp: Date.now(),
      count: this.queue.length,
      stats: await this.getStats(),
      items: this.queue
    };
  }
}

// Singleton instance
const offlineQueue = new OfflineQueue();

export default offlineQueue;

// Удобные функции для быстрого доступа
export const addToQueue = (operation, data) => offlineQueue.addToQueue(operation, data);
export const getQueueStats = () => offlineQueue.getStats();
export const getPendingItems = () => offlineQueue.getPendingItems();
export const clearCompleted = (days) => offlineQueue.clearCompleted(days);
export const retryFailed = () => offlineQueue.retryFailed();

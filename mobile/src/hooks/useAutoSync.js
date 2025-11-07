/**
 * useAutoSync Hook
 * React Hook для автоматической синхронизации
 *
 * Использование:
 * const { isSyncing, stats, syncNow } = useAutoSync();
 */

import { useState, useEffect, useCallback } from 'react';
import autoSync, { startAutoSync, stopAutoSync } from '../services/autoSync';
import offlineQueue from '../services/offlineQueue';

export const useAutoSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [stats, setStats] = useState({
    pending: 0,
    processing: 0,
    failed: 0,
    completed: 0,
    total: 0
  });
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [lastSyncResult, setLastSyncResult] = useState(null);

  // Обновить статистику
  const updateStats = useCallback(async () => {
    try {
      const queueStats = await offlineQueue.getStats();
      setStats(queueStats);
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  }, []);

  // Запустить синхронизацию вручную
  const syncNow = useCallback(async () => {
    try {
      const result = await autoSync.syncNow();
      setLastSyncTime(Date.now());
      setLastSyncResult(result);
      await updateStats();
      return result;
    } catch (error) {
      console.error('Sync error:', error);
      return { success: false, error: error.message };
    }
  }, [updateStats]);

  // Повторить неудачные
  const retryFailed = useCallback(async () => {
    try {
      const count = await offlineQueue.retryFailed();
      await updateStats();
      return count;
    } catch (error) {
      console.error('Retry failed error:', error);
      return 0;
    }
  }, [updateStats]);

  // Очистить выполненные
  const clearCompleted = useCallback(async (days = 7) => {
    try {
      const count = await offlineQueue.clearCompleted(days);
      await updateStats();
      return count;
    } catch (error) {
      console.error('Clear completed error:', error);
      return 0;
    }
  }, [updateStats]);

  useEffect(() => {
    // Слушатель событий синхронизации
    const syncListener = (event, data) => {
      switch (event) {
        case 'sync_started':
          setIsSyncing(true);
          break;

        case 'sync_progress':
          // Можно обновлять прогресс
          break;

        case 'sync_completed':
          setIsSyncing(false);
          setLastSyncTime(Date.now());
          setLastSyncResult(data);
          updateStats();
          break;

        case 'sync_error':
          setIsSyncing(false);
          break;
      }
    };

    // Добавить слушатель
    autoSync.addListener(syncListener);

    // Запустить автосинхронизацию
    startAutoSync();

    // Первоначальное обновление статистики
    updateStats();

    // Периодическое обновление статистики (каждые 10 секунд)
    const statsInterval = setInterval(updateStats, 10000);

    // Очистка при размонтировании
    return () => {
      autoSync.removeListener(syncListener);
      clearInterval(statsInterval);
      // Не останавливаем автосинхронизацию, она должна работать в фоне
    };
  }, [updateStats]);

  return {
    // Состояние
    isSyncing,
    stats,
    lastSyncTime,
    lastSyncResult,

    // Функции
    syncNow,
    retryFailed,
    clearCompleted,

    // Удобные флаги
    hasPending: stats.pending > 0,
    hasFailed: stats.failed > 0,
    hasData: stats.total > 0
  };
};

export default useAutoSync;

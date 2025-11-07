/**
 * Main Screen - Dashboard with Work Session Controls
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {useAuth} from '../contexts/AuthContext';
import {workSessionsAPI} from '../api/client';
import StorageService from '../services/storage';
import GPSService from '../services/gps';
import SyncService from '../services/sync';

const MainScreen = ({navigation}) => {
  const {user, logout} = useAuth();
  const [activeSession, setActiveSession] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncStatus, setSyncStatus] = useState({});

  useEffect(() => {
    loadData();
    loadSyncStatus();

    // Check for active session
    const checkActiveSession = async () => {
      const session = await StorageService.getActiveSession();
      if (session) {
        setActiveSession(session);
      }
    };
    checkActiveSession();

    // Refresh sync status every 10 seconds
    const syncInterval = setInterval(loadSyncStatus, 10000);

    return () => clearInterval(syncInterval);
  }, []);

  const loadData = async () => {
    try {
      // Load recent sessions
      const sessions = await workSessionsAPI.getWorkSessions({
        limit: 5,
        sort: 'createdAt:desc',
      });
      setRecentSessions(sessions.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSyncStatus = async () => {
    const status = await SyncService.getSyncStatus();
    setSyncStatus(status);
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    await loadSyncStatus();
    setIsRefreshing(false);
  };

  const handleStartSession = async () => {
    try {
      // Get current location
      const location = await GPSService.getCurrentPosition();

      // Create session
      const session = await workSessionsAPI.startWorkSession({
        startLocation: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        startTime: new Date().toISOString(),
      });

      // Save active session
      await StorageService.setActiveSession(session);
      setActiveSession(session);

      // Start GPS tracking
      await GPSService.startTracking(session.id);

      Alert.alert('Успешно', 'Рабочая смена начата');

      // Navigate to active session screen
      navigation.navigate('ActiveSession');
    } catch (error) {
      console.error('Error starting session:', error);
      Alert.alert('Ошибка', 'Не удалось начать смену. Попробуйте снова.');
    }
  };

  const handleEndSession = () => {
    if (activeSession) {
      navigation.navigate('ActiveSession');
    }
  };

  const handleLogout = () => {
    Alert.alert('Выход', 'Вы уверены, что хотите выйти?', [
      {text: 'Отмена', style: 'cancel'},
      {
        text: 'Выйти',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const formatDuration = seconds => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}ч ${minutes}м`;
  };

  const formatDate = dateString => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Добро пожаловать,</Text>
          <Text style={styles.userName}>
            {user?.firstName} {user?.lastName}
          </Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Выход</Text>
        </TouchableOpacity>
      </View>

      {/* Sync Status */}
      {syncStatus.queueLength > 0 && (
        <View style={styles.syncBanner}>
          <Text style={styles.syncText}>
            {syncStatus.isOnline
              ? `Синхронизация: ${syncStatus.queueLength} элементов...`
              : `Оффлайн: ${syncStatus.queueLength} элементов в очереди`}
          </Text>
        </View>
      )}

      {/* Active Session Card */}
      {activeSession ? (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Активная смена</Text>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>В работе</Text>
            </View>
          </View>
          <Text style={styles.sessionTime}>
            Начало: {formatDate(activeSession.startTime)}
          </Text>
          <TouchableOpacity
            style={styles.endButton}
            onPress={handleEndSession}>
            <Text style={styles.endButtonText}>Завершить смену</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Начать рабочую смену</Text>
          <Text style={styles.cardDescription}>
            Нажмите кнопку ниже, чтобы начать отслеживание рабочего времени и
            GPS
          </Text>
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartSession}>
            <Text style={styles.startButtonText}>Начать смену</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Clients')}>
          <Text style={styles.actionIcon}>👥</Text>
          <Text style={styles.actionText}>Клиенты</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Map')}>
          <Text style={styles.actionIcon}>🗺️</Text>
          <Text style={styles.actionText}>Карта</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.actionIcon}>👤</Text>
          <Text style={styles.actionText}>Профиль</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Sessions */}
      <View style={styles.recentContainer}>
        <Text style={styles.sectionTitle}>Последние смены</Text>
        {recentSessions.length > 0 ? (
          recentSessions.map(session => (
            <View key={session.id} style={styles.sessionItem}>
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionDate}>
                  {formatDate(session.startTime)}
                </Text>
                <Text style={styles.sessionStatus}>
                  {session.status === 'completed'
                    ? '✅ Завершено'
                    : '🔄 В процессе'}
                </Text>
              </View>
              {session.duration && (
                <Text style={styles.sessionDuration}>
                  {formatDuration(session.duration)}
                </Text>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Нет записей</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  logoutText: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  syncBanner: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE69C',
  },
  syncText: {
    color: '#856404',
    fontSize: 13,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  activeBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  sessionTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  startButton: {
    backgroundColor: '#34C759',
    height: 52,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  endButton: {
    backgroundColor: '#FF3B30',
    height: 52,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  endButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#fff',
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  recentContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  sessionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDate: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  sessionStatus: {
    fontSize: 13,
    color: '#666',
  },
  sessionDuration: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
});

export default MainScreen;

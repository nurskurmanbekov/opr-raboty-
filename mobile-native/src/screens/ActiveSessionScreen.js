/**
 * Active Session Screen - Live Work Session with Timer and GPS
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {workSessionsAPI} from '../api/client';
import StorageService from '../services/storage';
import GPSService from '../services/gps';

const ActiveSessionScreen = ({navigation}) => {
  const [session, setSession] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [gpsStatus, setGpsStatus] = useState({});
  const [isEnding, setIsEnding] = useState(false);

  useEffect(() => {
    loadSession();

    // Update timer every second
    const timerInterval = setInterval(() => {
      updateElapsedTime();
    }, 1000);

    // Update GPS status every 5 seconds
    const gpsInterval = setInterval(() => {
      updateGPSStatus();
    }, 5000);

    return () => {
      clearInterval(timerInterval);
      clearInterval(gpsInterval);
    };
  }, []);

  const loadSession = async () => {
    const activeSession = await StorageService.getActiveSession();
    if (activeSession) {
      setSession(activeSession);
    } else {
      Alert.alert('Ошибка', 'Нет активной смены');
      navigation.goBack();
    }
  };

  const updateElapsedTime = () => {
    if (session) {
      const startTime = new Date(session.startTime).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000); // seconds
      setElapsedTime(elapsed);
    }
  };

  const updateGPSStatus = async () => {
    try {
      const location = await GPSService.getCurrentPosition();
      setCurrentLocation(location);

      const status = GPSService.getTrackingStatus();
      setGpsStatus(status);
    } catch (error) {
      console.error('GPS update error:', error);
    }
  };

  const handleEndSession = () => {
    Alert.alert(
      'Завершить смену?',
      'Вы уверены, что хотите завершить рабочую смену?',
      [
        {text: 'Отмена', style: 'cancel'},
        {
          text: 'Завершить',
          style: 'destructive',
          onPress: confirmEndSession,
        },
      ],
    );
  };

  const confirmEndSession = async () => {
    setIsEnding(true);

    try {
      // Get final location
      const endLocation = await GPSService.getCurrentPosition();

      // Stop GPS tracking
      const trackingPoints = await GPSService.stopTracking();

      // End session on server
      await workSessionsAPI.endWorkSession(session.id, {
        endTime: new Date().toISOString(),
        endLocation: {
          latitude: endLocation.latitude,
          longitude: endLocation.longitude,
        },
        totalPoints: trackingPoints.length,
      });

      // Clear active session
      await StorageService.removeActiveSession();

      Alert.alert('Успешно', 'Рабочая смена завершена', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Main'),
        },
      ]);
    } catch (error) {
      console.error('Error ending session:', error);
      Alert.alert(
        'Ошибка',
        'Не удалось завершить смену. Данные сохранены для синхронизации.',
      );

      // Queue for offline sync
      await StorageService.queueOfflineAction({
        type: 'END_SESSION',
        sessionId: session.id,
        data: {
          endTime: new Date().toISOString(),
        },
      });

      navigation.navigate('Main');
    } finally {
      setIsEnding(false);
    }
  };

  const formatTime = seconds => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
      2,
      '0',
    )}:${String(secs).padStart(2, '0')}`;
  };

  const formatDate = dateString => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!session) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Timer Card */}
      <View style={styles.timerCard}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>🟢 В работе</Text>
        </View>
        <Text style={styles.timerLabel}>Время работы</Text>
        <Text style={styles.timerValue}>{formatTime(elapsedTime)}</Text>
        <Text style={styles.startTime}>
          Начало: {formatDate(session.startTime)}
        </Text>
      </View>

      {/* GPS Status Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📍 GPS Статус</Text>
        <View style={styles.gpsInfo}>
          <View style={styles.gpsRow}>
            <Text style={styles.gpsLabel}>Отслеживание:</Text>
            <Text
              style={[
                styles.gpsValue,
                gpsStatus.isTracking ? styles.gpsActive : styles.gpsInactive,
              ]}>
              {gpsStatus.isTracking ? 'Активно' : 'Остановлено'}
            </Text>
          </View>

          {currentLocation && (
            <>
              <View style={styles.gpsRow}>
                <Text style={styles.gpsLabel}>Широта:</Text>
                <Text style={styles.gpsValue}>
                  {currentLocation.latitude.toFixed(6)}
                </Text>
              </View>
              <View style={styles.gpsRow}>
                <Text style={styles.gpsLabel}>Долгота:</Text>
                <Text style={styles.gpsValue}>
                  {currentLocation.longitude.toFixed(6)}
                </Text>
              </View>
              <View style={styles.gpsRow}>
                <Text style={styles.gpsLabel}>Точность:</Text>
                <Text style={styles.gpsValue}>
                  ±{Math.round(currentLocation.accuracy)}м
                </Text>
              </View>
            </>
          )}

          <View style={styles.gpsRow}>
            <Text style={styles.gpsLabel}>Точек трека:</Text>
            <Text style={styles.gpsValue}>
              {gpsStatus.pointsCount || 0}
            </Text>
          </View>
        </View>
      </View>

      {/* Session Info Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>ℹ️ Информация о смене</Text>
        <View style={styles.sessionInfo}>
          <Text style={styles.infoLabel}>ID смены:</Text>
          <Text style={styles.infoValue}>{session.id}</Text>
        </View>
        <View style={styles.sessionInfo}>
          <Text style={styles.infoLabel}>Офицер:</Text>
          <Text style={styles.infoValue}>
            {session.officerName || 'Не указан'}
          </Text>
        </View>
        <View style={styles.sessionInfo}>
          <Text style={styles.infoLabel}>Статус:</Text>
          <Text style={styles.infoValue}>
            {session.status === 'active' ? 'Активна' : session.status}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Clients')}>
          <Text style={styles.actionButtonText}>👥 Клиенты</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Map')}>
          <Text style={styles.actionButtonText}>🗺️ Карта</Text>
        </TouchableOpacity>
      </View>

      {/* End Session Button */}
      <TouchableOpacity
        style={[styles.endButton, isEnding && styles.buttonDisabled]}
        onPress={handleEndSession}
        disabled={isEnding}>
        {isEnding ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.endButtonText}>Завершить смену</Text>
        )}
      </TouchableOpacity>

      <View style={styles.spacer} />
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
  timerCard: {
    backgroundColor: '#007AFF',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  statusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  timerLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    marginBottom: 8,
  },
  timerValue: {
    color: '#fff',
    fontSize: 56,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 12,
    fontVariant: ['tabular-nums'],
  },
  startTime: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  gpsInfo: {
    gap: 12,
  },
  gpsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  gpsLabel: {
    fontSize: 14,
    color: '#666',
  },
  gpsValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  gpsActive: {
    color: '#34C759',
  },
  gpsInactive: {
    color: '#FF3B30',
  },
  sessionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#fff',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  endButton: {
    backgroundColor: '#FF3B30',
    margin: 16,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  endButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  spacer: {
    height: 20,
  },
});

export default ActiveSessionScreen;

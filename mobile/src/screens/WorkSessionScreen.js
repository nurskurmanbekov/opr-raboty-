import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Camera } from 'expo-camera';
import NetInfo from '@react-native-community/netinfo';
import api from '../api/axios';
import { workSessionsAPI, geofencesAPI, syncAPI } from '../api/api';
import Button from '../components/Button';

const LOCATION_TASK_NAME = 'background-location-task';
const LOCATION_TRACKING_INTERVAL = 30000; // 30 seconds

// Define the background location task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Background location error:', error);
    return;
  }
  if (data) {
    const { locations } = data;
    const location = locations[0];

    // Get active session and send location update
    try {
      const sessionData = await AsyncStorage.getItem('activeSession');
      if (sessionData) {
        const session = JSON.parse(sessionData);

        // Check if online
        const networkState = await NetInfo.fetch();

        if (networkState.isConnected) {
          // Send location update
          await workSessionsAPI.updateLocation(session.id, {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            altitude: location.coords.altitude,
            speed: location.coords.speed,
            heading: location.coords.heading
          });
        } else {
          // Queue for offline sync
          await syncAPI.addToQueue({
            operation: 'update_location',
            data: {
              workSessionId: session.id,
              ...location.coords
            }
          });
        }
      }
    } catch (error) {
      console.error('Error processing location:', error);
    }
  }
});

const WorkSessionScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [geofenceStatus, setGeofenceStatus] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const timerInterval = useRef(null);
  const locationSubscription = useRef(null);

  useEffect(() => {
    loadUser();
    requestLocationPermission();
    checkActiveSession();
    checkNetworkStatus();

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
      stopLocationTracking();
    };
  }, []);

  const checkNetworkStatus = () => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
    });
    return unsubscribe;
  };

  const loadUser = async () => {
    const userData = await AsyncStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  };

  const requestLocationPermission = async () => {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      Alert.alert('Ошибка', 'Необходимо разрешение на использование местоположения');
      return;
    }

    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== 'granted') {
      Alert.alert(
        'Фоновое отслеживание',
        'Для точного учета работы требуется разрешение на фоновое отслеживание местоположения',
        [{ text: 'OK' }]
      );
    }

    getCurrentLocation();
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(location);
      checkGeofence(location.coords.latitude, location.coords.longitude);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось получить местоположение');
    }
  };

  const checkGeofence = async (latitude, longitude) => {
    try {
      const response = await geofencesAPI.checkGeofence({ latitude, longitude });
      setGeofenceStatus(response.data);
    } catch (error) {
      console.error('Geofence check error:', error);
    }
  };

  const checkActiveSession = async () => {
    try {
      const sessionData = await AsyncStorage.getItem('activeSession');
      if (sessionData) {
        const activeSession = JSON.parse(sessionData);
        setSession(activeSession);
        startTimer(activeSession.startTime);
        startLocationTracking(activeSession);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    }
  };

  const startTimer = (startTime) => {
    timerInterval.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
      setTimer(elapsed);
    }, 1000);
  };

  const startLocationTracking = async (session) => {
    try {
      // Start background location tracking
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.High,
        timeInterval: LOCATION_TRACKING_INTERVAL,
        distanceInterval: 50, // Update every 50 meters
        foregroundService: {
          notificationTitle: 'Рабочая сессия активна',
          notificationBody: 'Отслеживание местоположения',
          notificationColor: '#3b82f6',
        },
      });

      console.log('Background location tracking started');
    } catch (error) {
      console.error('Error starting location tracking:', error);
    }
  };

  const stopLocationTracking = async () => {
    try {
      const isTracking = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      if (isTracking) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        console.log('Background location tracking stopped');
      }
    } catch (error) {
      console.error('Error stopping location tracking:', error);
    }
  };

  const handleStartSession = async () => {
    if (!location) {
      Alert.alert('Ошибка', 'Определение местоположения...');
      return;
    }

    // Check if in geofence
    if (geofenceStatus && !geofenceStatus.isInGeofence) {
      Alert.alert(
        'Предупреждение',
        'Вы находитесь вне рабочей зоны. Продолжить?',
        [
          { text: 'Отмена', style: 'cancel' },
          { text: 'Продолжить', onPress: () => startSessionConfirmed() }
        ]
      );
      return;
    }

    startSessionConfirmed();
  };

  const startSessionConfirmed = async () => {
    setLoading(true);
    try {
      const sessionData = {
        clientId: user.id,
        startLatitude: location.coords.latitude,
        startLongitude: location.coords.longitude,
        workLocation: geofenceStatus?.geofence?.name || 'Определяется...',
      };

      let newSession;

      if (isOnline) {
        const response = await workSessionsAPI.startWorkSession(sessionData);
        newSession = response.data;
      } else {
        // Offline mode - create local session and queue for sync
        newSession = {
          id: Date.now().toString(),
          ...sessionData,
          startTime: new Date().toISOString(),
          status: 'in_progress',
          offline: true
        };

        await syncAPI.addToQueue({
          operation: 'create_work_session',
          data: sessionData
        });
      }

      await AsyncStorage.setItem('activeSession', JSON.stringify(newSession));
      setSession(newSession);
      startTimer(newSession.startTime);
      startLocationTracking(newSession);

      Alert.alert(
        'Успех',
        isOnline ? 'Рабочая сессия начата' : 'Рабочая сессия начата (оффлайн режим)'
      );
    } catch (error) {
      Alert.alert(
        'Ошибка',
        error.response?.data?.message || 'Не удалось начать сессию'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTakePhoto = async () => {
    if (!session) {
      Alert.alert('Ошибка', 'Сначала начните рабочую сессию');
      return;
    }

    // Request camera permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Ошибка', 'Необходимо разрешение на использование камеры');
      return;
    }

    Alert.alert(
      'Загрузить фото',
      'Выберите способ загрузки',
      [
        {
          text: 'Камера',
          onPress: async () => {
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.7,
            });

            if (!result.canceled && result.assets[0]) {
              await uploadPhoto(result.assets[0].uri);
            }
          }
        },
        {
          text: 'Галерея',
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.7,
            });

            if (!result.canceled && result.assets[0]) {
              await uploadPhoto(result.assets[0].uri);
            }
          }
        },
        { text: 'Отмена', style: 'cancel' }
      ]
    );
  };

  const uploadPhoto = async (uri) => {
    try {
      setLoading(true);

      // Create form data
      const formData = new FormData();
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('photo', {
        uri,
        name: filename,
        type,
      });

      if (isOnline) {
        // Upload photo immediately
        await workSessionsAPI.uploadPhoto(session.id, formData);
        Alert.alert('Успех', 'Фото успешно загружено');
      } else {
        // Queue for offline sync
        await syncAPI.addToQueue({
          operation: 'upload_photo',
          data: {
            workSessionId: session.id,
            photoUri: uri
          }
        });
        Alert.alert('Оффлайн', 'Фото будет загружено при подключении к интернету');
      }

      setLoading(false);
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить фото');
      setLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (!location) {
      Alert.alert('Ошибка', 'Определение местоположения...');
      return;
    }

    Alert.alert(
      'Завершить сессию?',
      'Вы уверены, что хотите завершить рабочую сессию?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Завершить',
          onPress: async () => {
            setLoading(true);
            try {
              const endData = {
                endLatitude: location.coords.latitude,
                endLongitude: location.coords.longitude,
              };

              if (isOnline) {
                await workSessionsAPI.endWorkSession(session.id, endData);
              } else {
                // Queue for offline sync
                await syncAPI.addToQueue({
                  operation: 'update_work_session',
                  data: {
                    workSessionId: session.id,
                    ...endData
                  }
                });
              }

              await AsyncStorage.removeItem('activeSession');
              stopLocationTracking();

              if (timerInterval.current) {
                clearInterval(timerInterval.current);
              }

              Alert.alert(
                'Успех',
                isOnline ? 'Рабочая сессия завершена' : 'Рабочая сессия завершена (будет синхронизировано)',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } catch (error) {
              Alert.alert(
                'Ошибка',
                error.response?.data?.message || 'Не удалось завершить сессию'
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <ScrollView style={styles.container}>
      {/* Network Status Banner */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>📡 Оффлайн режим - данные будут синхронизированы позже</Text>
        </View>
      )}

      {/* Location Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📍 Местоположение</Text>
        {location ? (
          <View>
            <Text style={styles.locationText}>
              Широта: {location.coords.latitude.toFixed(6)}
            </Text>
            <Text style={styles.locationText}>
              Долгота: {location.coords.longitude.toFixed(6)}
            </Text>
            <Text style={styles.locationAccuracy}>
              Точность: ±{location.coords.accuracy.toFixed(0)}м
            </Text>
          </View>
        ) : (
          <ActivityIndicator size="large" color="#3b82f6" />
        )}
      </View>

      {/* Geofence Status */}
      {geofenceStatus && (
        <View style={[styles.card, { backgroundColor: geofenceStatus.isInGeofence ? '#d1fae5' : '#fee2e2' }]}>
          <Text style={styles.cardTitle}>
            {geofenceStatus.isInGeofence ? '✅ В рабочей зоне' : '⚠️ Вне рабочей зоны'}
          </Text>
          <Text style={styles.geofenceText}>
            {geofenceStatus.geofence?.name || 'Геозона не определена'}
          </Text>
          {geofenceStatus.distance && (
            <Text style={styles.geofenceDistance}>
              Расстояние: {geofenceStatus.distance.toFixed(0)} м
            </Text>
          )}
        </View>
      )}

      {/* Timer Card */}
      {session && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⏱️ Таймер</Text>
          <Text style={styles.timerText}>{formatTime(timer)}</Text>
          <Text style={styles.timerLabel}>
            Начато: {new Date(session.startTime).toLocaleTimeString('ru-RU')}
          </Text>
          {session.offline && (
            <View style={styles.offlineTag}>
              <Text style={styles.offlineTagText}>Оффлайн сессия</Text>
            </View>
          )}
        </View>
      )}

      {/* Status Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Статус</Text>
        {session ? (
          <View style={styles.statusActive}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Рабочая сессия активна</Text>
          </View>
        ) : (
          <Text style={styles.statusInactive}>Нет активной сессии</Text>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {session ? (
          <>
            <Button
              title="📸 Загрузить фото"
              onPress={handleTakePhoto}
              style={styles.photoButton}
            />
            <Button
              title="Завершить рабочую сессию"
              onPress={handleEndSession}
              loading={loading}
              style={styles.endButton}
            />
          </>
        ) : (
          <Button
            title="Начать рабочую сессию"
            onPress={handleStartSession}
            loading={loading}
            disabled={!location}
          />
        )}
      </View>

      {/* Info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>ℹ️ Информация</Text>
        <Text style={styles.infoText}>
          • Включите GPS для точного отслеживания
        </Text>
        <Text style={styles.infoText}>
          • Местоположение обновляется каждые 30 секунд
        </Text>
        <Text style={styles.infoText}>
          • Работает в оффлайн режиме
        </Text>
        <Text style={styles.infoText}>
          • Автоматическая синхронизация при подключении
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  offlineBanner: {
    backgroundColor: '#fbbf24',
    padding: 12,
    alignItems: 'center',
  },
  offlineText: {
    color: '#78350f',
    fontWeight: '600',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 4,
  },
  locationAccuracy: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  geofenceText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  geofenceDistance: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#3b82f6',
    textAlign: 'center',
    marginVertical: 16,
  },
  timerLabel: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  offlineTag: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    alignSelf: 'center',
  },
  offlineTagText: {
    color: '#92400e',
    fontSize: 12,
    fontWeight: '600',
  },
  statusActive: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#d1fae5',
    borderRadius: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    marginRight: 12,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065f46',
  },
  statusInactive: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    padding: 12,
  },
  actions: {
    padding: 16,
    gap: 12,
  },
  photoButton: {
    backgroundColor: '#8b5cf6',
  },
  endButton: {
    backgroundColor: '#ef4444',
  },
  infoCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    marginBottom: 8,
  },
});

export default WorkSessionScreen;

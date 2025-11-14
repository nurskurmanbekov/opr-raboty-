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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Camera } from 'expo-camera';
import NetInfo from '@react-native-community/netinfo';
import { useTheme } from '../hooks/useTheme';
import api from '../api/axios';
import { workSessionsAPI, geofencesAPI, faceVerificationAPI } from '../api/api';
import offlineQueue from '../services/offlineQueue';
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
          await offlineQueue.addToQueue('update_location', {
            workSessionId: session.id,
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            altitude: location.coords.altitude,
            speed: location.coords.speed,
            heading: location.coords.heading,
            timestamp: Date.now()
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
  const [faceIdSelfie, setFaceIdSelfie] = useState(null); // Face ID selfie for verification
  const [faceIdStatus, setFaceIdStatus] = useState(null); // Face ID verification status
  const { colors } = useTheme();
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

  const handleTakeFaceIdSelfie = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Ошибка', 'Необходимо разрешение на использование камеры для Face ID');
        return;
      }

      // Launch camera for selfie (ONLY camera, no gallery)
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
        cameraType: ImagePicker.CameraType.front, // Force front camera for selfie
      });

      if (!result.canceled && result.assets[0]) {
        setFaceIdSelfie(result.assets[0].uri);
        setFaceIdStatus(null); // Reset status
        Alert.alert(
          '✅ Селфи сделано',
          'Теперь нажмите "Начать работу" для верификации Face ID',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Face ID selfie error:', error);
      Alert.alert('Ошибка', 'Не удалось сделать селфи для Face ID');
    }
  };

  const handleStartSession = async () => {
    if (!location) {
      Alert.alert('Ошибка', 'Определение местоположения...');
      return;
    }

    // Navigate to QR Scanner screen for MTU check-in
    // The flow will be: QR Scanner → Face Verification → Complete Session
    navigation.navigate('QRScanner', {
      userId: user.id,
      location: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      }
    });
  };

  const startSessionConfirmed = async () => {
    setLoading(true);
    try {
      // ⭐ КРИТИЧНО: Создать FormData с Face ID селфи
      const formData = new FormData();
      const filename = faceIdSelfie.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      // Add Face ID selfie photo
      formData.append('photo', {
        uri: faceIdSelfie,
        name: `faceid-${Date.now()}.jpg`,
        type,
      });

      // Add session data
      formData.append('clientId', user.id);
      formData.append('startLatitude', location.coords.latitude.toString());
      formData.append('startLongitude', location.coords.longitude.toString());
      formData.append('workLocation', geofenceStatus?.geofence?.name || 'Определяется...');
      formData.append('biometricType', 'FaceID');
      formData.append('deviceId', `${Platform.OS}-${Date.now()}`);

      let newSession;

      if (isOnline) {
        try {
          // ⭐ Send with Face ID verification
          const response = await api.post('/work-sessions/start', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });

          newSession = response.data;

          // ✅ Face ID верификация прошла успешно!
          setFaceIdStatus({
            verified: true,
            confidence: newSession.faceVerification?.confidence || 0,
            similarity: newSession.faceVerification?.similarity || '0%'
          });

          Alert.alert(
            '✅ Рабочая сессия начата!',
            `Face ID верифицирован: ${newSession.faceVerification?.similarity || 'N/A'}\n\nВаше местоположение отслеживается. Не забывайте делать фото работы.`,
            [{ text: 'OK' }]
          );

          // Clear Face ID selfie
          setFaceIdSelfie(null);

        } catch (error) {
          console.error('Start session error:', error);

          // ❌ Обработка ошибок Face ID
          if (error.response?.status === 400 && error.response?.data?.requireFaceRegistration) {
            Alert.alert(
              '❌ Face ID не зарегистрирован',
              'Вам необходимо зарегистрировать Face ID в настройках профиля перед началом работы.',
              [
                { text: 'Отмена', style: 'cancel' },
                { text: 'Перейти в профиль', onPress: () => navigation.navigate('Profile') }
              ]
            );
            setLoading(false);
            return;
          }

          if (error.response?.status === 403 && error.response?.data?.faceVerificationFailed) {
            const details = error.response.data.details || {};
            Alert.alert(
              '❌ Face ID верификация не прошла',
              `Ваше лицо не совпадает с зарегистрированным!\n\nСхожесть: ${(details.similarity * 100).toFixed(1)}%\nТребуется: ${(details.threshold * 100).toFixed(0)}%\n\nЭто требование антикоррупционной защиты.`,
              [
                { text: 'Попробовать снова', onPress: handleTakeFaceIdSelfie }
              ]
            );
            setFaceIdStatus({
              verified: false,
              confidence: details.similarity || 0,
              reason: 'Лицо не совпадает'
            });
            setLoading(false);
            return;
          }

          throw error;
        }
      } else {
        // Offline mode - create local session and queue for sync
        newSession = {
          id: Date.now().toString(),
          clientId: user.id,
          startLatitude: location.coords.latitude,
          startLongitude: location.coords.longitude,
          workLocation: geofenceStatus?.geofence?.name || 'Определяется...',
          startTime: new Date().toISOString(),
          status: 'in_progress',
          offline: true,
          faceIdSelfie: faceIdSelfie // Store selfie URI for later sync
        };

        await offlineQueue.addToQueue('create_work_session', {
          ...newSession,
          photoUri: faceIdSelfie
        });

        Alert.alert(
          '📡 Оффлайн режим',
          'Рабочая сессия начата в оффлайн режиме. Face ID будет верифицирован при подключении к интернету.'
        );
      }

      await AsyncStorage.setItem('activeSession', JSON.stringify(newSession));
      setSession(newSession);
      startTimer(newSession.startTime);
      startLocationTracking(newSession);

    } catch (error) {
      console.error('Start session error:', error);
      Alert.alert(
        'Ошибка',
        error.response?.data?.message || error.message || 'Не удалось начать сессию'
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
        await offlineQueue.addToQueue('upload_photo', {
          workSessionId: session.id,
          photoUri: uri
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

    // Navigate to Complete Session screen for work description and photos
    navigation.navigate('CompleteSession', {
      sessionId: session.id,
      location: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      }
    });
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView style={styles.container}>
        {/* Network Status Banner */}
        {!isOnline && (
          <View style={[styles.offlineBanner, { backgroundColor: colors.warning }]}>
            <Text style={[styles.offlineText, { color: colors.warningText }]}>📡 Оффлайн режим - данные будут синхронизированы позже</Text>
          </View>
        )}

      {/* Location Card */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>📍 Местоположение</Text>
        {location ? (
          <View>
            <Text style={[styles.locationText, { color: colors.text }]}>
              Широта: {location.coords.latitude.toFixed(6)}
            </Text>
            <Text style={[styles.locationText, { color: colors.text }]}>
              Долгота: {location.coords.longitude.toFixed(6)}
            </Text>
            <Text style={[styles.locationAccuracy, { color: colors.textSecondary }]}>
              Точность: ±{location.coords.accuracy.toFixed(0)}м
            </Text>
          </View>
        ) : (
          <ActivityIndicator size="large" color={colors.primary} />
        )}
      </View>

      {/* Geofence Status */}
      {geofenceStatus && (
        <View style={[styles.card, { backgroundColor: geofenceStatus.isInGeofence ? colors.successBackground : colors.errorBackground }]}>
          <Text style={[styles.cardTitle, { color: geofenceStatus.isInGeofence ? colors.successText : colors.errorText }]}>
            {geofenceStatus.isInGeofence ? '✅ В рабочей зоне' : '⚠️ Вне рабочей зоны'}
          </Text>
          <Text style={[styles.geofenceText, { color: geofenceStatus.isInGeofence ? colors.successText : colors.errorText }]}>
            {geofenceStatus.geofence?.name || 'Геозона не определена'}
          </Text>
          {geofenceStatus.distance && (
            <Text style={[styles.geofenceDistance, { color: geofenceStatus.isInGeofence ? colors.successText : colors.errorText }]}>
              Расстояние: {geofenceStatus.distance.toFixed(0)} м
            </Text>
          )}
        </View>
      )}

      {/* Timer Card */}
      {session && (
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>⏱️ Таймер</Text>
          <Text style={[styles.timerText, { color: colors.primary }]}>{formatTime(timer)}</Text>
          <Text style={[styles.timerLabel, { color: colors.textSecondary }]}>
            Начато: {new Date(session.startTime).toLocaleTimeString('ru-RU')}
          </Text>
          {session.offline && (
            <View style={[styles.offlineTag, { backgroundColor: colors.warningBackground }]}>
              <Text style={[styles.offlineTagText, { color: colors.warningText }]}>Оффлайн сессия</Text>
            </View>
          )}
        </View>
      )}

      {/* Status Card */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Статус</Text>
        {session ? (
          <View style={[styles.statusActive, { backgroundColor: colors.successBackground }]}>
            <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
            <Text style={[styles.statusText, { color: colors.successText }]}>Рабочая сессия активна</Text>
          </View>
        ) : (
          <Text style={[styles.statusInactive, { color: colors.textSecondary }]}>Нет активной сессии</Text>
        )}
      </View>

      {/* Workflow Info Card - Show only when NO active session */}
      {!session && (
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>📋 Процесс начала работы</Text>
          <View style={styles.workflowSteps}>
            <Text style={[styles.workflowStep, { color: colors.textSecondary }]}>
              1️⃣ Сканировать QR код на месте работы (MTU)
            </Text>
            <Text style={[styles.workflowStep, { color: colors.textSecondary }]}>
              2️⃣ Подтверждение личности через Face ID (3 фото)
            </Text>
            <Text style={[styles.workflowStep, { color: colors.textSecondary }]}>
              3️⃣ Начало рабочей смены
            </Text>
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {session ? (
          <>
            <Button
              title="📸 Загрузить фото"
              onPress={handleTakePhoto}
              style={[styles.photoButton, { backgroundColor: colors.purple }]}
            />
            <Button
              title="Завершить рабочую сессию"
              onPress={handleEndSession}
              loading={loading}
              style={[styles.endButton, { backgroundColor: colors.error }]}
            />
          </>
        ) : (
          <Button
            title="🚀 Начать рабочую смену"
            onPress={handleStartSession}
            loading={loading}
            disabled={!location}
          />
        )}
      </View>

      {/* Info */}
      <View style={[styles.infoCard, { backgroundColor: colors.infoLight }]}>
        <Text style={[styles.infoTitle, { color: colors.infoText }]}>ℹ️ Информация</Text>
        <Text style={[styles.infoText, { color: colors.infoText }]}>
          • Включите GPS для точного отслеживания
        </Text>
        <Text style={[styles.infoText, { color: colors.infoText }]}>
          • Местоположение обновляется каждые 30 секунд
        </Text>
        <Text style={[styles.infoText, { color: colors.infoText }]}>
          • Работает в оффлайн режиме
        </Text>
        <Text style={[styles.infoText, { color: colors.infoText }]}>
          • Автоматическая синхронизация при подключении
        </Text>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  offlineBanner: {
    padding: 12,
    alignItems: 'center',
  },
  offlineText: {
    fontWeight: '600',
    fontSize: 14,
  },
  card: {
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
    marginBottom: 12,
  },
  locationText: {
    fontSize: 16,
    marginBottom: 4,
  },
  locationAccuracy: {
    fontSize: 14,
    marginTop: 8,
  },
  geofenceText: {
    fontSize: 16,
    fontWeight: '500',
  },
  geofenceDistance: {
    fontSize: 14,
    marginTop: 8,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 16,
  },
  timerLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
  offlineTag: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'center',
  },
  offlineTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusActive: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusInactive: {
    fontSize: 16,
    textAlign: 'center',
    padding: 12,
  },
  actions: {
    padding: 16,
    gap: 12,
  },
  photoButton: {
  },
  endButton: {
  },
  infoCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 8,
  },
  faceIdPreview: {
    alignItems: 'center',
    marginVertical: 16,
  },
  faceIdImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 4,
    borderColor: '#10b981',
  },
  faceIdSuccess: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 12,
    alignItems: 'center',
  },
  faceIdSuccessText: {
    fontSize: 16,
    fontWeight: '600',
  },
  faceIdInfo: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  faceIdButton: {
    marginTop: 8,
  },
  retakeButton: {
    marginTop: 8,
  },
  faceIdError: {
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  faceIdErrorText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  faceIdErrorDetails: {
    fontSize: 14,
  },
  workflowSteps: {
    gap: 12,
  },
  workflowStep: {
    fontSize: 15,
    lineHeight: 22,
    paddingLeft: 8,
  },
});

export default WorkSessionScreen;

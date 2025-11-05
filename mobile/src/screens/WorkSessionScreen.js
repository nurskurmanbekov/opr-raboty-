import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axios';
import Button from '../components/Button';

const WorkSessionScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);

  useEffect(() => {
    loadUser();
    requestLocationPermission();
    checkActiveSession();

    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, []);

  const loadUser = async () => {
    const userData = await AsyncStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  };

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Ошибка', 'Необходимо разрешение на использование местоположения');
      return;
    }
    getCurrentLocation();
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(location);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось получить местоположение');
    }
  };

  const checkActiveSession = async () => {
    try {
      const response = await api.get('/work-sessions', {
        params: { status: 'in_progress' }
      });
      const sessions = response.data.data;
      const activeSession = sessions.find(s => s.status === 'in_progress');
      
      if (activeSession) {
        setSession(activeSession);
        startTimer(activeSession.startTime);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    }
  };

  const startTimer = (startTime) => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
      setTimer(elapsed);
    }, 1000);
    setTimerInterval(interval);
  };

  const handleStartSession = async () => {
    if (!location) {
      Alert.alert('Ошибка', 'Определение местоположения...');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/work-sessions/start', {
        clientId: user.id,
        startLatitude: location.coords.latitude,
        startLongitude: location.coords.longitude,
        workLocation: 'Определяется...',
      });

      setSession(response.data.data);
      startTimer(response.data.data.startTime);
      Alert.alert('Успех', 'Рабочая сессия начата');
    } catch (error) {
      Alert.alert(
        'Ошибка',
        error.response?.data?.message || 'Не удалось начать сессию'
      );
    } finally {
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
              await api.put(`/work-sessions/${session.id}/end`, {
                endLatitude: location.coords.latitude,
                endLongitude: location.coords.longitude,
              });

              if (timerInterval) {
                clearInterval(timerInterval);
              }

              Alert.alert('Успех', 'Рабочая сессия завершена', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
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

      {/* Timer Card */}
      {session && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⏱️ Таймер</Text>
          <Text style={styles.timerText}>{formatTime(timer)}</Text>
          <Text style={styles.timerLabel}>
            Начато: {new Date(session.startTime).toLocaleTimeString('ru-RU')}
          </Text>
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
          <Button
            title="Завершить рабочую сессию"
            onPress={handleEndSession}
            loading={loading}
            style={styles.endButton}
          />
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
          • Не выключайте приложение во время работы
        </Text>
        <Text style={styles.infoText}>
          • Часы будут зафиксированы автоматически
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
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.99.7.91:5000/api';

export default function QRScannerScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    setHasPermission(status === 'granted');

    if (status !== 'granted') {
      Alert.alert(
        'Нет доступа к камере',
        'Пожалуйста, предоставьте доступ к камере в настройках для сканирования QR-кода'
      );
    }
  };

  const handleBarCodeScanned = async ({ type, data }) => {
    setScanned(true);
    setScanning(true);

    try {
      // Parse QR data
      const qrData = JSON.parse(data);

      // Validate QR code type
      if (qrData.type !== 'mtu_checkin') {
        Alert.alert('Ошибка', 'Неверный QR-код. Отсканируйте QR-код с места работы.');
        setScanned(false);
        setScanning(false);
        return;
      }

      // Get client location
      const { latitude, longitude } = await getCurrentLocation();

      // Verify QR code with backend
      await verifyQRCode(qrData, latitude, longitude);

    } catch (error) {
      console.error('QR scan error:', error);
      Alert.alert('Ошибка', 'Не удалось обработать QR-код. Попробуйте снова.');
      setScanned(false);
      setScanning(false);
    }
  };

  const getCurrentLocation = async () => {
    return new Promise(async (resolve, reject) => {
      try {
        const { Location } = await import('expo-location');

        // Request permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          reject(new Error('Location permission denied'));
          return;
        }

        // Get current location
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });

        resolve({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
      } catch (error) {
        reject(error);
      }
    });
  };

  const verifyQRCode = async (qrData, latitude, longitude) => {
    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('token');

      const response = await axios.post(
        `${API_URL}/mtu/verify-qr`,
        {
          qr_data: JSON.stringify(qrData),
          latitude,
          longitude
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        // QR code verified successfully
        const mtuData = response.data.data;

        Alert.alert(
          '✅ QR-код проверен',
          `Место работы: ${mtuData.name}\nРайон: ${mtuData.district}\n\nТеперь пройдите верификацию лица.`,
          [
            {
              text: 'Продолжить',
              onPress: () => {
                // Navigate to Face Verification screen
                navigation.navigate('FaceVerification', {
                  mtuData: mtuData,
                  gpsLocation: { latitude, longitude }
                });
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('QR verification error:', error);

      let errorMessage = 'Не удалось проверить QR-код';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      if (error.response?.data?.geofence_error) {
        errorMessage += '\n\nВы находитесь вне геозоны места работы. Подойдите ближе к месту работы.';
      }

      Alert.alert('Ошибка', errorMessage, [
        {
          text: 'Попробовать снова',
          onPress: () => {
            setScanned(false);
            setScanning(false);
          }
        },
        {
          text: 'Отмена',
          style: 'cancel',
          onPress: () => navigation.goBack()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Запрос разрешения на камеру...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Нет доступа к камере</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={requestCameraPermission}
        >
          <Text style={styles.buttonText}>Запросить доступ</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Назад</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Сканирование QR-кода</Text>
        <Text style={styles.subHeaderText}>
          Наведите камеру на QR-код места работы
        </Text>
      </View>

      <View style={styles.scannerContainer}>
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
          barCodeTypes={[BarCodeScanner.Constants.BarCodeType.qr]}
        />

        {/* Scan frame overlay */}
        <View style={styles.overlay}>
          <View style={styles.scanFrame} />
        </View>

        {scanning && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.processingText}>
              {loading ? 'Проверка QR-кода...' : 'Обработка...'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        {scanned && !scanning && (
          <TouchableOpacity
            style={styles.rescanButton}
            onPress={() => setScanned(false)}
          >
            <Text style={styles.rescanButtonText}>Сканировать снова</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Отмена</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: 'rgba(0,0,0,0.8)',
    zIndex: 10,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subHeaderText: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: '#4CAF50',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  processingText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 16,
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    zIndex: 10,
  },
  rescanButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  rescanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#666',
    padding: 16,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  errorText: {
    color: '#f44336',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    margin: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

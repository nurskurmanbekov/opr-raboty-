import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Platform
} from 'react-native';
import { Camera } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.99.7.91:5000/api';

const VERIFICATION_STEPS = [
  {
    id: 1,
    type: 'left',
    title: 'Шаг 1 из 3',
    instruction: 'Поверните голову ВЛЕВО',
    icon: '←',
    color: '#2196F3'
  },
  {
    id: 2,
    type: 'right',
    title: 'Шаг 2 из 3',
    instruction: 'Поверните голову ВПРАВО',
    icon: '→',
    color: '#FF9800'
  },
  {
    id: 3,
    type: 'frontal',
    title: 'Шаг 3 из 3',
    instruction: 'Смотрите ПРЯМО в камеру',
    icon: '●',
    color: '#4CAF50'
  }
];

export default function FaceVerificationScreen({ route, navigation }) {
  const { mtuData, gpsLocation } = route.params;

  const [hasPermission, setHasPermission] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(10);

  const cameraRef = useRef(null);

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');

    if (status !== 'granted') {
      Alert.alert(
        'Нет доступа к камере',
        'Пожалуйста, предоставьте доступ к камере для верификации лица'
      );
    }
  };

  const capturePhoto = async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
        skipProcessing: true
      });

      const currentStepData = VERIFICATION_STEPS[currentStep];

      // Add photo to array
      const newPhotos = [...capturedPhotos, {
        uri: photo.uri,
        base64: photo.base64,
        type: currentStepData.type
      }];

      setCapturedPhotos(newPhotos);

      // Move to next step or verify
      if (currentStep < VERIFICATION_STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        // All photos captured, proceed to verification
        await verifyFace(newPhotos);
      }
    } catch (error) {
      console.error('Capture error:', error);
      Alert.alert('Ошибка', 'Не удалось сделать фото. Попробуйте снова.');
    } finally {
      setIsCapturing(false);
    }
  };

  const verifyFace = async (photos) => {
    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('token');
      const clientData = await AsyncStorage.getItem('user');
      const client = JSON.parse(clientData);

      // Prepare FormData
      const formData = new FormData();
      formData.append('user_id', client.id);
      formData.append('mtu_id', mtuData.mtu_id);
      formData.append('gps_location', JSON.stringify(gpsLocation));
      formData.append('device_info', JSON.stringify({
        platform: Platform.OS,
        version: Platform.Version
      }));

      // Append photos in correct order: left, right, frontal
      photos.forEach((photo, index) => {
        formData.append('photos', {
          uri: photo.uri,
          type: 'image/jpeg',
          name: `face_${photo.type}_${Date.now()}.jpg`
        });
      });

      const response = await axios.post(
        `${API_URL}/face-id/verify`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success && response.data.matched) {
        // Face verified successfully
        Alert.alert(
          '✅ Верификация успешна!',
          `Личность подтверждена\nСхожесть: ${(response.data.similarity * 100).toFixed(1)}%\n\nТеперь начните рабочую сессию.`,
          [
            {
              text: 'Начать работу',
              onPress: () => {
                // Navigate to work session screen
                navigation.navigate('WorkSession', {
                  mtuData: mtuData,
                  faceVerified: true,
                  verificationData: response.data
                });
              }
            }
          ]
        );
      } else {
        // Face verification failed
        const newAttemptsLeft = response.data.attempts_left || 0;
        setAttemptsLeft(newAttemptsLeft);

        Alert.alert(
          '❌ Верификация не прошла',
          `${response.data.message}\n\nОсталось попыток: ${newAttemptsLeft}`,
          [
            {
              text: 'Попробовать снова',
              onPress: () => {
                // Reset and try again
                setCapturedPhotos([]);
                setCurrentStep(0);
              }
            },
            {
              text: 'Отмена',
              style: 'cancel',
              onPress: () => navigation.navigate('Home')
            }
          ]
        );
      }
    } catch (error) {
      console.error('Face verification error:', error);

      let errorMessage = 'Не удалось верифицировать лицо';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      if (error.response?.status === 429) {
        // Too many attempts - blocked
        Alert.alert(
          '🚫 Верификация заблокирована',
          errorMessage,
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Home')
            }
          ]
        );
        return;
      }

      Alert.alert('Ошибка', errorMessage, [
        {
          text: 'Попробовать снова',
          onPress: () => {
            setCapturedPhotos([]);
            setCurrentStep(0);
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

  const retakePhoto = () => {
    setCapturedPhotos([]);
    setCurrentStep(0);
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

  const currentStepData = VERIFICATION_STEPS[currentStep];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Верификация лица</Text>
        <Text style={styles.mtuText}>{mtuData.name}</Text>
        <Text style={styles.attemptsText}>
          Осталось попыток: {attemptsLeft}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        {VERIFICATION_STEPS.map((step, index) => (
          <View
            key={step.id}
            style={[
              styles.progressStep,
              index <= currentStep && styles.progressStepActive,
              { backgroundColor: index <= currentStep ? step.color : '#ddd' }
            ]}
          />
        ))}
      </View>

      {/* Instructions */}
      <View style={[styles.instructionsCard, { borderColor: currentStepData.color }]}>
        <Text style={styles.stepTitle}>{currentStepData.title}</Text>
        <Text style={[styles.iconText, { color: currentStepData.color }]}>
          {currentStepData.icon}
        </Text>
        <Text style={styles.instructionText}>{currentStepData.instruction}</Text>
      </View>

      {/* Camera */}
      <View style={styles.cameraContainer}>
        <Camera
          ref={cameraRef}
          style={styles.camera}
          type={Camera.Constants.Type.front}
          ratio="4:3"
        >
          <View style={styles.cameraOverlay}>
            <View style={[styles.faceFrame, { borderColor: currentStepData.color }]} />
          </View>
        </Camera>
      </View>

      {/* Preview captured photos */}
      {capturedPhotos.length > 0 && (
        <View style={styles.previewContainer}>
          {capturedPhotos.map((photo, index) => (
            <Image
              key={index}
              source={{ uri: photo.uri }}
              style={styles.previewImage}
            />
          ))}
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.footer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Проверка...</Text>
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.captureButton, { backgroundColor: currentStepData.color }]}
              onPress={capturePhoto}
              disabled={isCapturing}
            >
              <Text style={styles.captureButtonText}>
                {isCapturing ? 'Обработка...' : 'Сделать фото'}
              </Text>
            </TouchableOpacity>

            {capturedPhotos.length > 0 && (
              <TouchableOpacity
                style={styles.retakeButton}
                onPress={retakePhoto}
              >
                <Text style={styles.retakeButtonText}>Переснять все</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelButtonText}>Отмена</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  mtuText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  attemptsText: {
    fontSize: 14,
    color: '#FF5722',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: 'bold',
  },
  progressContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
  },
  progressStep: {
    flex: 1,
    height: 4,
    marginHorizontal: 4,
    borderRadius: 2,
  },
  progressStepActive: {
    opacity: 1,
  },
  instructionsCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 3,
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  iconText: {
    fontSize: 48,
    fontWeight: 'bold',
    marginVertical: 12,
  },
  instructionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  cameraContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceFrame: {
    width: 200,
    height: 250,
    borderWidth: 4,
    borderRadius: 100,
    backgroundColor: 'transparent',
  },
  previewContainer: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  previewImage: {
    width: 60,
    height: 80,
    borderRadius: 8,
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  footer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    backgroundColor: '#fff',
  },
  captureButton: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  captureButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  retakeButton: {
    backgroundColor: '#FF9800',
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  retakeButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#666',
    padding: 14,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
    marginTop: 12,
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

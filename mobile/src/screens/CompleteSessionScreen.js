import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.99.7.91:5000/api';

export default function CompleteSessionScreen({ route, navigation }) {
  const { workSessionId } = route.params;

  const [workDescription, setWorkDescription] = useState('');
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const pickImage = async () => {
    if (photos.length >= 5) {
      Alert.alert('Ограничение', 'Максимум 5 фотографий');
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Ошибка', 'Нужен доступ к галерее для загрузки фото');
        return;
      }

      const result = await ImagePicker.launchImagePickerAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 0.8,
        base64: true
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotos([...photos, result.assets[0]]);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Ошибка', 'Не удалось выбрать фото');
    }
  };

  const takePhoto = async () => {
    if (photos.length >= 5) {
      Alert.alert('Ограничение', 'Максимум 5 фотографий');
      return;
    }

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Ошибка', 'Нужен доступ к камере для съемки фото');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
        base64: true
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotos([...photos, result.assets[0]]);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Ошибка', 'Не удалось сделать фото');
    }
  };

  const removePhoto = (index) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate work description
    if (!workDescription.trim()) {
      newErrors.workDescription = 'Описание работы обязательно';
    } else if (workDescription.trim().length < 20) {
      newErrors.workDescription = 'Описание должно содержать минимум 20 символов';
    }

    // Validate photos
    if (photos.length < 3) {
      newErrors.photos = 'Загрузите минимум 3 фотографии';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const completeSession = async () => {
    if (!validateForm()) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните все поля правильно');
      return;
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('token');

      // Prepare FormData
      const formData = new FormData();
      formData.append('work_session_id', workSessionId);
      formData.append('work_description', workDescription.trim());

      // Append photos
      photos.forEach((photo, index) => {
        formData.append('photos', {
          uri: photo.uri,
          type: 'image/jpeg',
          name: `work_photo_${index}_${Date.now()}.jpg`
        });
      });

      const response = await axios.post(
        `${API_URL}/work-sessions/${workSessionId}/complete`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        Alert.alert(
          '✅ Сессия завершена!',
          `Работа завершена успешно.\n\nОтработано часов: ${response.data.data.hoursWorked || 0}\n\nСессия отправлена на проверку офицеру.`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate back to home
                navigation.navigate('Home');
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Complete session error:', error);

      let errorMessage = 'Не удалось завершить сессию';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      Alert.alert('Ошибка', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const charCount = workDescription.length;
  const charCountColor = charCount >= 20 ? '#4CAF50' : charCount >= 10 ? '#FF9800' : '#f44336';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Завершение работы</Text>
        <Text style={styles.subHeaderText}>
          Опишите выполненную работу и загрузите фотографии
        </Text>
      </View>

      {/* Work Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Описание работы <Text style={styles.required}>*</Text>
        </Text>
        <Text style={styles.sectionSubtitle}>
          Подробно опишите что вы делали (минимум 20 символов)
        </Text>

        <TextInput
          style={[
            styles.textArea,
            errors.workDescription && styles.inputError
          ]}
          placeholder="Например: Убирал территорию парка, собрал мусор, подмел дорожки..."
          placeholderTextColor="#999"
          value={workDescription}
          onChangeText={(text) => {
            setWorkDescription(text);
            if (errors.workDescription) {
              setErrors({ ...errors, workDescription: null });
            }
          }}
          multiline
          numberOfLines={6}
          maxLength={500}
        />

        <View style={styles.charCountContainer}>
          <Text style={[styles.charCount, { color: charCountColor }]}>
            {charCount} / 500 символов
            {charCount < 20 && ` (минимум 20)`}
          </Text>
        </View>

        {errors.workDescription && (
          <Text style={styles.errorText}>{errors.workDescription}</Text>
        )}
      </View>

      {/* Photos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Фотографии <Text style={styles.required}>*</Text>
        </Text>
        <Text style={styles.sectionSubtitle}>
          Загрузите минимум 3 фотографии с места работы
        </Text>

        <View style={styles.photoGrid}>
          {photos.map((photo, index) => (
            <View key={index} style={styles.photoContainer}>
              <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
              <TouchableOpacity
                style={styles.removePhotoButton}
                onPress={() => removePhoto(index)}
              >
                <Text style={styles.removePhotoText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          {photos.length < 5 && (
            <TouchableOpacity
              style={styles.addPhotoButton}
              onPress={() => {
                Alert.alert(
                  'Добавить фото',
                  'Выберите способ добавления фотографии',
                  [
                    {
                      text: 'Камера',
                      onPress: takePhoto
                    },
                    {
                      text: 'Галерея',
                      onPress: pickImage
                    },
                    {
                      text: 'Отмена',
                      style: 'cancel'
                    }
                  ]
                );
              }}
            >
              <Text style={styles.addPhotoText}>+</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.photoCount}>
          Загружено: {photos.length} / 5 (минимум 3)
        </Text>

        {errors.photos && (
          <Text style={styles.errorText}>{errors.photos}</Text>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.footer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Завершение сессии...</Text>
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={[
                styles.completeButton,
                (!workDescription.trim() || photos.length < 3) && styles.buttonDisabled
              ]}
              onPress={completeSession}
              disabled={!workDescription.trim() || photos.length < 3}
            >
              <Text style={styles.completeButtonText}>
                Завершить работу
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelButtonText}>Отмена</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    paddingBottom: 20,
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
    marginBottom: 8,
  },
  subHeaderText: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  required: {
    color: '#f44336',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#f44336',
    borderWidth: 2,
  },
  charCountContainer: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  charCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  errorText: {
    color: '#f44336',
    fontSize: 14,
    marginTop: 8,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  photoContainer: {
    width: 100,
    height: 100,
    marginRight: 12,
    marginBottom: 12,
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#f44336',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePhotoText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 12,
  },
  addPhotoText: {
    fontSize: 36,
    color: '#4CAF50',
  },
  photoCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 18,
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
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
    marginTop: 12,
  },
});

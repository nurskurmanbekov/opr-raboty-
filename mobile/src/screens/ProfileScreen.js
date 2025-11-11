import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../hooks/useTheme';
import { profileAPI, syncAPI, faceVerificationAPI } from '../api/api';
import Button from '../components/Button';

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncStats, setSyncStats] = useState(null);
  const [faceIdRegistered, setFaceIdRegistered] = useState(false);
  const [faceIdSelfie, setFaceIdSelfie] = useState(null);
  const { colors, isDark, toggleTheme, themePreference, setTheme } = useTheme();
  const [profileData, setProfileData] = useState({
    fullName: '',
    phoneNumber: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    loadUser();
    fetchSyncStats();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setProfileData({
          fullName: parsedUser.fullName || '',
          phoneNumber: parsedUser.phoneNumber || '',
        });
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const fetchSyncStats = async () => {
    try {
      const response = await syncAPI.getQueueStatus();
      setSyncStats(response.data);
    } catch (error) {
      console.error('Error fetching sync stats:', error);
    }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const response = await profileAPI.updateProfile(profileData);
      const updatedUser = response.data;

      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setIsEditing(false);
      Alert.alert('Успех', 'Профиль обновлен');
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось обновить профиль');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Ошибка', 'Пароли не совпадают');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert('Ошибка', 'Пароль должен быть не менее 6 символов');
      return;
    }

    setLoading(true);
    try {
      await profileAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      Alert.alert('Успех', 'Пароль изменен');
    } catch (error) {
      Alert.alert('Ошибка', 'Неверный текущий пароль');
    } finally {
      setLoading(false);
    }
  };

  const handleTakeFaceIdSelfie = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Ошибка', 'Необходимо разрешение на использование камеры для Face ID');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
        cameraType: ImagePicker.CameraType.front,
      });

      if (!result.canceled && result.assets[0]) {
        setFaceIdSelfie(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Face ID selfie error:', error);
      Alert.alert('Ошибка', 'Не удалось сделать селфи для Face ID');
    }
  };

  const handleRegisterFaceId = async () => {
    if (!faceIdSelfie) {
      Alert.alert('Ошибка', 'Сначала сделайте селфи для регистрации Face ID');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      const filename = faceIdSelfie.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('faceImage', {
        uri: faceIdSelfie,
        name: `faceid-registration-${Date.now()}.jpg`,
        type,
      });

      const response = await faceVerificationAPI.registerFace(formData);

      if (response.success) {
        setFaceIdRegistered(true);
        setFaceIdSelfie(null);
        Alert.alert(
          '✅ Face ID зарегистрирован!',
          'Теперь вы можете начинать рабочие сессии с Face ID верификацией',
          [{ text: 'OK' }]
        );

        // Update user data
        const updatedUser = { ...user, faceIdRegistered: true };
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      } else {
        Alert.alert('Ошибка', response.message || 'Не удалось зарегистрировать Face ID');
      }
    } catch (error) {
      console.error('Face ID registration error:', error);
      Alert.alert(
        'Ошибка',
        error.response?.data?.message || error.message || 'Не удалось зарегистрировать Face ID'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSyncNow = async () => {
    setLoading(true);
    try {
      await syncAPI.processQueue();
      fetchSyncStats();
      Alert.alert('Успех', 'Синхронизация завершена');
    } catch (error) {
      Alert.alert('Ошибка', 'Ошибка синхронизации');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Выход',
      'Вы уверены, что хотите выйти?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Выйти',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Загрузка...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.primary }]} edges={['top']}>
      <ScrollView style={[styles.scrollView, { backgroundColor: colors.background }]}>
        {/* Profile Header */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={[styles.avatar, { backgroundColor: colors.avatar }]}>
          <Text style={[styles.avatarText, { color: colors.textOnPrimary }]}>{user.fullName?.charAt(0)}</Text>
        </View>
        <Text style={[styles.name, { color: colors.textOnPrimary }]}>{user.fullName}</Text>
        <Text style={[styles.email, { color: colors.textLight }]}>{user.email}</Text>
        {user.district && (
          <View style={[styles.districtBadge, { backgroundColor: colors.overlayLight }]}>
            <Text style={[styles.districtText, { color: colors.textOnPrimary }]}>📍 {user.district}</Text>
          </View>
        )}
      </View>

      {/* Profile Information */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Личные данные</Text>
          {!isEditing ? (
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Text style={[styles.editButton, { color: colors.primary }]}>Редактировать</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setIsEditing(false)}>
              <Text style={[styles.cancelButton, { color: colors.error }]}>Отмена</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Полное имя</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, {
                  borderColor: colors.border,
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.text
                }]}
                placeholderTextColor={colors.textTertiary}
                value={profileData.fullName}
                onChangeText={(text) => setProfileData({ ...profileData, fullName: text })}
              />
            ) : (
              <Text style={[styles.value, { color: colors.text }]}>{user.fullName}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
            <Text style={[styles.value, { color: colors.text }]}>{user.email}</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Телефон</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, {
                  borderColor: colors.border,
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.text
                }]}
                placeholderTextColor={colors.textTertiary}
                value={profileData.phoneNumber}
                onChangeText={(text) => setProfileData({ ...profileData, phoneNumber: text })}
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={[styles.value, { color: colors.text }]}>{user.phoneNumber || 'Не указан'}</Text>
            )}
          </View>

          {isEditing && (
            <Button
              title="Сохранить изменения"
              onPress={handleUpdateProfile}
              loading={loading}
            />
          )}
        </View>
      </View>

      {/* Theme Settings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Тема оформления</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.themeOptions}>
            <TouchableOpacity
              style={[
                styles.themeOption,
                { borderColor: colors.border },
                themePreference === 'light' && { borderColor: colors.primary, backgroundColor: colors.infoLight }
              ]}
              onPress={() => setTheme('light')}
            >
              <Text style={[styles.themeIcon, { fontSize: 32 }]}>☀️</Text>
              <Text style={[styles.themeLabel, { color: colors.text }]}>Светлая</Text>
              {themePreference === 'light' && (
                <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
                  <Text style={{ color: colors.textOnPrimary, fontSize: 12 }}>✓</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeOption,
                { borderColor: colors.border },
                themePreference === 'dark' && { borderColor: colors.primary, backgroundColor: colors.infoLight }
              ]}
              onPress={() => setTheme('dark')}
            >
              <Text style={[styles.themeIcon, { fontSize: 32 }]}>🌙</Text>
              <Text style={[styles.themeLabel, { color: colors.text }]}>Темная</Text>
              {themePreference === 'dark' && (
                <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
                  <Text style={{ color: colors.textOnPrimary, fontSize: 12 }}>✓</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeOption,
                { borderColor: colors.border },
                themePreference === 'system' && { borderColor: colors.primary, backgroundColor: colors.infoLight }
              ]}
              onPress={() => setTheme('system')}
            >
              <Text style={[styles.themeIcon, { fontSize: 32 }]}>⚙️</Text>
              <Text style={[styles.themeLabel, { color: colors.text }]}>Системная</Text>
              {themePreference === 'system' && (
                <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
                  <Text style={{ color: colors.textOnPrimary, fontSize: 12 }}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          <Text style={[styles.themeHint, { color: colors.textSecondary }]}>
            Текущая тема: {isDark ? 'Темная' : 'Светлая'}
          </Text>
        </View>
      </View>

      {/* Face ID Registration */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>🔐 Face ID Верификация</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {user?.faceIdRegistered || faceIdRegistered ? (
            <View style={[styles.faceIdRegistered, { backgroundColor: colors.successBackground }]}>
              <Text style={[styles.faceIdRegisteredIcon, { fontSize: 48 }]}>✅</Text>
              <Text style={[styles.faceIdRegisteredText, { color: colors.successText }]}>
                Face ID зарегистрирован
              </Text>
              <Text style={[styles.faceIdRegisteredHint, { color: colors.textSecondary }]}>
                Вы можете начинать рабочие сессии с автоматической верификацией лица
              </Text>
            </View>
          ) : (
            <View>
              <View style={[styles.faceIdWarning, { backgroundColor: colors.warningBackground }]}>
                <Text style={[styles.faceIdWarningText, { color: colors.warningText }]}>
                  ⚠️ Face ID не зарегистрирован
                </Text>
                <Text style={[styles.faceIdWarningHint, { color: colors.warningText }]}>
                  Для начала рабочих сессий необходимо зарегистрировать Face ID. Это требование антикоррупционной защиты.
                </Text>
              </View>

              {faceIdSelfie ? (
                <View>
                  <View style={styles.faceIdPreview}>
                    <Image
                      source={{ uri: faceIdSelfie }}
                      style={styles.faceIdImage}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={[styles.faceIdReady, { backgroundColor: colors.infoLight }]}>
                    <Text style={[styles.faceIdReadyText, { color: colors.infoText }]}>
                      ✅ Селфи готово к регистрации
                    </Text>
                  </View>
                  <View style={styles.faceIdButtons}>
                    <Button
                      title="🔄 Переснять"
                      onPress={handleTakeFaceIdSelfie}
                      style={[styles.retakeButtonSmall, { backgroundColor: colors.textSecondary }]}
                    />
                    <Button
                      title="✅ Зарегистрировать Face ID"
                      onPress={handleRegisterFaceId}
                      loading={loading}
                      style={[styles.registerButton, { backgroundColor: colors.success }]}
                    />
                  </View>
                </View>
              ) : (
                <View>
                  <View style={styles.faceIdInstructions}>
                    <Text style={[styles.instructionStep, { color: colors.text }]}>
                      1️⃣ Нажмите кнопку ниже
                    </Text>
                    <Text style={[styles.instructionStep, { color: colors.text }]}>
                      2️⃣ Сделайте селфи (фронтальная камера)
                    </Text>
                    <Text style={[styles.instructionStep, { color: colors.text }]}>
                      3️⃣ Убедитесь, что лицо хорошо видно
                    </Text>
                    <Text style={[styles.instructionStep, { color: colors.text }]}>
                      4️⃣ Зарегистрируйте Face ID
                    </Text>
                  </View>
                  <Button
                    title="📸 Сделать селфи для Face ID"
                    onPress={handleTakeFaceIdSelfie}
                    style={[styles.faceIdButton, { backgroundColor: colors.primary }]}
                  />
                </View>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Change Password */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Изменить пароль</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Текущий пароль</Text>
            <TextInput
              style={[styles.input, {
                borderColor: colors.border,
                backgroundColor: colors.backgroundSecondary,
                color: colors.text
              }]}
              placeholderTextColor={colors.textTertiary}
              value={passwordData.currentPassword}
              onChangeText={(text) => setPasswordData({ ...passwordData, currentPassword: text })}
              secureTextEntry
              placeholder="Введите текущий пароль"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Новый пароль</Text>
            <TextInput
              style={[styles.input, {
                borderColor: colors.border,
                backgroundColor: colors.backgroundSecondary,
                color: colors.text
              }]}
              placeholderTextColor={colors.textTertiary}
              value={passwordData.newPassword}
              onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })}
              secureTextEntry
              placeholder="Введите новый пароль"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Подтвердите пароль</Text>
            <TextInput
              style={[styles.input, {
                borderColor: colors.border,
                backgroundColor: colors.backgroundSecondary,
                color: colors.text
              }]}
              placeholderTextColor={colors.textTertiary}
              value={passwordData.confirmPassword}
              onChangeText={(text) => setPasswordData({ ...passwordData, confirmPassword: text })}
              secureTextEntry
              placeholder="Повторите новый пароль"
            />
          </View>

          <Button
            title="Изменить пароль"
            onPress={handleChangePassword}
            loading={loading}
            disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
          />
        </View>
      </View>

      {/* Sync Status */}
      {syncStats && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Синхронизация</Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={[styles.statRow, { borderBottomColor: colors.background }]}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Ожидают синхронизации:</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{syncStats.pending || 0}</Text>
            </View>
            <View style={[styles.statRow, { borderBottomColor: colors.background }]}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Завершено:</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{syncStats.completed || 0}</Text>
            </View>
            <View style={[styles.statRow, { borderBottomColor: colors.background }]}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Ошибки:</Text>
              <Text style={[styles.statValue, styles.errorValue, { color: colors.error }]}>{syncStats.failed || 0}</Text>
            </View>

            {(syncStats.pending > 0 || syncStats.failed > 0) && (
              <Button
                title="Синхронизировать сейчас"
                onPress={handleSyncNow}
                loading={loading}
                style={[styles.syncButton, { backgroundColor: colors.success }]}
              />
            )}
          </View>
        </View>
      )}

      {/* Logout Button */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.logoutButton, {
            backgroundColor: colors.card,
            borderColor: colors.error
          }]}
          onPress={handleLogout}
        >
          <Text style={[styles.logoutText, { color: colors.error }]}>Выйти из аккаунта</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    marginBottom: 8,
  },
  districtBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  districtText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  editButton: {
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  value: {
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  statLabel: {
    fontSize: 14,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorValue: {
  },
  syncButton: {
    marginTop: 16,
  },
  logoutButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  themeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    position: 'relative',
  },
  themeIcon: {
    marginBottom: 8,
  },
  themeLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeHint: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  faceIdRegistered: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  faceIdRegisteredIcon: {
    marginBottom: 12,
  },
  faceIdRegisteredText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  faceIdRegisteredHint: {
    fontSize: 14,
    textAlign: 'center',
  },
  faceIdWarning: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  faceIdWarningText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  faceIdWarningHint: {
    fontSize: 14,
  },
  faceIdPreview: {
    alignItems: 'center',
    marginVertical: 16,
  },
  faceIdImage: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 4,
    borderColor: '#10b981',
  },
  faceIdReady: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  faceIdReadyText: {
    fontSize: 14,
    fontWeight: '600',
  },
  faceIdButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  retakeButtonSmall: {
    flex: 1,
  },
  registerButton: {
    flex: 2,
  },
  faceIdInstructions: {
    marginBottom: 16,
  },
  instructionStep: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  faceIdButton: {
    marginTop: 8,
  },
});

export default ProfileScreen;

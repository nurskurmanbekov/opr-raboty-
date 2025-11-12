import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncAPI } from '../api/api';
import Button from '../components/Button';

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncStats, setSyncStats] = useState(null);

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
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.fullName?.charAt(0)}</Text>
          </View>
          <Text style={styles.name}>{user.fullName}</Text>
          <Text style={styles.email}>{user.email}</Text>
          {user.district && (
            <View style={styles.districtBadge}>
              <Text style={styles.districtText}>📍 {user.district}</Text>
            </View>
          )}
        </View>

        {/* Profile Information - READ ONLY */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Личные данные</Text>
            <View style={styles.readOnlyBadge}>
              <Text style={styles.readOnlyText}>🔒 Только просмотр</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Полное имя</Text>
              <Text style={styles.value}>{user.fullName}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{user.email}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>ИИН</Text>
              <Text style={styles.value}>{user.idNumber || 'Не указан'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Телефон</Text>
              <Text style={styles.value}>{user.phone || 'Не указан'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Район</Text>
              <Text style={styles.value}>{user.district || 'Не указан'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Назначено часов</Text>
              <Text style={styles.value}>{user.assignedHours || 0} ч</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Выполнено часов</Text>
              <Text style={styles.valueHighlight}>{user.completedHours || 0} ч</Text>
            </View>

            <View style={styles.noteBox}>
              <Text style={styles.noteText}>
                ℹ️ Для изменения личных данных обратитесь к вашему инспектору
              </Text>
            </View>
          </View>
        </View>

        {/* Sync Status */}
        {syncStats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Синхронизация данных</Text>
            <View style={styles.card}>
              <View style={styles.syncRow}>
                <Text style={styles.label}>Ожидают синхронизации</Text>
                <Text style={styles.syncValue}>{syncStats.pending || 0}</Text>
              </View>
              <View style={styles.syncRow}>
                <Text style={styles.label}>Синхронизировано</Text>
                <Text style={styles.syncValueSuccess}>{syncStats.completed || 0}</Text>
              </View>
              <View style={styles.syncRow}>
                <Text style={styles.label}>Ошибки</Text>
                <Text style={styles.syncValueError}>{syncStats.failed || 0}</Text>
              </View>

              <Button
                title="Синхронизировать сейчас"
                onPress={handleSyncNow}
                loading={loading}
                style={[styles.syncButton, { backgroundColor: colors.success }]}
              />
            </View>
          </View>
        )}

        {/* Logout */}
        <View style={styles.section}>
          <Button
            title="Выйти из аккаунта"
            onPress={handleLogout}
            variant="danger"
          />
        </View>

        {/* Footer Info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Система мониторинга общественных работ
          </Text>
          <Text style={styles.footerVersion}>Версия 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  districtBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
  },
  districtText: {
    color: '#1976D2',
    fontWeight: '600',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  readOnlyBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  readOnlyText: {
    fontSize: 12,
    color: '#F57C00',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  valueHighlight: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  noteBox: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  noteText: {
    fontSize: 13,
    color: '#2E7D32',
    lineHeight: 18,
  },
  syncRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  syncValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  syncValueSuccess: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  syncValueError: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f44336',
  },
  syncButton: {
    marginTop: 15,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 5,
  },
  footerVersion: {
    fontSize: 10,
    color: '#ccc',
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

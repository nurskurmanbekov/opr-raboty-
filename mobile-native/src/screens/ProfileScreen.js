/**
 * Profile Screen - User Profile and Settings
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import {useAuth} from '../contexts/AuthContext';
import {profileAPI} from '../api/client';
import StorageService from '../services/storage';
import SyncService from '../services/sync';

const ProfileScreen = () => {
  const {user, logout, refreshUser} = useAuth();
  const [profile, setProfile] = useState(user);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [storageInfo, setStorageInfo] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      // Refresh user data
      const freshUser = await refreshUser();
      setProfile(freshUser);

      // Get storage info
      const storage = await StorageService.getStorageInfo();
      setStorageInfo(storage);

      // Get sync status
      const sync = await SyncService.getSyncStatus();
      setSyncStatus(sync);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadProfileData();
    setIsRefreshing(false);
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

  const handleForceSync = async () => {
    try {
      Alert.alert('Синхронизация', 'Начинаю принудительную синхронизацию...');
      await SyncService.forceSyncNow();
      await loadProfileData();
      Alert.alert('Успешно', 'Синхронизация завершена');
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось выполнить синхронизацию');
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Очистить кэш',
      'Вы уверены? Это удалит все локальные данные (кроме авторизации).',
      [
        {text: 'Отмена', style: 'cancel'},
        {
          text: 'Очистить',
          style: 'destructive',
          onPress: async () => {
            await StorageService.clearOfflineQueue();
            await StorageService.setCachedClients([]);
            await StorageService.setCachedSessions([]);
            await loadProfileData();
            Alert.alert('Готово', 'Кэш очищен');
          },
        },
      ],
    );
  };

  const formatBytes = bytes => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }>
      {/* User Info Card */}
      <View style={styles.card}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile?.firstName?.[0]}
              {profile?.lastName?.[0]}
            </Text>
          </View>
        </View>

        <Text style={styles.userName}>
          {profile?.firstName} {profile?.lastName}
        </Text>
        <Text style={styles.userEmail}>{profile?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{profile?.role || 'Officer'}</Text>
        </View>
      </View>

      {/* Profile Details */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Информация</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Телефон:</Text>
          <Text style={styles.infoValue}>
            {profile?.phone || 'Не указан'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>МРУ:</Text>
          <Text style={styles.infoValue}>{profile?.mruName || 'Не указан'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Район:</Text>
          <Text style={styles.infoValue}>
            {profile?.districtName || 'Не указан'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>ID пользователя:</Text>
          <Text style={styles.infoValue}>{profile?.id}</Text>
        </View>
      </View>

      {/* Sync Status Card */}
      {syncStatus && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Синхронизация</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Статус сети:</Text>
            <Text
              style={[
                styles.infoValue,
                syncStatus.isOnline ? styles.onlineText : styles.offlineText,
              ]}>
              {syncStatus.isOnline ? '🟢 Онлайн' : '🔴 Оффлайн'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>В очереди:</Text>
            <Text style={styles.infoValue}>
              {syncStatus.queueLength} элементов
            </Text>
          </View>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleForceSync}>
            <Text style={styles.actionButtonText}>
              Принудительная синхронизация
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Storage Info Card */}
      {storageInfo && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Локальное хранилище</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Элементов:</Text>
            <Text style={styles.infoValue}>{storageInfo.itemCount}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Размер:</Text>
            <Text style={styles.infoValue}>
              {formatBytes(storageInfo.totalSize)}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleClearCache}>
            <Text style={styles.actionButtonText}>Очистить кэш</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* App Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>О приложении</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Версия:</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>API:</Text>
          <Text style={styles.infoValue}>
            http://85.113.27.42:8090/api
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Движок:</Text>
          <Text style={styles.infoValue}>React Native + Hermes</Text>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Выйти из аккаунта</Text>
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
  card: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  roleBadge: {
    alignSelf: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
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
  onlineText: {
    color: '#34C759',
  },
  offlineText: {
    color: '#FF3B30',
  },
  actionButton: {
    backgroundColor: '#007AFF',
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    margin: 16,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  spacer: {
    height: 20,
  },
});

export default ProfileScreen;

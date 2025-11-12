import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { notificationsAPI } from '../api/api';

const NOTIFICATION_ICONS = {
  work_session_reminder: '⏰',
  work_session_approved: '✅',
  work_session_rejected: '❌',
  geofence_violation: '⚠️',
  photo_verification_needed: '📸',
  system_announcement: '📢',
  client_assigned: '👤',
  schedule_change: '📅',
  general: '📬'
};

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await notificationsAPI.getNotifications();
      setNotifications(response.data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationsAPI.getUnreadCount();
      setUnreadCount(response.data?.count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      fetchNotifications();
      fetchUnreadCount();
      Alert.alert('Успех', 'Все уведомления отмечены как прочитанные');
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const getNotificationIcon = (type) => {
    return NOTIFICATION_ICONS[type] || NOTIFICATION_ICONS.general;
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        { backgroundColor: colors.card },
        !item.isRead && [styles.unreadCard, {
          borderLeftColor: colors.primary,
          backgroundColor: colors.infoLight
        }]
      ]}
      onPress={() => handleMarkAsRead(item.id)}
    >
      <View style={styles.notificationContent}>
        <Text style={styles.notificationIcon}>{getNotificationIcon(item.type)}</Text>
        <View style={styles.notificationText}>
          <Text style={[styles.notificationTitle, { color: colors.text }]}>{item.title || 'Уведомление'}</Text>
          <Text style={[styles.notificationBody, { color: colors.textSecondary }]}>{item.body}</Text>
          <Text style={[styles.notificationTime, { color: colors.textTertiary }]}>
            {new Date(item.createdAt).toLocaleString('ru-RU')}
          </Text>
        </View>
        {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.primary }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={[styles.headerTitle, { color: colors.textOnPrimary }]}>Уведомления</Text>
        {unreadCount > 0 && (
          <TouchableOpacity style={[styles.markAllButton, { backgroundColor: colors.overlayLight }]} onPress={handleMarkAllAsRead}>
            <Text style={[styles.markAllText, { color: colors.textOnPrimary }]}>Прочитать все</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Unread Count */}
      {unreadCount > 0 && (
        <View style={[styles.unreadBanner, { backgroundColor: colors.infoBackground }]}>
          <Text style={[styles.unreadText, { color: colors.infoText }]}>
            {unreadCount} {unreadCount === 1 ? 'непрочитанное' : 'непрочитанных'}
          </Text>
        </View>
      )}

      {/* Notifications List */}
      <FlatList
        style={{ backgroundColor: colors.background }}
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📬</Text>
              <Text style={[styles.emptyText, { color: colors.textTertiary }]}>Нет уведомлений</Text>
            </View>
          )
        }
        contentContainerStyle={notifications.length === 0 && styles.emptyList}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  unreadBanner: {
    padding: 12,
    alignItems: 'center',
  },
  unreadText: {
    fontWeight: '600',
  },
  notificationCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadCard: {
    borderLeftWidth: 4,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 14,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
  },
});

export default NotificationsScreen;

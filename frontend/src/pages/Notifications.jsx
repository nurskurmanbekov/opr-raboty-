import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
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

const NOTIFICATION_COLORS = {
  work_session_reminder: { bg: 'from-blue-100 to-blue-50', border: 'border-blue-300', text: 'text-blue-600' },
  work_session_approved: { bg: 'from-green-100 to-green-50', border: 'border-green-300', text: 'text-green-600' },
  work_session_rejected: { bg: 'from-red-100 to-red-50', border: 'border-red-300', text: 'text-red-600' },
  geofence_violation: { bg: 'from-orange-100 to-orange-50', border: 'border-orange-300', text: 'text-orange-600' },
  photo_verification_needed: { bg: 'from-purple-100 to-purple-50', border: 'border-purple-300', text: 'text-purple-600' },
  system_announcement: { bg: 'from-yellow-100 to-yellow-50', border: 'border-yellow-300', text: 'text-yellow-600' },
  client_assigned: { bg: 'from-indigo-100 to-indigo-50', border: 'border-indigo-300', text: 'text-indigo-600' },
  schedule_change: { bg: 'from-pink-100 to-pink-50', border: 'border-pink-300', text: 'text-pink-600' },
  general: { bg: 'from-gray-100 to-gray-50', border: 'border-gray-300', text: 'text-gray-600' }
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'

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
      setLoading(true);
      const response = await notificationsAPI.getNotifications();

      // Backend returns: {success: true, data: {notifications: [...], pagination: {...}}}
      // Check multiple possible response structures
      let notificationsArray = [];

      if (response?.data?.notifications && Array.isArray(response.data.notifications)) {
        // Standard backend format
        notificationsArray = response.data.notifications;
      } else if (response?.notifications && Array.isArray(response.notifications)) {
        // Alternative format
        notificationsArray = response.notifications;
      } else if (Array.isArray(response?.data)) {
        // Direct array in data
        notificationsArray = response.data;
      } else if (Array.isArray(response)) {
        // Direct array response
        notificationsArray = response;
      } else {
        console.warn('Unexpected response format:', response);
        notificationsArray = [];
      }

      setNotifications(notificationsArray);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Ошибка при загрузке уведомлений');
      setNotifications([]); // Always set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationsAPI.getUnreadCount();
      setUnreadCount(response.data?.count || response.count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
      setUnreadCount(0);
    }
  };

  const handleMarkAsRead = async (id) => {
    const loadingToast = toast.loading('Отмечаем как прочитанное...');
    try {
      await notificationsAPI.markAsRead(id);
      fetchNotifications();
      fetchUnreadCount();
      toast.success('Уведомление прочитано', { id: loadingToast });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Ошибка при отметке', { id: loadingToast });
    }
  };

  const handleMarkAllAsRead = async () => {
    const loadingToast = toast.loading('Отмечаем все как прочитанные...');
    try {
      await notificationsAPI.markAllAsRead();
      fetchNotifications();
      fetchUnreadCount();
      toast.success('Все уведомления прочитаны', { id: loadingToast });
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Ошибка при отметке', { id: loadingToast });
    }
  };

  // Ensure notifications is always an array before filtering
  const notificationsArray = Array.isArray(notifications) ? notifications : [];
  const filteredNotifications = notificationsArray.filter(notification => {
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'read') return notification.isRead;
    return true;
  });

  const getNotificationIcon = (type) => {
    return NOTIFICATION_ICONS[type] || NOTIFICATION_ICONS.general;
  };

  const getNotificationColor = (type) => {
    return NOTIFICATION_COLORS[type] || NOTIFICATION_COLORS.general;
  };

  const getNotificationTitle = (type) => {
    const titles = {
      work_session_reminder: 'Напоминание о работе',
      work_session_approved: 'Сессия одобрена',
      work_session_rejected: 'Сессия отклонена',
      geofence_violation: 'Нарушение геозоны',
      photo_verification_needed: 'Требуется фото',
      system_announcement: 'Системное уведомление',
      client_assigned: 'Новый клиент',
      schedule_change: 'Изменение расписания',
      general: 'Уведомление'
    };
    return titles[type] || 'Уведомление';
  };

  return (
    <Layout>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Уведомления
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-gray-600 mt-2"
          >
            {unreadCount > 0 ? `У вас ${unreadCount} непрочитанных уведомлений` : 'Все уведомления прочитаны'}
          </motion.p>
        </div>
        {unreadCount > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleMarkAllAsRead}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition shadow-md"
          >
            <CheckCheck size={20} />
            <span>Прочитать все</span>
          </motion.button>
        )}
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6 flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setFilter('all')}
          className={`px-6 py-2 rounded-lg transition ${
            filter === 'all'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Все ({notificationsArray.length})
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setFilter('unread')}
          className={`px-6 py-2 rounded-lg transition ${
            filter === 'unread'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Непрочитанные ({unreadCount})
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setFilter('read')}
          className={`px-6 py-2 rounded-lg transition ${
            filter === 'read'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Прочитанные ({notificationsArray.length - unreadCount})
        </motion.button>
      </motion.div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-md p-6 animate-pulse">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-4">
            {filteredNotifications.map((notification, index) => {
              const colorConfig = getNotificationColor(notification.type);
              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.01, x: 5 }}
                  className={`bg-gradient-to-r ${colorConfig.bg} rounded-xl shadow-md p-6 border-l-4 ${
                    colorConfig.border
                  } transition hover:shadow-xl ${!notification.isRead ? 'ring-2 ring-blue-200' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: index * 0.05 + 0.2, type: 'spring' }}
                        className="text-4xl"
                      >
                        {getNotificationIcon(notification.type)}
                      </motion.div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-bold text-gray-800">
                            {notification.title || getNotificationTitle(notification.type)}
                          </h3>
                          {!notification.isRead && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="inline-block w-2 h-2 bg-blue-600 rounded-full"
                            />
                          )}
                        </div>
                        <p className="text-gray-700 mb-3">{notification.body}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{new Date(notification.createdAt).toLocaleString('ru-RU')}</span>
                          {notification.data && Object.keys(notification.data).length > 0 && (
                            <span className="text-xs bg-white/50 px-2 py-1 rounded">
                              {JSON.stringify(notification.data).substring(0, 50)}...
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {!notification.isRead && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="text-blue-600 hover:text-blue-800 transition p-2 hover:bg-white/50 rounded-lg"
                          title="Отметить как прочитанное"
                        >
                          <Check size={20} />
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {filteredNotifications.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-md"
              >
                <motion.div
                  initial={{ y: -20 }}
                  animate={{ y: 0 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                >
                  <Bell size={64} className="text-gray-400 mx-auto mb-4" />
                </motion.div>
                <p className="text-gray-600 text-lg font-medium">
                  {filter === 'unread' && 'Нет непрочитанных уведомлений'}
                  {filter === 'read' && 'Нет прочитанных уведомлений'}
                  {filter === 'all' && 'У вас пока нет уведомлений'}
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Уведомления появятся здесь автоматически
                </p>
              </motion.div>
            )}
          </div>
        </AnimatePresence>
      )}
    </Layout>
  );
};

export default Notifications;

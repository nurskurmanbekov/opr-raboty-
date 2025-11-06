import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, Filter } from 'lucide-react';
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
  work_session_reminder: 'bg-blue-100 border-blue-300',
  work_session_approved: 'bg-green-100 border-green-300',
  work_session_rejected: 'bg-red-100 border-red-300',
  geofence_violation: 'bg-orange-100 border-orange-300',
  photo_verification_needed: 'bg-purple-100 border-purple-300',
  system_announcement: 'bg-yellow-100 border-yellow-300',
  client_assigned: 'bg-indigo-100 border-indigo-300',
  schedule_change: 'bg-pink-100 border-pink-300',
  general: 'bg-gray-100 border-gray-300'
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
      setUnreadCount(0); // При ошибке - 0
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking all as read:', error);
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
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Уведомления</h1>
          <p className="text-gray-600 mt-2">
            {unreadCount > 0 ? `У вас ${unreadCount} непрочитанных уведомлений` : 'Все уведомления прочитаны'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition shadow-md"
          >
            <CheckCheck size={20} />
            <span>Прочитать все</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6 flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setFilter('all')}
          className={`px-6 py-2 rounded-lg transition ${
            filter === 'all'
              ? 'bg-white text-blue-600 shadow'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Все ({notificationsArray.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-6 py-2 rounded-lg transition ${
            filter === 'unread'
              ? 'bg-white text-blue-600 shadow'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Непрочитанные ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('read')}
          className={`px-6 py-2 rounded-lg transition ${
            filter === 'read'
              ? 'bg-white text-blue-600 shadow'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Прочитанные ({notificationsArray.length - unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-xl shadow-md p-6 border-l-4 transition hover:shadow-lg ${
                getNotificationColor(notification.type)
              } ${!notification.isRead ? 'ring-2 ring-blue-200' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="text-3xl">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-bold text-gray-800">
                        {notification.title || getNotificationTitle(notification.type)}
                      </h3>
                      {!notification.isRead && (
                        <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-3">{notification.body}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{new Date(notification.createdAt).toLocaleString('ru-RU')}</span>
                      {notification.data && (
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {JSON.stringify(notification.data).substring(0, 50)}...
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  {!notification.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="text-blue-600 hover:text-blue-800 transition p-2 hover:bg-blue-50 rounded-lg"
                      title="Отметить как прочитанное"
                    >
                      <Check size={20} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredNotifications.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl shadow-md">
              <Bell size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                {filter === 'unread' && 'Нет непрочитанных уведомлений'}
                {filter === 'read' && 'Нет прочитанных уведомлений'}
                {filter === 'all' && 'У вас пока нет уведомлений'}
              </p>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};

export default Notifications;

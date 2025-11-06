const DeviceToken = require('../models/DeviceToken');
const Notification = require('../models/Notification');
const notificationService = require('../services/notificationService');
const { Op } = require('sequelize');

/**
 * Register device token
 */
exports.registerDeviceToken = async (req, res) => {
  try {
    const { token, deviceType, deviceId, deviceName } = req.body;
    const userId = req.user.id;

    if (!token || !deviceType) {
      return res.status(400).json({
        success: false,
        message: 'Token and deviceType are required'
      });
    }

    // Check if token already exists
    let deviceToken = await DeviceToken.findOne({ where: { token } });

    if (deviceToken) {
      // Update existing token
      await deviceToken.update({
        userId,
        deviceType,
        deviceId,
        deviceName,
        isActive: true,
        lastUsed: new Date()
      });
    } else {
      // Create new token
      deviceToken = await DeviceToken.create({
        userId,
        token,
        deviceType,
        deviceId,
        deviceName,
        isActive: true
      });
    }

    res.json({
      success: true,
      message: 'Device token registered successfully',
      data: deviceToken
    });

  } catch (error) {
    console.error('Register device token error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering device token',
      error: error.message
    });
  }
};

/**
 * Unregister device token
 */
exports.unregisterDeviceToken = async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }

    await DeviceToken.update(
      { isActive: false },
      { where: { userId, token } }
    );

    res.json({
      success: true,
      message: 'Device token unregistered successfully'
    });

  } catch (error) {
    console.error('Unregister device token error:', error);
    res.status(500).json({
      success: false,
      message: 'Error unregistering device token',
      error: error.message
    });
  }
};

/**
 * Get user's notifications
 */
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, type, isRead } = req.query;
    const offset = (page - 1) * limit;

    const where = { userId };
    if (type) where.type = type;
    if (isRead !== undefined) where.isRead = isRead === 'true';

    const { count, rows } = await Notification.findAndCountAll({
      where,
      order: [['sentAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        notifications: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
};

/**
 * Get unread notification count
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await Notification.count({
      where: { userId, isRead: false }
    });

    res.json({
      success: true,
      data: { count }
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching unread count',
      error: error.message
    });
  }
};

/**
 * Mark notification as read
 */
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({
      where: { id, userId }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.update({
      isRead: true,
      readAt: new Date()
    });

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      error: error.message
    });
  }
};

/**
 * Mark all notifications as read
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.update(
      { isRead: true, readAt: new Date() },
      { where: { userId, isRead: false } }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notifications as read',
      error: error.message
    });
  }
};

/**
 * Delete notification
 */
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({
      where: { id, userId }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.destroy();

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting notification',
      error: error.message
    });
  }
};

/**
 * Send notification (Admin only)
 */
exports.sendNotification = async (req, res) => {
  try {
    const { userId, userIds, role, district, title, body, type, data } = req.body;

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'Title and body are required'
      });
    }

    const notification = { title, body, type, data };
    let result;

    if (userId) {
      // Send to single user
      result = await notificationService.sendToUser(userId, notification);
    } else if (userIds && Array.isArray(userIds)) {
      // Send to multiple users
      result = await notificationService.sendToMultipleUsers(userIds, notification);
    } else if (role) {
      // Send to all users with specific role
      result = await notificationService.sendToRole(role, notification);
    } else if (district) {
      // Send to all users in district
      result = await notificationService.sendToDistrict(district, notification);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please specify userId, userIds, role, or district'
      });
    }

    res.json({
      success: true,
      message: 'Notification sent successfully',
      data: result
    });

  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending notification',
      error: error.message
    });
  }
};

/**
 * Test notification (for development)
 */
exports.testNotification = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await notificationService.sendToUser(userId, {
      title: 'Тестовое уведомление',
      body: 'Это тестовое push-уведомление от системы мониторинга',
      type: 'general',
      data: { test: true }
    });

    res.json({
      success: true,
      message: 'Test notification sent',
      data: result
    });

  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending test notification',
      error: error.message
    });
  }
};

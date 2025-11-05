const { admin, isFirebaseEnabled } = require('../config/firebase');
const DeviceToken = require('../models/DeviceToken');
const Notification = require('../models/Notification');

class NotificationService {
  /**
   * Send push notification to a user
   */
  async sendToUser(userId, notification) {
    try {
      // Save notification to database
      const notificationRecord = await Notification.create({
        userId,
        title: notification.title,
        body: notification.body,
        type: notification.type || 'general',
        data: notification.data || {},
        deliveryStatus: 'pending'
      });

      // If Firebase is not enabled, just save to DB
      if (!isFirebaseEnabled()) {
        console.log(`Notification saved to DB (Firebase disabled): ${notification.title}`);
        return { success: true, notification: notificationRecord, pushed: false };
      }

      // Get user's device tokens
      const deviceTokens = await DeviceToken.findAll({
        where: { userId, isActive: true }
      });

      if (deviceTokens.length === 0) {
        console.log(`No device tokens found for user ${userId}`);
        await notificationRecord.update({ deliveryStatus: 'sent' });
        return { success: true, notification: notificationRecord, pushed: false };
      }

      // Prepare FCM message
      const tokens = deviceTokens.map(dt => dt.token);
      const message = {
        notification: {
          title: notification.title,
          body: notification.body
        },
        data: {
          type: notification.type || 'general',
          ...notification.data
        },
        tokens
      };

      // Send via FCM
      const response = await admin.messaging().sendMulticast(message);

      // Update device tokens based on response
      for (let i = 0; i < response.responses.length; i++) {
        const result = response.responses[i];
        const token = deviceTokens[i];

        if (result.success) {
          await token.update({ lastUsed: new Date() });
        } else {
          // Handle errors (invalid tokens, etc.)
          if (result.error?.code === 'messaging/invalid-registration-token' ||
              result.error?.code === 'messaging/registration-token-not-registered') {
            await token.update({ isActive: false });
          }
        }
      }

      // Update notification status
      const status = response.successCount > 0 ? 'sent' : 'failed';
      await notificationRecord.update({
        deliveryStatus: status,
        errorMessage: response.successCount === 0 ? 'All tokens failed' : null
      });

      return {
        success: response.successCount > 0,
        notification: notificationRecord,
        pushed: true,
        successCount: response.successCount,
        failureCount: response.failureCount
      };

    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Send notification to multiple users
   */
  async sendToMultipleUsers(userIds, notification) {
    const results = [];

    for (const userId of userIds) {
      try {
        const result = await this.sendToUser(userId, notification);
        results.push({ userId, success: true, result });
      } catch (error) {
        results.push({ userId, success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * Send notification based on role
   */
  async sendToRole(role, notification) {
    const User = require('../models/User');

    const users = await User.findAll({
      where: { role, isActive: true },
      attributes: ['id']
    });

    const userIds = users.map(u => u.id);
    return this.sendToMultipleUsers(userIds, notification);
  }

  /**
   * Send notification to users in a district
   */
  async sendToDistrict(district, notification) {
    const User = require('../models/User');

    const users = await User.findAll({
      where: { district, isActive: true },
      attributes: ['id']
    });

    const userIds = users.map(u => u.id);
    return this.sendToMultipleUsers(userIds, notification);
  }

  /**
   * Schedule a notification for later (simple implementation)
   */
  async scheduleNotification(userId, notification, sendAt) {
    const delay = new Date(sendAt) - new Date();

    if (delay <= 0) {
      return this.sendToUser(userId, notification);
    }

    setTimeout(async () => {
      try {
        await this.sendToUser(userId, notification);
      } catch (error) {
        console.error('Error sending scheduled notification:', error);
      }
    }, delay);

    return { success: true, scheduled: true, sendAt };
  }

  /**
   * Send work session reminders
   */
  async sendWorkSessionReminder(clientId) {
    const Client = require('../models/Client');
    const client = await Client.findByPk(clientId);

    if (!client) {
      throw new Error('Client not found');
    }

    return this.sendToUser(client.userId, {
      title: 'Напоминание о работе',
      body: 'Не забудьте отметить начало рабочей смены',
      type: 'work_session_reminder',
      data: { clientId }
    });
  }

  /**
   * Send geofence violation alert
   */
  async sendGeofenceViolation(clientId, violationType, geofenceName) {
    const Client = require('../models/Client');
    const client = await Client.findByPk(clientId);

    if (!client) {
      throw new Error('Client not found');
    }

    const messages = {
      exit: `Вы покинули рабочую зону "${geofenceName}"`,
      never_entered: `Вы не находитесь в рабочей зоне "${geofenceName}"`
    };

    return this.sendToUser(client.userId, {
      title: 'Нарушение геозоны',
      body: messages[violationType] || 'Обнаружено нарушение геозоны',
      type: 'geofence_violation',
      data: { clientId, violationType, geofenceName }
    });
  }
}

module.exports = new NotificationService();

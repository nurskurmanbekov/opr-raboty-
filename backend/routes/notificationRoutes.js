const express = require('express');
const router = express.Router();
const {
  registerDeviceToken,
  unregisterDeviceToken,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  sendNotification,
  testNotification
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');
const { requireRole, requirePermission } = require('../middleware/roleCheck');

router.use(protect); // All routes need authentication

// Device token management
router.post('/device-token', registerDeviceToken);
router.delete('/device-token', unregisterDeviceToken);

// User notifications
router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);
router.delete('/:id', deleteNotification);

// Admin: Send notifications
router.post('/send', requirePermission('notifications.send'), sendNotification);

// Test notification (development)
router.post('/test', testNotification);

module.exports = router;

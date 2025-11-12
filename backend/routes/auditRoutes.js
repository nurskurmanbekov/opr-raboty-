const express = require('express');
const router = express.Router();
const {
  getAuditLogs,
  getAuditLogById,
  getUserAuditLogs,
  getEntityAuditLogs,
  getAuditStats
} = require('../controllers/auditController');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

// Все роуты требуют аутентификации
router.use(protect);

// Только superadmin, central_admin и auditor имеют доступ к audit logs
const auditRoles = ['superadmin', 'central_admin', 'auditor'];

// @route   GET /api/audit-logs
// @desc    Получить все audit logs с фильтрацией и пагинацией
router.get('/', requireRole(...auditRoles), getAuditLogs);

// @route   GET /api/audit-logs/stats
// @desc    Получить статистику по audit logs
router.get('/stats', requireRole(...auditRoles), getAuditStats);

// @route   GET /api/audit-logs/user/:userId
// @desc    Получить историю действий конкретного пользователя
router.get('/user/:userId', requireRole(...auditRoles), getUserAuditLogs);

// @route   GET /api/audit-logs/entity/:entityType/:entityId
// @desc    Получить историю действий с конкретной сущностью
router.get('/entity/:entityType/:entityId', getEntityAuditLogs);

// @route   GET /api/audit-logs/:id
// @desc    Получить audit log по ID
router.get('/:id', requireRole(...auditRoles), getAuditLogById);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  exportStatisticsToExcel,
  exportClientsToExcel
} = require('../controllers/exportController');
const { protect, authorize } = require('../middleware/auth');
const { checkAuditorAccess } = require('../middleware/auditorAccess');

router.use(protect); // Все маршруты требуют аутентификации

// Экспорт общей статистики в Excel
router.get(
  '/statistics/excel',
  authorize('auditor', 'central_admin', 'superadmin', 'mru_manager', 'district_manager'),
  checkAuditorAccess,
  exportStatisticsToExcel
);

// Экспорт списка клиентов в Excel
router.get(
  '/clients/excel',
  authorize('auditor', 'central_admin', 'superadmin', 'mru_manager', 'district_manager', 'officer'),
  checkAuditorAccess,
  exportClientsToExcel
);

module.exports = router;

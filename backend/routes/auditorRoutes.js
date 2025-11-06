const express = require('express');
const router = express.Router();
const {
  setAuditorPermissions,
  getAuditorPermissions,
  getOverviewStatistics,
  getStatisticsByMRU,
  getStatisticsByDistrict
} = require('../controllers/auditorController');
const { protect, authorize } = require('../middleware/auth');
const { checkAuditorAccess } = require('../middleware/auditorAccess');

router.use(protect); // Все маршруты требуют аутентификации

// Управление правами аудиторов (только central_admin)
router.post('/:userId/permissions', authorize('central_admin', 'superadmin'), setAuditorPermissions);
router.get('/:userId/permissions', getAuditorPermissions);

// Статистика (доступна аудиторам, администраторам и руководителям)
router.get(
  '/statistics/overview',
  authorize('auditor', 'central_admin', 'superadmin', 'mru_manager', 'district_manager'),
  checkAuditorAccess,
  getOverviewStatistics
);

router.get(
  '/statistics/by-mru',
  authorize('auditor', 'central_admin', 'superadmin', 'mru_manager'),
  checkAuditorAccess,
  getStatisticsByMRU
);

router.get(
  '/statistics/by-district',
  authorize('auditor', 'central_admin', 'superadmin', 'mru_manager', 'district_manager'),
  checkAuditorAccess,
  getStatisticsByDistrict
);

module.exports = router;

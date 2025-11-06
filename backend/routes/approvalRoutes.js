const express = require('express');
const router = express.Router();
const {
  getAllApprovals,
  getApprovalById,
  approveApproval,
  rejectApproval,
  createOfficerApproval,
  createClientApproval
} = require('../controllers/approvalController');
const { protect, authorize } = require('../middleware/auth');

// Создание заявки на регистрацию офицера (публичный доступ)
router.post('/officer', createOfficerApproval);

// Все остальные маршруты требуют аутентификации
router.use(protect);

// Получить все заявки (только central_admin)
router.get('/', authorize('central_admin', 'superadmin'), getAllApprovals);

// Получить одну заявку
router.get('/:id', getApprovalById);

// Одобрить заявку (только central_admin)
router.post('/:id/approve', authorize('central_admin', 'superadmin'), approveApproval);

// Отклонить заявку (только central_admin)
router.post('/:id/reject', authorize('central_admin', 'superadmin'), rejectApproval);

// Создать заявку на добавление клиента (офицеры)
router.post('/client', authorize('officer'), createClientApproval);

module.exports = router;

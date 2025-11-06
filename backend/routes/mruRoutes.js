const express = require('express');
const router = express.Router();
const {
  getAllMRU,
  getMRUById,
  createMRU,
  updateMRU,
  deleteMRU,
  getMRUStats
} = require('../controllers/mruController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect); // Все маршруты требуют аутентификации

// Получить все МРУ (доступно всем авторизованным пользователям)
router.get('/', getAllMRU);

// Получить одно МРУ
router.get('/:id', getMRUById);

// Получить статистику по МРУ
router.get('/:id/stats', getMRUStats);

// Создать МРУ (только central_admin)
router.post('/', authorize('central_admin', 'superadmin'), createMRU);

// Обновить МРУ (только central_admin)
router.put('/:id', authorize('central_admin', 'superadmin'), updateMRU);

// Удалить МРУ (только central_admin)
router.delete('/:id', authorize('central_admin', 'superadmin'), deleteMRU);

module.exports = router;

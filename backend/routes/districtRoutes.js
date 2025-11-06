const express = require('express');
const router = express.Router();
const {
  getAllDistricts,
  getDistrictById,
  createDistrict,
  updateDistrict,
  deleteDistrict,
  getDistrictStats
} = require('../controllers/districtController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect); // Все маршруты требуют аутентификации

// Получить все районы (доступно всем авторизованным пользователям)
router.get('/', getAllDistricts);

// Получить один район
router.get('/:id', getDistrictById);

// Получить статистику по району
router.get('/:id/stats', getDistrictStats);

// Создать район (только central_admin)
router.post('/', authorize('central_admin', 'superadmin'), createDistrict);

// Обновить район (только central_admin)
router.put('/:id', authorize('central_admin', 'superadmin'), updateDistrict);

// Удалить район (только central_admin)
router.delete('/:id', authorize('central_admin', 'superadmin'), deleteDistrict);

module.exports = router;

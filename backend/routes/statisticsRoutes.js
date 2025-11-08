const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getMRUStats,
  getDistrictStats,
  getDrilldownData
} = require('../controllers/statisticsController');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

// Все роуты требуют аутентификации
router.use(protect);

// Роли, которые могут просматривать статистику
const statsRoles = [
  'superadmin',
  'central_admin',
  'regional_admin',
  'district_admin',
  'mru_manager',
  'district_manager',
  'officer',
  'supervisor',
  'analyst',
  'auditor'
];

// @route   GET /api/statistics/dashboard
// @desc    Получить общую статистику для главного дашборда
router.get('/dashboard', requireRole(...statsRoles), getDashboardStats);

// @route   GET /api/statistics/mru
// @desc    Получить статистику по всем МРУ
router.get('/mru', requireRole(...statsRoles), getMRUStats);

// @route   GET /api/statistics/districts
// @desc    Получить статистику по районам (для карты)
router.get('/districts', requireRole(...statsRoles), getDistrictStats);

// @route   GET /api/statistics/drilldown
// @desc    Получить drill-down данные (МРУ → Район → Офицер → Клиенты)
router.get('/drilldown', requireRole(...statsRoles), getDrilldownData);

module.exports = router;

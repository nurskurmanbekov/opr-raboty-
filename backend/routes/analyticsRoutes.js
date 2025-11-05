const express = require('express');
const router = express.Router();
const {
  getOverallStats,
  getClientPerformance,
  getOfficerPerformance,
  getDistrictStats,
  getTimeSeriesData,
  exportToExcel,
  exportToPDF
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');
const { requirePermission } = require('../middleware/roleCheck');

router.use(protect); // All routes need authentication

// Statistics endpoints
router.get('/overall', requirePermission('analytics.view'), getOverallStats);
router.get('/client/:clientId', requirePermission('analytics.view'), getClientPerformance);
router.get('/officer/:officerId', requirePermission('analytics.view'), getOfficerPerformance);
router.get('/district/:district', requirePermission('analytics.view'), getDistrictStats);

// Time series data for charts
router.get('/timeseries/:type', requirePermission('analytics.view'), getTimeSeriesData);

// Export endpoints
router.get('/export/excel', requirePermission('reports.export'), exportToExcel);
router.get('/export/pdf', requirePermission('reports.export'), exportToPDF);

module.exports = router;

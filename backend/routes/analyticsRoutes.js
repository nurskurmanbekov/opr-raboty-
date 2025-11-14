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
const { requireOfficer, requireDistrictHead } = require('../middleware/roleCheck');

router.use(protect); // All routes need authentication

// Statistics endpoints (officers and above)
router.get('/overall', requireOfficer(), getOverallStats);
router.get('/client/:clientId', requireOfficer(), getClientPerformance);
router.get('/officer/:officerId', requireOfficer(), getOfficerPerformance);
router.get('/district/:district', requireOfficer(), getDistrictStats);

// Time series data for charts
router.get('/timeseries/:type', requireOfficer(), getTimeSeriesData);

// Export endpoints (district_head and superadmin only)
router.get('/export/excel', requireDistrictHead(), exportToExcel);
router.get('/export/pdf', requireDistrictHead(), exportToPDF);

module.exports = router;

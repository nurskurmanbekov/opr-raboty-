const express = require('express');
const router = express.Router();
const {
  createGeofence,
  getAllGeofences,
  getGeofenceById,
  updateGeofence,
  deleteGeofence,
  checkGeofence,
  getViolations
} = require('../controllers/geofenceController');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

router.use(protect); // All routes need authentication

router.post('/', requireRole('superadmin', 'regional_admin', 'district_admin'), createGeofence);
router.get('/', getAllGeofences);
router.get('/violations', getViolations);
router.post('/check', checkGeofence);
router.get('/:id', getGeofenceById);
router.put('/:id', requireRole('superadmin', 'regional_admin', 'district_admin'), updateGeofence);
router.delete('/:id', requireRole('superadmin'), deleteGeofence);

module.exports = router;

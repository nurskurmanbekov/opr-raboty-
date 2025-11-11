const express = require('express');
const router = express.Router();
const {
  startWorkSession,
  endWorkSession,
  getWorkSessions,
  getWorkSession,
  uploadPhoto,
  updateLocation,
  verifyWorkSession,
  getWorkSessionRoute
} = require('../controllers/workSessionController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect); // All routes need authentication

// ⭐ КРИТИЧНО: Face ID фото обязательно для старта сессии
router.post('/start', upload.single('photo'), startWorkSession);
router.put('/:id/end', endWorkSession);
router.post('/:id/location', updateLocation);
router.get('/', getWorkSessions);
router.get('/:id', getWorkSession);
router.get('/:id/route', getWorkSessionRoute);
router.post('/:id/photos', upload.single('photo'), uploadPhoto);
router.put('/:id/verify', authorize('officer', 'district_admin', 'superadmin'), verifyWorkSession);

module.exports = router;
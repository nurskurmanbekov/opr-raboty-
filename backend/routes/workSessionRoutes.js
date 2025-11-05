const express = require('express');
const router = express.Router();
const {
  startWorkSession,
  endWorkSession,
  getWorkSessions,
  getWorkSession,
  uploadPhoto,
  verifyWorkSession
} = require('../controllers/workSessionController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect); // All routes need authentication

router.post('/start', startWorkSession);
router.put('/:id/end', endWorkSession);
router.get('/', getWorkSessions);
router.get('/:id', getWorkSession);
router.post('/:id/photos', upload.single('photo'), uploadPhoto);
router.put('/:id/verify', authorize('officer', 'district_admin', 'superadmin'), verifyWorkSession);

module.exports = router;
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
const { canAccessWorkSession, mustOwnWorkSession } = require('../middleware/accessControl');
const upload = require('../middleware/upload');

router.use(protect); // All routes need authentication

// 🔒 SECURITY: Start session - only clients, enforced in controller
router.post('/start', startWorkSession);

// 🔒 SECURITY: End session - must own session
router.put('/:id/end', mustOwnWorkSession, endWorkSession);

// 🔒 SECURITY: Update location - must own session
router.post('/:id/location', mustOwnWorkSession, updateLocation);

// 🔒 SECURITY: Get all sessions - role-based filtering in controller
router.get('/', getWorkSessions);

// 🔒 SECURITY: Get single session - check access rights
router.get('/:id', canAccessWorkSession, getWorkSession);

// 🔒 SECURITY: Get session route - check access rights
router.get('/:id/route', canAccessWorkSession, getWorkSessionRoute);

// 🔒 SECURITY: Upload photo - must own session (check ownership BEFORE uploading file!)
router.post('/:id/photos', mustOwnWorkSession, upload.single('photo'), uploadPhoto);

// 🔒 SECURITY: Verify session - only authorized roles
router.put('/:id/verify', authorize('officer', 'district_admin', 'superadmin', 'central_admin'), canAccessWorkSession, verifyWorkSession);

module.exports = router;
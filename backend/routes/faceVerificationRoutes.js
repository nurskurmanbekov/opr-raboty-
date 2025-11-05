const express = require('express');
const router = express.Router();
const {
  registerFace,
  verifyFace,
  getVerificationHistory,
  getVerificationStats,
  getVerificationById,
  deleteFaceRegistration
} = require('../controllers/faceVerificationController');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

router.use(protect); // All routes need authentication

// Face registration and verification
router.post('/register', registerFace);
router.post('/verify', verifyFace);

// Verification history and stats
router.get('/history', getVerificationHistory);
router.get('/history/:userId', requireRole('superadmin', 'regional_admin', 'district_admin', 'officer'), getVerificationHistory);
router.get('/stats', getVerificationStats);
router.get('/stats/:userId', requireRole('superadmin', 'regional_admin', 'district_admin', 'officer'), getVerificationStats);

// Get specific verification
router.get('/:id', getVerificationById);

// Admin: Delete face registration
router.delete('/:userId', requireRole('superadmin', 'district_admin'), deleteFaceRegistration);

module.exports = router;

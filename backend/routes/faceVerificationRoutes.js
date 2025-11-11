const express = require('express');
const router = express.Router();
const {
  registerFace,
  verifyFace,
  getFaceStatus,
  deleteFaceRegistration,
  getVerificationHistory
} = require('../controllers/faceVerificationController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

/**
 * @route   POST /api/face-verification/register
 * @desc    Регистрация Face ID клиента
 * @access  Private (Client or Admin)
 */
router.post(
  '/register',
  protect,
  upload.single('photo'),
  registerFace
);

/**
 * @route   POST /api/face-verification/verify
 * @desc    Верификация лица при старте рабочей сессии
 * @access  Private (Client)
 */
router.post(
  '/verify',
  protect,
  upload.single('photo'),
  verifyFace
);

/**
 * @route   GET /api/face-verification/status
 * @desc    Получить статус регистрации Face ID
 * @access  Private
 */
router.get('/status', protect, getFaceStatus);

/**
 * @route   DELETE /api/face-verification/:clientId
 * @desc    Удалить регистрацию Face ID
 * @access  Private (Admin or Self)
 */
router.delete('/:clientId', protect, deleteFaceRegistration);

/**
 * @route   GET /api/face-verification/history
 * @desc    История верификаций Face ID
 * @access  Private
 */
router.get('/history', protect, authorize('superadmin', 'district_admin', 'officer'), getVerificationHistory);

module.exports = router;

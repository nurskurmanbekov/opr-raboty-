const express = require('express');
const router = express.Router();
const faceIdController = require('../controllers/faceIdController');
const { protect } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for face photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/faces');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `face-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed for face photos'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 5 // Max 5 files at once
  }
});

/**
 * @route   POST /api/face-id/register
 * @desc    Register client face photos (3-5 photos)
 * @access  Private (officers, district_head, superadmin)
 * @body    { clientId, files: [array of 3-5 photos] }
 */
router.post(
  '/register',
  protect,
  upload.array('photos', 5), // Accept up to 5 photos with field name 'photos'
  faceIdController.registerClientFaces
);

/**
 * @route   POST /api/face-id/verify
 * @desc    Verify client face with liveness detection (3 photos: left, right, frontal)
 * @access  Private (clients)
 * @body    { user_id, mtu_id, gps_location, files: [3 photos] }
 */
router.post(
  '/verify',
  protect,
  upload.array('photos', 3), // Exactly 3 photos for liveness detection
  faceIdController.verifyClientFace
);

/**
 * @route   GET /api/face-id/status/:clientId
 * @desc    Get client face registration status
 * @access  Private
 */
router.get(
  '/status/:clientId',
  protect,
  faceIdController.getFaceRegistrationStatus
);

/**
 * @route   GET /api/face-id/attempts/:clientId
 * @desc    Get face verification attempts for client
 * @access  Private
 * @query   limit, workSessionId
 */
router.get(
  '/attempts/:clientId',
  protect,
  faceIdController.getFaceVerificationAttempts
);

/**
 * @route   DELETE /api/face-id/register/:clientId
 * @desc    Delete client face registration
 * @access  Private (officers, district_head, superadmin)
 */
router.delete(
  '/register/:clientId',
  protect,
  faceIdController.deleteClientFaceRegistration
);

/**
 * @route   POST /api/face-id/reset-attempts/:clientId
 * @desc    Reset client face verification attempts
 * @access  Private (superadmin only)
 */
router.post(
  '/reset-attempts/:clientId',
  protect,
  faceIdController.resetFaceVerificationAttempts
);

module.exports = router;

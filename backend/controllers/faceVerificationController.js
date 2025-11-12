const faceVerificationService = require('../services/faceVerificationService');
const FaceVerification = require('../models/FaceVerification');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for face photo uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = 'uploads/faces';
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'face-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only JPEG, JPG, and PNG images are allowed'));
    }
  }
}).single('faceImage');

/**
 * Register user's face
 */
exports.registerFace = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Face image is required'
        });
      }

      const userId = req.user.id;
      const faceImagePath = req.file.path;

      const result = await faceVerificationService.registerFace(
        userId,
        faceImagePath,
        'registration'
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error || 'Failed to register face',
          data: result.faceVerification
        });
      }

      res.json({
        success: true,
        message: result.message,
        data: result.faceVerification
      });

    } catch (error) {
      console.error('Register face error:', error);
      res.status(500).json({
        success: false,
        message: 'Error registering face',
        error: error.message
      });
    }
  });
};

/**
 * Verify face
 */
exports.verifyFace = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Face image is required'
        });
      }

      const userId = req.user.id;
      const { verificationType, workSessionId, photoId } = req.body;
      const faceImagePath = req.file.path;

      if (!verificationType) {
        return res.status(400).json({
          success: false,
          message: 'Verification type is required'
        });
      }

      const result = await faceVerificationService.verifyFace(
        userId,
        faceImagePath,
        verificationType,
        workSessionId,
        photoId
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error || 'Face verification failed',
          data: result.faceVerification
        });
      }

      res.json({
        success: true,
        message: result.isMatch ? 'Face verified successfully' : 'Face verification failed - no match',
        data: {
          isMatch: result.isMatch,
          matchScore: result.matchScore,
          threshold: result.threshold,
          verification: result.faceVerification
        }
      });

    } catch (error) {
      console.error('Verify face error:', error);
      res.status(500).json({
        success: false,
        message: 'Error verifying face',
        error: error.message
      });
    }
  });
};

/**
 * Get face registration status
 */
exports.getFaceStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId, {
      attributes: ['id', 'firstName', 'lastName', 'email', 'faceEncodingId']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let faceRegistration = null;
    if (user.faceEncodingId) {
      faceRegistration = await FaceVerification.findByPk(user.faceEncodingId, {
        attributes: ['id', 'verificationType', 'verificationStatus', 'createdAt']
      });
    }

    res.json({
      success: true,
      data: {
        isRegistered: !!user.faceEncodingId,
        faceEncodingId: user.faceEncodingId,
        registration: faceRegistration
      }
    });

  } catch (error) {
    console.error('Get face status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching face status',
      error: error.message
    });
  }
};

/**
 * Get verification history
 */
exports.getVerificationHistory = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const { limit = 50 } = req.query;

    // Check permissions - users can only see their own history unless admin
    const userRole = req.user.role || req.user.dataValues?.role;
    if (userId !== req.user.id && !['superadmin', 'regional_admin', 'district_admin', 'officer'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied'
      });
    }

    const history = await faceVerificationService.getVerificationHistory(
      userId,
      parseInt(limit)
    );

    res.json({
      success: true,
      data: history
    });

  } catch (error) {
    console.error('Get verification history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching verification history',
      error: error.message
    });
  }
};

/**
 * Get verification statistics
 */
exports.getVerificationStats = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const { startDate, endDate } = req.query;

    // Check permissions
    const userRole = req.user.role || req.user.dataValues?.role;
    if (userId !== req.user.id && !['superadmin', 'regional_admin', 'district_admin', 'officer'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied'
      });
    }

    const stats = await faceVerificationService.getVerificationStats(
      userId,
      startDate,
      endDate
    );

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get verification stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching verification statistics',
      error: error.message
    });
  }
};

/**
 * Get verification by ID
 */
exports.getVerificationById = async (req, res) => {
  try {
    const { id } = req.params;

    const verification = await FaceVerification.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Verification not found'
      });
    }

    // Check permissions
    const userRole = req.user.role || req.user.dataValues?.role;
    if (verification.userId !== req.user.id && !['superadmin', 'regional_admin', 'district_admin', 'officer'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied'
      });
    }

    res.json({
      success: true,
      data: verification
    });

  } catch (error) {
    console.error('Get verification by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching verification',
      error: error.message
    });
  }
};

/**
 * Delete face registration (Admin only)
 */
exports.deleteFaceRegistration = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.faceEncodingId) {
      const faceVerification = await FaceVerification.findByPk(user.faceEncodingId);
      if (faceVerification) {
        // Delete face image file
        try {
          await fs.unlink(faceVerification.faceImageUrl);
        } catch (err) {
          console.error('Error deleting face image file:', err);
        }

        await faceVerification.destroy();
      }

      await user.update({ faceEncodingId: null });
    }

    res.json({
      success: true,
      message: 'Face registration deleted successfully'
    });

  } catch (error) {
    console.error('Delete face registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting face registration',
      error: error.message
    });
  }
};

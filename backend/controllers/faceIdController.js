const comprefaceService = require('../services/comprefaceService');
const { Client, FaceVerificationAttempt, ClientFace, MTULocation, WorkSession } = require('../models');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

/**
 * @desc    Upload client face photos during registration (3-5 photos)
 * @route   POST /api/face-id/register
 * @access  Private (officers, district_head, superadmin)
 */
exports.registerClientFaces = async (req, res, next) => {
  try {
    const { clientId } = req.body;
    const files = req.files; // multer array upload

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'Client ID is required'
      });
    }

    if (!files || files.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'At least 3 face photos are required (left, right, frontal)'
      });
    }

    if (files.length > 5) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 5 face photos allowed'
      });
    }

    // Check client exists
    const client = await Client.findByPk(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Check if already registered
    if (client.faceRegistered) {
      return res.status(400).json({
        success: false,
        message: 'Client face already registered. Delete existing registration first.'
      });
    }

    // Prepare photo paths with types
    const photoPaths = files.map((file, index) => {
      let type = 'additional';
      if (index === 0) type = 'left';
      else if (index === 1) type = 'right';
      else if (index === 2) type = 'frontal';

      return {
        path: file.path,
        type
      };
    });

    // Register with CompreFace
    const result = await comprefaceService.registerClientFaces(clientId, photoPaths);

    console.log(`✅ Client ${clientId} face registered successfully`);

    res.status(201).json({
      success: true,
      message: 'Client face registered successfully',
      data: result
    });

  } catch (error) {
    console.error('❌ Error registering client face:', error);
    next(error);
  }
};

/**
 * @desc    Verify client face with liveness detection (3 photos)
 * @route   POST /api/face-id/verify
 * @access  Private (clients)
 */
exports.verifyClientFace = async (req, res, next) => {
  try {
    const { user_id, mtu_id, gps_location } = req.body;
    const files = req.files; // 3 photos: left, right, frontal

    // Validate inputs
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    if (!files || files.length !== 3) {
      return res.status(400).json({
        success: false,
        message: 'Exactly 3 photos required for liveness detection (left, right, frontal)'
      });
    }

    // Check client exists
    const client = await Client.findByPk(user_id);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Check if face is registered
    if (!client.faceRegistered) {
      return res.status(400).json({
        success: false,
        message: 'Client face is not registered. Please register face photos first.'
      });
    }

    // Optional: Verify MTU if provided
    if (mtu_id) {
      const mtu = await MTULocation.findByPk(mtu_id);
      if (!mtu) {
        return res.status(404).json({
          success: false,
          message: 'MTU location not found'
        });
      }

      // Check geofence if GPS provided
      if (gps_location && gps_location.lat && gps_location.lon) {
        const { isInSquare } = require('../utils/squareGeofence');
        const bounds = {
          north: parseFloat(mtu.geofenceNorth),
          south: parseFloat(mtu.geofenceSouth),
          east: parseFloat(mtu.geofenceEast),
          west: parseFloat(mtu.geofenceWest)
        };

        const insideGeofence = isInSquare(
          parseFloat(gps_location.lat),
          parseFloat(gps_location.lon),
          bounds
        );

        if (!insideGeofence) {
          return res.status(400).json({
            success: false,
            message: 'You are outside the MTU geofence. Please move closer to the location.',
            geofence_error: true
          });
        }
      }
    }

    // Prepare verification photos
    const verificationPhotos = [
      { path: files[0].path, type: 'left' },
      { path: files[1].path, type: 'right' },
      { path: files[2].path, type: 'frontal' }
    ];

    // Verify with CompreFace
    const result = await comprefaceService.verifyClientFace(
      user_id,
      verificationPhotos,
      {
        mtuId: mtu_id,
        gpsLocation: gps_location,
        deviceInfo: req.body.device_info || null
      }
    );

    if (!result.success || !result.matched) {
      return res.status(400).json({
        success: false,
        matched: false,
        similarity: result.similarity || 0,
        attempts_left: result.attempts_left || 0,
        message: result.message || 'Face verification failed'
      });
    }

    // Success
    res.json({
      success: true,
      matched: true,
      similarity: result.similarity,
      liveness: result.liveness,
      confidence: result.confidence,
      message: result.message || 'Личность подтверждена'
    });

  } catch (error) {
    console.error('❌ Error verifying client face:', error);

    // Handle specific errors
    if (error.message.includes('blocked') || error.message.includes('Maximum attempts')) {
      return res.status(429).json({
        success: false,
        message: error.message
      });
    }

    next(error);
  }
};

/**
 * @desc    Get client face registration status
 * @route   GET /api/face-id/status/:clientId
 * @access  Private
 */
exports.getFaceRegistrationStatus = async (req, res, next) => {
  try {
    const { clientId } = req.params;

    const client = await Client.findByPk(clientId, {
      attributes: ['id', 'fullName', 'faceRegistered', 'faceRegisteredAt', 'comprefaceSubjectId', 'faceAttemptsCount', 'faceBlockedUntil']
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Get registered photos
    const facePhotos = await ClientFace.findAll({
      where: { userId: clientId },
      attributes: ['id', 'photoType', 'isPrimary', 'uploadedAt'],
      order: [['uploadedAt', 'DESC']]
    });

    // Get recent attempts
    const recentAttempts = await FaceVerificationAttempt.findAll({
      where: { userId: clientId },
      order: [['createdAt', 'DESC']],
      limit: 10,
      attributes: ['id', 'attemptNumber', 'success', 'similarityScore', 'livenessCheck', 'createdAt']
    });

    // Check if blocked
    const isBlocked = client.faceBlockedUntil && new Date(client.faceBlockedUntil) > new Date();
    let minutesRemaining = 0;
    if (isBlocked) {
      minutesRemaining = Math.ceil((new Date(client.faceBlockedUntil) - new Date()) / 60000);
    }

    res.json({
      success: true,
      data: {
        client_id: client.id,
        full_name: client.fullName,
        face_registered: client.faceRegistered,
        registered_at: client.faceRegisteredAt,
        subject_id: client.comprefaceSubjectId,
        photos_count: facePhotos.length,
        photos: facePhotos,
        is_blocked: isBlocked,
        blocked_until: client.faceBlockedUntil,
        minutes_remaining: minutesRemaining,
        failed_attempts_today: client.faceAttemptsCount,
        recent_attempts: recentAttempts
      }
    });

  } catch (error) {
    console.error('❌ Error getting face status:', error);
    next(error);
  }
};

/**
 * @desc    Get face verification attempts for client
 * @route   GET /api/face-id/attempts/:clientId
 * @access  Private
 */
exports.getFaceVerificationAttempts = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const { limit = 50, workSessionId } = req.query;

    const where = { userId: clientId };
    if (workSessionId) {
      where.workSessionId = workSessionId;
    }

    const attempts = await FaceVerificationAttempt.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      include: [
        {
          model: WorkSession,
          as: 'workSession',
          attributes: ['id', 'status', 'startTime'],
          required: false
        }
      ]
    });

    // Calculate stats
    const stats = {
      total: attempts.length,
      successful: attempts.filter(a => a.success).length,
      failed: attempts.filter(a => !a.success).length,
      average_similarity: attempts.length > 0
        ? attempts.reduce((sum, a) => sum + (parseFloat(a.similarityScore) || 0), 0) / attempts.length
        : 0
    };

    res.json({
      success: true,
      data: {
        stats,
        attempts
      }
    });

  } catch (error) {
    console.error('❌ Error getting verification attempts:', error);
    next(error);
  }
};

/**
 * @desc    Delete client face registration
 * @route   DELETE /api/face-id/register/:clientId
 * @access  Private (officers, district_head, superadmin)
 */
exports.deleteClientFaceRegistration = async (req, res, next) => {
  try {
    const { clientId } = req.params;

    const client = await Client.findByPk(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    if (!client.faceRegistered) {
      return res.status(400).json({
        success: false,
        message: 'Client face is not registered'
      });
    }

    // Delete from CompreFace
    if (client.comprefaceSubjectId && comprefaceService.isEnabled()) {
      try {
        await comprefaceService.deleteFace(client.comprefaceSubjectId);
      } catch (error) {
        console.warn('⚠️  Failed to delete from CompreFace:', error.message);
      }
    }

    // Delete face photos from database
    await ClientFace.destroy({ where: { userId: clientId } });

    // Delete verification attempts
    await FaceVerificationAttempt.destroy({ where: { userId: clientId } });

    // Update client
    await client.update({
      comprefaceSubjectId: null,
      faceRegistered: false,
      faceRegisteredAt: null,
      faceAttemptsCount: 0,
      faceBlockedUntil: null
    });

    console.log(`✅ Client ${clientId} face registration deleted`);

    res.json({
      success: true,
      message: 'Client face registration deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting face registration:', error);
    next(error);
  }
};

/**
 * @desc    Reset client face verification attempts (for testing or manual reset)
 * @route   POST /api/face-id/reset-attempts/:clientId
 * @access  Private (superadmin only)
 */
exports.resetFaceVerificationAttempts = async (req, res, next) => {
  try {
    const currentUser = req.user;

    // Only superadmin can reset attempts
    if (currentUser.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only superadmin can reset face verification attempts'
      });
    }

    const { clientId } = req.params;

    const client = await Client.findByPk(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    await client.update({
      faceAttemptsCount: 0,
      faceBlockedUntil: null
    });

    console.log(`✅ Reset face verification attempts for client ${clientId}`);

    res.json({
      success: true,
      message: 'Face verification attempts reset successfully'
    });

  } catch (error) {
    console.error('❌ Error resetting attempts:', error);
    next(error);
  }
};

module.exports = exports;

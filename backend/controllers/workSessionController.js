const { WorkSession, Client, Photo, User, LocationHistory, FaceVerification } = require('../models');
const { Op } = require('sequelize');
const path = require('path');
const faceRecognitionService = require('../services/faceRecognitionService');
const fs = require('fs').promises;

// @desc    Start work session with Face ID verification
// @route   POST /api/work-sessions/start
// @access  Private (Client only)
exports.startWorkSession = async (req, res, next) => {
  try {
    const { clientId, startLatitude, startLongitude, workLocation, biometricType, deviceId } = req.body;

    // Обязательная проверка: должно быть фото для Face ID
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '❌ Фото для Face ID верификации обязательно! Это требование антикоррупционной защиты.'
      });
    }

    // 🔒 SECURITY: Only clients can start sessions
    if (req.user.role !== 'client') {
      return res.status(403).json({
        success: false,
        message: 'Only clients can start work sessions'
      });
    }

    // 🔒 SECURITY: Client can only start session for themselves
    if (clientId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: cannot start session for another client'
      });
    }

    // Check if client has active session
    const activeSession = await WorkSession.findOne({
      where: {
        clientId,
        status: 'in_progress'
      }
    });

    if (activeSession) {
      return res.status(400).json({
        success: false,
        message: 'У вас уже есть активная рабочая сессия'
      });
    }

    // ⭐ КРИТИЧНО: Проверка Face ID зарегистрирован ли
    const faceVerification = await FaceVerification.findOne({
      where: {
        userId: clientId,
        verificationType: 'registration',
        verificationStatus: 'verified'
      }
    });

    if (!faceVerification) {
      return res.status(400).json({
        success: false,
        message: '❌ Face ID не зарегистрирован. Зарегистрируйте Face ID в настройках профиля.',
        requireFaceRegistration: true
      });
    }

    // ⭐ КРИТИЧНО: Верификация лица через CompreFace
    console.log(`🔒 Face ID verification for client ${clientId}...`);

    const verificationResult = await faceRecognitionService.verifyFace(
      clientId,
      req.file.buffer,
      `session-start-${Date.now()}.jpg`
    );

    // Сохранить фото верификации
    const uploadDir = path.join(__dirname, '../uploads/sessions');
    await fs.mkdir(uploadDir, { recursive: true });

    const verificationPhotoFilename = `${clientId}-verify-${Date.now()}.jpg`;
    const verificationPhotoPath = path.join(uploadDir, verificationPhotoFilename);
    await fs.writeFile(verificationPhotoPath, req.file.buffer);

    const verificationPhotoUrl = `/uploads/sessions/${verificationPhotoFilename}`;

    // Создать запись о попытке верификации
    const verificationAttempt = await FaceVerification.create({
      userId: clientId,
      faceImageUrl: verificationPhotoUrl,
      verificationType: 'check_in',
      verificationStatus: verificationResult.verified ? 'verified' : 'failed',
      matchScore: verificationResult.similarity,
      matchThreshold: verificationResult.threshold || 0.85,
      isMatch: verificationResult.verified,
      metadata: {
        age: verificationResult.age,
        gender: verificationResult.gender,
        boundingBox: verificationResult.boundingBox,
        context: 'work_session_start',
        confidence: verificationResult.confidence
      },
      verifiedAt: verificationResult.verified ? new Date() : null
    });

    // ⚠️ КРИТИЧНО: Если Face ID НЕ ПРОШЕЛ - ЗАПРЕТИТЬ старт!
    if (!verificationResult.verified) {
      console.warn(`❌ Face verification FAILED for client ${clientId}:`, {
        similarity: verificationResult.similarity,
        threshold: verificationResult.threshold,
        reason: verificationResult.reason
      });

      // Удалить фото (опционально, можно оставить для аудита)
      // await fs.unlink(verificationPhotoPath).catch(() => {});

      return res.status(403).json({
        success: false,
        message: '❌ Face ID верификация не прошла! Ваше лицо не совпадает с зарегистрированным.',
        faceVerificationFailed: true,
        details: {
          similarity: verificationResult.similarity,
          threshold: verificationResult.threshold,
          confidence: verificationResult.confidence
        }
      });
    }

    // ✅ Face ID ПРОШЕЛ - создаем сессию
    console.log(`✅ Face verification SUCCESS for client ${clientId}: ${(verificationResult.similarity * 100).toFixed(1)}%`);

    const session = await WorkSession.create({
      clientId,
      startTime: new Date(),
      startLatitude,
      startLongitude,
      workLocation,
      status: 'in_progress',
      // Face ID данные
      faceVerified: true,
      verificationPhotoUrl: verificationPhotoUrl,
      faceVerificationAttemptId: verificationAttempt.id,
      biometricType: biometricType || 'FaceID',
      deviceId: deviceId,
      faceVerificationConfidence: verificationResult.similarity
    });

    res.status(201).json({
      success: true,
      message: '✅ Рабочая сессия начата! Face ID верифицирован.',
      data: {
        ...session.toJSON(),
        faceVerification: {
          verified: true,
          confidence: verificationResult.similarity,
          similarity: (verificationResult.similarity * 100).toFixed(1) + '%'
        }
      }
    });
  } catch (error) {
    console.error('Start work session error:', error);
    next(error);
  }
};

// @desc    End work session
// @route   PUT /api/work-sessions/:id/end
// @access  Private (Client only)
exports.endWorkSession = async (req, res, next) => {
  try {
    const { endLatitude, endLongitude } = req.body;

    const session = await WorkSession.findByPk(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Work session not found'
      });
    }

    // 🔒 SECURITY: Only clients can end sessions
    if (req.user.role !== 'client') {
      return res.status(403).json({
        success: false,
        message: 'Only clients can end work sessions'
      });
    }

    // 🔒 SECURITY: Client can only end their own session
    if (session.clientId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: not your session'
      });
    }

    if (session.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Work session is not in progress'
      });
    }

    const endTime = new Date();
    const hoursWorked = (endTime - new Date(session.startTime)) / (1000 * 60 * 60);

    await session.update({
      endTime,
      endLatitude,
      endLongitude,
      hoursWorked: hoursWorked.toFixed(2),
      status: 'completed'
    });

    res.json({
      success: true,
      message: 'Work session ended successfully',
      data: session
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all work sessions
// @route   GET /api/work-sessions
// @access  Private
exports.getWorkSessions = async (req, res, next) => {
  try {
    const { clientId, status, startDate, endDate } = req.query;

    let whereClause = {};
    let clientWhereClause = {};

    // 🔒 SECURITY: Filter sessions by user role
    if (req.user.role === 'client') {
      // Clients can only see their own sessions
      whereClause.clientId = req.user.id;
    } else if (req.user.role === 'officer') {
      // Officers can only see sessions of their assigned clients
      const officerClients = await Client.findAll({
        where: { officerId: req.user.id },
        attributes: ['id']
      });
      const clientIds = officerClients.map(c => c.id);
      whereClause.clientId = { [Op.in]: clientIds };
    } else if (req.user.role === 'district_admin') {
      // District admins can only see sessions from their district
      if (req.user.districtId) {
        clientWhereClause.districtId = req.user.districtId;
      } else if (req.user.district) {
        // Fallback for old system
        clientWhereClause.district = req.user.district;
      }
    } else if (req.user.role === 'regional_admin') {
      // Regional admins can only see sessions from their MRU
      if (req.user.mruId) {
        // Need to filter through officer's MRU
        const mruOfficers = await User.findAll({
          where: { mruId: req.user.mruId, role: 'officer' },
          attributes: ['id']
        });
        const officerIds = mruOfficers.map(o => o.id);
        clientWhereClause.officerId = { [Op.in]: officerIds };
      }
    }
    // superadmin and central_admin can see all sessions

    // Apply query filters
    if (clientId && req.user.role !== 'client') {
      whereClause.clientId = clientId;
    }

    if (status) {
      whereClause.status = status;
    }

    if (startDate && endDate) {
      whereClause.startTime = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const sessions = await WorkSession.findAll({
      where: whereClause,
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'fullName', 'idNumber', 'district', 'districtId', 'officerId'],
          where: Object.keys(clientWhereClause).length > 0 ? clientWhereClause : undefined,
          required: Object.keys(clientWhereClause).length > 0,
          include: [{
            model: User,
            as: 'officer',
            attributes: ['id', 'fullName', 'districtId', 'mruId']
          }]
        },
        {
          model: Photo,
          as: 'photos'
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: sessions.length,
      data: sessions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single work session
// @route   GET /api/work-sessions/:id
// @access  Private
exports.getWorkSession = async (req, res, next) => {
  try {
    const session = await WorkSession.findByPk(req.params.id, {
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'fullName', 'idNumber', 'district', 'districtId', 'officerId'],
          include: [{
            model: User,
            as: 'officer',
            attributes: ['id', 'fullName', 'districtId', 'mruId']
          }]
        },
        {
          model: Photo,
          as: 'photos'
        },
        {
          model: User,
          as: 'verifier',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Work session not found'
      });
    }

    // 🔒 SECURITY: Check access rights
    if (req.user.role === 'client') {
      if (session.clientId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    } else if (req.user.role === 'officer') {
      if (session.client?.officerId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: not your client'
        });
      }
    } else if (req.user.role === 'district_admin') {
      const clientDistrictId = session.client?.districtId || session.client?.officer?.districtId;
      if (req.user.districtId && clientDistrictId !== req.user.districtId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: different district'
        });
      } else if (req.user.district && session.client?.district !== req.user.district) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: different district'
        });
      }
    } else if (req.user.role === 'regional_admin') {
      const clientMruId = session.client?.officer?.mruId;
      if (req.user.mruId && clientMruId !== req.user.mruId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: different MRU'
        });
      }
    }
    // superadmin and central_admin can see all

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload photo for work session
// @route   POST /api/work-sessions/:id/photos
// @access  Private (Client only)
exports.uploadPhoto = async (req, res, next) => {
  try {
    console.log('📸 Upload photo request received');
    console.log('Session ID:', req.params.id);
    console.log('File:', req.file);
    console.log('Body:', req.body);
    console.log('User:', req.user?.id);

    if (!req.file) {
      console.error('❌ No file received in request');
      return res.status(400).json({
        success: false,
        message: 'Please upload a photo'
      });
    }

    const { photoType, latitude, longitude } = req.body;

    console.log('🔍 Looking for work session:', req.params.id);
    const session = await WorkSession.findByPk(req.params.id);

    if (!session) {
      console.error('❌ Work session not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Work session not found'
      });
    }

    // 🔒 SECURITY: Only clients can upload photos
    if (req.user.role !== 'client') {
      return res.status(403).json({
        success: false,
        message: 'Only clients can upload photos'
      });
    }

    // 🔒 SECURITY: Client can only upload photos to their own session
    if (session.clientId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: not your session'
      });
    }

    console.log('✅ Work session found:', session.id);
    console.log('✅ File saved to disk:', req.file.path);
    console.log('📁 File size:', req.file.size, 'bytes');

    // Save relative path for frontend access
    const relativePath = `uploads/${req.file.filename}`;
    console.log('💾 Saving to database with relative path:', relativePath);

    const photo = await Photo.create({
      workSessionId: session.id,
      photoType: photoType || 'process',
      filePath: relativePath,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      timestamp: new Date()
    });

    console.log('✅ Photo saved successfully to database!');
    console.log('Photo ID:', photo.id);
    console.log('Photo path:', photo.filePath);

    res.status(201).json({
      success: true,
      message: 'Photo uploaded successfully',
      data: photo
    });
  } catch (error) {
    console.error('❌ Error uploading photo:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    // Send detailed error response
    res.status(500).json({
      success: false,
      message: 'Failed to upload photo',
      error: error.message
    });
  }
};

// @desc    Update location for work session
// @route   POST /api/work-sessions/:id/location
// @access  Private (Client only)
exports.updateLocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, accuracy, speed, altitude, heading } = req.body;

    // Find work session
    const workSession = await WorkSession.findByPk(id);

    if (!workSession) {
      return res.status(404).json({
        success: false,
        message: 'Work session not found'
      });
    }

    // 🔒 SECURITY: Only clients can update location
    if (req.user.role !== 'client') {
      return res.status(403).json({
        success: false,
        message: 'Only clients can update location'
      });
    }

    // 🔒 SECURITY: Client can only update location for their own session
    if (workSession.clientId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: not your session'
      });
    }

    // Check that session is active
    if (workSession.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update location for inactive session'
      });
    }

    // Save to LocationHistory
    await LocationHistory.create({
      workSessionId: id,
      clientId: workSession.clientId,
      latitude,
      longitude,
      accuracy,
      speed,
      altitude,
      heading,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Location updated successfully'
    });
  } catch (error) {
    console.error('Error updating location:', error);
    next(error);
  }
};

// @desc    Verify work session
// @route   PUT /api/work-sessions/:id/verify
// @access  Private (Officer, Admin)
exports.verifyWorkSession = async (req, res, next) => {
  try {
    const { status, verificationNotes } = req.body; // status: 'verified' or 'rejected'

    const session = await WorkSession.findByPk(req.params.id, {
      include: [{ model: Client, as: 'client' }]
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Work session not found'
      });
    }

    if (session.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only verify completed sessions'
      });
    }

    await session.update({
      status,
      verifiedBy: req.user.id,
      verificationNotes,
      verifiedAt: new Date()
    });

    // If verified, update client's completed hours
    if (status === 'verified') {
      const client = session.client;
      await client.update({
        completedHours: parseFloat(client.completedHours) + parseFloat(session.hoursWorked)
      });
    }

    res.json({
      success: true,
      message: `Work session ${status} successfully`,
      data: session
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get work session GPS route with photos and geofence data
// @route   GET /api/work-sessions/:id/route
// @access  Private
exports.getWorkSessionRoute = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get session with all related data
    const session = await WorkSession.findByPk(id, {
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'fullName', 'idNumber', 'district', 'workLocation']
        },
        {
          model: Photo,
          as: 'photos',
          attributes: ['id', 'photoType', 'filePath', 'latitude', 'longitude', 'timestamp']
        },
        {
          model: User,
          as: 'verifier',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: LocationHistory,
          as: 'locationHistory',
          attributes: ['id', 'latitude', 'longitude', 'accuracy', 'speed', 'altitude', 'heading', 'timestamp'],
          order: [['timestamp', 'ASC']]
        }
      ]
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Work session not found'
      });
    }

    // Find matching geofence by workLocation
    const Geofence = require('../models').Geofence;
    const GeofenceViolation = require('../models').GeofenceViolation;

    let geofence = null;
    if (session.workLocation) {
      geofence = await Geofence.findOne({
        where: {
          workLocation: session.workLocation,
          isActive: true
        }
      });
    }

    // Get violations for this session
    const violations = await GeofenceViolation.findAll({
      where: {
        workSessionId: id
      },
      include: [{
        model: Geofence,
        as: 'geofence',
        attributes: ['id', 'name', 'latitude', 'longitude', 'radius']
      }],
      order: [['violationTime', 'ASC']]
    });

    // Calculate statistics
    let timeInGeofence = 0;
    let timeOutGeofence = 0;
    let totalDistance = 0;

    if (geofence && session.locationHistory && session.locationHistory.length > 0) {
      const locationPoints = session.locationHistory;

      // Calculate time in/out of geofence
      for (let i = 0; i < locationPoints.length - 1; i++) {
        const point = locationPoints[i];
        const nextPoint = locationPoints[i + 1];

        // Calculate distance from geofence center
        const distance = calculateDistance(
          point.latitude,
          point.longitude,
          geofence.latitude,
          geofence.longitude
        );

        // Calculate time between points (in minutes)
        const timeDiff = (new Date(nextPoint.timestamp) - new Date(point.timestamp)) / (1000 * 60);

        if (distance <= geofence.radius) {
          timeInGeofence += timeDiff;
        } else {
          timeOutGeofence += timeDiff;
        }

        // Calculate distance traveled
        if (i < locationPoints.length - 1) {
          totalDistance += calculateDistance(
            point.latitude,
            point.longitude,
            nextPoint.latitude,
            nextPoint.longitude
          );
        }
      }
    }

    res.json({
      success: true,
      data: {
        session: {
          id: session.id,
          startTime: session.startTime,
          endTime: session.endTime,
          hoursWorked: session.hoursWorked,
          status: session.status,
          workLocation: session.workLocation,
          startLatitude: session.startLatitude,
          startLongitude: session.startLongitude,
          endLatitude: session.endLatitude,
          endLongitude: session.endLongitude,
          client: session.client,
          verifier: session.verifier
        },
        route: session.locationHistory || [],
        photos: session.photos || [],
        geofence: geofence ? {
          id: geofence.id,
          name: geofence.name,
          latitude: geofence.latitude,
          longitude: geofence.longitude,
          radius: geofence.radius,
          workLocation: geofence.workLocation
        } : null,
        violations: violations || [],
        statistics: {
          timeInGeofence: Math.round(timeInGeofence),
          timeOutGeofence: Math.round(timeOutGeofence),
          totalDistance: Math.round(totalDistance),
          violationsCount: violations.length,
          photosCount: session.photos ? session.photos.length : 0,
          gpsPointsCount: session.locationHistory ? session.locationHistory.length : 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching work session route:', error);
    next(error);
  }
};

// Helper function to calculate distance between two coordinates (Haversine formula)
// Returns distance in meters
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
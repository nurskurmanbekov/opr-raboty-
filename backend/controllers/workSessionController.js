const { WorkSession, Client, Photo, User, LocationHistory } = require('../models');
const { Op } = require('sequelize');

// @desc    Start work session
// @route   POST /api/work-sessions/start
// @access  Private (Client only)
exports.startWorkSession = async (req, res, next) => {
  try {
    const { clientId, startLatitude, startLongitude, workLocation } = req.body;

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
        message: 'You already have an active work session'
      });
    }

    const session = await WorkSession.create({
      clientId,
      startTime: new Date(),
      startLatitude,
      startLongitude,
      workLocation,
      status: 'in_progress'
    });

    res.status(201).json({
      success: true,
      message: 'Work session started successfully',
      data: session
    });
  } catch (error) {
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

    if (clientId) {
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
          attributes: ['id', 'fullName', 'idNumber', 'district']
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
          attributes: ['id', 'fullName', 'idNumber', 'district']
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
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a photo'
      });
    }

    const { photoType, latitude, longitude } = req.body;

    const session = await WorkSession.findByPk(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Work session not found'
      });
    }

    const photo = await Photo.create({
      workSessionId: session.id,
      photoType,
      filePath: req.file.path,
      latitude,
      longitude,
      timestamp: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Photo uploaded successfully',
      data: photo
    });
  } catch (error) {
    next(error);
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
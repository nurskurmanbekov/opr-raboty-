const { WorkSession, Client, Photo, User } = require('../models');
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
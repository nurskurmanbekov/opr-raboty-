const { Client, User, WorkSession, Photo } = require('../models');
const bcrypt = require('bcryptjs');

// @desc    Get all clients
// @route   GET /api/clients
// @access  Private
exports.getClients = async (req, res, next) => {
  try {
    const { status, district } = req.query;

    let whereClause = {};

    // Filter by status
    if (status) {
      whereClause.status = status;
    }

    // District admin and officers can only see clients from their district
    if (req.user.role === 'district_admin' || req.user.role === 'officer') {
      whereClause.district = req.user.district;
    } else if (district) {
      whereClause.district = district;
    }

    // Officers can only see their assigned clients
    if (req.user.role === 'officer') {
      whereClause.officerId = req.user.id;
    }

    const clients = await Client.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'officer',
          attributes: ['id', 'fullName', 'email', 'phone']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: clients.length,
      data: clients
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single client
// @route   GET /api/clients/:id
// @access  Private
exports.getClient = async (req, res, next) => {
  try {
    const client = await Client.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'officer',
          attributes: ['id', 'fullName', 'email', 'phone']
        },
        {
          model: WorkSession,
          as: 'workSessions',
          limit: 10,
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Check access
    if (req.user.role === 'officer' && client.officerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this client'
      });
    }

    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new client
// @route   POST /api/clients
// @access  Private (Admin, District Admin)
exports.createClient = async (req, res, next) => {
  try {
    const {
      fullName,
      idNumber,
      phone,
      email,
      password,
      district,
      assignedHours,
      startDate,
      officerId,
      workLocation,
      notes
    } = req.body;

    // Check if client already exists
    const existingClient = await Client.findOne({ where: { idNumber } });
    if (existingClient) {
      return res.status(400).json({
        success: false,
        message: 'Client with this ID number already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create client
    const client = await Client.create({
      fullName,
      idNumber,
      phone,
      email,
      password: hashedPassword,
      district,
      assignedHours,
      startDate,
      officerId,
      workLocation,
      notes
    });

    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      data: client
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update client
// @route   PUT /api/clients/:id
// @access  Private
exports.updateClient = async (req, res, next) => {
  try {
    const client = await Client.findByPk(req.params.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Check access
    if (req.user.role === 'officer' && client.officerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this client'
      });
    }

    const {
      fullName,
      phone,
      email,
      status,
      assignedHours,
      workLocation,
      notes,
      endDate
    } = req.body;

    await client.update({
      fullName,
      phone,
      email,
      status,
      assignedHours,
      workLocation,
      notes,
      endDate
    });

    res.json({
      success: true,
      message: 'Client updated successfully',
      data: client
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete client
// @route   DELETE /api/clients/:id
// @access  Private (Admin only)
exports.deleteClient = async (req, res, next) => {
  try {
    const client = await Client.findByPk(req.params.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Check if client has active work sessions
    const activeSessionsCount = await WorkSession.count({
      where: {
        clientId: req.params.id,
        status: 'in_progress'
      }
    });

    if (activeSessionsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete client with ${activeSessionsCount} active work sessions. Please complete or cancel them first.`
      });
    }

    // Delete client (cascading deletes will handle related records)
    await client.destroy();

    res.json({
      success: true,
      message: 'Client deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get client statistics
// @route   GET /api/clients/:id/stats
// @access  Private
exports.getClientStats = async (req, res, next) => {
  try {
    const client = await Client.findByPk(req.params.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    const totalSessions = await WorkSession.count({
      where: { clientId: client.id }
    });

    const completedSessions = await WorkSession.count({
      where: { clientId: client.id, status: 'verified' }
    });

    const progressPercentage = (client.completedHours / client.assignedHours) * 100;
    const remainingHours = client.assignedHours - client.completedHours;

    res.json({
      success: true,
      data: {
        assignedHours: client.assignedHours,
        completedHours: client.completedHours,
        remainingHours: remainingHours,
        progressPercentage: progressPercentage.toFixed(2),
        totalSessions,
        completedSessions,
        status: client.status
      }
    });
  } catch (error) {
    next(error);
  }
};
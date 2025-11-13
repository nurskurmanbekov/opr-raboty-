const { Client, User, WorkSession, Photo, District, MRU } = require('../models');

// @desc    Get all clients
// @route   GET /api/clients
// @access  Private
exports.getClients = async (req, res, next) => {
  try {
    const { status, districtId, mruId } = req.query;

    let whereClause = {};

    // Filter by status
    if (status) {
      whereClause.status = status;
    }

    // 🔒 SECURITY: Officers can only see their assigned clients
    if (req.user.role === 'officer') {
      whereClause.officerId = req.user.id;
      if (req.user.districtId) {
        whereClause.districtId = req.user.districtId;
      }
    }
    // 🔒 SECURITY: District admin can only see clients from their district
    else if (req.user.role === 'district_admin') {
      if (!req.user.districtId) {
        return res.status(403).json({
          success: false,
          message: 'District not assigned'
        });
      }
      whereClause.districtId = req.user.districtId;
    }
    // 🔒 SECURITY: Regional admin can only see clients from their MRU
    else if (req.user.role === 'regional_admin') {
      if (!req.user.mruId) {
        return res.status(403).json({
          success: false,
          message: 'MRU not assigned'
        });
      }
      whereClause['$assignedDistrict.mruId$'] = req.user.mruId;
    }
    // Superadmin/central_admin can filter by districtId or mruId
    else if (req.user.role === 'superadmin' || req.user.role === 'central_admin') {
      if (districtId) {
        whereClause.districtId = districtId;
      }
      if (mruId) {
        whereClause['$assignedDistrict.mruId$'] = mruId;
      }
    }
    // All other roles - deny access
    else {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const clients = await Client.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'officer',
          attributes: ['id', 'fullName', 'email', 'phone']
        },
        {
          model: District,
          as: 'assignedDistrict',
          attributes: ['id', 'name'],
          include: [{
            model: MRU,
            as: 'mru',
            attributes: ['id', 'name']
          }]
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
          attributes: ['id', 'fullName', 'email', 'phone', 'districtId', 'mruId']
        },
        {
          model: WorkSession,
          as: 'workSessions',
          limit: 10,
          order: [['createdAt', 'DESC']]
        },
        {
          model: District,
          as: 'assignedDistrict',
          attributes: ['id', 'name'],
          include: [{
            model: MRU,
            as: 'mru',
            attributes: ['id', 'name']
          }]
        }
      ]
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // 🔒 SECURITY: Superadmin and central_admin can access all clients
    if (req.user.role === 'superadmin' || req.user.role === 'central_admin') {
      return res.json({
        success: true,
        data: client
      });
    }

    // 🔒 SECURITY: Client can only access themselves
    if (req.user.role === 'client') {
      if (req.user.id !== req.params.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      return res.json({
        success: true,
        data: client
      });
    }

    // 🔒 SECURITY: Officer can only access their assigned clients
    if (req.user.role === 'officer') {
      if (client.officerId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this client'
        });
      }
      return res.json({
        success: true,
        data: client
      });
    }

    // 🔒 SECURITY: District admin can only access clients from their district
    if (req.user.role === 'district_admin') {
      if (!req.user.districtId) {
        return res.status(403).json({
          success: false,
          message: 'District not assigned'
        });
      }

      // Check client's district or officer's district
      const clientDistrictId = client.districtId || client.officer?.districtId;

      if (clientDistrictId !== req.user.districtId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: different district'
        });
      }

      return res.json({
        success: true,
        data: client
      });
    }

    // 🔒 SECURITY: Regional admin can only access clients from their MRU
    if (req.user.role === 'regional_admin') {
      if (!req.user.mruId) {
        return res.status(403).json({
          success: false,
          message: 'MRU not assigned'
        });
      }

      // Check through officer's MRU
      const clientMruId = client.officer?.mruId;

      if (clientMruId !== req.user.mruId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: different MRU'
        });
      }

      return res.json({
        success: true,
        data: client
      });
    }

    // 🔒 SECURITY: All other roles - deny access
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Create new client
// @route   POST /api/clients
// @access  Private (Superadmin, Central Admin, District Admin, Regional Admin)
exports.createClient = async (req, res, next) => {
  try {
    const {
      fullName,
      idNumber,
      phone,
      email,
      password,
      districtId,
      assignedHours,
      startDate,
      officerId,
      workLocation,
      notes
    } = req.body;

    const currentUser = req.user;

    // 🔒 SECURITY: Only admins can create clients
    const allowedRoles = ['superadmin', 'central_admin', 'district_admin', 'regional_admin'];
    if (!allowedRoles.includes(currentUser.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can create clients'
      });
    }

    // 🔒 SECURITY: District admin can only create clients in their district
    if (currentUser.role === 'district_admin') {
      if (!currentUser.districtId) {
        return res.status(403).json({
          success: false,
          message: 'District not assigned'
        });
      }
      if (districtId && districtId !== currentUser.districtId) {
        return res.status(403).json({
          success: false,
          message: 'Cannot create clients in other districts'
        });
      }
    }

    // 🔒 SECURITY: Regional admin can only create clients in their MRU
    if (currentUser.role === 'regional_admin') {
      if (!currentUser.mruId) {
        return res.status(403).json({
          success: false,
          message: 'MRU not assigned'
        });
      }
      // Verify district belongs to regional admin's MRU
      if (districtId) {
        const District = require('../models').District;
        const district = await District.findByPk(districtId);
        if (!district || district.mruId !== currentUser.mruId) {
          return res.status(403).json({
            success: false,
            message: 'Cannot create clients in districts outside your MRU'
          });
        }
      }
    }

    // Check if client already exists
    const existingClient = await Client.findOne({ where: { idNumber } });
    if (existingClient) {
      return res.status(400).json({
        success: false,
        message: 'Client with this ID number already exists'
      });
    }

    // 🔒 SECURITY: Verify officer belongs to the same district/MRU
    if (officerId) {
      const officer = await User.findByPk(officerId);
      if (!officer) {
        return res.status(400).json({
          success: false,
          message: 'Officer not found'
        });
      }

      // District admin can only assign officers from their district
      if (currentUser.role === 'district_admin') {
        if (officer.districtId !== currentUser.districtId) {
          return res.status(403).json({
            success: false,
            message: 'Cannot assign officers from other districts'
          });
        }
      }

      // Regional admin can only assign officers from their MRU
      if (currentUser.role === 'regional_admin') {
        if (officer.mruId !== currentUser.mruId) {
          return res.status(403).json({
            success: false,
            message: 'Cannot assign officers from other MRUs'
          });
        }
      }
    }

    // Create client (пароль будет автоматически захеширован через beforeCreate хук в модели)
    // ВАЖНО: НЕ хешируем пароль вручную, т.к. модель уже имеет beforeCreate хук
    const client = await Client.create({
      fullName,
      idNumber,
      phone,
      email,
      password, // Передаем пароль в чистом виде - хук модели сделает хеширование
      districtId: districtId || currentUser.districtId || null,
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
    console.error('❌ Error creating client:', error);
    console.error('📋 Error details:', error.message);
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(e => ({ field: e.path, message: e.message }));
      console.error('🔍 Validation errors:', validationErrors);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    next(error);
  }
};

// @desc    Update client
// @route   PUT /api/clients/:id
// @access  Private
exports.updateClient = async (req, res, next) => {
  try {
    const client = await Client.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'officer',
        attributes: ['id', 'districtId', 'mruId']
      }]
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // 🔒 SECURITY: Superadmin and central_admin can update all clients
    if (req.user.role === 'superadmin' || req.user.role === 'central_admin') {
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

      return res.json({
        success: true,
        message: 'Client updated successfully',
        data: client
      });
    }

    // 🔒 SECURITY: Officer can only update their assigned clients
    if (req.user.role === 'officer') {
      if (client.officerId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this client'
        });
      }

      const {
        fullName,
        phone,
        email,
        workLocation,
        notes
      } = req.body;

      await client.update({
        fullName,
        phone,
        email,
        workLocation,
        notes
      });

      return res.json({
        success: true,
        message: 'Client updated successfully',
        data: client
      });
    }

    // 🔒 SECURITY: District admin can only update clients from their district
    if (req.user.role === 'district_admin') {
      if (!req.user.districtId) {
        return res.status(403).json({
          success: false,
          message: 'District not assigned'
        });
      }

      const clientDistrictId = client.districtId || client.officer?.districtId;

      if (clientDistrictId !== req.user.districtId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: different district'
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

      return res.json({
        success: true,
        message: 'Client updated successfully',
        data: client
      });
    }

    // 🔒 SECURITY: Regional admin can only update clients from their MRU
    if (req.user.role === 'regional_admin') {
      if (!req.user.mruId) {
        return res.status(403).json({
          success: false,
          message: 'MRU not assigned'
        });
      }

      const clientMruId = client.officer?.mruId;

      if (clientMruId !== req.user.mruId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: different MRU'
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

      return res.json({
        success: true,
        message: 'Client updated successfully',
        data: client
      });
    }

    // 🔒 SECURITY: Clients cannot update themselves through this endpoint
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Delete client
// @route   DELETE /api/clients/:id
// @access  Private (Superadmin, Central Admin only)
exports.deleteClient = async (req, res, next) => {
  try {
    const currentUser = req.user;

    // 🔒 SECURITY: Only superadmin and central_admin can delete clients
    if (currentUser.role !== 'superadmin' && currentUser.role !== 'central_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only superadmin and central admin can delete clients'
      });
    }

    const client = await Client.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'officer',
        attributes: ['id', 'districtId', 'mruId']
      }]
    });

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
    const client = await Client.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'officer',
        attributes: ['id', 'districtId', 'mruId']
      }]
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // 🔒 SECURITY: Check access rights before showing stats
    const currentUser = req.user;

    // Superadmin and central_admin can view all stats
    if (currentUser.role !== 'superadmin' && currentUser.role !== 'central_admin') {

      // Client can only view their own stats
      if (currentUser.role === 'client') {
        if (currentUser.id !== req.params.id) {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }
      }

      // Officer can only view stats of their assigned clients
      else if (currentUser.role === 'officer') {
        if (client.officerId !== currentUser.id) {
          return res.status(403).json({
            success: false,
            message: 'Not authorized to view this client\'s stats'
          });
        }
      }

      // District admin can only view stats from their district
      else if (currentUser.role === 'district_admin') {
        if (!currentUser.districtId) {
          return res.status(403).json({
            success: false,
            message: 'District not assigned'
          });
        }

        const clientDistrictId = client.districtId || client.officer?.districtId;

        if (clientDistrictId !== currentUser.districtId) {
          return res.status(403).json({
            success: false,
            message: 'Access denied: different district'
          });
        }
      }

      // Regional admin can only view stats from their MRU
      else if (currentUser.role === 'regional_admin') {
        if (!currentUser.mruId) {
          return res.status(403).json({
            success: false,
            message: 'MRU not assigned'
          });
        }

        const clientMruId = client.officer?.mruId;

        if (clientMruId !== currentUser.mruId) {
          return res.status(403).json({
            success: false,
            message: 'Access denied: different MRU'
          });
        }
      }

      // All other roles - deny access
      else {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
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
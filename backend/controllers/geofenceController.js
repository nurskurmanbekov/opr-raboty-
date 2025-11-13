const { Geofence, GeofenceViolation, Client, WorkSession, District, MRU } = require('../models');
const { isInGeofence, haversineDistance } = require('../utils/geofence');

// @desc    Create geofence
// @route   POST /api/geofences
// @access  Private (Superadmin, Central Admin, District Admin, Regional Admin)
exports.createGeofence = async (req, res, next) => {
  try {
    const currentUser = req.user;
    const { name, latitude, longitude, radius, workLocation, districtId, mruId } = req.body;

    // 🔒 SECURITY: Only admins can create geofences
    const allowedRoles = ['superadmin', 'central_admin', 'district_admin', 'regional_admin'];
    if (!allowedRoles.includes(currentUser.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can create geofences'
      });
    }

    // 🔒 SECURITY: District admin can only create geofences in their district
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
          message: 'Cannot create geofences in other districts'
        });
      }
    }

    // 🔒 SECURITY: Regional admin can only create geofences in their MRU
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
            message: 'Cannot create geofences in districts outside your MRU'
          });
        }
      }
    }

    const geofence = await Geofence.create({
      name,
      latitude,
      longitude,
      radius: radius || 200,
      workLocation,
      districtId: districtId || currentUser.districtId || null,
      mruId: mruId || currentUser.mruId || null,
      createdBy: currentUser.id
    });

    res.status(201).json({
      success: true,
      message: 'Geofence created successfully',
      data: geofence
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all geofences
// @route   GET /api/geofences
// @access  Private
exports.getAllGeofences = async (req, res, next) => {
  try {
    const currentUser = req.user;
    const { districtId, mruId, isActive } = req.query;

    let whereClause = {};

    // 🔒 SECURITY: Officers can only see geofences from their district
    if (currentUser.role === 'officer') {
      if (!currentUser.districtId) {
        return res.status(403).json({
          success: false,
          message: 'District not assigned'
        });
      }
      whereClause.districtId = currentUser.districtId;
    }
    // 🔒 SECURITY: District admin can only see their district's geofences
    else if (currentUser.role === 'district_admin') {
      if (!currentUser.districtId) {
        return res.status(403).json({
          success: false,
          message: 'District not assigned'
        });
      }
      whereClause.districtId = currentUser.districtId;
    }
    // 🔒 SECURITY: Regional admin can only see geofences from their MRU
    else if (currentUser.role === 'regional_admin') {
      if (!currentUser.mruId) {
        return res.status(403).json({
          success: false,
          message: 'MRU not assigned'
        });
      }
      whereClause.mruId = currentUser.mruId;
    }
    // Superadmin/central_admin can filter by districtId or mruId
    else if (currentUser.role === 'superadmin' || currentUser.role === 'central_admin') {
      if (districtId) {
        whereClause.districtId = districtId;
      }
      if (mruId) {
        whereClause.mruId = mruId;
      }
    }
    // 🔒 SECURITY: Clients can see active geofences (for work session tracking)
    else if (currentUser.role === 'client') {
      whereClause.isActive = true;
    }
    // All other roles - deny access
    else {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    const geofences = await Geofence.findAll({
      where: whereClause,
      include: [
        {
          model: District,
          as: 'assignedDistrict',
          attributes: ['id', 'name'],
          include: [{
            model: MRU,
            as: 'mru',
            attributes: ['id', 'name']
          }]
        },
        {
          model: MRU,
          as: 'assignedMru',
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: geofences.length,
      data: geofences
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get geofence by ID
// @route   GET /api/geofences/:id
// @access  Private
exports.getGeofenceById = async (req, res, next) => {
  try {
    const currentUser = req.user;

    const geofence = await Geofence.findByPk(req.params.id, {
      include: [
        {
          model: District,
          as: 'assignedDistrict',
          attributes: ['id', 'name', 'mruId']
        }
      ]
    });

    if (!geofence) {
      return res.status(404).json({
        success: false,
        message: 'Geofence not found'
      });
    }

    // 🔒 SECURITY: Superadmin and central_admin can view all geofences
    if (currentUser.role === 'superadmin' || currentUser.role === 'central_admin') {
      return res.json({
        success: true,
        data: geofence
      });
    }

    // 🔒 SECURITY: Officers can only view geofences from their district
    if (currentUser.role === 'officer') {
      if (!currentUser.districtId || geofence.districtId !== currentUser.districtId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: different district'
        });
      }
      return res.json({
        success: true,
        data: geofence
      });
    }

    // 🔒 SECURITY: District admin can only view geofences from their district
    if (currentUser.role === 'district_admin') {
      if (!currentUser.districtId || geofence.districtId !== currentUser.districtId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: different district'
        });
      }
      return res.json({
        success: true,
        data: geofence
      });
    }

    // 🔒 SECURITY: Regional admin can only view geofences from their MRU
    if (currentUser.role === 'regional_admin') {
      if (!currentUser.mruId || geofence.mruId !== currentUser.mruId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: different MRU'
        });
      }
      return res.json({
        success: true,
        data: geofence
      });
    }

    // 🔒 SECURITY: Clients can view active geofences
    if (currentUser.role === 'client') {
      if (!geofence.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: geofence not active'
        });
      }
      return res.json({
        success: true,
        data: geofence
      });
    }

    // All other roles - deny access
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Update geofence
// @route   PUT /api/geofences/:id
// @access  Private (Superadmin, Central Admin, District Admin, Regional Admin)
exports.updateGeofence = async (req, res, next) => {
  try {
    const currentUser = req.user;

    // 🔒 SECURITY: Only admins can update geofences
    const allowedRoles = ['superadmin', 'central_admin', 'district_admin', 'regional_admin'];
    if (!allowedRoles.includes(currentUser.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can update geofences'
      });
    }

    const geofence = await Geofence.findByPk(req.params.id);

    if (!geofence) {
      return res.status(404).json({
        success: false,
        message: 'Geofence not found'
      });
    }

    // 🔒 SECURITY: District admin can only update geofences in their district
    if (currentUser.role === 'district_admin') {
      if (!currentUser.districtId || geofence.districtId !== currentUser.districtId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: different district'
        });
      }
    }

    // 🔒 SECURITY: Regional admin can only update geofences in their MRU
    if (currentUser.role === 'regional_admin') {
      if (!currentUser.mruId || geofence.mruId !== currentUser.mruId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: different MRU'
        });
      }
    }

    const { name, latitude, longitude, radius, workLocation, districtId, mruId, isActive } = req.body;

    // 🔒 SECURITY: Verify new district/MRU assignment is valid
    if (districtId && districtId !== geofence.districtId) {
      if (currentUser.role === 'district_admin') {
        return res.status(403).json({
          success: false,
          message: 'District admin cannot change geofence district'
        });
      }
      if (currentUser.role === 'regional_admin') {
        const District = require('../models').District;
        const district = await District.findByPk(districtId);
        if (!district || district.mruId !== currentUser.mruId) {
          return res.status(403).json({
            success: false,
            message: 'Cannot assign geofence to districts outside your MRU'
          });
        }
      }
    }

    await geofence.update({
      name: name || geofence.name,
      latitude: latitude !== undefined ? latitude : geofence.latitude,
      longitude: longitude !== undefined ? longitude : geofence.longitude,
      radius: radius !== undefined ? radius : geofence.radius,
      workLocation: workLocation || geofence.workLocation,
      districtId: districtId !== undefined ? districtId : geofence.districtId,
      mruId: mruId !== undefined ? mruId : geofence.mruId,
      isActive: isActive !== undefined ? isActive : geofence.isActive
    });

    res.json({
      success: true,
      message: 'Geofence updated successfully',
      data: geofence
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete geofence
// @route   DELETE /api/geofences/:id
// @access  Private (Superadmin, Central Admin only)
exports.deleteGeofence = async (req, res, next) => {
  try {
    const currentUser = req.user;

    // 🔒 SECURITY: Only superadmin and central_admin can delete geofences
    if (currentUser.role !== 'superadmin' && currentUser.role !== 'central_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only superadmin and central admin can delete geofences'
      });
    }

    const geofence = await Geofence.findByPk(req.params.id);

    if (!geofence) {
      return res.status(404).json({
        success: false,
        message: 'Geofence not found'
      });
    }

    // Check if geofence is being used in active work sessions
    const activeSessionsCount = await WorkSession.count({
      where: {
        geofenceId: req.params.id,
        status: 'in_progress'
      }
    });

    if (activeSessionsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete geofence with ${activeSessionsCount} active work sessions. Please complete them first.`
      });
    }

    await geofence.destroy();

    res.json({
      success: true,
      message: 'Geofence deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check if coordinates are in geofence
// @route   POST /api/geofences/check
// @access  Private
exports.checkGeofence = async (req, res, next) => {
  try {
    const { latitude, longitude, geofenceId } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    let geofence;

    if (geofenceId) {
      geofence = await Geofence.findByPk(geofenceId);
    } else {
      // Find nearest geofence
      const allGeofences = await Geofence.findAll({
        where: { isActive: true }
      });

      let nearest = null;
      let minDistance = Infinity;

      for (const gf of allGeofences) {
        const distance = haversineDistance(latitude, longitude, gf.latitude, gf.longitude);
        if (distance < minDistance) {
          minDistance = distance;
          nearest = gf;
        }
      }

      geofence = nearest;
    }

    if (!geofence) {
      return res.status(404).json({
        success: false,
        message: 'No geofence found'
      });
    }

    const inGeofence = isInGeofence(latitude, longitude, geofence);
    const distance = haversineDistance(latitude, longitude, geofence.latitude, geofence.longitude);

    res.json({
      success: true,
      data: {
        inGeofence,
        distance: Math.round(distance),
        geofence: {
          id: geofence.id,
          name: geofence.name,
          radius: geofence.radius
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get geofence violations
// @route   GET /api/geofences/violations
// @access  Private
exports.getViolations = async (req, res, next) => {
  try {
    const currentUser = req.user;
    const { clientId, workSessionId } = req.query;

    let whereClause = {};

    if (clientId) {
      whereClause.clientId = clientId;
    }

    if (workSessionId) {
      whereClause.workSessionId = workSessionId;
    }

    const violations = await GeofenceViolation.findAll({
      where: whereClause,
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'fullName', 'districtId'],
          include: [{
            model: require('../models').User,
            as: 'officer',
            attributes: ['id', 'districtId', 'mruId']
          }]
        },
        {
          model: Geofence,
          as: 'geofence',
          attributes: ['id', 'name', 'latitude', 'longitude', 'radius', 'districtId', 'mruId']
        }
      ],
      order: [['violationTime', 'DESC']]
    });

    // 🔒 SECURITY: Filter violations based on user role
    let filteredViolations = violations;

    // Officers can only see violations from their assigned clients
    if (currentUser.role === 'officer') {
      filteredViolations = violations.filter(v =>
        v.client && v.client.officer && v.client.officer.id === currentUser.id
      );
    }
    // District admin can only see violations from their district
    else if (currentUser.role === 'district_admin') {
      if (!currentUser.districtId) {
        return res.status(403).json({
          success: false,
          message: 'District not assigned'
        });
      }
      filteredViolations = violations.filter(v =>
        (v.client && v.client.districtId === currentUser.districtId) ||
        (v.geofence && v.geofence.districtId === currentUser.districtId)
      );
    }
    // Regional admin can only see violations from their MRU
    else if (currentUser.role === 'regional_admin') {
      if (!currentUser.mruId) {
        return res.status(403).json({
          success: false,
          message: 'MRU not assigned'
        });
      }
      filteredViolations = violations.filter(v =>
        (v.client && v.client.officer && v.client.officer.mruId === currentUser.mruId) ||
        (v.geofence && v.geofence.mruId === currentUser.mruId)
      );
    }
    // Superadmin and central_admin can see all violations
    else if (currentUser.role !== 'superadmin' && currentUser.role !== 'central_admin') {
      // All other roles - deny access
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      count: filteredViolations.length,
      data: filteredViolations
    });
  } catch (error) {
    next(error);
  }
};

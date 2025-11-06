const { Geofence, GeofenceViolation, Client, WorkSession } = require('../models');
const { isInGeofence, haversineDistance } = require('../utils/geofence');

// @desc    Create geofence
// @route   POST /api/geofences
// @access  Private (Admin, District Admin)
exports.createGeofence = async (req, res, next) => {
  try {
    const { name, latitude, longitude, radius, workLocation, district } = req.body;

    const geofence = await Geofence.create({
      name,
      latitude,
      longitude,
      radius: radius || 200,
      workLocation,
      district: district || req.user.district,
      createdBy: req.user.id
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
    const { district, isActive } = req.query;

    let whereClause = {};

    // District admins can only see their district's geofences
    if (req.user.role === 'district_admin') {
      whereClause.district = req.user.district;
    } else if (district) {
      whereClause.district = district;
    }

    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    const geofences = await Geofence.findAll({
      where: whereClause,
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
    const geofence = await Geofence.findByPk(req.params.id);

    if (!geofence) {
      return res.status(404).json({
        success: false,
        message: 'Geofence not found'
      });
    }

    res.json({
      success: true,
      data: geofence
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update geofence
// @route   PUT /api/geofences/:id
// @access  Private (Admin, District Admin)
exports.updateGeofence = async (req, res, next) => {
  try {
    const geofence = await Geofence.findByPk(req.params.id);

    if (!geofence) {
      return res.status(404).json({
        success: false,
        message: 'Geofence not found'
      });
    }

    const { name, latitude, longitude, radius, workLocation, isActive } = req.body;

    await geofence.update({
      name: name || geofence.name,
      latitude: latitude || geofence.latitude,
      longitude: longitude || geofence.longitude,
      radius: radius || geofence.radius,
      workLocation: workLocation || geofence.workLocation,
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
// @access  Private (Admin only)
exports.deleteGeofence = async (req, res, next) => {
  try {
    const geofence = await Geofence.findByPk(req.params.id);

    if (!geofence) {
      return res.status(404).json({
        success: false,
        message: 'Geofence not found'
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
          attributes: ['id', 'fullName', 'district']
        },
        {
          model: Geofence,
          as: 'geofence',
          attributes: ['id', 'name', 'latitude', 'longitude', 'radius']
        }
      ],
      order: [['violationTime', 'DESC']]
    });

    res.json({
      success: true,
      count: violations.length,
      data: violations
    });
  } catch (error) {
    next(error);
  }
};

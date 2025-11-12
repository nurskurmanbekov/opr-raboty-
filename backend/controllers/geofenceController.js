const { Geofence, GeofenceViolation, Client, WorkSession, District, MRU } = require('../models');
const { isInGeofence, haversineDistance } = require('../utils/geofence');

// @desc    Create geofence
// @route   POST /api/geofences
// @access  Private (Admin, District Admin)
exports.createGeofence = async (req, res, next) => {
  try {
    const { name, latitude, longitude, radius, workLocation, district, districtId, mruId } = req.body;

    const geofence = await Geofence.create({
      name,
      latitude,
      longitude,
      radius: radius || 200,
      workLocation,
      // Поддержка новой системы (districtId, mruId) и старой (district STRING)
      district: district || req.user.district || null,
      districtId: districtId || req.user.districtId || null,
      mruId: mruId || req.user.mruId || null,
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
    const { district, districtId, mruId, isActive } = req.query;

    let whereClause = {};

    // District admins can only see their district's geofences
    if (req.user.role === 'district_admin') {
      // Новая система - districtId
      if (req.user.districtId) {
        whereClause.districtId = req.user.districtId;
      } else if (req.user.district) {
        // Fallback для старой системы
        whereClause.district = req.user.district;
      }
    } else {
      // Фильтрация по параметрам запроса
      if (districtId) {
        whereClause.districtId = districtId;
      } else if (district) {
        // Поддержка старого параметра district (STRING)
        whereClause.district = district;
      }
      if (mruId) {
        whereClause.mruId = mruId;
      }
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

    const { name, latitude, longitude, radius, workLocation, district, districtId, mruId, isActive } = req.body;

    await geofence.update({
      name: name || geofence.name,
      latitude: latitude || geofence.latitude,
      longitude: longitude || geofence.longitude,
      radius: radius || geofence.radius,
      workLocation: workLocation || geofence.workLocation,
      district: district !== undefined ? district : geofence.district,
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

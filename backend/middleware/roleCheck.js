const { hasPermission } = require('../config/permissions');

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role || req.user.dataValues?.role;

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role || req.user.dataValues?.role;

    if (!hasPermission(userRole, permission)) {
      return res.status(403).json({
        success: false,
        message: `Permission denied. Required permission: ${permission}`
      });
    }

    next();
  };
};

const canManageDistrict = (district) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role || req.user.dataValues?.role;

    // Superadmin can manage any district
    if (userRole === 'superadmin') {
      return next();
    }

    // Regional admin can manage districts in their managed list
    if (userRole === 'regional_admin') {
      const managedDistricts = req.user.managedDistricts || [];
      if (managedDistricts.includes(district)) {
        return next();
      }
    }

    // District admin can only manage their own district
    if (userRole === 'district_admin' && req.user.district === district) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'You are not authorized to manage this district'
    });
  };
};

module.exports = {
  requireRole,
  requirePermission,
  canManageDistrict
};

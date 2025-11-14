/**
 * Role-based access control middleware for v2.0
 *
 * Simplified roles (4 total):
 * - superadmin: Full system access
 * - district_head: District manager (can reassign clients, create officers)
 * - district_officer: District employee (creates clients for themselves only)
 * - client: Client users (limited access)
 */

/**
 * Require one or more roles
 */
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

/**
 * Require superadmin only
 */
const requireSuperadmin = () => {
  return requireRole('superadmin');
};

/**
 * Require district_head or superadmin
 */
const requireDistrictHead = () => {
  return requireRole('superadmin', 'district_head');
};

/**
 * Require any officer role (district_head, district_officer, or superadmin)
 */
const requireOfficer = () => {
  return requireRole('superadmin', 'district_head', 'district_officer');
};

/**
 * Check if user can manage a specific client
 */
const canManageClient = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const { role, id: userId, district } = req.user;

  // Superadmin can manage all clients
  if (role === 'superadmin') {
    return next();
  }

  // District head can manage clients in their district
  if (role === 'district_head') {
    if (req.params.id || req.body.clientId) {
      const { Client } = require('../models');
      const clientId = req.params.id || req.body.clientId;
      const client = await Client.findByPk(clientId);

      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client not found'
        });
      }

      if (client.district !== district) {
        return res.status(403).json({
          success: false,
          message: 'Can only manage clients in your district'
        });
      }
    }
    return next();
  }

  // District officer can only manage their own clients
  if (role === 'district_officer') {
    if (req.params.id || req.body.clientId) {
      const { Client } = require('../models');
      const clientId = req.params.id || req.body.clientId;
      const client = await Client.findByPk(clientId);

      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client not found'
        });
      }

      if (client.officerId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Can only manage your own clients'
        });
      }
    }
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied'
  });
};

/**
 * Check if user can reassign clients (only superadmin and district_head)
 */
const canReassignClients = () => {
  return requireRole('superadmin', 'district_head');
};

/**
 * Check if user can create officers (only superadmin and district_head)
 */
const canCreateOfficers = () => {
  return requireRole('superadmin', 'district_head');
};

/**
 * Check if user can delete clients (only superadmin)
 */
const canDeleteClients = () => {
  return requireRole('superadmin');
};

/**
 * Check if user can create MTU locations (only superadmin)
 */
const canCreateMTU = () => {
  return requireRole('superadmin');
};

/**
 * Check if user can manage district (superadmin or district_head of that district)
 */
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

    // District head can only manage their own district
    if (userRole === 'district_head' && req.user.district === district) {
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
  requireSuperadmin,
  requireDistrictHead,
  requireOfficer,
  canManageClient,
  canReassignClients,
  canCreateOfficers,
  canDeleteClients,
  canCreateMTU,
  canManageDistrict
};

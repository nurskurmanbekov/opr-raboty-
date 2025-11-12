const express = require('express');
const router = express.Router();
const {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  getClientStats
} = require('../controllers/clientController');
const {
  reassignClient,
  getClientAssignmentHistory,
  reassignAllClients
} = require('../controllers/clientReassignmentController');
const { createClientValidation } = require('../utils/validators');
const { validate } = require('../middleware/validation');
const { protect, authorize } = require('../middleware/auth');
const { canAccessClient } = require('../middleware/accessControl');

router.use(protect); // All routes need authentication

// 🔒 SECURITY: Get all clients - role-based filtering in controller
router.get('/', getClients);

// 🔒 SECURITY: Create client - only authorized roles
router.post('/', authorize('superadmin', 'district_admin', 'central_admin'), createClientValidation, validate, createClient);

// 🔒 SECURITY: Get single client - check access rights
router.get('/:id', canAccessClient, getClient);

// 🔒 SECURITY: Get client stats - check access rights
router.get('/:id/stats', canAccessClient, getClientStats);

// 🔒 SECURITY: Update client - check access rights in controller
router.put('/:id', authorize('superadmin', 'district_admin', 'officer', 'regional_admin', 'central_admin'), updateClient);

// 🔒 SECURITY: Delete client - only superadmin
router.delete('/:id', authorize('superadmin', 'central_admin'), deleteClient);

// 🔒 SECURITY: Reassign client - only central_admin and superadmin
router.post('/:clientId/reassign', authorize('central_admin', 'superadmin'), reassignClient);

// 🔒 SECURITY: Get assignment history - check access rights
router.get('/:clientId/assignment-history', canAccessClient, getClientAssignmentHistory);

module.exports = router;
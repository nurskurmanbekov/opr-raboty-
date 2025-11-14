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
const { authenticate } = require('../middleware/auth');
const {
  requireOfficer,
  requireDistrictHead,
  canDeleteClients,
  canReassignClients,
  canManageClient
} = require('../middleware/roleCheck');

router.use(authenticate); // All routes need authentication

// 🔒 SECURITY: Get all clients - role-based filtering in controller
router.get('/', requireOfficer(), getClients);

// 🔒 SECURITY: Create client - only officers can create clients
// district_officer creates for self, district_head can create for any officer in their district
router.post('/', requireOfficer(), createClientValidation, validate, createClient);

// 🔒 SECURITY: Get single client - check access rights
router.get('/:id', getClient);

// 🔒 SECURITY: Get client stats - check access rights
router.get('/:id/stats', getClientStats);

// 🔒 SECURITY: Update client - officers can update their clients
router.put('/:id', requireOfficer(), canManageClient, updateClient);

// 🔒 SECURITY: Delete client - only superadmin
router.delete('/:id', canDeleteClients(), deleteClient);

// 🔒 SECURITY: Reassign client - only district_head and superadmin
router.post('/:clientId/reassign', canReassignClients(), reassignClient);

// 🔒 SECURITY: Get assignment history - check access rights
router.get('/:clientId/assignment-history', getClientAssignmentHistory);

module.exports = router;
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
const { createClientValidation } = require('../utils/validators');
const { validate } = require('../middleware/validation');
const { protect, authorize } = require('../middleware/auth');

router.use(protect); // All routes need authentication

router.get('/', getClients);
router.post('/', authorize('superadmin', 'district_admin'), createClientValidation, validate, createClient);
router.get('/:id', getClient);
router.get('/:id/stats', getClientStats);
router.put('/:id', authorize('superadmin', 'district_admin', 'officer'), updateClient);
router.delete('/:id', authorize('superadmin'), deleteClient);

module.exports = router;
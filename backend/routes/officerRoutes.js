const express = require('express');
const router = express.Router();
const {
  reassignAllClients
} = require('../controllers/clientReassignmentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect); // Все маршруты требуют аутентификации

// Массовое переназначение всех клиентов офицера (при увольнении)
router.post('/:officerId/reassign-all-clients', authorize('central_admin', 'superadmin'), reassignAllClients);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  createUser,
  updateUserRole,
  assignDistrict,
  deactivateUser,
  activateUser
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { canAccessUser, canModifyUser } = require('../middleware/accessControl');

router.use(protect); // All routes need authentication

// 🔒 SECURITY: Create user - only authorized roles
router.post('/', requireRole('superadmin', 'district_admin', 'regional_admin', 'central_admin'), createUser);

// 🔒 SECURITY: Get all users - role-based filtering in controller
router.get('/', requireRole('superadmin', 'regional_admin', 'district_admin', 'officer', 'central_admin'), getUsers);

// 🔒 SECURITY: Get single user - check access rights
router.get('/:id', canAccessUser, getUser);

// 🔒 SECURITY: Update user - check modification rights (prevents privilege escalation)
router.put('/:id', canModifyUser, updateUser);

// 🔒 SECURITY: Update user role - only superadmin
router.put('/:id/role', requireRole('superadmin'), updateUserRole);

// 🔒 SECURITY: Assign district - only superadmin and regional_admin
router.put('/:id/district', requireRole('superadmin', 'regional_admin', 'central_admin'), assignDistrict);

// 🔒 SECURITY: Deactivate user - check modification rights
router.put('/:id/deactivate', requireRole('superadmin', 'district_admin', 'regional_admin', 'central_admin'), deactivateUser);

// 🔒 SECURITY: Activate user - check modification rights
router.put('/:id/activate', requireRole('superadmin', 'district_admin', 'regional_admin', 'central_admin'), activateUser);

// 🔒 SECURITY: Delete user - only superadmin
router.delete('/:id', requireRole('superadmin', 'central_admin'), deleteUser);

module.exports = router;
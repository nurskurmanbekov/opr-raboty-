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

router.use(protect); // All routes need authentication

router.post('/', requireRole('superadmin', 'district_admin'), createUser);
router.get('/', requireRole('superadmin', 'regional_admin', 'district_admin'), getUsers);
router.get('/:id', getUser);
router.put('/:id', requireRole('superadmin', 'district_admin'), updateUser);
router.put('/:id/role', requireRole('superadmin'), updateUserRole);
router.put('/:id/district', requireRole('superadmin', 'regional_admin'), assignDistrict);
router.put('/:id/deactivate', requireRole('superadmin', 'district_admin'), deactivateUser);
router.put('/:id/activate', requireRole('superadmin', 'district_admin'), activateUser);
router.delete('/:id', requireRole('superadmin'), deleteUser);

module.exports = router;
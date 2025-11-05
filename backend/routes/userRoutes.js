const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect); // All routes need authentication

router.get('/', authorize('superadmin', 'district_admin'), getUsers);
router.get('/:id', getUser);
router.put('/:id', authorize('superadmin', 'district_admin'), updateUser);
router.delete('/:id', authorize('superadmin'), deleteUser);

module.exports = router;
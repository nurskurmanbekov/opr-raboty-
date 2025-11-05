const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  changePassword,
  uploadProfilePhoto
} = require('../controllers/profileController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect); // All routes need authentication

router.get('/me', getProfile);
router.put('/me', updateProfile);
router.put('/password', changePassword);
router.post('/photo', upload.single('photo'), uploadProfilePhoto);

module.exports = router;

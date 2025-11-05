const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { registerValidation, loginValidation } = require('../utils/validators');
const { validate } = require('../middleware/validation');
const { protect } = require('../middleware/auth');

router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.get('/me', protect, getMe);

module.exports = router;
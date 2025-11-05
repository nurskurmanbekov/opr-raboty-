const { User, Client } = require('../models');
const { generateToken } = require('../utils/jwtUtils');

// @desc    Register new user (staff)
// @route   POST /api/auth/register
// @access  Public (but should be protected in production)
exports.register = async (req, res, next) => {
  try {
    const { fullName, email, phone, password, role, district } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Create user
    const user = await User.create({
      fullName,
      email,
      phone,
      password,
      role,
      district
    });

    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          district: user.district
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user (staff or client)
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password, userType } = req.body; // userType: 'staff' or 'client'

    let user;
    
    if (userType === 'client') {
      // Login as client (using idNumber instead of email)
      user = await Client.findOne({ where: { idNumber: email } });
    } else {
      // Login as staff
      user = await User.findOne({ where: { email } });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login (for staff)
    if (userType !== 'client') {
      user.lastLogin = new Date();
      await user.save();
    }

    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email || user.idNumber,
          role: user.role || 'client',
          district: user.district
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    next(error);
  }
};
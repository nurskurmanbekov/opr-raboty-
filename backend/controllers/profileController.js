const { User, Client } = require('../models');
const bcrypt = require('bcryptjs');

// @desc    Get current user profile
// @route   GET /api/profile/me
// @access  Private
exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role || req.user.dataValues?.role;

    let profile;

    if (userRole === 'client') {
      profile = await Client.findByPk(userId, {
        attributes: { exclude: ['password'] }
      });
    } else {
      profile = await User.findByPk(userId, {
        attributes: { exclude: ['password'] }
      });
    }

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update profile
// @route   PUT /api/profile/me
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role || req.user.dataValues?.role;
    const { fullName, phone, email } = req.body;

    let profile;

    if (userRole === 'client') {
      profile = await Client.findByPk(userId);
    } else {
      profile = await User.findByPk(userId);
    }

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    // Update fields
    await profile.update({
      fullName: fullName || profile.fullName,
      phone: phone || profile.phone,
      email: email || profile.email
    });

    // Return without password
    const updatedProfile = profile.toJSON();
    delete updatedProfile.password;

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedProfile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/profile/password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role || req.user.dataValues?.role;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    let user;

    if (userRole === 'client') {
      user = await Client.findByPk(userId);
    } else {
      user = await User.findByPk(userId);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password (will be hashed by model hook)
    await user.update({ password: newPassword });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload profile photo
// @route   POST /api/profile/photo
// @access  Private
exports.uploadProfilePhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a photo'
      });
    }

    const userId = req.user.id;
    const userRole = req.user.role || req.user.dataValues?.role;
    const photoPath = req.file.path;

    let user;

    if (userRole === 'client') {
      user = await Client.findByPk(userId);
    } else {
      user = await User.findByPk(userId);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.update({ profilePhoto: photoPath });

    res.json({
      success: true,
      message: 'Profile photo uploaded successfully',
      data: {
        profilePhoto: photoPath
      }
    });
  } catch (error) {
    next(error);
  }
};

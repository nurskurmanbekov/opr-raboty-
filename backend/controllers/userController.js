const { User } = require('../models');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin, District Admin)
exports.getUsers = async (req, res, next) => {
  try {
    const { role, district } = req.query;

    let whereClause = {};
    
    // Filter by role if provided
    if (role) {
      whereClause.role = role;
    }

    // District admin can only see users from their district
    if (req.user.role === 'district_admin') {
      whereClause.district = req.user.district;
    } else if (district) {
      whereClause.district = district;
    }

    const users = await User.findAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin)
exports.updateUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { fullName, email, phone, role, district, isActive } = req.body;

    await user.update({
      fullName,
      email,
      phone,
      role,
      district,
      isActive
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Superadmin only)
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Cannot delete yourself
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete yourself'
      });
    }

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has active clients
    const Client = require('../models').Client;
    const clientCount = await Client.count({ where: { officerId: id } });

    if (clientCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete user with ${clientCount} active clients. Please reassign clients first.`
      });
    }

    await user.destroy();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create user
// @route   POST /api/users
// @access  Private (Superadmin, District Admin)
exports.createUser = async (req, res, next) => {
  try {
    const { fullName, email, phone, password, role, district, managedDistricts } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // District admin can only create officers
    if (req.user.role === 'district_admin' && role !== 'officer') {
      return res.status(403).json({
        success: false,
        message: 'District admins can only create officers'
      });
    }

    // Create user
    const user = await User.create({
      fullName,
      email,
      phone,
      password,
      role: role || 'officer',
      district: district || req.user.district,
      managedDistricts: managedDistricts || []
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        district: user.district
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role
// @route   PUT /api/users/:id/role
// @access  Private (Superadmin only)
exports.updateUserRole = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { role, managedDistricts } = req.body;

    await user.update({
      role,
      managedDistricts: managedDistricts || user.managedDistricts
    });

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign district to user
// @route   PUT /api/users/:id/district
// @access  Private (Superadmin, Regional Admin)
exports.assignDistrict = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { district } = req.body;

    await user.update({ district });

    res.json({
      success: true,
      message: 'District assigned successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Deactivate user
// @route   PUT /api/users/:id/deactivate
// @access  Private (Superadmin, District Admin)
exports.deactivateUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.update({ isActive: false });

    res.json({
      success: true,
      message: 'User deactivated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Activate user
// @route   PUT /api/users/:id/activate
// @access  Private (Superadmin, District Admin)
exports.activateUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.update({ isActive: true });

    res.json({
      success: true,
      message: 'User activated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};
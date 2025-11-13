const { User } = require('../models');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin, District Admin, Officer)
exports.getUsers = async (req, res, next) => {
  try {
    const { role, districtId, mruId } = req.query;

    let whereClause = {};

    // Filter by role if provided
    if (role) {
      whereClause.role = role;
    }

    // 🔒 SECURITY: District admin and officer can only see users from their district
    if (req.user.role === 'district_admin' || req.user.role === 'officer') {
      if (req.user.districtId) {
        whereClause.districtId = req.user.districtId;
      }
    }
    // 🔒 SECURITY: Regional admin can only see users from their MRU
    else if (req.user.role === 'regional_admin') {
      if (req.user.mruId) {
        whereClause.mruId = req.user.mruId;
      }
    }
    // Superadmin/central_admin can filter by districtId or mruId
    else {
      if (districtId) {
        whereClause.districtId = districtId;
      }
      if (mruId) {
        whereClause.mruId = mruId;
      }
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
    const targetUserId = req.params.id;
    const currentUser = req.user;

    // 🔒 SECURITY: User can always see themselves
    if (targetUserId === currentUser.id) {
      const user = await User.findByPk(targetUserId, {
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      return res.json({
        success: true,
        data: user
      });
    }

    // 🔒 SECURITY: Superadmin can see all users
    if (currentUser.role === 'superadmin' || currentUser.role === 'central_admin') {
      const user = await User.findByPk(targetUserId, {
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      return res.json({
        success: true,
        data: user
      });
    }

    const targetUser = await User.findByPk(targetUserId, {
      attributes: { exclude: ['password'] }
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // 🔒 SECURITY: District admin can only see users from their district
    if (currentUser.role === 'district_admin') {
      if (!currentUser.districtId || targetUser.districtId !== currentUser.districtId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: different district'
        });
      }
      return res.json({
        success: true,
        data: targetUser
      });
    }

    // 🔒 SECURITY: Regional admin can only see users from their MRU
    if (currentUser.role === 'regional_admin') {
      if (!currentUser.mruId || targetUser.mruId !== currentUser.mruId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: different MRU'
        });
      }
      return res.json({
        success: true,
        data: targetUser
      });
    }

    // 🔒 SECURITY: Officers and clients cannot see other users
    return res.status(403).json({
      success: false,
      message: 'Access denied'
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
    const targetUserId = req.params.id;
    const currentUser = req.user;
    const { fullName, email, phone, role: newRole, district, districtId, mruId, isActive } = req.body;

    // 🔒 SECURITY: Cannot modify yourself (use /profile endpoint instead)
    if (targetUserId === currentUser.id) {
      return res.status(403).json({
        success: false,
        message: 'Use /profile endpoint to update your own data'
      });
    }

    const targetUser = await User.findByPk(targetUserId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // 🔒 SECURITY: Only superadmin can change user roles
    if (newRole && newRole !== targetUser.role) {
      if (currentUser.role !== 'superadmin') {
        return res.status(403).json({
          success: false,
          message: 'Only superadmin can change user roles'
        });
      }
    }

    // 🔒 SECURITY: Superadmin can modify anyone
    if (currentUser.role === 'superadmin' || currentUser.role === 'central_admin') {
      await targetUser.update({
        fullName,
        email,
        phone,
        role: newRole,
        district,
        districtId,
        mruId,
        isActive
      });

      return res.json({
        success: true,
        message: 'User updated successfully',
        data: targetUser
      });
    }

    // 🔒 SECURITY: District admin can only modify users from their district
    if (currentUser.role === 'district_admin') {
      if (!currentUser.districtId || targetUser.districtId !== currentUser.districtId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: different district'
        });
      }

      // District admin cannot modify other admins
      if (targetUser.role === 'district_admin' || targetUser.role === 'regional_admin' || targetUser.role === 'superadmin' || targetUser.role === 'central_admin') {
        return res.status(403).json({
          success: false,
          message: 'Cannot modify admin users'
        });
      }

      await targetUser.update({
        fullName,
        email,
        phone,
        isActive
        // Note: district_admin cannot change role, district, districtId, mruId
      });

      return res.json({
        success: true,
        message: 'User updated successfully',
        data: targetUser
      });
    }

    // 🔒 SECURITY: Regional admin can only modify users from their MRU
    if (currentUser.role === 'regional_admin') {
      if (!currentUser.mruId || targetUser.mruId !== currentUser.mruId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: different MRU'
        });
      }

      // Regional admin cannot modify other admins of same or higher level
      if (targetUser.role === 'regional_admin' || targetUser.role === 'superadmin' || targetUser.role === 'central_admin') {
        return res.status(403).json({
          success: false,
          message: 'Cannot modify admin users of same or higher level'
        });
      }

      await targetUser.update({
        fullName,
        email,
        phone,
        isActive
        // Note: regional_admin cannot change role, district, districtId, mruId
      });

      return res.json({
        success: true,
        message: 'User updated successfully',
        data: targetUser
      });
    }

    // 🔒 SECURITY: Other roles cannot modify users
    return res.status(403).json({
      success: false,
      message: 'Access denied'
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
// @access  Private (Superadmin, District Admin, Regional Admin)
exports.createUser = async (req, res, next) => {
  try {
    const { fullName, email, phone, password, role, districtId, mruId, managedDistricts } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // 🔒 SECURITY: District admin can only create officers in their district
    if (req.user.role === 'district_admin') {
      if (role && role !== 'officer') {
        return res.status(403).json({
          success: false,
          message: 'District admins can only create officers'
        });
      }
      if (districtId && districtId !== req.user.districtId) {
        return res.status(403).json({
          success: false,
          message: 'Cannot create users in other districts'
        });
      }
    }

    // 🔒 SECURITY: Regional admin can only create users in their MRU
    if (req.user.role === 'regional_admin') {
      if (role && (role === 'superadmin' || role === 'central_admin')) {
        return res.status(403).json({
          success: false,
          message: 'Cannot create admin users'
        });
      }
      if (mruId && mruId !== req.user.mruId) {
        return res.status(403).json({
          success: false,
          message: 'Cannot create users in other MRUs'
        });
      }
    }

    // 🔒 SECURITY: Cannot create superadmin users
    if (role === 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot create superadmin users. Contact database administrator.'
      });
    }

    // Create user
    const user = await User.create({
      fullName,
      email,
      phone,
      password,
      role: role || 'officer',
      districtId: districtId || req.user.districtId,
      mruId: mruId || req.user.mruId,
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
        districtId: user.districtId,
        mruId: user.mruId
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
    const targetUserId = req.params.id;
    const currentUser = req.user;

    // 🔒 SECURITY: Cannot modify your own role (privilege escalation prevention)
    if (targetUserId === currentUser.id) {
      return res.status(403).json({
        success: false,
        message: 'You cannot modify your own role'
      });
    }

    const user = await User.findByPk(targetUserId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { role, managedDistricts } = req.body;

    // 🔒 SECURITY: Cannot elevate anyone to superadmin (only database admin can do this)
    if (role === 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot elevate users to superadmin role. Contact database administrator.'
      });
    }

    // 🔒 SECURITY: Only superadmin can modify other superadmins
    if (user.role === 'superadmin' && currentUser.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only superadmin can modify other superadmins'
      });
    }

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
    const targetUserId = req.params.id;
    const currentUser = req.user;

    // 🔒 SECURITY: Cannot modify yourself
    if (targetUserId === currentUser.id) {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify your own district assignment'
      });
    }

    const user = await User.findByPk(targetUserId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { districtId, mruId } = req.body;

    // 🔒 SECURITY: Regional admin can only assign districts within their MRU
    if (currentUser.role === 'regional_admin') {
      if (mruId && mruId !== currentUser.mruId) {
        return res.status(403).json({
          success: false,
          message: 'Cannot assign districts from other MRUs'
        });
      }
    }

    await user.update({
      districtId: districtId || user.districtId,
      mruId: mruId || user.mruId
    });

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
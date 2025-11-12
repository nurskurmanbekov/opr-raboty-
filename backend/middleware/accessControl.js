const { Client, WorkSession, User, District, MRU } = require('../models');

/**
 * Проверяет, имеет ли пользователь доступ к клиенту
 */
exports.canAccessClient = async (req, res, next) => {
  try {
    const clientId = req.params.id || req.params.clientId;
    const user = req.user;

    // Superadmin имеет доступ ко всем
    if (user.role === 'superadmin' || user.role === 'central_admin') {
      return next();
    }

    const client = await Client.findByPk(clientId, {
      include: [{
        model: User,
        as: 'officer',
        attributes: ['id', 'districtId', 'mruId']
      }]
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Клиент может видеть только себя
    if (user.role === 'client') {
      if (user.id !== clientId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      return next();
    }

    // Офицер может видеть только своих клиентов
    if (user.role === 'officer') {
      if (client.officerId !== user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: not your client'
        });
      }
      return next();
    }

    // Админ района может видеть только клиентов своего района
    if (user.role === 'district_admin') {
      if (!user.districtId) {
        return res.status(403).json({
          success: false,
          message: 'District not assigned'
        });
      }

      // Проверяем через districtId клиента или через districtId офицера
      const clientDistrictId = client.districtId || client.officer?.districtId;

      if (clientDistrictId !== user.districtId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: different district'
        });
      }
      return next();
    }

    // Админ МРУ может видеть только клиентов своего МРУ
    if (user.role === 'regional_admin') {
      if (!user.mruId) {
        return res.status(403).json({
          success: false,
          message: 'MRU not assigned'
        });
      }

      // Проверяем через МРУ офицера
      const clientMruId = client.officer?.mruId;

      if (clientMruId !== user.mruId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: different MRU'
        });
      }
      return next();
    }

    // Аудитор - проверка через auditorAccess (из другого middleware)
    if (user.role === 'auditor') {
      // Эта проверка уже сделана в checkAuditorAccess middleware
      return next();
    }

    // Для всех остальных ролей - запрет
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Проверяет, имеет ли пользователь доступ к рабочей сессии
 */
exports.canAccessWorkSession = async (req, res, next) => {
  try {
    const sessionId = req.params.id || req.params.sessionId;
    const user = req.user;

    const session = await WorkSession.findByPk(sessionId, {
      include: [{
        model: Client,
        as: 'client',
        include: [{
          model: User,
          as: 'officer',
          attributes: ['id', 'districtId', 'mruId']
        }]
      }]
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Work session not found'
      });
    }

    // Superadmin имеет доступ ко всем
    if (user.role === 'superadmin' || user.role === 'central_admin') {
      return next();
    }

    // Клиент может видеть только свои сессии
    if (user.role === 'client') {
      if (session.clientId !== user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: not your session'
        });
      }
      return next();
    }

    // Офицер может видеть сессии только своих клиентов
    if (user.role === 'officer') {
      if (session.client?.officerId !== user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: not your client'
        });
      }
      return next();
    }

    // Админ района может видеть сессии клиентов своего района
    if (user.role === 'district_admin') {
      if (!user.districtId) {
        return res.status(403).json({
          success: false,
          message: 'District not assigned'
        });
      }

      const clientDistrictId = session.client?.districtId || session.client?.officer?.districtId;

      if (clientDistrictId !== user.districtId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: different district'
        });
      }
      return next();
    }

    // Админ МРУ может видеть сессии клиентов своего МРУ
    if (user.role === 'regional_admin') {
      if (!user.mruId) {
        return res.status(403).json({
          success: false,
          message: 'MRU not assigned'
        });
      }

      const clientMruId = session.client?.officer?.mruId;

      if (clientMruId !== user.mruId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: different MRU'
        });
      }
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Проверяет, что пользователь является владельцем рабочей сессии
 * (только для клиентов - для операций модификации)
 */
exports.mustOwnWorkSession = async (req, res, next) => {
  try {
    const sessionId = req.params.id || req.params.sessionId;
    const user = req.user;

    // Только клиенты могут владеть сессиями
    if (user.role !== 'client') {
      return res.status(403).json({
        success: false,
        message: 'Only clients can perform this action'
      });
    }

    const session = await WorkSession.findByPk(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Work session not found'
      });
    }

    if (session.clientId !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: not your session'
      });
    }

    // Сохраняем сессию в req для использования в контроллере
    req.workSession = session;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Проверяет, может ли пользователь просматривать другого пользователя
 */
exports.canAccessUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const currentUser = req.user;

    // Пользователь может всегда видеть себя
    if (targetUserId === currentUser.id) {
      return next();
    }

    // Superadmin может видеть всех
    if (currentUser.role === 'superadmin' || currentUser.role === 'central_admin') {
      return next();
    }

    const targetUser = await User.findByPk(targetUserId, {
      attributes: ['id', 'role', 'districtId', 'mruId']
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Админ района может видеть пользователей своего района
    if (currentUser.role === 'district_admin') {
      if (!currentUser.districtId || targetUser.districtId !== currentUser.districtId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: different district'
        });
      }
      return next();
    }

    // Админ МРУ может видеть пользователей своего МРУ
    if (currentUser.role === 'regional_admin') {
      if (!currentUser.mruId || targetUser.mruId !== currentUser.mruId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: different MRU'
        });
      }
      return next();
    }

    // Офицеры и остальные роли не могут видеть других пользователей
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Проверяет, может ли пользователь изменять другого пользователя
 */
exports.canModifyUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const currentUser = req.user;
    const { role: newRole } = req.body;

    // Нельзя изменять самого себя (кроме профиля через отдельный endpoint)
    if (targetUserId === currentUser.id) {
      return res.status(403).json({
        success: false,
        message: 'Use /profile endpoint to update your own data'
      });
    }

    const targetUser = await User.findByPk(targetUserId, {
      attributes: ['id', 'role', 'districtId', 'mruId']
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Только superadmin может изменять роли
    if (newRole && newRole !== targetUser.role) {
      if (currentUser.role !== 'superadmin') {
        return res.status(403).json({
          success: false,
          message: 'Only superadmin can change user roles'
        });
      }
    }

    // Superadmin может изменять всех
    if (currentUser.role === 'superadmin' || currentUser.role === 'central_admin') {
      return next();
    }

    // Админ района может изменять только пользователей своего района
    if (currentUser.role === 'district_admin') {
      if (!currentUser.districtId || targetUser.districtId !== currentUser.districtId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: different district'
        });
      }

      // Админ района не может изменять других админов
      if (targetUser.role === 'district_admin' || targetUser.role === 'regional_admin' || targetUser.role === 'superadmin') {
        return res.status(403).json({
          success: false,
          message: 'Cannot modify admin users'
        });
      }

      return next();
    }

    // Админ МРУ может изменять пользователей своего МРУ
    if (currentUser.role === 'regional_admin') {
      if (!currentUser.mruId || targetUser.mruId !== currentUser.mruId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: different MRU'
        });
      }

      // Админ МРУ не может изменять других админов МРУ и выше
      if (targetUser.role === 'regional_admin' || targetUser.role === 'superadmin') {
        return res.status(403).json({
          success: false,
          message: 'Cannot modify admin users of same or higher level'
        });
      }

      return next();
    }

    // Остальные роли не могут изменять пользователей
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });

  } catch (error) {
    next(error);
  }
};

module.exports = exports;

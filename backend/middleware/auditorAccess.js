const { AuditorPermission, MRU, District } = require('../models');

/**
 * Middleware для проверки прав доступа аудитора
 * Проверяет, имеет ли аудитор доступ к конкретному МРУ или району
 */
exports.checkAuditorAccess = async (req, res, next) => {
  try {
    const user = req.user;

    // Если не аудитор - пропускаем (для других ролей проверка в других middleware)
    if (user.role !== 'auditor') {
      return next();
    }

    // Получаем права аудитора
    const permissions = await AuditorPermission.findOne({
      where: { auditorId: user.id, isActive: true }
    });

    if (!permissions) {
      return res.status(403).json({
        success: false,
        message: 'У вас нет прав доступа. Обратитесь к администратору.'
      });
    }

    // Если accessType === 'all', аудитор видит всё
    if (permissions.accessType === 'all') {
      req.auditorAccess = {
        type: 'all',
        allowedMruIds: [],
        allowedDistrictIds: []
      };
      return next();
    }

    // Сохраняем права доступа в request для использования в контроллерах
    req.auditorAccess = {
      type: permissions.accessType,
      allowedMruIds: permissions.allowedMruIds || [],
      allowedDistrictIds: permissions.allowedDistrictIds || []
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Проверяет доступ аудитора к конкретному МРУ
 */
exports.checkMRUAccess = async (req, res, next) => {
  try {
    const user = req.user;
    const mruId = req.params.id || req.params.mruId;

    // Если не аудитор или superadmin/central_admin - пропускаем
    if (user.role !== 'auditor') {
      return next();
    }

    if (!req.auditorAccess) {
      return res.status(403).json({
        success: false,
        message: 'Права доступа не определены'
      });
    }

    // Полный доступ
    if (req.auditorAccess.type === 'all') {
      return next();
    }

    // Проверка доступа к МРУ
    if (req.auditorAccess.type === 'mru') {
      if (req.auditorAccess.allowedMruIds.includes(mruId)) {
        return next();
      }
    }

    // Проверка доступа через район
    if (req.auditorAccess.type === 'district' && mruId) {
      // Получаем районы этого МРУ
      const districts = await District.findAll({
        where: { mruId },
        attributes: ['id']
      });
      const districtIds = districts.map(d => d.id);

      // Проверяем, есть ли у аудитора доступ хотя бы к одному району в этом МРУ
      const hasAccess = req.auditorAccess.allowedDistrictIds.some(id =>
        districtIds.includes(id)
      );

      if (hasAccess) {
        return next();
      }
    }

    return res.status(403).json({
      success: false,
      message: 'У вас нет доступа к этому МРУ'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Проверяет доступ аудитора к конкретному району
 */
exports.checkDistrictAccess = async (req, res, next) => {
  try {
    const user = req.user;
    const districtId = req.params.id || req.params.districtId;

    // Если не аудитор - пропускаем
    if (user.role !== 'auditor') {
      return next();
    }

    if (!req.auditorAccess) {
      return res.status(403).json({
        success: false,
        message: 'Права доступа не определены'
      });
    }

    // Полный доступ
    if (req.auditorAccess.type === 'all') {
      return next();
    }

    // Проверка доступа к району напрямую
    if (req.auditorAccess.type === 'district') {
      if (req.auditorAccess.allowedDistrictIds.includes(districtId)) {
        return next();
      }
    }

    // Проверка доступа через МРУ
    if (req.auditorAccess.type === 'mru' && districtId) {
      // Получаем район и его МРУ
      const district = await District.findByPk(districtId, {
        attributes: ['id', 'mruId']
      });

      if (district && req.auditorAccess.allowedMruIds.includes(district.mruId)) {
        return next();
      }
    }

    return res.status(403).json({
      success: false,
      message: 'У вас нет доступа к этому району'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Фильтрует данные для аудиторов в зависимости от их прав
 * Используется в контроллерах для ограничения выдачи данных
 */
exports.getAuditorFilter = (auditorAccess) => {
  if (!auditorAccess) {
    return null;
  }

  if (auditorAccess.type === 'all') {
    return {}; // Нет фильтров - возвращаем всё
  }

  const filter = {};

  if (auditorAccess.type === 'mru' && auditorAccess.allowedMruIds.length > 0) {
    filter.mruId = auditorAccess.allowedMruIds;
  }

  if (auditorAccess.type === 'district' && auditorAccess.allowedDistrictIds.length > 0) {
    filter.districtId = auditorAccess.allowedDistrictIds;
  }

  return filter;
};

module.exports = exports;

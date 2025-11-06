const { AuditorPermission, User, MRU, District, Client, WorkSession } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

// @desc    Создать/обновить права аудитора
// @route   POST /api/auditors/:userId/permissions
// @access  Private (central_admin)
exports.setAuditorPermissions = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { accessType, allowedMruIds, allowedDistrictIds, organization, notes } = req.body;

    // Проверяем существование пользователя
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    if (user.role !== 'auditor') {
      return res.status(400).json({
        success: false,
        message: 'Пользователь не является аудитором'
      });
    }

    // Проверяем существующие права
    let permissions = await AuditorPermission.findOne({
      where: { auditorId: userId }
    });

    if (permissions) {
      // Обновляем существующие права
      await permissions.update({
        accessType: accessType || permissions.accessType,
        allowedMruIds: allowedMruIds || permissions.allowedMruIds,
        allowedDistrictIds: allowedDistrictIds || permissions.allowedDistrictIds,
        organization: organization || permissions.organization,
        notes: notes !== undefined ? notes : permissions.notes,
        isActive: true
      });
    } else {
      // Создаем новые права
      permissions = await AuditorPermission.create({
        auditorId: userId,
        accessType: accessType || 'all',
        allowedMruIds: allowedMruIds || [],
        allowedDistrictIds: allowedDistrictIds || [],
        organization,
        notes
      });
    }

    // Получаем обновленные права с информацией о МРУ и районах
    const updatedPermissions = await AuditorPermission.findByPk(permissions.id);

    res.json({
      success: true,
      message: 'Права аудитора успешно настроены',
      data: updatedPermissions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Получить права аудитора
// @route   GET /api/auditors/:userId/permissions
// @access  Private
exports.getAuditorPermissions = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const permissions = await AuditorPermission.findOne({
      where: { auditorId: userId },
      include: [
        {
          model: User,
          as: 'auditor',
          attributes: ['id', 'fullName', 'email', 'organization']
        }
      ]
    });

    if (!permissions) {
      return res.status(404).json({
        success: false,
        message: 'Права аудитора не найдены'
      });
    }

    // Получаем названия МРУ и районов
    let mrus = [];
    let districts = [];

    if (permissions.allowedMruIds && permissions.allowedMruIds.length > 0) {
      mrus = await MRU.findAll({
        where: { id: permissions.allowedMruIds },
        attributes: ['id', 'name', 'region']
      });
    }

    if (permissions.allowedDistrictIds && permissions.allowedDistrictIds.length > 0) {
      districts = await District.findAll({
        where: { id: permissions.allowedDistrictIds },
        attributes: ['id', 'name', 'city'],
        include: [
          {
            model: MRU,
            as: 'mru',
            attributes: ['id', 'name']
          }
        ]
      });
    }

    res.json({
      success: true,
      data: {
        permissions,
        allowedMRUs: mrus,
        allowedDistricts: districts
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Получить общую статистику (для аудиторов и администраторов)
// @route   GET /api/auditors/statistics/overview
// @access  Private (auditor, central_admin, mru_manager, district_manager)
exports.getOverviewStatistics = async (req, res, next) => {
  try {
    const user = req.user;
    const auditorAccess = req.auditorAccess;

    let whereClause = {};

    // Фильтрация для аудиторов
    if (user.role === 'auditor' && auditorAccess) {
      if (auditorAccess.type === 'mru' && auditorAccess.allowedMruIds.length > 0) {
        // Получаем районы в разрешенных МРУ
        const districts = await District.findAll({
          where: { mruId: auditorAccess.allowedMruIds },
          attributes: ['id']
        });
        const districtIds = districts.map(d => d.id);

        // Получаем офицеров в этих районах
        const officers = await User.findAll({
          where: { districtId: districtIds, role: 'officer' },
          attributes: ['id']
        });
        const officerIds = officers.map(o => o.id);

        whereClause.officerId = officerIds;
      } else if (auditorAccess.type === 'district' && auditorAccess.allowedDistrictIds.length > 0) {
        // Получаем офицеров в разрешенных районах
        const officers = await User.findAll({
          where: { districtId: auditorAccess.allowedDistrictIds, role: 'officer' },
          attributes: ['id']
        });
        const officerIds = officers.map(o => o.id);

        whereClause.officerId = officerIds;
      }
    }

    // Фильтрация для руководителей МРУ
    if (user.role === 'mru_manager') {
      const districts = await District.findAll({
        where: { mruId: user.mruId },
        attributes: ['id']
      });
      const districtIds = districts.map(d => d.id);

      const officers = await User.findAll({
        where: { districtId: districtIds, role: 'officer' },
        attributes: ['id']
      });
      const officerIds = officers.map(o => o.id);

      whereClause.officerId = officerIds;
    }

    // Фильтрация для руководителей районов
    if (user.role === 'district_manager') {
      const officers = await User.findAll({
        where: { districtId: user.districtId, role: 'officer' },
        attributes: ['id']
      });
      const officerIds = officers.map(o => o.id);

      whereClause.officerId = officerIds;
    }

    // Общая статистика
    const [
      totalClients,
      activeClients,
      completedClients,
      totalOfficers,
      totalMRUs,
      totalDistricts,
      totalWorkSessions,
      totalHoursWorked
    ] = await Promise.all([
      Client.count({ where: whereClause }),
      Client.count({ where: { ...whereClause, status: 'active' } }),
      Client.count({ where: { ...whereClause, status: 'completed' } }),
      // Офицеры (с учетом фильтра)
      whereClause.officerId
        ? User.count({ where: { id: whereClause.officerId, role: 'officer' } })
        : User.count({ where: { role: 'officer', isActive: true } }),
      // МРУ и районы (только для центрального аппарата)
      user.role === 'central_admin' || user.role === 'superadmin'
        ? MRU.count({ where: { isActive: true } })
        : user.role === 'mru_manager'
        ? 1
        : 0,
      user.role === 'central_admin' || user.role === 'superadmin'
        ? District.count({ where: { isActive: true } })
        : user.role === 'mru_manager'
        ? District.count({ where: { mruId: user.mruId, isActive: true } })
        : user.role === 'district_manager'
        ? 1
        : 0,
      // Рабочие сессии
      whereClause.officerId
        ? WorkSession.count({
            include: [
              {
                model: Client,
                as: 'client',
                where: { officerId: whereClause.officerId },
                required: true
              }
            ]
          })
        : WorkSession.count(),
      // Отработанные часы
      whereClause.officerId
        ? Client.sum('completedHours', { where: whereClause })
        : Client.sum('completedHours')
    ]);

    res.json({
      success: true,
      data: {
        clients: {
          total: totalClients || 0,
          active: activeClients || 0,
          completed: completedClients || 0
        },
        officers: totalOfficers || 0,
        mrus: totalMRUs || 0,
        districts: totalDistricts || 0,
        workSessions: totalWorkSessions || 0,
        hoursWorked: Math.round(totalHoursWorked || 0)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Получить статистику по МРУ (для аудиторов и администраторов)
// @route   GET /api/auditors/statistics/by-mru
// @access  Private (auditor, central_admin, mru_manager)
exports.getStatisticsByMRU = async (req, res, next) => {
  try {
    const user = req.user;
    const auditorAccess = req.auditorAccess;

    let mruFilter = {};

    // Фильтрация для аудиторов
    if (user.role === 'auditor' && auditorAccess) {
      if (auditorAccess.type === 'all') {
        // Нет фильтра
      } else if (auditorAccess.type === 'mru' && auditorAccess.allowedMruIds.length > 0) {
        mruFilter.id = auditorAccess.allowedMruIds;
      } else if (auditorAccess.type === 'district' && auditorAccess.allowedDistrictIds.length > 0) {
        // Получаем МРУ через районы
        const districts = await District.findAll({
          where: { id: auditorAccess.allowedDistrictIds },
          attributes: ['mruId']
        });
        const mruIds = [...new Set(districts.map(d => d.mruId))];
        mruFilter.id = mruIds;
      }
    }

    // Фильтрация для руководителей МРУ
    if (user.role === 'mru_manager') {
      mruFilter.id = user.mruId;
    }

    const mrus = await MRU.findAll({
      where: { ...mruFilter, isActive: true },
      attributes: ['id', 'name', 'region'],
      include: [
        {
          model: District,
          as: 'districts',
          where: { isActive: true },
          required: false,
          attributes: ['id']
        }
      ]
    });

    // Для каждого МРУ получаем статистику
    const statistics = await Promise.all(
      mrus.map(async (mru) => {
        const districtIds = mru.districts.map(d => d.id);

        const officers = await User.findAll({
          where: { districtId: districtIds, role: 'officer', isActive: true },
          attributes: ['id']
        });
        const officerIds = officers.map(o => o.id);

        const [clientsCount, activeClientsCount, totalHours] = await Promise.all([
          Client.count({ where: { officerId: officerIds } }),
          Client.count({ where: { officerId: officerIds, status: 'active' } }),
          Client.sum('completedHours', { where: { officerId: officerIds } })
        ]);

        return {
          mru: {
            id: mru.id,
            name: mru.name,
            region: mru.region
          },
          districts: mru.districts.length,
          officers: officers.length,
          clients: clientsCount || 0,
          activeClients: activeClientsCount || 0,
          hoursWorked: Math.round(totalHours || 0)
        };
      })
    );

    res.json({
      success: true,
      count: statistics.length,
      data: statistics
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Получить статистику по районам
// @route   GET /api/auditors/statistics/by-district
// @access  Private (auditor, central_admin, mru_manager, district_manager)
exports.getStatisticsByDistrict = async (req, res, next) => {
  try {
    const user = req.user;
    const auditorAccess = req.auditorAccess;
    const { mruId } = req.query;

    let districtFilter = {};

    // Фильтрация по МРУ из query
    if (mruId) {
      districtFilter.mruId = mruId;
    }

    // Фильтрация для аудиторов
    if (user.role === 'auditor' && auditorAccess) {
      if (auditorAccess.type === 'all') {
        // Нет фильтра
      } else if (auditorAccess.type === 'mru' && auditorAccess.allowedMruIds.length > 0) {
        if (!mruId) {
          districtFilter.mruId = auditorAccess.allowedMruIds;
        }
      } else if (auditorAccess.type === 'district' && auditorAccess.allowedDistrictIds.length > 0) {
        districtFilter.id = auditorAccess.allowedDistrictIds;
      }
    }

    // Фильтрация для руководителей МРУ
    if (user.role === 'mru_manager') {
      districtFilter.mruId = user.mruId;
    }

    // Фильтрация для руководителей районов
    if (user.role === 'district_manager') {
      districtFilter.id = user.districtId;
    }

    const districts = await District.findAll({
      where: { ...districtFilter, isActive: true },
      attributes: ['id', 'name', 'city'],
      include: [
        {
          model: MRU,
          as: 'mru',
          attributes: ['id', 'name', 'region']
        }
      ]
    });

    // Для каждого района получаем статистику
    const statistics = await Promise.all(
      districts.map(async (district) => {
        const officers = await User.findAll({
          where: { districtId: district.id, role: 'officer', isActive: true },
          attributes: ['id']
        });
        const officerIds = officers.map(o => o.id);

        const [clientsCount, activeClientsCount, totalHours] = await Promise.all([
          Client.count({ where: { officerId: officerIds } }),
          Client.count({ where: { officerId: officerIds, status: 'active' } }),
          Client.sum('completedHours', { where: { officerId: officerIds } })
        ]);

        return {
          district: {
            id: district.id,
            name: district.name,
            city: district.city
          },
          mru: district.mru,
          officers: officers.length,
          clients: clientsCount || 0,
          activeClients: activeClientsCount || 0,
          hoursWorked: Math.round(totalHours || 0)
        };
      })
    );

    res.json({
      success: true,
      count: statistics.length,
      data: statistics
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;

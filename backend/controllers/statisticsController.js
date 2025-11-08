const {
  Client,
  User,
  WorkSession,
  GeofenceViolation,
  MRU,
  District,
  Photo
} = require('../models');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

// @desc    Получить общую статистику для главного дашборда
// @route   GET /api/statistics/dashboard
// @access  Private
exports.getDashboardStats = async (req, res, next) => {
  try {
    const { mruId, districtId, dateFrom, dateTo } = req.query;

    // Условия фильтрации по дате
    const dateFilter = {};
    if (dateFrom || dateTo) {
      if (dateFrom) dateFilter[Op.gte] = new Date(dateFrom);
      if (dateTo) dateFilter[Op.lte] = new Date(dateTo);
    }

    // Фильтр по МРУ или району (для ограничения доступа)
    const userFilter = {};
    if (mruId) {
      userFilter.mruId = mruId;
    }
    if (districtId) {
      userFilter.districtId = districtId;
    }

    // ОСНОВНЫЕ ПОКАЗАТЕЛИ

    // Всего клиентов
    const totalClients = await Client.count({
      where: mruId || districtId ? {
        '$officer.mruId$': mruId || undefined,
        '$officer.districtId$': districtId || undefined
      } : {},
      include: mruId || districtId ? [
        {
          model: User,
          as: 'officer',
          attributes: [],
          where: userFilter
        }
      ] : []
    });

    // Активные клиенты (не завершили программу)
    const activeClients = await Client.count({
      where: {
        status: 'active',
        ...(mruId || districtId ? {
          '$officer.mruId$': mruId || undefined,
          '$officer.districtId$': districtId || undefined
        } : {})
      },
      include: mruId || districtId ? [
        {
          model: User,
          as: 'officer',
          attributes: [],
          where: userFilter
        }
      ] : []
    });

    // Завершили программу
    const completedClients = await Client.count({
      where: {
        status: 'completed',
        ...(mruId || districtId ? {
          '$officer.mruId$': mruId || undefined,
          '$officer.districtId$': districtId || undefined
        } : {})
      },
      include: mruId || districtId ? [
        {
          model: User,
          as: 'officer',
          attributes: [],
          where: userFilter
        }
      ] : []
    });

    // Всего офицеров
    const totalOfficers = await User.count({
      where: {
        role: 'officer',
        isActive: true,
        ...userFilter
      }
    });

    // ПУЛЬС СИСТЕМЫ - активные сессии прямо сейчас
    const now = new Date();
    const activeSessions = await WorkSession.count({
      where: {
        status: 'in_progress',
        startTime: { [Op.lte]: now },
        [Op.or]: [
          { endTime: { [Op.gte]: now } },
          { endTime: null }
        ],
        ...(dateFilter.createdAt ? { createdAt: dateFilter.createdAt } : {})
      }
    });

    // Всего рабочих сессий за период
    const totalSessions = await WorkSession.count({
      where: dateFilter.createdAt ? { createdAt: dateFilter.createdAt } : {}
    });

    // Одобренные сессии (верифицированные)
    const approvedSessions = await WorkSession.count({
      where: {
        status: 'verified',
        ...(dateFilter.createdAt ? { createdAt: dateFilter.createdAt } : {})
      }
    });

    // Отклоненные сессии
    const rejectedSessions = await WorkSession.count({
      where: {
        status: 'rejected',
        ...(dateFilter.createdAt ? { createdAt: dateFilter.createdAt } : {})
      }
    });

    // Ожидают проверки (завершенные, но не верифицированные)
    const pendingSessions = await WorkSession.count({
      where: {
        status: 'completed',
        ...(dateFilter.createdAt ? { createdAt: dateFilter.createdAt } : {})
      }
    });

    // НАРУШЕНИЯ
    const totalViolations = await GeofenceViolation.count({
      where: dateFilter.createdAt ? { createdAt: dateFilter.createdAt } : {}
    });

    // Фото требуют верификации
    const photosNeedVerification = await Photo.count({
      where: {
        verificationStatus: 'pending'
      }
    });

    // ЧАСЫ РАБОТЫ
    const workHoursStats = await Client.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('assignedHours')), 'totalAssigned'],
        [sequelize.fn('SUM', sequelize.col('completedHours')), 'totalCompleted']
      ],
      where: mruId || districtId ? {
        '$officer.mruId$': mruId || undefined,
        '$officer.districtId$': districtId || undefined
      } : {},
      include: mruId || districtId ? [
        {
          model: User,
          as: 'officer',
          attributes: [],
          where: userFilter
        }
      ] : [],
      raw: true
    });

    const totalAssignedHours = parseInt(workHoursStats[0]?.totalAssigned || 0);
    const totalCompletedHours = parseInt(workHoursStats[0]?.totalCompleted || 0);
    const completionPercentage = totalAssignedHours > 0
      ? Math.round((totalCompletedHours / totalAssignedHours) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        // Основные показатели
        clients: {
          total: totalClients,
          active: activeClients,
          completed: completedClients
        },
        officers: {
          total: totalOfficers,
          averageClientsPerOfficer: totalOfficers > 0
            ? Math.round(activeClients / totalOfficers)
            : 0
        },
        // Пульс системы
        pulse: {
          activeSessionsNow: activeSessions,
          message: activeSessions > 0
            ? `${activeSessions} ${activeSessions === 1 ? 'клиент работает' : 'клиентов работают'} прямо сейчас`
            : 'Нет активных сессий'
        },
        // Сессии
        sessions: {
          total: totalSessions,
          approved: approvedSessions,
          rejected: rejectedSessions,
          pending: pendingSessions,
          approvalRate: totalSessions > 0
            ? Math.round((approvedSessions / totalSessions) * 100)
            : 0
        },
        // Нарушения
        violations: {
          total: totalViolations
        },
        // Фото
        photos: {
          needVerification: photosNeedVerification
        },
        // Часы работы
        workHours: {
          assigned: totalAssignedHours,
          completed: totalCompletedHours,
          remaining: totalAssignedHours - totalCompletedHours,
          completionPercentage
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Получить статистику по МРУ
// @route   GET /api/statistics/mru
// @access  Private
exports.getMRUStats = async (req, res, next) => {
  try {
    const mrus = await MRU.findAll({
      attributes: [
        'id',
        'name',
        'code'
      ],
      include: [
        {
          model: District,
          as: 'districts',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'users',
          where: { role: 'officer', isActive: true },
          attributes: ['id'],
          required: false
        }
      ]
    });

    const mruStats = await Promise.all(mrus.map(async (mru) => {
      // Количество районов
      const districtsCount = mru.districts.length;

      // Количество офицеров
      const officersCount = mru.users.length;

      // Количество клиентов
      const clientsCount = await Client.count({
        include: [
          {
            model: User,
            as: 'officer',
            where: { mruId: mru.id },
            attributes: []
          }
        ]
      });

      // Активные клиенты
      const activeClientsCount = await Client.count({
        where: { status: 'active' },
        include: [
          {
            model: User,
            as: 'officer',
            where: { mruId: mru.id },
            attributes: []
          }
        ]
      });

      // Завершенные клиенты
      const completedClientsCount = await Client.count({
        where: { status: 'completed' },
        include: [
          {
            model: User,
            as: 'officer',
            where: { mruId: mru.id },
            attributes: []
          }
        ]
      });

      // Нарушения за последние 30 дней
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const violationsCount = await GeofenceViolation.count({
        where: {
          createdAt: { [Op.gte]: thirtyDaysAgo }
        },
        include: [
          {
            model: Client,
            as: 'client',
            include: [
              {
                model: User,
                as: 'officer',
                where: { mruId: mru.id },
                attributes: []
              }
            ]
          }
        ]
      });

      return {
        id: mru.id,
        name: mru.name,
        code: mru.code,
        stats: {
          districts: districtsCount,
          officers: officersCount,
          clients: {
            total: clientsCount,
            active: activeClientsCount,
            completed: completedClientsCount
          },
          violations: violationsCount,
          efficiency: clientsCount > 0
            ? Math.round((completedClientsCount / clientsCount) * 100)
            : 0
        }
      };
    }));

    res.json({
      success: true,
      data: mruStats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Получить статистику по районам (для карты)
// @route   GET /api/statistics/districts
// @access  Private
exports.getDistrictStats = async (req, res, next) => {
  try {
    const { mruId } = req.query;

    const where = {};
    if (mruId) {
      where.mruId = mruId;
    }

    const districts = await District.findAll({
      where,
      include: [
        {
          model: MRU,
          as: 'mru',
          attributes: ['id', 'name', 'code']
        }
      ]
    });

    const districtStats = await Promise.all(districts.map(async (district) => {
      // Офицеры
      const officersCount = await User.count({
        where: {
          districtId: district.id,
          role: 'officer',
          isActive: true
        }
      });

      // Клиенты
      const clientsCount = await Client.count({
        include: [
          {
            model: User,
            as: 'officer',
            where: { districtId: district.id },
            attributes: []
          }
        ]
      });

      // Активные сессии прямо сейчас
      const now = new Date();
      const activeSessionsNow = await WorkSession.count({
        where: {
          status: 'in_progress',
          startTime: { [Op.lte]: now },
          [Op.or]: [
            { endTime: { [Op.gte]: now } },
            { endTime: null }
          ]
        },
        include: [
          {
            model: Client,
            as: 'client',
            include: [
              {
                model: User,
                as: 'officer',
                where: { districtId: district.id },
                attributes: []
              }
            ]
          }
        ]
      });

      return {
        id: district.id,
        name: district.name,
        code: district.code,
        mru: district.mru,
        coordinates: district.coordinates,
        stats: {
          officers: officersCount,
          clients: clientsCount,
          activeSessionsNow
        }
      };
    }));

    res.json({
      success: true,
      data: districtStats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Получить drill-down данные (МРУ → Район → Офицер → Клиенты)
// @route   GET /api/statistics/drilldown
// @access  Private
exports.getDrilldownData = async (req, res, next) => {
  try {
    const { level, mruId, districtId, officerId } = req.query;

    let data;

    switch (level) {
      case 'mru':
        // Показываем все МРУ
        data = await getMRULevel();
        break;

      case 'district':
        // Показываем районы выбранного МРУ
        if (!mruId) {
          return res.status(400).json({
            success: false,
            message: 'mruId required for district level'
          });
        }
        data = await getDistrictLevel(mruId);
        break;

      case 'officer':
        // Показываем офицеров выбранного района
        if (!districtId) {
          return res.status(400).json({
            success: false,
            message: 'districtId required for officer level'
          });
        }
        data = await getOfficerLevel(districtId);
        break;

      case 'client':
        // Показываем клиентов выбранного офицера
        if (!officerId) {
          return res.status(400).json({
            success: false,
            message: 'officerId required for client level'
          });
        }
        data = await getClientLevel(officerId);
        break;

      default:
        // По умолчанию показываем уровень МРУ
        data = await getMRULevel();
    }

    res.json({
      success: true,
      level: level || 'mru',
      data
    });
  } catch (error) {
    next(error);
  }
};

// Helper функции для drill-down

async function getMRULevel() {
  const mrus = await MRU.findAll({
    attributes: ['id', 'name', 'code']
  });

  return await Promise.all(mrus.map(async (mru) => {
    const districtsCount = await District.count({ where: { mruId: mru.id } });
    const officersCount = await User.count({
      where: { mruId: mru.id, role: 'officer', isActive: true }
    });
    const clientsCount = await Client.count({
      include: [{
        model: User,
        as: 'officer',
        where: { mruId: mru.id },
        attributes: []
      }]
    });

    return {
      id: mru.id,
      name: mru.name,
      code: mru.code,
      stats: {
        districts: districtsCount,
        officers: officersCount,
        clients: clientsCount
      }
    };
  }));
}

async function getDistrictLevel(mruId) {
  const districts = await District.findAll({
    where: { mruId },
    attributes: ['id', 'name', 'code']
  });

  return await Promise.all(districts.map(async (district) => {
    const officersCount = await User.count({
      where: { districtId: district.id, role: 'officer', isActive: true }
    });
    const clientsCount = await Client.count({
      include: [{
        model: User,
        as: 'officer',
        where: { districtId: district.id },
        attributes: []
      }]
    });

    return {
      id: district.id,
      name: district.name,
      code: district.code,
      stats: {
        officers: officersCount,
        clients: clientsCount
      }
    };
  }));
}

async function getOfficerLevel(districtId) {
  const officers = await User.findAll({
    where: {
      districtId,
      role: 'officer',
      isActive: true
    },
    attributes: ['id', 'fullName', 'email', 'phone']
  });

  return await Promise.all(officers.map(async (officer) => {
    const clientsCount = await Client.count({
      where: { officerId: officer.id }
    });
    const activeClientsCount = await Client.count({
      where: { officerId: officer.id, status: 'active' }
    });
    const completedClientsCount = await Client.count({
      where: { officerId: officer.id, status: 'completed' }
    });

    return {
      id: officer.id,
      fullName: officer.fullName,
      email: officer.email,
      phone: officer.phone,
      stats: {
        clients: clientsCount,
        active: activeClientsCount,
        completed: completedClientsCount
      }
    };
  }));
}

async function getClientLevel(officerId) {
  const clients = await Client.findAll({
    where: { officerId },
    attributes: [
      'id',
      'fullName',
      'status',
      'assignedHours',
      'completedHours',
      'createdAt'
    ]
  });

  return clients.map(client => ({
    id: client.id,
    fullName: client.fullName,
    status: client.status,
    assignedHours: client.assignedHours,
    completedHours: client.completedHours,
    remainingHours: client.assignedHours - client.completedHours,
    completionPercentage: Math.round((client.completedHours / client.assignedHours) * 100),
    createdAt: client.createdAt
  }));
}

module.exports = exports;

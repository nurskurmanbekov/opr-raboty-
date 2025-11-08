const { AuditLog, User } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

// @desc    Получить список всех audit logs с фильтрацией и пагинацией
// @route   GET /api/audit-logs
// @access  Private (superadmin, central_admin, auditor)
exports.getAuditLogs = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      userId,
      action,
      entityType,
      entityId,
      status,
      dateFrom,
      dateTo,
      search
    } = req.query;

    // Построение условий фильтрации
    const where = {};

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (entityId) {
      where.entityId = entityId;
    }

    if (status) {
      where.status = status;
    }

    // Фильтр по дате
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt[Op.gte] = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt[Op.lte] = new Date(dateTo);
      }
    }

    // Поиск по имени пользователя или описанию
    if (search) {
      where[Op.or] = [
        { userName: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { entityName: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows: logs } = await AuditLog.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email', 'role'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      count: logs.length,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Получить audit log по ID
// @route   GET /api/audit-logs/:id
// @access  Private (superadmin, central_admin, auditor)
exports.getAuditLogById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const log = await AuditLog.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email', 'role', 'phone']
        }
      ]
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Audit log не найден'
      });
    }

    res.json({
      success: true,
      data: log
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Получить историю действий конкретного пользователя
// @route   GET /api/audit-logs/user/:userId
// @access  Private (superadmin, central_admin, auditor)
exports.getUserAuditLogs = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50, action, entityType } = req.query;

    const where = { userId };

    if (action) {
      where.action = action;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    const offset = (page - 1) * limit;

    const { count, rows: logs } = await AuditLog.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      count: logs.length,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Получить историю действий с конкретной сущностью
// @route   GET /api/audit-logs/entity/:entityType/:entityId
// @access  Private
exports.getEntityAuditLogs = async (req, res, next) => {
  try {
    const { entityType, entityId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const offset = (page - 1) * limit;

    const { count, rows: logs } = await AuditLog.findAndCountAll({
      where: {
        entityType,
        entityId
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'role'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      count: logs.length,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Получить статистику по audit logs
// @route   GET /api/audit-logs/stats
// @access  Private (superadmin, central_admin, auditor)
exports.getAuditStats = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const where = {};
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt[Op.gte] = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt[Op.lte] = new Date(dateTo);
      }
    }

    // Общее количество логов
    const totalLogs = await AuditLog.count({ where });

    // По действиям
    const byAction = await AuditLog.findAll({
      where,
      attributes: [
        'action',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['action']
    });

    // По типам сущностей
    const byEntityType = await AuditLog.findAll({
      where,
      attributes: [
        'entityType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['entityType']
    });

    // По пользователям (топ-10 активных)
    const byUser = await AuditLog.findAll({
      where,
      attributes: [
        'userId',
        'userName',
        'userRole',
        [sequelize.fn('COUNT', sequelize.col('AuditLog.id')), 'count']
      ],
      include: [
        {
          model: User,
          as: 'user',
          attributes: [],
          required: false
        }
      ],
      group: ['userId', 'userName', 'userRole'],
      order: [[sequelize.fn('COUNT', sequelize.col('AuditLog.id')), 'DESC']],
      limit: 10
    });

    // По статусу
    const byStatus = await AuditLog.findAll({
      where,
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    res.json({
      success: true,
      data: {
        totalLogs,
        byAction,
        byEntityType,
        byUser,
        byStatus
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;

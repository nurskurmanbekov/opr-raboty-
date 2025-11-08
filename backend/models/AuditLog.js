const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },

  // Кто выполнил действие
  userId: {
    type: DataTypes.UUID,
    allowNull: true, // null для системных действий
    references: {
      model: 'Users',
      key: 'id'
    }
  },

  userName: {
    type: DataTypes.STRING,
    allowNull: true
  },

  userRole: {
    type: DataTypes.STRING,
    allowNull: true
  },

  // Что было сделано
  action: {
    type: DataTypes.ENUM(
      'create',           // Создание
      'update',           // Обновление
      'delete',           // Удаление
      'login',            // Вход в систему
      'logout',           // Выход из системы
      'approve',          // Одобрение
      'reject',           // Отклонение
      'assign',           // Назначение
      'reassign',         // Переназначение
      'activate',         // Активация
      'deactivate',       // Деактивация
      'export',           // Экспорт данных
      'verify',           // Верификация
      'send_notification' // Отправка уведомления
    ),
    allowNull: false
  },

  // С какой сущностью
  entityType: {
    type: DataTypes.ENUM(
      'client',
      'user',
      'work_session',
      'geofence',
      'photo',
      'notification',
      'district',
      'mru',
      'report',
      'system'
    ),
    allowNull: true
  },

  entityId: {
    type: DataTypes.UUID,
    allowNull: true
  },

  entityName: {
    type: DataTypes.STRING,
    allowNull: true
  },

  // Детали изменений
  changes: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },

  // Дополнительная информация
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  // Технические данные
  ipAddress: {
    type: DataTypes.STRING(45), // IPv6 поддержка
    allowNull: true
  },

  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  // Статус
  status: {
    type: DataTypes.ENUM('success', 'failed', 'pending'),
    defaultValue: 'success'
  },

  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'audit_logs',
  timestamps: true,
  updatedAt: false, // Audit logs не обновляются
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['action']
    },
    {
      fields: ['entityType']
    },
    {
      fields: ['entityId']
    },
    {
      fields: ['createdAt']
    },
    {
      fields: ['userId', 'action']
    },
    {
      fields: ['entityType', 'entityId']
    }
  ]
});

// Связи
AuditLog.associate = (models) => {
  AuditLog.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user',
    onDelete: 'SET NULL'
  });
};

module.exports = AuditLog;

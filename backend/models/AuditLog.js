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
    },
    comment: 'ID пользователя, выполнившего действие'
  },

  userName: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Имя пользователя на момент действия'
  },

  userRole: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Роль пользователя на момент действия'
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
    allowNull: false,
    comment: 'Тип действия'
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
    allowNull: true,
    comment: 'Тип сущности'
  },

  entityId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'ID сущности'
  },

  entityName: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Название/имя сущности для отображения'
  },

  // Детали изменений
  changes: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'JSON с деталями изменений {old: {...}, new: {...}}',
    defaultValue: {}
  },

  // Дополнительная информация
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Описание действия'
  },

  // Технические данные
  ipAddress: {
    type: DataTypes.STRING(45), // IPv6 поддержка
    allowNull: true,
    comment: 'IP адрес пользователя'
  },

  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'User Agent (браузер/устройство)'
  },

  // Статус
  status: {
    type: DataTypes.ENUM('success', 'failed', 'pending'),
    defaultValue: 'success',
    comment: 'Статус выполнения действия'
  },

  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Сообщение об ошибке (если failed)'
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

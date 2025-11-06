const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PendingApproval = sequelize.define('PendingApproval', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  type: {
    type: DataTypes.ENUM('officer', 'client'),
    allowNull: false,
    comment: 'Тип заявки: регистрация офицера или создание клиента'
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'pending',
    comment: 'Статус заявки'
  },
  requesterId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'ID пользователя, который создал заявку'
  },
  targetId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'ID созданного пользователя или клиента (после одобрения)'
  },
  data: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Данные заявки (ФИО, телефон, и т.д.)'
  },
  reviewerId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'ID администратора, который рассмотрел заявку'
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Причина отклонения заявки'
  },
  assignedMruId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'МРУ, назначенное офицеру (только для officer)'
  },
  assignedDistrictId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Район, назначенный офицеру (только для officer)'
  }
}, {
  timestamps: true,
  tableName: 'PendingApprovals'
});

module.exports = PendingApproval;

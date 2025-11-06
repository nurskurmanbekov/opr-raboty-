const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AuditorPermission = sequelize.define('AuditorPermission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  auditorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: 'ID аудитора'
  },
  accessType: {
    type: DataTypes.ENUM('all', 'mru', 'district'),
    allowNull: false,
    defaultValue: 'all',
    comment: 'Тип доступа: все данные, конкретные МРУ или конкретные районы'
  },
  allowedMruIds: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Список ID МРУ, к которым есть доступ'
  },
  allowedDistrictIds: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Список ID районов, к которым есть доступ'
  },
  organization: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Организация аудитора, например: Администрация Президента'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Примечания о правах доступа'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true,
  tableName: 'AuditorPermissions',
  indexes: [
    {
      fields: ['auditorId']
    }
  ]
});

module.exports = AuditorPermission;

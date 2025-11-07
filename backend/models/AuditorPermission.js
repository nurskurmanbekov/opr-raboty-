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
    }
  },
  accessType: {
    type: DataTypes.ENUM({
      values: ['all', 'mru', 'district']
    }),
    allowNull: false,
    defaultValue: 'all'
  },
  allowedMruIds: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  allowedDistrictIds: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  organization: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
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

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Geofence = sequelize.define('Geofence', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  latitude: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  longitude: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  radius: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 200 // meters
  },
  workLocation: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Старое поле district (для обратной совместимости)
  district: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Устаревшее поле, используйте districtId'
  },
  // Новое поле districtId (UUID ссылка на Districts)
  districtId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Districts',
      key: 'id'
    },
    comment: 'ID района из справочника'
  },
  // Новое поле mruId (UUID ссылка на MRUs)
  mruId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'MRUs',
      key: 'id'
    },
    comment: 'ID МРУ из справочника (опционально)'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  timestamps: true
});

module.exports = Geofence;

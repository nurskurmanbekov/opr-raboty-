const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LocationHistory = sequelize.define('LocationHistory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  workSessionId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'WorkSessions',
      key: 'id'
    }
  },
  clientId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Clients',
      key: 'id'
    }
  },
  latitude: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  longitude: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  accuracy: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  speed: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  altitude: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  heading: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  updatedAt: false
});

module.exports = LocationHistory;

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const GeofenceViolation = sequelize.define('GeofenceViolation', {
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
  geofenceId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Geofences',
      key: 'id'
    }
  },
  violationType: {
    type: DataTypes.ENUM('exit', 'never_entered'),
    allowNull: false
  },
  violationTime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  latitude: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  longitude: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  distance: {
    type: DataTypes.FLOAT, // Distance from geofence in meters
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = GeofenceViolation;

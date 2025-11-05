const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Photo = sequelize.define('Photo', {
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
  photoType: {
    type: DataTypes.ENUM('start', 'end', 'process'),
    allowNull: false
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: false
  },
  latitude: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  longitude: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true
});

module.exports = Photo;
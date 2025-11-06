const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SyncQueue = sequelize.define('SyncQueue', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  deviceId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  operation: {
    type: DataTypes.ENUM(
      'create_work_session',
      'update_work_session',
      'upload_photo',
      'update_location',
      'create_client',
      'update_client',
      'batch_operation'
    ),
    allowNull: false
  },
  resourceType: {
    type: DataTypes.STRING, // WorkSession, Photo, Client, LocationHistory, etc.
    allowNull: false
  },
  resourceId: {
    type: DataTypes.UUID, // Temporary ID from mobile app
    allowNull: true
  },
  data: {
    type: DataTypes.JSON, // The actual data to sync
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'conflict'),
    defaultValue: 'pending'
  },
  priority: {
    type: DataTypes.INTEGER, // Higher number = higher priority
    defaultValue: 5
  },
  retryCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  maxRetries: {
    type: DataTypes.INTEGER,
    defaultValue: 3
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  conflictData: {
    type: DataTypes.JSON, // Data that caused conflict
    allowNull: true
  },
  serverResourceId: {
    type: DataTypes.UUID, // Actual ID created on server
    allowNull: true
  },
  processedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  clientTimestamp: {
    type: DataTypes.DATE, // When operation was created on client
    allowNull: false
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['status'] },
    { fields: ['operation'] },
    { fields: ['priority'] },
    { fields: ['clientTimestamp'] },
    { fields: ['deviceId'] }
  ]
});

module.exports = SyncQueue;

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FaceVerificationAttempt = sequelize.define('FaceVerificationAttempt', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'Clients',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    comment: 'Client ID attempting verification'
  },
  workSessionId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'work_session_id',
    references: {
      model: 'WorkSessions',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    comment: 'Related work session ID'
  },
  attemptNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'attempt_number',
    validate: {
      min: 1,
      max: 10
    },
    comment: 'Attempt number (1-10)'
  },
  similarityScore: {
    type: DataTypes.DECIMAL(5, 4),
    allowNull: true,
    field: 'similarity_score',
    validate: {
      min: 0.0000,
      max: 1.0000
    },
    comment: 'Similarity score from CompreFace (0.0000-1.0000)'
  },
  livenessCheck: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    field: 'liveness_check',
    comment: 'Whether liveness detection passed'
  },
  success: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    comment: 'Whether verification was successful'
  },
  photoPath: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'photo_path',
    comment: 'Path to verification photo'
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'error_message',
    comment: 'Error message if verification failed'
  },
  comprefaceResponse: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'compreface_response',
    comment: 'Full CompreFace API response'
  },
  deviceInfo: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'device_info',
    comment: 'Device information (OS, model, etc.)'
  }
}, {
  tableName: 'face_verification_attempts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['work_session_id']
    },
    {
      fields: ['success']
    },
    {
      fields: ['created_at']
    }
  ]
});

module.exports = FaceVerificationAttempt;

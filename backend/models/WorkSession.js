const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const WorkSession = sequelize.define('WorkSession', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  clientId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Clients',
      key: 'id'
    }
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  hoursWorked: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('in_progress', 'completed', 'verified', 'rejected'),
    defaultValue: 'in_progress'
  },
  workLocation: {
    type: DataTypes.STRING,
    allowNull: true
  },
  startLatitude: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  startLongitude: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  endLatitude: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  endLongitude: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  verifiedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  verificationNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  verifiedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Face ID Verification Fields
  faceVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  verificationPhotoUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Selfie photo taken at session start for face verification'
  },
  faceVerificationAttemptId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Reference to FaceVerification record'
  },
  biometricType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Type of biometric used (FaceID, TouchID, etc)'
  },
  deviceId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Device ID used for verification'
  },
  faceVerificationConfidence: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'Confidence score from face verification (0-1)'
  },
  // Work description field (NEW - required when completing work)
  workDescription: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Client description of work performed (minimum 20 characters required)'
  }
}, {
  timestamps: true
});

module.exports = WorkSession;
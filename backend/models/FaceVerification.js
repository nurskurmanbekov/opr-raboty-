const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FaceVerification = sequelize.define('FaceVerification', {
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
  photoId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Photos',
      key: 'id'
    }
  },
  workSessionId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'WorkSessions',
      key: 'id'
    }
  },
  faceImageUrl: {
    type: DataTypes.STRING,
    allowNull: false
  },
  faceEncoding: {
    type: DataTypes.TEXT, // Stores face embedding/encoding as JSON string
    allowNull: true
  },
  verificationType: {
    type: DataTypes.ENUM('registration', 'check_in', 'check_out', 'random_check'),
    allowNull: false
  },
  verificationStatus: {
    type: DataTypes.ENUM('pending', 'verified', 'failed', 'no_face_detected', 'multiple_faces'),
    defaultValue: 'pending'
  },
  matchScore: {
    type: DataTypes.FLOAT, // Similarity score (0-1 or 0-100 depending on service)
    allowNull: true
  },
  matchThreshold: {
    type: DataTypes.FLOAT, // Minimum score required for verification
    defaultValue: 0.6
  },
  isMatch: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  referencePhotoId: {
    type: DataTypes.UUID, // Reference photo for comparison
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON, // Additional face detection metadata
    defaultValue: {}
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  verifiedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['workSessionId'] },
    { fields: ['photoId'] },
    { fields: ['verificationType'] },
    { fields: ['verificationStatus'] },
    { fields: ['createdAt'] }
  ]
});

module.exports = FaceVerification;

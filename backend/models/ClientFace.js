const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ClientFace = sequelize.define('ClientFace', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'Clients',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    comment: 'Client ID (references Clients table)'
  },
  photoPath: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'photo_path',
    comment: 'Path to stored face photo'
  },
  photoType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'photo_type',
    validate: {
      isIn: [['frontal', 'left', 'right', 'additional']]
    },
    comment: 'Type of photo: frontal, left, right, additional'
  },
  comprefaceImageId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'compreface_image_id',
    comment: 'CompreFace image ID for this photo'
  },
  isPrimary: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: 'is_primary',
    comment: 'Whether this is the primary face photo'
  },
  uploadedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
    field: 'uploaded_at',
    comment: 'Timestamp of photo upload'
  }
}, {
  tableName: 'client_faces',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['photo_type']
    },
    {
      fields: ['compreface_image_id']
    },
    {
      fields: ['is_primary']
    }
  ]
});

module.exports = ClientFace;

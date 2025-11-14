const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('superadmin', 'district_head', 'district_officer', 'client'),
    allowNull: false,
    defaultValue: 'district_officer',
    comment: 'User role: superadmin (full access), district_head (can reassign clients), district_officer (creates clients for self), client'
  },
  // District assignment
  district: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'District name for officers and clients'
  },
  districtId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'District ID reference'
  },
  // Face ID fields for CompreFace integration
  compreFaceSubjectId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'compreface_subject_id',
    comment: 'CompreFace subject ID for face recognition'
  },
  faceRegistered: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: 'face_registered',
    comment: 'Whether user has registered their face'
  },
  faceRegisteredAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'face_registered_at',
    comment: 'Timestamp when face was registered'
  },
  // Legacy face encoding field (keeping for backward compatibility)
  faceEncodingId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Legacy face encoding reference'
  },
  profilePhoto: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Profile photo URL'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether user account is active'
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Last login timestamp'
  }
}, {
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Method to compare passwords
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = User;
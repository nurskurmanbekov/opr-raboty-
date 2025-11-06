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
    type: DataTypes.ENUM('superadmin', 'regional_admin', 'district_admin', 'officer', 'supervisor', 'analyst', 'observer', 'central_admin', 'mru_manager', 'district_manager', 'auditor', 'client'),
    allowNull: false,
    defaultValue: 'officer'
  },
  // Старое поле district (для обратной совместимости)
  district: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Новые поля для иерархии МРУ -> Район
  mruId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'ID МРУ (для mru_manager, district_manager, officer)'
  },
  districtId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'ID района (для district_manager, officer)'
  },
  organization: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Организация (для auditor)'
  },
  approvalStatus: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    allowNull: true,
    defaultValue: 'approved',
    comment: 'Статус одобрения (для новых офицеров)'
  },
  permissions: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  managedDistricts: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  profilePhoto: {
    type: DataTypes.STRING,
    allowNull: true
  },
  faceEncodingId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
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
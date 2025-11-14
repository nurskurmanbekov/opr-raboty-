const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const Client = sequelize.define('Client', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  idNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // Старое поле district (для обратной совместимости)
  district: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Устаревшее поле, используйте districtId'
  },
  // Новое поле districtId
  districtId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Districts',
      key: 'id'
    },
    comment: 'ID района из справочника'
  },
  assignedHours: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  completedHours: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('active', 'completed', 'suspended', 'violated'),
    defaultValue: 'active'
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  officerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  workLocation: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Face ID fields for CompreFace integration
  comprefaceSubjectId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'compreface_subject_id',
    comment: 'CompreFace subject ID for face recognition (e.g., client_123)'
  },
  faceRegistered: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: 'face_registered',
    comment: 'Whether client has registered their face (3-5 photos)'
  },
  faceRegisteredAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'face_registered_at',
    comment: 'Timestamp when face was registered'
  },
  faceAttemptsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    field: 'face_attempts_count',
    comment: 'Number of failed face verification attempts today'
  },
  faceBlockedUntil: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'face_blocked_until',
    comment: 'Timestamp until which face verification is blocked (after 10 failed attempts)'
  }
}, {
  timestamps: true,
  hooks: {
    beforeCreate: async (client) => {
      if (client.password) {
        const salt = await bcrypt.genSalt(10);
        client.password = await bcrypt.hash(client.password, salt);
      }
    },
    beforeUpdate: async (client) => {
      if (client.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        client.password = await bcrypt.hash(client.password, salt);
      }
    }
  }
});

// Method to compare passwords
Client.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = Client;
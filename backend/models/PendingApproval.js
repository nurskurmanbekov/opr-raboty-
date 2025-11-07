const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PendingApproval = sequelize.define('PendingApproval', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  type: {
    type: DataTypes.ENUM({
      values: ['officer', 'client']
    }),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM({
      values: ['pending', 'approved', 'rejected']
    }),
    allowNull: false,
    defaultValue: 'pending'
  },
  requesterId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  targetId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  data: {
    type: DataTypes.JSON,
    allowNull: false
  },
  reviewerId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  assignedMruId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  assignedDistrictId: {
    type: DataTypes.UUID,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'PendingApprovals'
});

module.exports = PendingApproval;

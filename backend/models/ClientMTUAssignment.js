const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ClientMTUAssignment = sequelize.define('ClientMTUAssignment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  clientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'client_id',
    references: {
      model: 'Clients',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    comment: 'Client ID (references Clients table)'
  },
  mtuId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'mtu_id',
    references: {
      model: 'mtu_locations',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    comment: 'MTU location ID (references mtu_locations table)'
  },
  assignedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'assigned_by',
    references: {
      model: 'Users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    comment: 'User ID who assigned the client (references Users table)'
  },
  assignedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
    field: 'assigned_at',
    comment: 'Timestamp of assignment'
  }
}, {
  tableName: 'client_mtu_assignments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['client_id', 'mtu_id'],
      name: 'unique_client_mtu'
    },
    {
      fields: ['client_id']
    },
    {
      fields: ['mtu_id']
    },
    {
      fields: ['assigned_by']
    }
  ]
});

module.exports = ClientMTUAssignment;

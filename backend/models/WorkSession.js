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
  }
}, {
  timestamps: true
});

module.exports = WorkSession;
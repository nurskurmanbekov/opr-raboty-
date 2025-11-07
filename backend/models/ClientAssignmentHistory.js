const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ClientAssignmentHistory = sequelize.define('ClientAssignmentHistory', {
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
    },
    comment: 'ID клиента'
  },
  previousOfficerId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'ID предыдущего офицера'
  },
  previousOfficerName: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'ФИО предыдущего офицера (сохраняем для истории)'
  },
  previousDistrictId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'ID предыдущего района'
  },
  previousDistrictName: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Название предыдущего района'
  },
  previousMruId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'ID предыдущего МРУ'
  },
  previousMruName: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Название предыдущего МРУ'
  },
  newOfficerId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'ID нового офицера'
  },
  newOfficerName: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'ФИО нового офицера'
  },
  newDistrictId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'ID нового района'
  },
  newDistrictName: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Название нового района'
  },
  newMruId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'ID нового МРУ'
  },
  newMruName: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Название нового МРУ'
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Причина переназначения'
  },
  reassignedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'ID администратора, который выполнил переназначение'
  },
  reassignedByName: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'ФИО администратора'
  }
}, {
  timestamps: true,
  tableName: 'ClientAssignmentHistory',
  indexes: [
    {
      fields: ['clientId']
    },
    {
      fields: ['previousOfficerId']
    },
    {
      fields: ['newOfficerId']
    }
  ]
});

module.exports = ClientAssignmentHistory;

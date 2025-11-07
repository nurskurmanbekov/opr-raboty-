const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MRU = sequelize.define('MRU', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Название МРУ, например: МРУ Север'
  },
  region: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Регион, например: Чуйская область'
  },
  code: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    comment: 'Уникальный код МРУ'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true,
  tableName: 'MRUs'
});

module.exports = MRU;

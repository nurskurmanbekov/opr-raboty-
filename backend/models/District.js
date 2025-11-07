const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const District = sequelize.define('District', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Название района, например: Ленинский район'
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Город, например: Бишкек'
  },
  mruId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'MRUs',
      key: 'id'
    },
    comment: 'ID МРУ к которому относится район'
  },
  code: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    comment: 'Уникальный код района'
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
  tableName: 'Districts'
});

module.exports = District;

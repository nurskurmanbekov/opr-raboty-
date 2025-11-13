const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MTULocation = sequelize.define('MTULocation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  mtuCode: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false,
    field: 'mtu_code',
    comment: 'Unique code for MTU location (e.g., MTU_BISHKEK_001)'
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Name of MTU location'
  },
  district: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'District name'
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Full address of MTU location'
  },

  // Square geofence configuration
  geofenceType: {
    type: DataTypes.STRING(20),
    defaultValue: 'square',
    allowNull: false,
    field: 'geofence_type',
    comment: 'Geofence type (square for MTU)'
  },
  geofenceCenterLat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
    field: 'geofence_center_lat',
    comment: 'Center latitude of geofence'
  },
  geofenceCenterLon: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
    field: 'geofence_center_lon',
    comment: 'Center longitude of geofence'
  },
  geofenceSize: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'geofence_size',
    validate: {
      min: 50,
      max: 1000
    },
    comment: 'Geofence size in meters (50-1000)'
  },
  geofenceNorth: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
    field: 'geofence_north',
    comment: 'North boundary of square geofence'
  },
  geofenceSouth: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
    field: 'geofence_south',
    comment: 'South boundary of square geofence'
  },
  geofenceEast: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
    field: 'geofence_east',
    comment: 'East boundary of square geofence'
  },
  geofenceWest: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
    field: 'geofence_west',
    comment: 'West boundary of square geofence'
  },

  // QR code data
  qrCodeData: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'qr_code_data',
    comment: 'JSON data encoded in QR code'
  },
  qrCodeImageUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'qr_code_image_url',
    comment: 'Path to QR code image file'
  },
  qrPdfUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'qr_pdf_url',
    comment: 'Path to printable PDF with QR code'
  },

  // Status and metadata
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'active',
    allowNull: false,
    validate: {
      isIn: [['active', 'inactive', 'maintenance']]
    },
    comment: 'MTU location status'
  }
}, {
  tableName: 'mtu_locations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['mtu_code']
    },
    {
      fields: ['district']
    },
    {
      fields: ['status']
    }
  ]
});

module.exports = MTULocation;

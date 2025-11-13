'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('mtu_locations', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      mtu_code: {
        type: Sequelize.STRING(50),
        unique: true,
        allowNull: false,
        comment: 'Unique code for MTU location (e.g., MTU_BISHKEK_001)'
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Name of MTU location'
      },
      district: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'District name'
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Full address of MTU location'
      },

      // Square geofence configuration
      geofence_type: {
        type: Sequelize.STRING(20),
        defaultValue: 'square',
        allowNull: false,
        comment: 'Geofence type (square for MTU)'
      },
      geofence_center_lat: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true,
        comment: 'Center latitude of geofence'
      },
      geofence_center_lon: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true,
        comment: 'Center longitude of geofence'
      },
      geofence_size: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Geofence size in meters (50-1000)'
      },
      geofence_north: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true,
        comment: 'North boundary of square geofence'
      },
      geofence_south: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true,
        comment: 'South boundary of square geofence'
      },
      geofence_east: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true,
        comment: 'East boundary of square geofence'
      },
      geofence_west: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true,
        comment: 'West boundary of square geofence'
      },

      // QR code data
      qr_code_data: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON data encoded in QR code'
      },
      qr_code_image_url: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Path to QR code image file'
      },
      qr_pdf_url: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Path to printable PDF with QR code'
      },

      // Status and metadata
      status: {
        type: Sequelize.STRING(20),
        defaultValue: 'active',
        allowNull: false,
        comment: 'MTU location status (active, inactive)'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false
      }
    });

    // Add indexes for performance
    await queryInterface.addIndex('mtu_locations', ['mtu_code'], {
      name: 'idx_mtu_locations_code',
      unique: true
    });

    await queryInterface.addIndex('mtu_locations', ['district'], {
      name: 'idx_mtu_locations_district'
    });

    await queryInterface.addIndex('mtu_locations', ['status'], {
      name: 'idx_mtu_locations_status'
    });

    console.log('✅ mtu_locations table created');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('mtu_locations');
    console.log('✅ mtu_locations table dropped');
  }
};

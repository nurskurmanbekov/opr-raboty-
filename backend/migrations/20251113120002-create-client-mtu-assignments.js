'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('client_mtu_assignments', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      client_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Clients',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Client ID (references Clients table)'
      },
      mtu_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'mtu_locations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'MTU location ID (references mtu_locations table)'
      },
      assigned_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'User ID who assigned the client (references Users table)'
      },
      assigned_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false,
        comment: 'Timestamp of assignment'
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

    // Add unique constraint to prevent duplicate assignments
    await queryInterface.addConstraint('client_mtu_assignments', {
      fields: ['client_id', 'mtu_id'],
      type: 'unique',
      name: 'unique_client_mtu'
    });

    // Add indexes for performance
    await queryInterface.addIndex('client_mtu_assignments', ['client_id'], {
      name: 'idx_client_mtu_assignments_client'
    });

    await queryInterface.addIndex('client_mtu_assignments', ['mtu_id'], {
      name: 'idx_client_mtu_assignments_mtu'
    });

    await queryInterface.addIndex('client_mtu_assignments', ['assigned_by'], {
      name: 'idx_client_mtu_assignments_assigned_by'
    });

    console.log('✅ client_mtu_assignments table created');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('client_mtu_assignments');
    console.log('✅ client_mtu_assignments table dropped');
  }
};

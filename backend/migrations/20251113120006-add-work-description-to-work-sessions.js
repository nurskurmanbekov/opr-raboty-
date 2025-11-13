'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('WorkSessions', 'work_description', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Description of work completed by client (minimum 20 characters required)'
    });

    await queryInterface.addColumn('WorkSessions', 'mtu_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'mtu_locations',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'MTU location ID where work was performed'
    });

    await queryInterface.addColumn('WorkSessions', 'qr_code_scanned', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Whether QR code was scanned to start session'
    });

    await queryInterface.addColumn('WorkSessions', 'qr_code_data', {
      type: Sequelize.JSONB,
      allowNull: true,
      comment: 'Data from scanned QR code'
    });

    // Add index for MTU lookups
    await queryInterface.addIndex('WorkSessions', ['mtu_id'], {
      name: 'idx_work_sessions_mtu'
    });

    console.log('✅ Work description and MTU fields added to WorkSessions table');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('WorkSessions', 'work_description');
    await queryInterface.removeColumn('WorkSessions', 'mtu_id');
    await queryInterface.removeColumn('WorkSessions', 'qr_code_scanned');
    await queryInterface.removeColumn('WorkSessions', 'qr_code_data');

    console.log('✅ Work description and MTU fields removed from WorkSessions table');
  }
};

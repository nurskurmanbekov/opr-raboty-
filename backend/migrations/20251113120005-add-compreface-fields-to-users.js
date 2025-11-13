'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add CompreFace fields to Users table
    await queryInterface.addColumn('Users', 'compreface_subject_id', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'CompreFace subject ID for this user'
    });

    await queryInterface.addColumn('Users', 'face_registered', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Whether user has registered face photos'
    });

    await queryInterface.addColumn('Users', 'face_registered_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Timestamp when face was registered'
    });

    // Add CompreFace fields to Clients table
    await queryInterface.addColumn('Clients', 'compreface_subject_id', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'CompreFace subject ID for this client'
    });

    await queryInterface.addColumn('Clients', 'face_registered', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Whether client has registered face photos'
    });

    await queryInterface.addColumn('Clients', 'face_registered_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Timestamp when face was registered'
    });

    await queryInterface.addColumn('Clients', 'face_attempts_count', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: 'Number of failed face verification attempts today'
    });

    await queryInterface.addColumn('Clients', 'face_blocked_until', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Timestamp until which face verification is blocked (after 10 failed attempts)'
    });

    // Add indexes
    await queryInterface.addIndex('Users', ['compreface_subject_id'], {
      name: 'idx_users_compreface_subject'
    });

    await queryInterface.addIndex('Clients', ['compreface_subject_id'], {
      name: 'idx_clients_compreface_subject'
    });

    console.log('✅ CompreFace fields added to Users and Clients tables');
  },

  async down(queryInterface, Sequelize) {
    // Remove from Users
    await queryInterface.removeColumn('Users', 'compreface_subject_id');
    await queryInterface.removeColumn('Users', 'face_registered');
    await queryInterface.removeColumn('Users', 'face_registered_at');

    // Remove from Clients
    await queryInterface.removeColumn('Clients', 'compreface_subject_id');
    await queryInterface.removeColumn('Clients', 'face_registered');
    await queryInterface.removeColumn('Clients', 'face_registered_at');
    await queryInterface.removeColumn('Clients', 'face_attempts_count');
    await queryInterface.removeColumn('Clients', 'face_blocked_until');

    console.log('✅ CompreFace fields removed from Users and Clients tables');
  }
};

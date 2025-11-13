'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('client_faces', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      user_id: {
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
      photo_path: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'Path to stored face photo'
      },
      photo_type: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Type of photo: frontal, left, right'
      },
      compreface_image_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'CompreFace image ID for this photo'
      },
      is_primary: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Whether this is the primary face photo'
      },
      uploaded_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false,
        comment: 'Timestamp of photo upload'
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
    await queryInterface.addIndex('client_faces', ['user_id'], {
      name: 'idx_client_faces_user'
    });

    await queryInterface.addIndex('client_faces', ['photo_type'], {
      name: 'idx_client_faces_type'
    });

    await queryInterface.addIndex('client_faces', ['compreface_image_id'], {
      name: 'idx_client_faces_compreface_id'
    });

    await queryInterface.addIndex('client_faces', ['is_primary'], {
      name: 'idx_client_faces_primary'
    });

    console.log('✅ client_faces table created');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('client_faces');
    console.log('✅ client_faces table dropped');
  }
};

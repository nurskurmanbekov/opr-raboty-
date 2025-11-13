'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('face_verification_attempts', {
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
        comment: 'Client ID attempting verification'
      },
      work_session_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'WorkSessions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Related work session ID'
      },
      attempt_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Attempt number (1-10)'
      },
      similarity_score: {
        type: Sequelize.DECIMAL(5, 4),
        allowNull: true,
        comment: 'Similarity score from CompreFace (0.0000-1.0000)'
      },
      liveness_check: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        comment: 'Whether liveness detection passed'
      },
      success: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        comment: 'Whether verification was successful'
      },
      photo_path: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'Path to verification photo'
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Error message if verification failed'
      },
      compreface_response: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Full CompreFace API response'
      },
      device_info: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Device information (OS, model, etc.)'
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
    await queryInterface.addIndex('face_verification_attempts', ['user_id'], {
      name: 'idx_face_attempts_user'
    });

    await queryInterface.addIndex('face_verification_attempts', ['work_session_id'], {
      name: 'idx_face_attempts_session'
    });

    await queryInterface.addIndex('face_verification_attempts', ['success'], {
      name: 'idx_face_attempts_success'
    });

    await queryInterface.addIndex('face_verification_attempts', ['created_at'], {
      name: 'idx_face_attempts_created'
    });

    console.log('✅ face_verification_attempts table created');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('face_verification_attempts');
    console.log('✅ face_verification_attempts table dropped');
  }
};

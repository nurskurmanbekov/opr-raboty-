'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('WorkSessions', 'faceVerified', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Whether Face ID verification was successful'
    });

    await queryInterface.addColumn('WorkSessions', 'verificationPhotoUrl', {
      type: Sequelize.STRING(500),
      allowNull: true,
      comment: 'Selfie photo taken at session start for face verification'
    });

    await queryInterface.addColumn('WorkSessions', 'faceVerificationAttemptId', {
      type: Sequelize.UUID,
      allowNull: true,
      comment: 'Reference to FaceVerification record'
    });

    await queryInterface.addColumn('WorkSessions', 'biometricType', {
      type: Sequelize.STRING(50),
      allowNull: true,
      comment: 'Type of biometric used (FaceID, TouchID, etc)'
    });

    await queryInterface.addColumn('WorkSessions', 'deviceId', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: 'Device ID used for verification'
    });

    await queryInterface.addColumn('WorkSessions', 'faceVerificationConfidence', {
      type: Sequelize.FLOAT,
      allowNull: true,
      comment: 'Confidence score from face verification (0-1)'
    });

    console.log('✅ Face ID verification fields added to WorkSessions table');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('WorkSessions', 'faceVerified');
    await queryInterface.removeColumn('WorkSessions', 'verificationPhotoUrl');
    await queryInterface.removeColumn('WorkSessions', 'faceVerificationAttemptId');
    await queryInterface.removeColumn('WorkSessions', 'biometricType');
    await queryInterface.removeColumn('WorkSessions', 'deviceId');
    await queryInterface.removeColumn('WorkSessions', 'faceVerificationConfidence');

    console.log('✅ Face ID verification fields removed from WorkSessions table');
  }
};

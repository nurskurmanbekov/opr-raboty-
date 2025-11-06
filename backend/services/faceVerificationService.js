const FaceVerification = require('../models/FaceVerification');
const Photo = require('../models/Photo');
const User = require('../models/User');
const Client = require('../models/Client');
const path = require('path');
const fs = require('fs').promises;

/**
 * Face Verification Service
 *
 * This service provides a flexible interface for face verification.
 * It can be integrated with various face recognition services:
 * - face-api.js (local, JavaScript-based)
 * - AWS Rekognition
 * - Microsoft Azure Face API
 * - Google Cloud Vision API
 * - Custom ML models
 *
 * For now, we implement a basic structure that can be extended.
 */

class FaceVerificationService {
  constructor() {
    this.faceRecognitionEnabled = process.env.FACE_RECOGNITION_ENABLED === 'true';
    this.faceRecognitionProvider = process.env.FACE_RECOGNITION_PROVIDER || 'mock'; // mock, face-api, aws, azure, google
    this.matchThreshold = parseFloat(process.env.FACE_MATCH_THRESHOLD || '0.6');
  }

  /**
   * Register a user's face (enrollment)
   */
  async registerFace(userId, faceImagePath, verificationType = 'registration') {
    try {
      // Check if user exists
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Create face verification record
      const faceVerification = await FaceVerification.create({
        userId,
        faceImageUrl: faceImagePath,
        verificationType,
        verificationStatus: 'pending',
        matchThreshold: this.matchThreshold
      });

      // If face recognition is disabled, just mark as verified
      if (!this.faceRecognitionEnabled) {
        await faceVerification.update({
          verificationStatus: 'verified',
          isMatch: true,
          verifiedAt: new Date(),
          metadata: { note: 'Face recognition disabled, auto-verified' }
        });

        return {
          success: true,
          faceVerification,
          message: 'Face registered (recognition disabled)'
        };
      }

      // Extract face encoding based on provider
      const result = await this.extractFaceEncoding(faceImagePath);

      if (!result.success) {
        await faceVerification.update({
          verificationStatus: result.status || 'failed',
          errorMessage: result.error,
          metadata: result.metadata || {}
        });

        return {
          success: false,
          faceVerification,
          error: result.error
        };
      }

      // Save encoding
      await faceVerification.update({
        faceEncoding: JSON.stringify(result.encoding),
        verificationStatus: 'verified',
        isMatch: true,
        verifiedAt: new Date(),
        metadata: result.metadata || {}
      });

      // Save reference to user
      await user.update({
        faceEncodingId: faceVerification.id
      });

      return {
        success: true,
        faceVerification,
        message: 'Face registered successfully'
      };

    } catch (error) {
      console.error('Register face error:', error);
      throw error;
    }
  }

  /**
   * Verify a face against registered face
   */
  async verifyFace(userId, faceImagePath, verificationType, workSessionId = null, photoId = null) {
    try {
      // Get user's registered face
      const user = await User.findByPk(userId);
      if (!user || !user.faceEncodingId) {
        return {
          success: false,
          error: 'No registered face found for user',
          isMatch: false
        };
      }

      const referenceFace = await FaceVerification.findByPk(user.faceEncodingId);
      if (!referenceFace) {
        return {
          success: false,
          error: 'Reference face not found',
          isMatch: false
        };
      }

      // Create verification record
      const faceVerification = await FaceVerification.create({
        userId,
        photoId,
        workSessionId,
        faceImageUrl: faceImagePath,
        verificationType,
        verificationStatus: 'pending',
        matchThreshold: this.matchThreshold,
        referencePhotoId: referenceFace.id
      });

      // If face recognition is disabled, auto-verify
      if (!this.faceRecognitionEnabled) {
        await faceVerification.update({
          verificationStatus: 'verified',
          isMatch: true,
          matchScore: 1.0,
          verifiedAt: new Date(),
          metadata: { note: 'Face recognition disabled, auto-verified' }
        });

        return {
          success: true,
          isMatch: true,
          matchScore: 1.0,
          faceVerification
        };
      }

      // Extract face encoding from new image
      const extractResult = await this.extractFaceEncoding(faceImagePath);

      if (!extractResult.success) {
        await faceVerification.update({
          verificationStatus: extractResult.status || 'failed',
          errorMessage: extractResult.error,
          isMatch: false,
          metadata: extractResult.metadata || {}
        });

        return {
          success: false,
          error: extractResult.error,
          isMatch: false,
          faceVerification
        };
      }

      // Compare faces
      const referenceEncoding = JSON.parse(referenceFace.faceEncoding);
      const compareResult = await this.compareFaces(referenceEncoding, extractResult.encoding);

      const isMatch = compareResult.similarity >= this.matchThreshold;

      // Update verification record
      await faceVerification.update({
        faceEncoding: JSON.stringify(extractResult.encoding),
        verificationStatus: isMatch ? 'verified' : 'failed',
        matchScore: compareResult.similarity,
        isMatch,
        verifiedAt: isMatch ? new Date() : null,
        metadata: {
          ...extractResult.metadata,
          comparisonMethod: compareResult.method
        }
      });

      return {
        success: true,
        isMatch,
        matchScore: compareResult.similarity,
        threshold: this.matchThreshold,
        faceVerification
      };

    } catch (error) {
      console.error('Verify face error:', error);
      throw error;
    }
  }

  /**
   * Extract face encoding from image
   * This is a placeholder that should be implemented with actual face recognition library
   */
  async extractFaceEncoding(imagePath) {
    try {
      // Check if file exists
      const fullPath = path.join(process.cwd(), imagePath);
      try {
        await fs.access(fullPath);
      } catch {
        return {
          success: false,
          status: 'failed',
          error: 'Image file not found'
        };
      }

      // Mock implementation - replace with actual face recognition
      if (this.faceRecognitionProvider === 'mock') {
        // Generate a random "encoding" for demo purposes
        const mockEncoding = Array(128).fill(0).map(() => Math.random());

        return {
          success: true,
          encoding: mockEncoding,
          metadata: {
            provider: 'mock',
            facesDetected: 1,
            faceBox: { x: 100, y: 100, width: 200, height: 200 }
          }
        };
      }

      // TODO: Implement actual face recognition based on provider
      // if (this.faceRecognitionProvider === 'face-api') {
      //   return await this.extractWithFaceAPI(imagePath);
      // }
      // if (this.faceRecognitionProvider === 'aws') {
      //   return await this.extractWithAWS(imagePath);
      // }

      return {
        success: false,
        status: 'failed',
        error: `Face recognition provider '${this.faceRecognitionProvider}' not implemented`
      };

    } catch (error) {
      console.error('Extract face encoding error:', error);
      return {
        success: false,
        status: 'failed',
        error: error.message
      };
    }
  }

  /**
   * Compare two face encodings
   */
  async compareFaces(encoding1, encoding2) {
    try {
      // Mock implementation - replace with actual comparison logic
      if (this.faceRecognitionProvider === 'mock') {
        // Calculate simple similarity (random for demo)
        const similarity = 0.7 + Math.random() * 0.25; // 0.7 - 0.95

        return {
          similarity,
          method: 'mock_euclidean_distance'
        };
      }

      // TODO: Implement actual face comparison
      // For real implementation, calculate distance between encodings:
      // - Euclidean distance
      // - Cosine similarity
      // Based on the face recognition library used

      return {
        similarity: 0,
        method: 'not_implemented'
      };

    } catch (error) {
      console.error('Compare faces error:', error);
      return {
        similarity: 0,
        method: 'error'
      };
    }
  }

  /**
   * Get verification history for a user
   */
  async getVerificationHistory(userId, limit = 50) {
    return await FaceVerification.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit,
      include: [
        {
          model: Photo,
          as: 'photo',
          attributes: ['id', 'photoUrl', 'photoType']
        }
      ]
    });
  }

  /**
   * Get verification statistics
   */
  async getVerificationStats(userId, startDate, endDate) {
    const { Op } = require('sequelize');

    const where = { userId };
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const verifications = await FaceVerification.findAll({ where });

    const stats = {
      total: verifications.length,
      verified: verifications.filter(v => v.isMatch).length,
      failed: verifications.filter(v => v.verificationStatus === 'failed').length,
      noFaceDetected: verifications.filter(v => v.verificationStatus === 'no_face_detected').length,
      multipleFaces: verifications.filter(v => v.verificationStatus === 'multiple_faces').length,
      averageMatchScore: 0,
      byType: {}
    };

    // Calculate average match score
    const matchedVerifications = verifications.filter(v => v.matchScore !== null);
    if (matchedVerifications.length > 0) {
      stats.averageMatchScore = matchedVerifications.reduce((sum, v) => sum + v.matchScore, 0) / matchedVerifications.length;
    }

    // Group by verification type
    const types = ['registration', 'check_in', 'check_out', 'random_check'];
    types.forEach(type => {
      const typeVerifications = verifications.filter(v => v.verificationType === type);
      stats.byType[type] = {
        total: typeVerifications.length,
        verified: typeVerifications.filter(v => v.isMatch).length,
        failed: typeVerifications.filter(v => !v.isMatch && v.verificationStatus === 'failed').length
      };
    });

    return stats;
  }
}

module.exports = new FaceVerificationService();

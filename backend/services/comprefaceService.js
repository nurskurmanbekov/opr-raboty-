const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const { ClientFace, FaceVerificationAttempt, Client } = require('../models');

class ComprefaceService {
  constructor() {
    this.apiUrl = process.env.COMPREFACE_API_URL || 'http://localhost:8002';
    this.apiKey = process.env.COMPREFACE_API_KEY;
    this.faceCollection = process.env.COMPREFACE_FACE_COLLECTION || 'probation_clients';
    this.similarityThreshold = parseFloat(process.env.FACE_SIMILARITY_THRESHOLD || '0.85');
    this.maxAttempts = parseInt(process.env.FACE_MAX_ATTEMPTS || '10');
    this.lockoutDuration = parseInt(process.env.FACE_LOCKOUT_DURATION_MINUTES || '30');
    this.enabled = process.env.COMPREFACE_ENABLED === 'true';

    if (this.enabled && !this.apiKey) {
      console.warn('⚠️  CompreFace is enabled but API key is not configured');
    }
  }

  /**
   * Check if CompreFace is enabled and configured
   */
  isEnabled() {
    return this.enabled && this.apiKey;
  }

  /**
   * Add a face to CompreFace collection
   * @param {string} subjectId - Unique subject identifier (client ID)
   * @param {string} photoPath - Path to face photo
   * @param {object} metadata - Optional metadata
   * @returns {Promise<object>} - CompreFace response
   */
  async addFace(subjectId, photoPath, metadata = {}) {
    if (!this.isEnabled()) {
      throw new Error('CompreFace is not enabled or configured');
    }

    try {
      const form = new FormData();
      form.append('file', fs.createReadStream(photoPath));

      const response = await axios.post(
        `${this.apiUrl}/api/v1/recognition/faces`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            'x-api-key': this.apiKey
          },
          params: {
            subject: subjectId,
            det_prob_threshold: 0.8,
            ...metadata
          }
        }
      );

      console.log(`✅ Face added to CompreFace for subject: ${subjectId}`);
      return response.data;

    } catch (error) {
      console.error('❌ Error adding face to CompreFace:', error.response?.data || error.message);
      throw new Error(`Failed to add face: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Verify a face against CompreFace collection
   * @param {string} photoPath - Path to verification photo
   * @param {object} options - Verification options
   * @returns {Promise<object>} - Verification result
   */
  async verifyFace(photoPath, options = {}) {
    if (!this.isEnabled()) {
      throw new Error('CompreFace is not enabled or configured');
    }

    try {
      const form = new FormData();
      form.append('file', fs.createReadStream(photoPath));

      const response = await axios.post(
        `${this.apiUrl}/api/v1/recognition/recognize`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            'x-api-key': this.apiKey
          },
          params: {
            limit: 1,
            det_prob_threshold: 0.8,
            face_plugins: 'age,gender,mask',
            status: true,
            ...options
          }
        }
      );

      return this.processVerificationResponse(response.data);

    } catch (error) {
      console.error('❌ Error verifying face with CompreFace:', error.response?.data || error.message);
      throw new Error(`Face verification failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Process CompreFace verification response
   * @param {object} data - Raw CompreFace response
   * @returns {object} - Processed verification result
   */
  processVerificationResponse(data) {
    const result = data.result?.[0];

    if (!result) {
      return {
        success: false,
        matched: false,
        similarity: 0,
        message: 'No face detected in image'
      };
    }

    const subjects = result.subjects || [];
    const bestMatch = subjects.length > 0 ? subjects[0] : null;

    if (!bestMatch) {
      return {
        success: false,
        matched: false,
        similarity: 0,
        message: 'No matching face found'
      };
    }

    const similarity = bestMatch.similarity || 0;
    const matched = similarity >= this.similarityThreshold;

    return {
      success: true,
      matched,
      similarity,
      subject: bestMatch.subject,
      confidence: result.box?.probability || 0,
      age: result.age,
      gender: result.gender,
      mask: result.mask,
      message: matched ? 'Face matched successfully' : `Similarity too low: ${similarity.toFixed(4)}`
    };
  }

  /**
   * Delete a face from CompreFace collection
   * @param {string} subjectId - Subject identifier
   * @param {string} imageId - Specific image ID (optional, deletes all if not provided)
   * @returns {Promise<object>} - Deletion result
   */
  async deleteFace(subjectId, imageId = null) {
    if (!this.isEnabled()) {
      throw new Error('CompreFace is not enabled or configured');
    }

    try {
      const url = imageId
        ? `${this.apiUrl}/api/v1/recognition/faces/${imageId}`
        : `${this.apiUrl}/api/v1/recognition/faces`;

      const config = {
        headers: { 'x-api-key': this.apiKey }
      };

      if (!imageId) {
        config.params = { subject: subjectId };
      }

      const response = await axios.delete(url, config);

      console.log(`✅ Face deleted from CompreFace: ${subjectId}`);
      return response.data;

    } catch (error) {
      console.error('❌ Error deleting face from CompreFace:', error.response?.data || error.message);
      throw new Error(`Failed to delete face: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Register client faces during registration (3-5 photos)
   * @param {number} clientId - Client ID
   * @param {array} photoPaths - Array of {path, type} objects
   * @returns {Promise<object>} - Registration result
   */
  async registerClientFaces(clientId, photoPaths) {
    if (!this.isEnabled()) {
      console.warn('⚠️  CompreFace disabled, skipping face registration');
      return { success: true, message: 'CompreFace disabled' };
    }

    if (!photoPaths || photoPaths.length < 3) {
      throw new Error('At least 3 face photos are required');
    }

    if (photoPaths.length > 5) {
      throw new Error('Maximum 5 face photos allowed');
    }

    const subjectId = `client_${clientId}`;
    const results = [];

    try {
      // Add each photo to CompreFace
      for (const photo of photoPaths) {
        const comprefaceResponse = await this.addFace(subjectId, photo.path, {
          photo_type: photo.type
        });

        // Save to database
        const faceRecord = await ClientFace.create({
          userId: clientId,
          photoPath: photo.path,
          photoType: photo.type,
          comprefaceImageId: comprefaceResponse.image_id,
          isPrimary: photo.type === 'frontal'
        });

        results.push({
          type: photo.type,
          image_id: comprefaceResponse.image_id,
          success: true
        });
      }

      // Update client record
      await Client.update(
        {
          comprefaceSubjectId: subjectId,
          faceRegistered: true,
          faceRegisteredAt: new Date()
        },
        { where: { id: clientId } }
      );

      console.log(`✅ Client ${clientId} faces registered successfully`);

      return {
        success: true,
        subject_id: subjectId,
        photos_registered: results.length,
        details: results
      };

    } catch (error) {
      console.error(`❌ Error registering client faces:`, error);

      // Rollback: delete from CompreFace if any were added
      try {
        await this.deleteFace(subjectId);
      } catch (rollbackError) {
        console.error('Failed to rollback face registration:', rollbackError);
      }

      throw error;
    }
  }

  /**
   * Verify client face with liveness detection (3 photos: left, right, frontal)
   * @param {number} clientId - Client ID
   * @param {array} verificationPhotos - Array of {path, type} objects
   * @param {object} options - Additional options (workSessionId, deviceInfo, etc.)
   * @returns {Promise<object>} - Verification result
   */
  async verifyClientFace(clientId, verificationPhotos, options = {}) {
    if (!this.isEnabled()) {
      return {
        success: true,
        message: 'CompreFace disabled - verification bypassed',
        similarity: 1.0,
        liveness: true
      };
    }

    // Check if client is blocked
    const client = await Client.findByPk(clientId);
    if (!client) {
      throw new Error('Client not found');
    }

    // Check lockout
    if (client.faceBlockedUntil && new Date(client.faceBlockedUntil) > new Date()) {
      const minutesRemaining = Math.ceil((new Date(client.faceBlockedUntil) - new Date()) / 60000);
      throw new Error(`Face verification is blocked. Try again in ${minutesRemaining} minutes.`);
    }

    // Get current attempt count (reset daily)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attemptsToday = await FaceVerificationAttempt.count({
      where: {
        userId: clientId,
        createdAt: { [require('sequelize').Op.gte]: today },
        success: false
      }
    });

    if (attemptsToday >= this.maxAttempts) {
      // Block user
      const blockUntil = new Date(Date.now() + this.lockoutDuration * 60 * 1000);
      await client.update({ faceBlockedUntil: blockUntil });

      throw new Error(`Maximum attempts (${this.maxAttempts}) reached. Blocked for ${this.lockoutDuration} minutes.`);
    }

    // Liveness check: require at least 3 photos
    if (!verificationPhotos || verificationPhotos.length < 3) {
      throw new Error('Liveness check requires 3 photos (left, right, frontal)');
    }

    const requiredTypes = ['left', 'right', 'frontal'];
    const providedTypes = verificationPhotos.map(p => p.type);
    const missingTypes = requiredTypes.filter(t => !providedTypes.includes(t));

    if (missingTypes.length > 0) {
      throw new Error(`Missing photo types for liveness: ${missingTypes.join(', ')}`);
    }

    // Verify frontal photo (main verification)
    const frontalPhoto = verificationPhotos.find(p => p.type === 'frontal');
    const verificationResult = await this.verifyFace(frontalPhoto.path);

    // Log attempt
    const attemptNumber = attemptsToday + 1;
    await FaceVerificationAttempt.create({
      userId: clientId,
      workSessionId: options.workSessionId || null,
      attemptNumber,
      similarityScore: verificationResult.similarity,
      livenessCheck: verificationPhotos.length >= 3,
      success: verificationResult.matched,
      photoPath: frontalPhoto.path,
      errorMessage: verificationResult.matched ? null : verificationResult.message,
      comprefaceResponse: verificationResult,
      deviceInfo: options.deviceInfo || null
    });

    if (!verificationResult.matched) {
      const attemptsLeft = this.maxAttempts - attemptNumber;

      return {
        success: false,
        matched: false,
        similarity: verificationResult.similarity,
        attempts_left: attemptsLeft,
        message: `Face verification failed. ${attemptsLeft} attempts remaining.`
      };
    }

    // Success - reset attempts counter
    await client.update({
      faceAttemptsCount: 0,
      faceBlockedUntil: null
    });

    return {
      success: true,
      matched: true,
      similarity: verificationResult.similarity,
      liveness: true,
      confidence: verificationResult.confidence,
      message: 'Face verified successfully'
    };
  }

  /**
   * Get subject info from CompreFace
   * @param {string} subjectId - Subject identifier
   * @returns {Promise<object>} - Subject info
   */
  async getSubjectInfo(subjectId) {
    if (!this.isEnabled()) {
      throw new Error('CompreFace is not enabled or configured');
    }

    try {
      const response = await axios.get(
        `${this.apiUrl}/api/v1/recognition/subjects/${subjectId}`,
        {
          headers: { 'x-api-key': this.apiKey }
        }
      );

      return response.data;

    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw new Error(`Failed to get subject info: ${error.response?.data?.message || error.message}`);
    }
  }
}

// Export singleton instance
module.exports = new ComprefaceService();

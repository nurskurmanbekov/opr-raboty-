const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// CompreFace Configuration
const COMPREFACE_URL = process.env.COMPREFACE_URL || 'http://localhost:8080';
const COMPREFACE_API_KEY = process.env.COMPREFACE_API_KEY || '';

class FaceRecognitionService {
  constructor() {
    this.apiClient = axios.create({
      baseURL: COMPREFACE_URL,
      headers: {
        'x-api-key': COMPREFACE_API_KEY
      }
    });
  }

  /**
   * Регистрация лица клиента в системе
   * @param {string} clientId - ID клиента
   * @param {Buffer} photoBuffer - Фото в виде Buffer
   * @param {string} filename - Имя файла
   * @returns {Promise<Object>}
   */
  async registerFace(clientId, photoBuffer, filename = 'face.jpg') {
    try {
      const formData = new FormData();
      formData.append('file', photoBuffer, {
        filename: filename,
        contentType: 'image/jpeg'
      });

      const response = await this.apiClient.post(
        '/api/v1/recognition/faces',
        formData,
        {
          headers: {
            ...formData.getHeaders()
          },
          params: {
            subject: clientId, // Уникальный идентификатор клиента
            det_prob_threshold: 0.8, // Порог уверенности детекции
            det_prob_threshold: 0.8
          }
        }
      );

      console.log(`Face registered for client ${clientId}:`, response.data);

      return {
        success: true,
        faceId: response.data.image_id,
        subject: response.data.subject,
        boundingBox: response.data.box,
        similarity: response.data.similarity
      };
    } catch (error) {
      console.error('Face registration error:', error.response?.data || error.message);

      return {
        success: false,
        error: error.response?.data?.message || 'Face detection failed',
        details: error.response?.data
      };
    }
  }

  /**
   * Верификация лица клиента
   * @param {string} clientId - ID клиента
   * @param {Buffer} photoBuffer - Фото для верификации
   * @param {string} filename - Имя файла
   * @returns {Promise<Object>}
   */
  async verifyFace(clientId, photoBuffer, filename = 'verify.jpg') {
    try {
      const formData = new FormData();
      formData.append('file', photoBuffer, {
        filename: filename,
        contentType: 'image/jpeg'
      });

      const response = await this.apiClient.post(
        '/api/v1/recognition/recognize',
        formData,
        {
          headers: {
            ...formData.getHeaders()
          },
          params: {
            limit: 1, // Возвращать только лучшее совпадение
            det_prob_threshold: 0.8,
            face_plugins: 'age,gender,landmarks', // Дополнительные данные
            status: true
          }
        }
      );

      const result = response.data.result[0];

      if (!result || !result.subjects || result.subjects.length === 0) {
        return {
          verified: false,
          reason: 'No face detected or no matches found',
          confidence: 0
        };
      }

      const match = result.subjects[0];
      const similarity = match.similarity; // 0-1 (1 = точное совпадение)
      const matchedClientId = match.subject;

      // Порог верификации: 0.85 (85% схожести)
      const VERIFICATION_THRESHOLD = 0.85;
      const isVerified = similarity >= VERIFICATION_THRESHOLD && matchedClientId === clientId;

      return {
        verified: isVerified,
        similarity: similarity,
        confidence: similarity,
        matchedClientId: matchedClientId,
        threshold: VERIFICATION_THRESHOLD,
        // Дополнительные данные
        age: result.age ? Math.round(result.age.low + result.age.high) / 2 : null,
        gender: result.gender?.value || null,
        genderConfidence: result.gender?.probability || null,
        boundingBox: result.box,
        landmarks: result.landmarks,
        executionTime: result.execution_time
      };
    } catch (error) {
      console.error('Face verification error:', error.response?.data || error.message);

      return {
        verified: false,
        error: error.response?.data?.message || 'Face verification failed',
        details: error.response?.data
      };
    }
  }

  /**
   * Получить все зарегистрированные лица клиента
   * @param {string} clientId - ID клиента
   * @returns {Promise<Array>}
   */
  async getClientFaces(clientId) {
    try {
      const response = await this.apiClient.get('/api/v1/recognition/faces', {
        params: {
          subject: clientId
        }
      });

      return {
        success: true,
        faces: response.data.faces || []
      };
    } catch (error) {
      console.error('Get client faces error:', error.response?.data || error.message);

      return {
        success: false,
        faces: [],
        error: error.message
      };
    }
  }

  /**
   * Удалить конкретное лицо
   * @param {string} faceId - ID лица в CompreFace
   * @returns {Promise<Object>}
   */
  async deleteFace(faceId) {
    try {
      await this.apiClient.delete(`/api/v1/recognition/faces/${faceId}`);

      return {
        success: true,
        message: 'Face deleted successfully'
      };
    } catch (error) {
      console.error('Delete face error:', error.response?.data || error.message);

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Удалить все лица клиента
   * @param {string} clientId - ID клиента
   * @returns {Promise<Object>}
   */
  async deleteAllClientFaces(clientId) {
    try {
      await this.apiClient.delete('/api/v1/recognition/faces', {
        params: {
          subject: clientId
        }
      });

      return {
        success: true,
        message: 'All client faces deleted successfully'
      };
    } catch (error) {
      console.error('Delete all faces error:', error.response?.data || error.message);

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Проверка здоровья CompreFace сервиса
   * @returns {Promise<Object>}
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${COMPREFACE_URL}/api/v1/status`);

      return {
        healthy: true,
        status: response.data
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }
}

module.exports = new FaceRecognitionService();

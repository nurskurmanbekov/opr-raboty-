const SyncQueue = require('../models/SyncQueue');
const WorkSession = require('../models/WorkSession');
const Photo = require('../models/Photo');
const Client = require('../models/Client');
const LocationHistory = require('../models/LocationHistory');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

class SyncService {
  /**
   * Add item to sync queue
   */
  async addToQueue(userId, operation, resourceType, data, options = {}) {
    try {
      const queueItem = await SyncQueue.create({
        userId,
        deviceId: options.deviceId,
        operation,
        resourceType,
        resourceId: options.resourceId,
        data,
        priority: options.priority || 5,
        clientTimestamp: options.clientTimestamp || new Date(),
        maxRetries: options.maxRetries || 3
      });

      return { success: true, queueItem };
    } catch (error) {
      console.error('Add to queue error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process sync queue for a user
   */
  async processSyncQueue(userId, deviceId = null) {
    const transaction = await sequelize.transaction();

    try {
      // Get pending items sorted by priority and timestamp
      const where = {
        userId,
        status: 'pending',
        retryCount: { [Op.lt]: sequelize.col('maxRetries') }
      };

      if (deviceId) {
        where.deviceId = deviceId;
      }

      const queueItems = await SyncQueue.findAll({
        where,
        order: [
          ['priority', 'DESC'],
          ['clientTimestamp', 'ASC']
        ],
        limit: 50 // Process in batches
      });

      const results = [];

      for (const item of queueItems) {
        await item.update({ status: 'processing' }, { transaction });

        try {
          const result = await this.processQueueItem(item, transaction);

          if (result.success) {
            await item.update({
              status: 'completed',
              serverResourceId: result.resourceId,
              processedAt: new Date()
            }, { transaction });

            results.push({
              clientId: item.resourceId,
              serverId: result.resourceId,
              success: true
            });
          } else if (result.conflict) {
            await item.update({
              status: 'conflict',
              conflictData: result.conflictData,
              errorMessage: result.error
            }, { transaction });

            results.push({
              clientId: item.resourceId,
              success: false,
              conflict: true,
              conflictData: result.conflictData
            });
          } else {
            await item.update({
              status: 'failed',
              retryCount: item.retryCount + 1,
              errorMessage: result.error
            }, { transaction });

            results.push({
              clientId: item.resourceId,
              success: false,
              error: result.error
            });
          }
        } catch (error) {
          console.error('Process queue item error:', error);

          await item.update({
            status: 'failed',
            retryCount: item.retryCount + 1,
            errorMessage: error.message
          }, { transaction });

          results.push({
            clientId: item.resourceId,
            success: false,
            error: error.message
          });
        }
      }

      await transaction.commit();

      return {
        success: true,
        processed: results.length,
        results
      };

    } catch (error) {
      await transaction.rollback();
      console.error('Process sync queue error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process individual queue item
   */
  async processQueueItem(item, transaction) {
    try {
      switch (item.operation) {
        case 'create_work_session':
          return await this.createWorkSession(item, transaction);

        case 'update_work_session':
          return await this.updateWorkSession(item, transaction);

        case 'upload_photo':
          return await this.uploadPhoto(item, transaction);

        case 'update_location':
          return await this.updateLocation(item, transaction);

        case 'create_client':
          return await this.createClient(item, transaction);

        case 'update_client':
          return await this.updateClient(item, transaction);

        default:
          return {
            success: false,
            error: `Unknown operation: ${item.operation}`
          };
      }
    } catch (error) {
      console.error('Process queue item error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create work session from sync
   */
  async createWorkSession(item, transaction) {
    try {
      const data = item.data;

      // Check for conflicts (duplicate work session for same time)
      const existing = await WorkSession.findOne({
        where: {
          clientId: data.clientId,
          startTime: data.startTime,
          status: { [Op.ne]: 'cancelled' }
        },
        transaction
      });

      if (existing) {
        return {
          success: false,
          conflict: true,
          conflictData: { existingSession: existing },
          error: 'Work session already exists for this time'
        };
      }

      const workSession = await WorkSession.create(data, { transaction });

      return {
        success: true,
        resourceId: workSession.id
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update work session from sync
   */
  async updateWorkSession(item, transaction) {
    try {
      const { id, ...updateData } = item.data;

      const workSession = await WorkSession.findByPk(id, { transaction });

      if (!workSession) {
        return {
          success: false,
          error: 'Work session not found'
        };
      }

      // Check for conflicts (if updated_at is newer on server)
      if (workSession.updatedAt > new Date(item.clientTimestamp)) {
        return {
          success: false,
          conflict: true,
          conflictData: { serverVersion: workSession },
          error: 'Work session was updated on server after client change'
        };
      }

      await workSession.update(updateData, { transaction });

      return {
        success: true,
        resourceId: workSession.id
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Upload photo from sync
   */
  async uploadPhoto(item, transaction) {
    try {
      const data = item.data;

      const photo = await Photo.create(data, { transaction });

      return {
        success: true,
        resourceId: photo.id
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update location from sync
   */
  async updateLocation(item, transaction) {
    try {
      const data = item.data;

      const location = await LocationHistory.create(data, { transaction });

      return {
        success: true,
        resourceId: location.id
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Create client from sync
   */
  async createClient(item, transaction) {
    try {
      const data = item.data;

      const client = await Client.create(data, { transaction });

      return {
        success: true,
        resourceId: client.id
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update client from sync
   */
  async updateClient(item, transaction) {
    try {
      const { id, ...updateData } = item.data;

      const client = await Client.findByPk(id, { transaction });

      if (!client) {
        return {
          success: false,
          error: 'Client not found'
        };
      }

      await client.update(updateData, { transaction });

      return {
        success: true,
        resourceId: client.id
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get sync queue status for user
   */
  async getQueueStatus(userId, deviceId = null) {
    try {
      const where = { userId };
      if (deviceId) where.deviceId = deviceId;

      const counts = await SyncQueue.findAll({
        where,
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status']
      });

      const status = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        conflict: 0
      };

      counts.forEach(row => {
        status[row.status] = parseInt(row.get('count'));
      });

      return { success: true, status };

    } catch (error) {
      console.error('Get queue status error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Clear completed items from queue
   */
  async clearCompleted(userId, olderThan = 7) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThan);

      const deleted = await SyncQueue.destroy({
        where: {
          userId,
          status: 'completed',
          processedAt: { [Op.lt]: cutoffDate }
        }
      });

      return { success: true, deleted };

    } catch (error) {
      console.error('Clear completed error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Resolve conflict
   */
  async resolveConflict(queueItemId, resolution) {
    try {
      const item = await SyncQueue.findByPk(queueItemId);

      if (!item || item.status !== 'conflict') {
        return {
          success: false,
          error: 'Queue item not found or not in conflict state'
        };
      }

      if (resolution === 'use_server') {
        // Mark as completed, use server version
        await item.update({
          status: 'completed',
          processedAt: new Date()
        });
      } else if (resolution === 'use_client') {
        // Retry with force flag
        await item.update({
          status: 'pending',
          retryCount: 0
        });
      } else if (resolution === 'discard') {
        // Mark as failed
        await item.update({
          status: 'failed',
          errorMessage: 'Discarded by user'
        });
      }

      return { success: true };

    } catch (error) {
      console.error('Resolve conflict error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new SyncService();

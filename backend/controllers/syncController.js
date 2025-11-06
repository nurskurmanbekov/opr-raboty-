const syncService = require('../services/syncService');
const SyncQueue = require('../models/SyncQueue');

/**
 * Batch sync - add multiple operations to queue
 */
exports.batchSync = async (req, res) => {
  try {
    const userId = req.user.id;
    const { operations, deviceId } = req.body;

    if (!operations || !Array.isArray(operations) || operations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Operations array is required'
      });
    }

    const results = [];

    for (const op of operations) {
      const result = await syncService.addToQueue(
        userId,
        op.operation,
        op.resourceType,
        op.data,
        {
          deviceId,
          resourceId: op.resourceId,
          priority: op.priority,
          clientTimestamp: op.timestamp,
          maxRetries: op.maxRetries
        }
      );

      results.push({
        clientId: op.resourceId,
        success: result.success,
        queueItemId: result.queueItem?.id,
        error: result.error
      });
    }

    // Automatically process queue after adding items
    const processResult = await syncService.processSyncQueue(userId, deviceId);

    res.json({
      success: true,
      message: 'Batch sync completed',
      data: {
        queued: results,
        processed: processResult
      }
    });

  } catch (error) {
    console.error('Batch sync error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing batch sync',
      error: error.message
    });
  }
};

/**
 * Process sync queue
 */
exports.processQueue = async (req, res) => {
  try {
    const userId = req.user.id;
    const { deviceId } = req.query;

    const result = await syncService.processSyncQueue(userId, deviceId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Error processing sync queue',
        error: result.error
      });
    }

    res.json({
      success: true,
      message: 'Sync queue processed',
      data: result
    });

  } catch (error) {
    console.error('Process queue error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing sync queue',
      error: error.message
    });
  }
};

/**
 * Get sync queue status
 */
exports.getQueueStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { deviceId } = req.query;

    const result = await syncService.getQueueStatus(userId, deviceId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Error getting queue status',
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.status
    });

  } catch (error) {
    console.error('Get queue status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting queue status',
      error: error.message
    });
  }
};

/**
 * Get pending queue items
 */
exports.getPendingItems = async (req, res) => {
  try {
    const userId = req.user.id;
    const { deviceId, limit = 50 } = req.query;

    const where = { userId };
    if (deviceId) where.deviceId = deviceId;

    const items = await SyncQueue.findAll({
      where,
      order: [
        ['priority', 'DESC'],
        ['clientTimestamp', 'ASC']
      ],
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: items
    });

  } catch (error) {
    console.error('Get pending items error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting pending items',
      error: error.message
    });
  }
};

/**
 * Get conflicts
 */
exports.getConflicts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { deviceId } = req.query;

    const where = { userId, status: 'conflict' };
    if (deviceId) where.deviceId = deviceId;

    const conflicts = await SyncQueue.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: conflicts
    });

  } catch (error) {
    console.error('Get conflicts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting conflicts',
      error: error.message
    });
  }
};

/**
 * Resolve conflict
 */
exports.resolveConflict = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution } = req.body; // 'use_server', 'use_client', 'discard'

    if (!['use_server', 'use_client', 'discard'].includes(resolution)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid resolution. Must be: use_server, use_client, or discard'
      });
    }

    const result = await syncService.resolveConflict(id, resolution);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    // If using client version, process the queue again
    if (resolution === 'use_client') {
      await syncService.processSyncQueue(req.user.id);
    }

    res.json({
      success: true,
      message: 'Conflict resolved',
      data: result
    });

  } catch (error) {
    console.error('Resolve conflict error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resolving conflict',
      error: error.message
    });
  }
};

/**
 * Clear completed items
 */
exports.clearCompleted = async (req, res) => {
  try {
    const userId = req.user.id;
    const { olderThan = 7 } = req.query; // Days

    const result = await syncService.clearCompleted(userId, parseInt(olderThan));

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Error clearing completed items',
        error: result.error
      });
    }

    res.json({
      success: true,
      message: `Cleared ${result.deleted} completed items`,
      data: { deleted: result.deleted }
    });

  } catch (error) {
    console.error('Clear completed error:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing completed items',
      error: error.message
    });
  }
};

/**
 * Retry failed items
 */
exports.retryFailed = async (req, res) => {
  try {
    const userId = req.user.id;
    const { deviceId } = req.query;

    const where = { userId, status: 'failed' };
    if (deviceId) where.deviceId = deviceId;

    // Reset failed items to pending
    await SyncQueue.update(
      { status: 'pending', retryCount: 0, errorMessage: null },
      { where }
    );

    // Process queue
    const result = await syncService.processSyncQueue(userId, deviceId);

    res.json({
      success: true,
      message: 'Retrying failed items',
      data: result
    });

  } catch (error) {
    console.error('Retry failed error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrying failed items',
      error: error.message
    });
  }
};

/**
 * Delete queue item
 */
exports.deleteQueueItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const item = await SyncQueue.findOne({
      where: { id, userId }
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Queue item not found'
      });
    }

    await item.destroy();

    res.json({
      success: true,
      message: 'Queue item deleted'
    });

  } catch (error) {
    console.error('Delete queue item error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting queue item',
      error: error.message
    });
  }
};

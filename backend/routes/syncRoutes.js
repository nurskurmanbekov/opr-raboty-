const express = require('express');
const router = express.Router();
const {
  batchSync,
  processQueue,
  getQueueStatus,
  getPendingItems,
  getConflicts,
  resolveConflict,
  clearCompleted,
  retryFailed,
  deleteQueueItem
} = require('../controllers/syncController');
const { protect } = require('../middleware/auth');

router.use(protect); // All routes need authentication

// Batch sync operations
router.post('/batch', batchSync);

// Queue management
router.post('/process', processQueue);
router.get('/status', getQueueStatus);
router.get('/pending', getPendingItems);

// Conflict resolution
router.get('/conflicts', getConflicts);
router.put('/conflicts/:id/resolve', resolveConflict);

// Queue maintenance
router.delete('/completed', clearCompleted);
router.post('/retry-failed', retryFailed);
router.delete('/:id', deleteQueueItem);

module.exports = router;

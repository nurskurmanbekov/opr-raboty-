const express = require('express');
const router = express.Router();
const {
  createMTU,
  getAllMTU,
  getMTUById,
  updateMTU,
  deleteMTU,
  assignClientToMTU,
  removeClientFromMTU,
  verifyQRCode
} = require('../controllers/mtuController');

// Import auth middleware
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

/**
 * MTU CRUD operations
 */
router.post('/create', createMTU);           // Create MTU (superadmin only)
router.get('/', getAllMTU);                   // Get all MTU locations
router.get('/:id', getMTUById);               // Get specific MTU
router.put('/:id', updateMTU);                // Update MTU (superadmin only)
router.delete('/:id', deleteMTU);             // Delete MTU (superadmin only)

/**
 * Client assignment operations
 */
router.post('/:id/assign', assignClientToMTU);              // Assign client to MTU
router.delete('/:id/assign/:clientId', removeClientFromMTU); // Remove client from MTU

/**
 * QR code verification (for mobile app)
 */
router.post('/verify-qr', verifyQRCode);      // Verify QR code and geofence

module.exports = router;

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
const { connectDB } = require('./config/database');
const { initializeFirebase } = require('./config/firebase');

// Load environment variables
dotenv.config();

// Initialize app
const app = express();

// Connect to database
connectDB();

// Initialize Firebase for push notifications
initializeFirebase();

// Middleware
app.use(helmet()); // Security headers

// CORS configuration - allow requests from mobile app and web frontend
app.use(cors({
  origin: '*', // Allow all origins (for development). In production, specify exact origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(compression()); // Compress responses
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan('dev')); // Logging

// Static files (for uploads)
const uploadsPath = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath));
console.log('📁 Serving static files from:', uploadsPath);

// Routes
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Probation System API',
    version: '1.0.0',
    status: 'running'
  });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/clients', require('./routes/clientRoutes'));
app.use('/api/work-sessions', require('./routes/workSessionRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/geofences', require('./routes/geofenceRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/face-verification', require('./routes/faceVerificationRoutes'));
app.use('/api/sync', require('./routes/syncRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
// Новые маршруты для системы ролей
app.use('/api/mru', require('./routes/mruRoutes'));
app.use('/api/districts', require('./routes/districtRoutes'));
app.use('/api/approvals', require('./routes/approvalRoutes'));
app.use('/api/officers', require('./routes/officerRoutes'));
app.use('/api/auditors', require('./routes/auditorRoutes'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Local: http://localhost:${PORT}`);
  console.log(`📱 Network: Server listening on all network interfaces (0.0.0.0:${PORT})`);
  console.log(`💡 To connect from mobile, use your machine's IP address`);
});
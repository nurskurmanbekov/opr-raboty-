const User = require('./User');
const Client = require('./Client');
const WorkSession = require('./WorkSession');
const Photo = require('./Photo');
const Geofence = require('./Geofence');
const GeofenceViolation = require('./GeofenceViolation');
const AuditLog = require('./AuditLog');
const LocationHistory = require('./LocationHistory');
const DeviceToken = require('./DeviceToken');
const Notification = require('./Notification');
const FaceVerification = require('./FaceVerification');
const SyncQueue = require('./SyncQueue');

// Relationships

// User -> Client (Officer has many Clients)
User.hasMany(Client, { foreignKey: 'officerId', as: 'clients' });
Client.belongsTo(User, { foreignKey: 'officerId', as: 'officer' });

// Client -> WorkSession
Client.hasMany(WorkSession, { foreignKey: 'clientId', as: 'workSessions' });
WorkSession.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });

// WorkSession -> Photo
WorkSession.hasMany(Photo, { foreignKey: 'workSessionId', as: 'photos' });
Photo.belongsTo(WorkSession, { foreignKey: 'workSessionId', as: 'workSession' });

// User -> WorkSession (Verifier)
User.hasMany(WorkSession, { foreignKey: 'verifiedBy', as: 'verifiedSessions' });
WorkSession.belongsTo(User, { foreignKey: 'verifiedBy', as: 'verifier' });

// User -> Geofence (Creator)
User.hasMany(Geofence, { foreignKey: 'createdBy', as: 'geofences' });
Geofence.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// WorkSession -> GeofenceViolation
WorkSession.hasMany(GeofenceViolation, { foreignKey: 'workSessionId', as: 'violations' });
GeofenceViolation.belongsTo(WorkSession, { foreignKey: 'workSessionId', as: 'workSession' });

// Client -> GeofenceViolation
Client.hasMany(GeofenceViolation, { foreignKey: 'clientId', as: 'violations' });
GeofenceViolation.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });

// Geofence -> GeofenceViolation
Geofence.hasMany(GeofenceViolation, { foreignKey: 'geofenceId', as: 'violations' });
GeofenceViolation.belongsTo(Geofence, { foreignKey: 'geofenceId', as: 'geofence' });

// User -> AuditLog
User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// WorkSession -> LocationHistory
WorkSession.hasMany(LocationHistory, { foreignKey: 'workSessionId', as: 'locationHistory' });
LocationHistory.belongsTo(WorkSession, { foreignKey: 'workSessionId', as: 'workSession' });

// Client -> LocationHistory
Client.hasMany(LocationHistory, { foreignKey: 'clientId', as: 'locationHistory' });
LocationHistory.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });

// User -> DeviceToken
User.hasMany(DeviceToken, { foreignKey: 'userId', as: 'deviceTokens' });
DeviceToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User -> Notification
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User -> FaceVerification
User.hasMany(FaceVerification, { foreignKey: 'userId', as: 'faceVerifications' });
FaceVerification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Photo -> FaceVerification
Photo.hasMany(FaceVerification, { foreignKey: 'photoId', as: 'faceVerifications' });
FaceVerification.belongsTo(Photo, { foreignKey: 'photoId', as: 'photo' });

// WorkSession -> FaceVerification
WorkSession.hasMany(FaceVerification, { foreignKey: 'workSessionId', as: 'faceVerifications' });
FaceVerification.belongsTo(WorkSession, { foreignKey: 'workSessionId', as: 'workSession' });

// User -> SyncQueue
User.hasMany(SyncQueue, { foreignKey: 'userId', as: 'syncQueue' });
SyncQueue.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  User,
  Client,
  WorkSession,
  Photo,
  Geofence,
  GeofenceViolation,
  AuditLog,
  LocationHistory,
  DeviceToken,
  Notification,
  FaceVerification,
  SyncQueue
};
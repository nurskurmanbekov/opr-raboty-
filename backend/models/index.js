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
// Новые модели для системы ролей
const MRU = require('./MRU');
const District = require('./District');
const PendingApproval = require('./PendingApproval');
const ClientAssignmentHistory = require('./ClientAssignmentHistory');
const AuditorPermission = require('./AuditorPermission');

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

// === НОВЫЕ СВЯЗИ ДЛЯ СИСТЕМЫ РОЛЕЙ ===

// MRU -> District (МРУ имеет много районов)
MRU.hasMany(District, { foreignKey: 'mruId', as: 'districts' });
District.belongsTo(MRU, { foreignKey: 'mruId', as: 'mru' });

// MRU -> User (МРУ имеет менеджера и офицеров)
MRU.hasMany(User, { foreignKey: 'mruId', as: 'users' });
User.belongsTo(MRU, { foreignKey: 'mruId', as: 'mru' });

// District -> User (Район имеет менеджера и офицеров)
District.hasMany(User, { foreignKey: 'districtId', as: 'users' });
User.belongsTo(District, { foreignKey: 'districtId', as: 'assignedDistrict' });

// District -> Client (Район имеет много клиентов)
District.hasMany(Client, { foreignKey: 'districtId', as: 'clients' });
Client.belongsTo(District, { foreignKey: 'districtId', as: 'assignedDistrict' });

// Client -> ClientAssignmentHistory (История переназначений клиента)
Client.hasMany(ClientAssignmentHistory, { foreignKey: 'clientId', as: 'assignmentHistory' });
ClientAssignmentHistory.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });

// User -> ClientAssignmentHistory (Офицер -> клиенты которые у него были)
User.hasMany(ClientAssignmentHistory, { foreignKey: 'newOfficerId', as: 'receivedAssignments' });
User.hasMany(ClientAssignmentHistory, { foreignKey: 'previousOfficerId', as: 'givenAssignments' });

// User -> PendingApproval (Заявки на одобрение)
User.hasMany(PendingApproval, { foreignKey: 'requesterId', as: 'createdApprovals' });
User.hasMany(PendingApproval, { foreignKey: 'reviewerId', as: 'reviewedApprovals' });
PendingApproval.belongsTo(User, { foreignKey: 'requesterId', as: 'requester' });
PendingApproval.belongsTo(User, { foreignKey: 'reviewerId', as: 'reviewer' });

// User -> AuditorPermission (Права аудитора)
User.hasOne(AuditorPermission, { foreignKey: 'auditorId', as: 'auditorPermissions' });
AuditorPermission.belongsTo(User, { foreignKey: 'auditorId', as: 'auditor' });

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
  SyncQueue,
  // Новые модели
  MRU,
  District,
  PendingApproval,
  ClientAssignmentHistory,
  AuditorPermission
};
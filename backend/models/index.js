const User = require('./User');
const Client = require('./Client');
const WorkSession = require('./WorkSession');
const Photo = require('./Photo');

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

module.exports = {
  User,
  Client,
  WorkSession,
  Photo
};
const ROLE_PERMISSIONS = {
  superadmin: ['*'], // Full access

  regional_admin: [
    'clients.view', 'clients.create', 'clients.edit', 'clients.delete',
    'officers.view', 'officers.create', 'officers.edit',
    'work_sessions.view', 'work_sessions.verify', 'work_sessions.reject',
    'geofences.view', 'geofences.create', 'geofences.edit', 'geofences.delete',
    'photos.view', 'photos.verify',
    'reports.view', 'reports.export',
    'analytics.view',
    'notifications.send'
  ],

  district_admin: [
    'clients.view', 'clients.create', 'clients.edit',
    'officers.view', 'officers.create',
    'work_sessions.view', 'work_sessions.verify', 'work_sessions.reject',
    'geofences.view', 'geofences.create', 'geofences.edit',
    'photos.view', 'photos.verify',
    'reports.view', 'reports.export',
    'analytics.view',
    'notifications.send'
  ],

  officer: [
    'clients.view', 'clients.create',
    'work_sessions.view', 'work_sessions.verify', 'work_sessions.reject',
    'photos.view', 'photos.verify',
    'reports.view',
    'geofences.view'
  ],

  supervisor: [
    'clients.view',
    'work_sessions.view',
    'photos.view',
    'geofences.view'
  ],

  analyst: [
    'clients.view',
    'work_sessions.view',
    'photos.view',
    'reports.view', 'reports.export',
    'analytics.view'
  ],

  observer: [
    'clients.view',
    'work_sessions.view',
    'reports.view'
  ],

  client: []
};

const hasPermission = (userRole, permission) => {
  if (userRole === 'superadmin') return true;

  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(permission) || permissions.includes('*');
};

const getRolePermissions = (role) => {
  return ROLE_PERMISSIONS[role] || [];
};

module.exports = {
  ROLE_PERMISSIONS,
  hasPermission,
  getRolePermissions
};

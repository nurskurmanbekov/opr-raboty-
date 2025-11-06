const { AuditLog } = require('../models');

const auditLogger = (resource) => {
  return async (req, res, next) => {
    // Store original methods
    const originalSend = res.send;
    const originalJson = res.json;

    // Capture old value for PUT/PATCH requests
    let oldValue = null;
    if (['PUT', 'PATCH'].includes(req.method) && req.params.id) {
      try {
        const Model = require(`../models/${resource}`);
        const record = await Model.findByPk(req.params.id);
        if (record) {
          oldValue = record.toJSON();
        }
      } catch (error) {
        // Continue even if we can't get old value
      }
    }

    // Override res.send
    res.send = function (data) {
      // Only log successful modifications
      if (res.statusCode >= 200 && res.statusCode < 300) {
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
          // Log asynchronously without blocking response
          setImmediate(async () => {
            try {
              let action = req.method.toLowerCase();
              if (action === 'post') action = 'create';
              if (action === 'put' || action === 'patch') action = 'update';

              await AuditLog.create({
                userId: req.user?.id,
                action,
                resource,
                resourceId: req.params.id || null,
                oldValue,
                newValue: typeof data === 'string' ? JSON.parse(data) : data,
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('user-agent')
              });
            } catch (error) {
              console.error('Audit log error:', error);
            }
          });
        }
      }

      originalSend.call(this, data);
    };

    // Override res.json
    res.json = function (data) {
      // Only log successful modifications
      if (res.statusCode >= 200 && res.statusCode < 300) {
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
          // Log asynchronously without blocking response
          setImmediate(async () => {
            try {
              let action = req.method.toLowerCase();
              if (action === 'post') action = 'create';
              if (action === 'put' || action === 'patch') action = 'update';

              await AuditLog.create({
                userId: req.user?.id,
                action,
                resource,
                resourceId: req.params.id || null,
                oldValue,
                newValue: data,
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('user-agent')
              });
            } catch (error) {
              console.error('Audit log error:', error);
            }
          });
        }
      }

      originalJson.call(this, data);
    };

    next();
  };
};

module.exports = auditLogger;

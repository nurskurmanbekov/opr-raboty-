const { AuditLog } = require('../models');

/**
 * Helper функция для логирования действий
 * Используется в контроллерах для явного логирования
 */
const logAction = async ({
  userId,
  userName,
  userRole,
  action,
  entityType,
  entityId,
  entityName,
  changes = {},
  description,
  ipAddress,
  userAgent,
  status = 'success',
  errorMessage = null
}) => {
  try {
    await AuditLog.create({
      userId,
      userName,
      userRole,
      action,
      entityType,
      entityId,
      entityName,
      changes,
      description,
      ipAddress,
      userAgent,
      status,
      errorMessage
    });
  } catch (error) {
    console.error('❌ Ошибка при логировании действия:', error);
    // Не прерываем основной процесс, если логирование не удалось
  }
};

/**
 * Middleware для автоматического логирования всех действий
 * Добавляется к роутам, которые нужно отслеживать
 */
const auditMiddleware = (action, entityType) => {
  return async (req, res, next) => {
    // Сохраняем оригинальный res.json
    const originalJson = res.json.bind(res);

    // Переопределяем res.json для перехвата успешных ответов
    res.json = function(data) {
      // Логируем только успешные операции (2xx статус коды)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Асинхронно логируем (не блокируем ответ)
        setImmediate(async () => {
          try {
            const user = req.user;
            if (!user) return; // Пропускаем если нет пользователя

            // Извлекаем информацию о сущности из ответа
            let entityId = null;
            let entityName = null;

            if (data && data.data) {
              // Если в ответе есть объект с id и name/fullName
              if (data.data.id) {
                entityId = data.data.id;
                entityName = data.data.fullName || data.data.name || null;
              }
              // Или если это клиент
              if (data.data.client) {
                entityId = data.data.client.id;
                entityName = data.data.client.fullName;
              }
            }

            // Или извлекаем из параметров URL
            if (!entityId && req.params.id) {
              entityId = req.params.id;
            }
            if (!entityId && req.params.clientId) {
              entityId = req.params.clientId;
            }

            await logAction({
              userId: user.id || user.dataValues?.id,
              userName: user.fullName || user.dataValues?.fullName,
              userRole: user.role || user.dataValues?.role,
              action,
              entityType,
              entityId,
              entityName,
              changes: req.body || {},
              description: `${action} ${entityType}`,
              ipAddress: req.ip || req.connection.remoteAddress,
              userAgent: req.get('User-Agent'),
              status: 'success'
            });
          } catch (error) {
            console.error('❌ Ошибка в audit middleware:', error);
          }
        });
      }

      // Вызываем оригинальный res.json
      return originalJson(data);
    };

    next();
  };
};

/**
 * Автоматическое определение action по HTTP методу
 */
const getActionByMethod = (method) => {
  const methodMap = {
    POST: 'create',
    PUT: 'update',
    PATCH: 'update',
    DELETE: 'delete',
    GET: 'export' // для экспорта данных
  };
  return methodMap[method] || 'update';
};

/**
 * Универсальный middleware для автоматического логирования
 * Использует req.method и req.baseUrl для определения действия
 */
const autoAudit = (entityType) => {
  return async (req, res, next) => {
    const action = getActionByMethod(req.method);
    return auditMiddleware(action, entityType)(req, res, next);
  };
};

/**
 * Старый auditLogger для обратной совместимости
 * @deprecated Используйте autoAudit или auditMiddleware
 */
const auditLogger = (resource) => {
  return autoAudit(resource);
};

module.exports = {
  logAction,
  auditMiddleware,
  autoAudit,
  auditLogger // для обратной совместимости
};

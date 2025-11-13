import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  History,
  Search,
  Filter,
  Calendar,
  User,
  FileText,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Layout from '../components/Layout';
import { auditLogsAPI } from '../api/api';
import { useTheme } from '../context/ThemeContext';

const AuditLog = () => {
  const { isDark } = useTheme();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedLog, setExpandedLog] = useState(null);

  // Фильтры
  const [filters, setFilters] = useState({
    search: '',
    action: '',
    entityType: '',
    status: '',
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    fetchAuditLogs();
  }, [page, filters]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const response = await auditLogsAPI.getAuditLogs({
        page,
        limit: 20,
        ...filters
      });

      setLogs(response.data.data);
      setTotalPages(response.data.totalPages);
      setLoading(false);
    } catch (error) {
      console.error('Ошибка при загрузке audit logs:', error);
      toast.error('Ошибка при загрузке истории действий');
      setLoading(false);
    }
  };

  const getActionColor = (action) => {
    const colors = {
      create: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      update: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      delete: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      login: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      logout: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
      export: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      approve: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      reject: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    };
    return colors[action] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'create':
      case 'approve':
        return CheckCircle;
      case 'delete':
      case 'reject':
        return XCircle;
      default:
        return FileText;
    }
  };

  const LogEntry = ({ log }) => {
    const Icon = getActionIcon(log.action);
    const isExpanded = expandedLog === log.id;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-xl p-4 mb-3 shadow transition-all ${
          isDark
            ? 'bg-gray-800 hover:bg-gray-750 border border-gray-700'
            : 'bg-white hover:bg-gray-50 border border-gray-100'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className={`p-3 rounded-lg ${getActionColor(log.action)}`}>
              <Icon size={20} />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {log.userName || 'Система'}
                </span>
                <span className={`text-sm px-2 py-1 rounded-lg ${getActionColor(log.action)}`}>
                  {log.action}
                </span>
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {log.entityType && `→ ${log.entityType}`}
                </span>
              </div>

              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {log.description}
              </p>

              <div className="flex items-center gap-4 mt-2">
                <span className={`text-xs flex items-center gap-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  <Calendar size={14} />
                  {new Date(log.createdAt).toLocaleString('ru-RU')}
                </span>
                {log.ipAddress && (
                  <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    IP: {log.ipAddress}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Кнопка развернуть */}
          {(log.changes && Object.keys(log.changes).length > 0) && (
            <button
              onClick={() => setExpandedLog(isExpanded ? null : log.id)}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          )}
        </div>

        {/* Детали изменений */}
        {isExpanded && log.changes && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`mt-4 p-4 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}
          >
            <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Детали изменений:
            </h4>
            <pre className={`text-xs overflow-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {JSON.stringify(log.changes, null, 2)}
            </pre>
          </motion.div>
        )}
      </motion.div>
    );
  };

  return (
    <Layout>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <History className="text-purple-600" size={32} />
          <h1 className={`text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent`}>
            История действий
          </h1>
        </div>
        <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Полный аудит всех действий в системе
        </p>
      </motion.div>

      {/* Фильтры */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`rounded-2xl p-6 mb-6 shadow-lg ${
          isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Поиск */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} size={20} />
              <input
                type="text"
                placeholder="Поиск по имени или описанию..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
              />
            </div>
          </div>

          {/* Действие */}
          <select
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            className={`px-4 py-2 rounded-lg border ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
          >
            <option value="">Все действия</option>
            <option value="create">Создание</option>
            <option value="update">Обновление</option>
            <option value="delete">Удаление</option>
            <option value="login">Вход</option>
            <option value="export">Экспорт</option>
          </select>

          {/* Тип сущности */}
          <select
            value={filters.entityType}
            onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
            className={`px-4 py-2 rounded-lg border ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
          >
            <option value="">Все типы</option>
            <option value="client">Клиенты</option>
            <option value="user">Пользователи</option>
            <option value="work_session">Сессии</option>
            <option value="report">Отчеты</option>
          </select>

          {/* Дата с */}
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            className={`px-4 py-2 rounded-lg border ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
          />

          {/* Дата по */}
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            className={`px-4 py-2 rounded-lg border ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
          />
        </div>
      </motion.div>

      {/* Список логов */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"
          />
        </div>
      ) : (logs?.length || 0) === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`text-center py-20 rounded-2xl ${
            isDark ? 'bg-gray-800' : 'bg-gray-50'
          }`}
        >
          <History className={`mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} size={64} />
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Нет записей в истории действий
          </p>
        </motion.div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {(logs || []).map((log) => (
              <LogEntry key={log.id} log={log} />
            ))}
          </motion.div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className={`px-4 py-2 rounded-lg transition-all ${
                  page === 1
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:scale-105'
                } ${
                  isDark
                    ? 'bg-gray-800 text-white'
                    : 'bg-white text-gray-900'
                } shadow`}
              >
                Назад
              </button>

              <span className={`px-4 py-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Страница {page} из {totalPages}
              </span>

              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className={`px-4 py-2 rounded-lg transition-all ${
                  page === totalPages
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:scale-105'
                } ${
                  isDark
                    ? 'bg-gray-800 text-white'
                    : 'bg-white text-gray-900'
                } shadow`}
              >
                Вперед
              </button>
            </div>
          )}
        </>
      )}
    </Layout>
  );
};

export default AuditLog;

import { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, CheckCircle, XCircle, Map, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Layout from '../components/Layout';
import WorkSessionMap from '../components/WorkSessionMap';

const STATUS_CONFIG = {
  in_progress: {
    badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    gradient: 'from-yellow-500 to-yellow-600',
    label: 'В процессе'
  },
  completed: {
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    gradient: 'from-blue-500 to-blue-600',
    label: 'Завершена'
  },
  verified: {
    badge: 'bg-green-100 text-green-800 border-green-200',
    gradient: 'from-green-500 to-green-600',
    label: 'Верифицирована'
  },
  rejected: {
    badge: 'bg-red-100 text-red-800 border-red-200',
    gradient: 'from-red-500 to-red-600',
    label: 'Отклонена'
  }
};

const WorkSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await api.get('/work-sessions');
      setSessions(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Ошибка при загрузке сессий');
      setLoading(false);
    }
  };

  const handleVerify = async (sessionId, status) => {
    const loadingToast = toast.loading(status === 'verified' ? 'Подтверждение сессии...' : 'Отклонение сессии...');
    try {
      await api.put(`/work-sessions/${sessionId}/verify`, {
        status,
        verificationNotes: status === 'verified' ? 'Работа подтверждена' : 'Требуется повторная проверка'
      });
      fetchSessions();
      toast.success(status === 'verified' ? 'Сессия подтверждена' : 'Сессия отклонена', { id: loadingToast });
    } catch (error) {
      console.error('Error verifying session:', error);
      toast.error('Ошибка при верификации', { id: loadingToast });
    }
  };

  const filteredSessions = sessions.filter(session => {
    if (filter === 'all') return true;
    return session.status === filter;
  });

  const getStatusConfig = (status) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.in_progress;
  };

  return (
    <Layout>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
          Рабочие сессии
        </h1>
        <p className="text-gray-600 mt-2">Мониторинг и верификация отработанных часов</p>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-md mb-6 p-2 flex flex-wrap gap-2"
      >
        {[
          { value: 'all', label: 'Все', count: sessions.length },
          { value: 'completed', label: 'Ожидают проверки', count: sessions.filter(s => s.status === 'completed').length },
          { value: 'verified', label: 'Верифицированные', count: sessions.filter(s => s.status === 'verified').length },
          { value: 'in_progress', label: 'В процессе', count: sessions.filter(s => s.status === 'in_progress').length }
        ].map(tab => (
          <motion.button
            key={tab.value}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter(tab.value)}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              filter === tab.value
                ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label} ({tab.count})
          </motion.button>
        ))}
      </motion.div>

      {/* Sessions List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-md p-6 animate-pulse">
              <div className="flex justify-between">
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="h-12 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-4">
            {filteredSessions.map((session, index) => {
              const statusConfig = getStatusConfig(session.status);
              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.01, y: -2 }}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl p-6 transition-all border border-gray-100"
                >
                  <div className="flex justify-between items-start flex-wrap gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center space-x-4 mb-4 flex-wrap gap-2">
                        <div className="flex items-center space-x-2">
                          <div className={`w-10 h-10 bg-gradient-to-br ${statusConfig.gradient} rounded-full flex items-center justify-center shadow`}>
                            <User className="text-white" size={20} />
                          </div>
                          <h3 className="text-xl font-semibold text-gray-800">
                            {session.client?.fullName || 'Клиент'}
                          </h3>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.badge}`}>
                          {statusConfig.label}
                        </span>
                      </div>

                      {/* Info Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className="flex items-center space-x-3 text-gray-600 bg-gray-50 p-3 rounded-lg"
                        >
                          <Calendar size={20} className="text-orange-500" />
                          <div>
                            <p className="text-xs text-gray-500">Дата</p>
                            <p className="text-sm font-medium">
                              {new Date(session.startTime).toLocaleDateString('ru-RU')}
                            </p>
                          </div>
                        </motion.div>

                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className="flex items-center space-x-3 text-gray-600 bg-gray-50 p-3 rounded-lg"
                        >
                          <Clock size={20} className="text-blue-500" />
                          <div>
                            <p className="text-xs text-gray-500">Часы</p>
                            <p className="text-sm font-medium">{session.hoursWorked || 0} ч</p>
                          </div>
                        </motion.div>

                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className="flex items-center space-x-3 text-gray-600 bg-gray-50 p-3 rounded-lg"
                        >
                          <MapPin size={20} className="text-green-500" />
                          <div>
                            <p className="text-xs text-gray-500">Место</p>
                            <p className="text-sm font-medium truncate">{session.workLocation || 'Не указано'}</p>
                          </div>
                        </motion.div>

                        {session.verifier ? (
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="flex items-center space-x-3 text-gray-600 bg-gray-50 p-3 rounded-lg"
                          >
                            <CheckCircle size={20} className="text-purple-500" />
                            <div>
                              <p className="text-xs text-gray-500">Проверил</p>
                              <p className="text-sm font-medium">{session.verifier.fullName}</p>
                            </div>
                          </motion.div>
                        ) : (
                          <div className="flex items-center justify-center text-gray-400 bg-gray-50 p-3 rounded-lg">
                            <span className="text-xs">Не верифицирована</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedSessionId(session.id)}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:shadow-lg transition"
                      >
                        <Map size={18} />
                        <span>На карте</span>
                      </motion.button>

                      {session.status === 'completed' && (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleVerify(session.id, 'verified')}
                            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:shadow-lg transition"
                          >
                            <CheckCircle size={18} />
                            <span>Подтвердить</span>
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleVerify(session.id, 'rejected')}
                            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:shadow-lg transition"
                          >
                            <XCircle size={18} />
                            <span>Отклонить</span>
                          </motion.button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {filteredSessions.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-md"
              >
                <motion.div
                  initial={{ y: -20 }}
                  animate={{ y: 0 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                >
                  <Clock size={64} className="text-gray-400 mx-auto mb-4" />
                </motion.div>
                <p className="text-gray-600 text-lg font-medium">Сессии не найдены</p>
                <p className="text-gray-500 text-sm mt-2">
                  Попробуйте изменить фильтр
                </p>
              </motion.div>
            )}
          </div>
        </AnimatePresence>
      )}

      {/* Map Modal */}
      {selectedSessionId && (
        <WorkSessionMap
          sessionId={selectedSessionId}
          onClose={() => setSelectedSessionId(null)}
        />
      )}
    </Layout>
  );
};

export default WorkSessions;

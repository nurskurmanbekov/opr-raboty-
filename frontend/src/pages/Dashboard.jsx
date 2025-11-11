import { useState, useEffect } from 'react';
import { Users, Activity, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Layout from '../components/Layout';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    completedSessions: 0,
    pendingSessions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [clientsRes, sessionsRes] = await Promise.all([
        api.get('/clients'),
        api.get('/work-sessions')
      ]);

      const clients = clientsRes.data.data;
      const sessions = sessionsRes.data.data;

      setStats({
        totalClients: clients.length,
        activeClients: clients.filter(c => c.status === 'active').length,
        completedSessions: sessions.filter(s => s.status === 'verified').length,
        pendingSessions: sessions.filter(s => s.status === 'completed').length
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Ошибка при загрузке статистики');
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Всего клиентов',
      value: stats.totalClients,
      icon: Users,
      gradient: 'from-blue-500 to-blue-600',
      delay: 0
    },
    {
      title: 'Активные клиенты',
      value: stats.activeClients,
      icon: Activity,
      gradient: 'from-green-500 to-green-600',
      delay: 0.1
    },
    {
      title: 'Верифицированные сессии',
      value: stats.completedSessions,
      icon: CheckCircle,
      gradient: 'from-purple-500 to-purple-600',
      delay: 0.2
    },
    {
      title: 'Ожидают проверки',
      value: stats.pendingSessions,
      icon: Clock,
      gradient: 'from-orange-500 to-orange-600',
      delay: 0.3
    }
  ];

  return (
    <Layout>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          Панель управления
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">Добро пожаловать в систему мониторинга пробации</p>
      </motion.div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-xl shadow-md p-6 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
                <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: card.delay, duration: 0.5 }}
                whileHover={{ y: -8, scale: 1.03 }}
                className="bg-white dark:bg-slate-900 rounded-xl shadow-lg hover:shadow-2xl p-6 transition-all border border-gray-100 dark:border-gray-800"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{card.title}</p>
                    <motion.p
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: card.delay + 0.2, duration: 0.5 }}
                      className="text-4xl font-bold text-gray-800 dark:text-gray-100 mt-2"
                    >
                      {card.value}
                    </motion.p>
                  </div>
                  <motion.div
                    initial={{ rotate: -180, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ delay: card.delay + 0.3, duration: 0.6, type: 'spring' }}
                    className={`bg-gradient-to-br ${card.gradient} p-4 rounded-xl shadow-md`}
                  >
                    <Icon size={28} className="text-white" />
                  </motion.div>
                </div>

                {/* Animated bottom border */}
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ delay: card.delay + 0.5, duration: 0.8 }}
                  className={`h-1 bg-gradient-to-r ${card.gradient} rounded-full mt-4`}
                />
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950 rounded-2xl p-8 border border-indigo-100 dark:border-indigo-900"
      >
        <div className="text-center">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3"
          >
            Система мониторинга работ пробации
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-gray-600 dark:text-gray-400"
          >
            Используйте боковое меню для навигации по разделам системы
          </motion.p>
        </div>
      </motion.div>
    </Layout>
  );
};

export default Dashboard;

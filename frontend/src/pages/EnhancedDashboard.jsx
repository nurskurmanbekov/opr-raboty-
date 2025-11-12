import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Users,
  Activity,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  Download,
  Moon,
  Sun,
  MapPin,
  BarChart3,
  FileText,
  Zap
} from 'lucide-react';
import Layout from '../components/Layout';
import { statisticsAPI, exportAPI } from '../api/api';
import { useTheme } from '../context/ThemeContext';

const EnhancedDashboard = () => {
  const { isDark, toggleTheme } = useTheme();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchDashboardStats();

    // Обновляем пульс каждые 30 секунд
    const interval = setInterval(fetchDashboardStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await statisticsAPI.getDashboardStats();
      setStats(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Ошибка при загрузке статистики:', error);
      toast.error('Ошибка при загрузке статистики');
      setLoading(false);
    }
  };

  const handleExport = async (format = 'excel') => {
    setExporting(true);
    const loadingToast = toast.loading(`Экспорт отчета (${format.toUpperCase()})...`);

    try {
      const blob = format === 'pdf'
        ? await exportAPI.exportStatisticsToPDF()
        : await exportAPI.exportStatisticsToExcel();

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Отчет успешно экспортирован!', { id: loadingToast });
    } catch (error) {
      console.error('Ошибка при экспорте:', error);
      toast.error('Ошибка при экспорте отчета', { id: loadingToast });
    } finally {
      setExporting(false);
    }
  };

  // ПУЛЬС СИСТЕМЫ - анимированный счетчик активных сессий
  const PulseIndicator = ({ count }) => (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative"
    >
      {/* Пульсирующие круги */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 0, 0.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="absolute w-20 h-20 rounded-full bg-green-500"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.7, 0, 0.7]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.5
          }}
          className="absolute w-16 h-16 rounded-full bg-green-400"
        />
      </div>

      {/* Центральный индикатор */}
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
        className="relative z-10 w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg"
      >
        <Zap className="text-white" size={28} />
      </motion.div>
    </motion.div>
  );

  // Карточка статистики
  const StatCard = ({ title, value, subtitle, icon: Icon, gradient, delay, trend }) => (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -5, scale: 1.02 }}
      className={`relative overflow-hidden rounded-2xl p-6 shadow-xl transition-all ${
        isDark
          ? 'bg-gray-800 border border-gray-700 hover:border-gray-600'
          : 'bg-white border border-gray-100 hover:border-gray-200'
      }`}
    >
      {/* Фоновый градиент */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-10 rounded-full -mr-16 -mt-16`} />

      <div className="relative flex items-center justify-between">
        <div className="flex-1">
          <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {title}
          </p>
          <motion.p
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay + 0.2, duration: 0.5 }}
            className={`text-4xl font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}
          >
            {value?.toLocaleString() || 0}
          </motion.p>
          {subtitle && (
            <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="flex items-center mt-2">
              <TrendingUp size={16} className="text-green-500 mr-1" />
              <span className="text-sm text-green-500 font-medium">{trend}</span>
            </div>
          )}
        </div>

        <motion.div
          initial={{ rotate: -180, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ delay: delay + 0.3, duration: 0.6, type: 'spring' }}
          className={`bg-gradient-to-br ${gradient} p-4 rounded-xl shadow-lg`}
        >
          <Icon size={28} className="text-white" />
        </motion.div>
      </div>

      {/* Анимированная нижняя граница */}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: '100%' }}
        transition={{ delay: delay + 0.5, duration: 0.8 }}
        className={`h-1 bg-gradient-to-r ${gradient} rounded-full mt-4`}
      />
    </motion.div>
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header с кнопками */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-center justify-between flex-wrap gap-4"
      >
        <div>
          <h1 className={`text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent`}>
            Панель управления
          </h1>
          <p className={`mt-2 text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Система мониторинга пробации Кыргызской Республики
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Переключатель темы */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className={`p-3 rounded-xl shadow-lg transition-all ${
              isDark
                ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <AnimatePresence mode="wait">
              {isDark ? (
                <motion.div
                  key="sun"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Sun size={24} />
                </motion.div>
              ) : (
                <motion.div
                  key="moon"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Moon size={24} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Кнопки экспорта */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleExport('excel')}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            <Download size={20} />
            <span className="font-medium">Excel</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleExport('pdf')}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            <FileText size={20} />
            <span className="font-medium">PDF</span>
          </motion.button>
        </div>
      </motion.div>

      {/* ПУЛЬС СИСТЕМЫ - Главная карточка */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className={`mb-8 rounded-2xl p-8 shadow-2xl ${
          isDark
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700'
            : 'bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100'
        }`}
      >
        <div className="flex items-center justify-between flex-wrap gap-6">
          <div className="flex items-center gap-6">
            <PulseIndicator count={stats?.pulse?.activeSessionsNow} />
            <div>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Пульс системы
              </h2>
              <p className={`text-lg mt-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {stats?.pulse?.message || 'Загрузка...'}
              </p>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                Обновлено: {new Date().toLocaleTimeString('ru-RU')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className={`text-center px-6 py-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-white'} shadow-lg`}>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Активных сейчас</p>
              <p className={`text-3xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'} mt-1`}>
                {stats?.pulse?.activeSessionsNow || 0}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Основные показатели */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Всего клиентов"
          value={stats?.clients?.total}
          subtitle={`Активных: ${stats?.clients?.active || 0}`}
          icon={Users}
          gradient="from-blue-500 to-blue-600"
          delay={0.2}
        />

        <StatCard
          title="Активные клиенты"
          value={stats?.clients?.active}
          subtitle={`Завершили: ${stats?.clients?.completed || 0}`}
          icon={Activity}
          gradient="from-green-500 to-green-600"
          delay={0.3}
        />

        <StatCard
          title="Офицеров"
          value={stats?.officers?.total}
          subtitle={`Средняя нагрузка: ${stats?.officers?.averageClientsPerOfficer || 0}`}
          icon={Users}
          gradient="from-purple-500 to-purple-600"
          delay={0.4}
        />

        <StatCard
          title="Одобрено сессий"
          value={stats?.sessions?.approved}
          subtitle={`Всего: ${stats?.sessions?.total || 0}`}
          icon={CheckCircle}
          gradient="from-orange-500 to-orange-600"
          delay={0.5}
        />
      </div>

      {/* Дополнительная статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Ожидают проверки"
          value={stats?.sessions?.pending}
          subtitle={`${stats?.photos?.needVerification || 0} фото требуют проверки`}
          icon={Clock}
          gradient="from-yellow-500 to-yellow-600"
          delay={0.6}
        />

        <StatCard
          title="Нарушения"
          value={stats?.violations?.total}
          subtitle="Выход из геозоны"
          icon={AlertCircle}
          gradient="from-red-500 to-red-600"
          delay={0.7}
        />

        <StatCard
          title="Выполнение плана"
          value={`${stats?.workHours?.completionPercentage || 0}%`}
          subtitle={`${stats?.workHours?.completed || 0} / ${stats?.workHours?.assigned || 0} часов`}
          icon={TrendingUp}
          gradient="from-indigo-500 to-indigo-600"
          delay={0.8}
          trend={`${stats?.workHours?.completionPercentage || 0}%`}
        />
      </div>
    </Layout>
  );
};

export default EnhancedDashboard;

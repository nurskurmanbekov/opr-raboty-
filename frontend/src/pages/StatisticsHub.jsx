import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Map, Network, History } from 'lucide-react';
import Layout from '../components/Layout';
import KyrgyzstanMap from '../components/KyrgyzstanMap';
import DrilldownNavigation from '../components/DrilldownNavigation';
import { statisticsAPI } from '../api/api';
import { useTheme } from '../contexts/ThemeContext';

const StatisticsHub = () => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('map'); // 'map' | 'drilldown'
  const [districtStats, setDistrictStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDistrictStats();
  }, []);

  const fetchDistrictStats = async () => {
    try {
      const response = await statisticsAPI.getDistrictStats();
      setDistrictStats(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Ошибка при загрузке статистики районов:', error);
      setLoading(false);
    }
  };

  const tabs = [
    {
      id: 'map',
      name: 'Карта КР',
      icon: Map,
      description: 'Интерактивная карта с активностью по регионам'
    },
    {
      id: 'drilldown',
      name: 'Детализация',
      icon: Network,
      description: 'Навигация МРУ → Район → Офицер → Клиент'
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
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="text-blue-600" size={32} />
          <h1 className={`text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent`}>
            Аналитика и статистика
          </h1>
        </div>
        <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Визуализация данных и drill-down анализ
        </p>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className="flex items-center gap-4 flex-wrap">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id)}
                className={`relative overflow-hidden rounded-xl p-4 shadow-lg transition-all ${
                  isActive
                    ? isDark
                      ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white'
                      : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                    : isDark
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    isActive
                      ? 'bg-white/20'
                      : isDark
                      ? 'bg-gray-700'
                      : 'bg-gray-100'
                  }`}>
                    <Icon size={24} />
                  </div>
                  <div className="text-left">
                    <div className="font-bold">{tab.name}</div>
                    <div className={`text-xs ${
                      isActive ? 'text-white/80' : isDark ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                      {tab.description}
                    </div>
                  </div>
                </div>

                {/* Активный индикатор */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-full"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-20"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
            />
          </motion.div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'map' && <KyrgyzstanMap districtStats={districtStats} />}
            {activeTab === 'drilldown' && <DrilldownNavigation />}
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
};

export default StatisticsHub;

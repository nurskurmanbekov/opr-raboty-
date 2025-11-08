import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ChevronRight,
  Home,
  Building2,
  MapPin,
  UserCog,
  Users,
  ArrowLeft,
  TrendingUp,
  Activity
} from 'lucide-react';
import { statisticsAPI } from '../api/api';
import { useTheme } from '../contexts/ThemeContext';

const DrilldownNavigation = () => {
  const { isDark } = useTheme();
  const [currentLevel, setCurrentLevel] = useState('mru'); // 'mru' | 'district' | 'officer' | 'client'
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMru, setSelectedMru] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedOfficer, setSelectedOfficer] = useState(null);

  useEffect(() => {
    fetchData();
  }, [currentLevel, selectedMru, selectedDistrict, selectedOfficer]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let params = {};

      switch (currentLevel) {
        case 'mru':
          params = { level: 'mru' };
          break;
        case 'district':
          params = { level: 'district', mruId: selectedMru?.id };
          break;
        case 'officer':
          params = { level: 'officer', districtId: selectedDistrict?.id };
          break;
        case 'client':
          params = { level: 'client', officerId: selectedOfficer?.id };
          break;
      }

      const response = await statisticsAPI.getDrilldownData(params);
      setData(response.data.data);
    } catch (error) {
      console.error('Ошибка при загрузке данных:', error);
      toast.error('Ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  };

  const navigateToLevel = (level, item = null) => {
    const newBreadcrumb = [...breadcrumb];

    switch (level) {
      case 'mru':
        setCurrentLevel('mru');
        setBreadcrumb([]);
        setSelectedMru(null);
        setSelectedDistrict(null);
        setSelectedOfficer(null);
        break;

      case 'district':
        setCurrentLevel('district');
        setSelectedMru(item);
        setBreadcrumb([{ level: 'mru', name: item.name, item }]);
        setSelectedDistrict(null);
        setSelectedOfficer(null);
        break;

      case 'officer':
        setCurrentLevel('officer');
        setSelectedDistrict(item);
        newBreadcrumb.push({ level: 'district', name: item.name, item });
        setBreadcrumb(newBreadcrumb);
        setSelectedOfficer(null);
        break;

      case 'client':
        setCurrentLevel('client');
        setSelectedOfficer(item);
        newBreadcrumb.push({ level: 'officer', name: item.fullName, item });
        setBreadcrumb(newBreadcrumb);
        break;
    }
  };

  const goBack = () => {
    if (breadcrumb.length === 0) return;

    const newBreadcrumb = [...breadcrumb];
    newBreadcrumb.pop();
    setBreadcrumb(newBreadcrumb);

    if (currentLevel === 'district') {
      setCurrentLevel('mru');
      setSelectedMru(null);
    } else if (currentLevel === 'officer') {
      setCurrentLevel('district');
      setSelectedDistrict(null);
    } else if (currentLevel === 'client') {
      setCurrentLevel('officer');
      setSelectedOfficer(null);
    }
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case 'mru':
        return Building2;
      case 'district':
        return MapPin;
      case 'officer':
        return UserCog;
      case 'client':
        return Users;
      default:
        return Home;
    }
  };

  const getLevelTitle = (level) => {
    switch (level) {
      case 'mru':
        return 'Межрегиональные управления';
      case 'district':
        return 'Районы';
      case 'officer':
        return 'Офицеры';
      case 'client':
        return 'Клиенты';
      default:
        return '';
    }
  };

  const DataCard = ({ item, onClick }) => {
    const Icon = getLevelIcon(currentLevel);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02, y: -2 }}
        onClick={onClick}
        className={`relative overflow-hidden rounded-xl p-6 shadow-lg cursor-pointer transition-all ${
          isDark
            ? 'bg-gray-800 border border-gray-700 hover:border-gray-600'
            : 'bg-white border border-gray-100 hover:border-blue-300'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <Icon className="text-white" size={24} />
            </div>
            <div>
              <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {item.name || item.fullName}
              </h3>
              {item.code && (
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Код: {item.code}
                </p>
              )}
            </div>
          </div>

          {currentLevel !== 'client' && (
            <ChevronRight className={isDark ? 'text-gray-400' : 'text-gray-600'} size={20} />
          )}
        </div>

        {/* Статистика */}
        {item.stats && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {item.stats.districts !== undefined && (
              <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Районов</p>
                <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {item.stats.districts}
                </p>
              </div>
            )}

            {item.stats.officers !== undefined && (
              <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Офицеров</p>
                <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {item.stats.officers}
                </p>
              </div>
            )}

            {item.stats.clients !== undefined && (
              <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Клиентов</p>
                <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {item.stats.clients}
                </p>
              </div>
            )}

            {item.stats.active !== undefined && (
              <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Активных</p>
                <p className="text-lg font-bold text-green-500">
                  {item.stats.active}
                </p>
              </div>
            )}

            {item.stats.completed !== undefined && (
              <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Завершили</p>
                <p className="text-lg font-bold text-blue-500">
                  {item.stats.completed}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Для клиентов - прогресс бар */}
        {currentLevel === 'client' && item.completionPercentage !== undefined && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Прогресс</span>
              <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {item.completionPercentage}%
              </span>
            </div>
            <div className={`w-full h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${item.completionPercentage}%` }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
              />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                {item.completedHours} / {item.assignedHours} часов
              </span>
              <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                Осталось: {item.remainingHours} ч
              </span>
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className={`rounded-2xl p-6 shadow-xl ${
      isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'
    }`}>
      {/* Header с breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {breadcrumb.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={goBack}
                className={`p-2 rounded-lg ${
                  isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <ArrowLeft size={20} />
              </motion.button>
            )}

            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {getLevelTitle(currentLevel)}
            </h2>
          </div>

          <div className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Всего: {data.length}
            </span>
          </div>
        </div>

        {/* Breadcrumb */}
        {breadcrumb.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => navigateToLevel('mru')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm ${
                isDark
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Home size={14} />
              <span>МРУ</span>
            </button>

            {breadcrumb.map((crumb, index) => (
              <div key={index} className="flex items-center gap-2">
                <ChevronRight size={16} className={isDark ? 'text-gray-600' : 'text-gray-400'} />
                <span className={`px-3 py-1 rounded-lg text-sm ${
                  isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                }`}>
                  {crumb.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Данные */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
          />
        </div>
      ) : data.length === 0 ? (
        <div className={`text-center py-20 rounded-xl ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Нет данных для отображения
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {data.map((item, index) => (
              <motion.div
                key={item.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <DataCard
                  item={item}
                  onClick={() => {
                    if (currentLevel === 'mru') {
                      navigateToLevel('district', item);
                    } else if (currentLevel === 'district') {
                      navigateToLevel('officer', item);
                    } else if (currentLevel === 'officer') {
                      navigateToLevel('client', item);
                    }
                  }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default DrilldownNavigation;

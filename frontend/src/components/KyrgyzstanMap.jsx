import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Users, Activity } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const KyrgyzstanMap = ({ districtStats = [] }) => {
  const { isDark } = useTheme();
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [hoveredDistrict, setHoveredDistrict] = useState(null);

  // Упрощенная карта регионов КР (примерные координаты для SVG)
  const regions = [
    {
      id: '1',
      name: 'Чуйская область',
      path: 'M250,150 L350,150 L350,250 L250,250 Z',
      center: { x: 300, y: 200 },
      color: '#3b82f6'
    },
    {
      id: '2',
      name: 'Иссык-Кульская область',
      path: 'M350,150 L500,150 L500,250 L350,250 Z',
      center: { x: 425, y: 200 },
      color: '#10b981'
    },
    {
      id: '3',
      name: 'Нарынская область',
      path: 'M350,250 L500,250 L500,350 L350,350 Z',
      center: { x: 425, y: 300 },
      color: '#f59e0b'
    },
    {
      id: '4',
      name: 'Таласская область',
      path: 'M150,150 L250,150 L250,250 L150,250 Z',
      center: { x: 200, y: 200 },
      color: '#ef4444'
    },
    {
      id: '5',
      name: 'Джалал-Абадская область',
      path: 'M200,300 L350,300 L350,400 L200,400 Z',
      center: { x: 275, y: 350 },
      color: '#8b5cf6'
    },
    {
      id: '6',
      name: 'Ошская область',
      path: 'M100,350 L200,350 L200,450 L100,450 Z',
      center: { x: 150, y: 400 },
      color: '#ec4899'
    },
    {
      id: '7',
      name: 'Баткенская область',
      path: 'M50,400 L150,400 L150,500 L50,500 Z',
      center: { x: 100, y: 450 },
      color: '#06b6d4'
    },
    {
      id: 'bishkek',
      name: 'г. Бишкек',
      path: 'M275,175 L285,175 L285,185 L275,185 Z',
      center: { x: 280, y: 180 },
      color: '#f97316',
      isCity: true
    },
    {
      id: 'osh',
      name: 'г. Ош',
      path: 'M135,375 L145,375 L145,385 L135,385 Z',
      center: { x: 140, y: 380 },
      color: '#f97316',
      isCity: true
    }
  ];

  // Получаем статистику для региона
  const getRegionStats = (regionName) => {
    return districtStats.find(d => d.name?.includes(regionName.split(' ')[0])) || {};
  };

  // Вычисляем интенсивность цвета на основе активности
  const getActivityOpacity = (regionName) => {
    const stats = getRegionStats(regionName);
    const activeSessionsNow = stats.stats?.activeSessionsNow || 0;
    return Math.min(0.3 + (activeSessionsNow / 10) * 0.7, 1);
  };

  return (
    <div className={`relative rounded-2xl p-6 shadow-xl ${
      isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'
    }`}>
      {/* Заголовок */}
      <div className="flex items-center gap-3 mb-6">
        <MapPin className="text-blue-600" size={28} />
        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Карта активности по Кыргызстану
        </h2>
      </div>

      {/* SVG Карта */}
      <div className="relative">
        <svg
          viewBox="0 0 600 600"
          className="w-full h-auto"
          style={{ maxHeight: '600px' }}
        >
          {/* Фон карты */}
          <rect
            x="0"
            y="0"
            width="600"
            height="600"
            fill={isDark ? '#1f2937' : '#f3f4f6'}
            rx="20"
          />

          {/* Регионы */}
          {regions.map((region) => {
            const stats = getRegionStats(region.name);
            const isHovered = hoveredDistrict === region.id;
            const isSelected = selectedDistrict?.id === region.id;

            return (
              <motion.g
                key={region.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {/* Область региона */}
                <motion.path
                  d={region.path}
                  fill={region.color}
                  fillOpacity={isSelected ? 0.8 : getActivityOpacity(region.name)}
                  stroke={isDark ? '#374151' : '#e5e7eb'}
                  strokeWidth={isHovered || isSelected ? 3 : 1}
                  whileHover={{ scale: 1.02 }}
                  onMouseEnter={() => setHoveredDistrict(region.id)}
                  onMouseLeave={() => setHoveredDistrict(null)}
                  onClick={() => setSelectedDistrict(region)}
                  className="cursor-pointer transition-all"
                  style={{
                    filter: isHovered || isSelected ? 'brightness(1.2)' : 'brightness(1)',
                    transformOrigin: `${region.center.x}px ${region.center.y}px`
                  }}
                />

                {/* Индикатор активности */}
                {stats.stats?.activeSessionsNow > 0 && (
                  <motion.circle
                    cx={region.center.x}
                    cy={region.center.y}
                    r={region.isCity ? 5 : 8}
                    fill="#ef4444"
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.8, 1, 0.8]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  />
                )}

                {/* Название города (для крупных городов) */}
                {region.isCity && (
                  <text
                    x={region.center.x}
                    y={region.center.y + 15}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="bold"
                    fill={isDark ? '#fff' : '#000'}
                  >
                    {region.name}
                  </text>
                )}
              </motion.g>
            );
          })}
        </svg>

        {/* Tooltip при наведении */}
        <AnimatePresence>
          {hoveredDistrict && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className={`absolute top-4 right-4 p-4 rounded-xl shadow-2xl ${
                isDark ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
              }`}
              style={{ minWidth: '200px' }}
            >
              {(() => {
                const region = regions.find(r => r.id === hoveredDistrict);
                const stats = getRegionStats(region.name);

                return (
                  <>
                    <h3 className={`font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {region.name}
                    </h3>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          Офицеров:
                        </span>
                        <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {stats.stats?.officers || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          Клиентов:
                        </span>
                        <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {stats.stats?.clients || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          <Activity size={14} className="text-green-500" />
                          Активных сейчас:
                        </span>
                        <span className="text-sm font-bold text-green-500">
                          {stats.stats?.activeSessionsNow || 0}
                        </span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Информация о выбранном регионе */}
        <AnimatePresence>
          {selectedDistrict && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`mt-6 p-6 rounded-xl shadow-lg ${
                isDark ? 'bg-gray-900 border border-gray-700' : 'bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100'
              }`}
            >
              {(() => {
                const stats = getRegionStats(selectedDistrict.name);

                return (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {selectedDistrict.name}
                      </h3>
                      <button
                        onClick={() => setSelectedDistrict(null)}
                        className={`px-3 py-1 rounded-lg ${
                          isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-white hover:bg-gray-50 text-gray-700'
                        } transition-colors`}
                      >
                        Закрыть
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className={`text-center p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                        <Users className={`mx-auto mb-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} size={24} />
                        <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {stats.stats?.officers || 0}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Офицеров</p>
                      </div>

                      <div className={`text-center p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                        <Users className={`mx-auto mb-2 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} size={24} />
                        <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {stats.stats?.clients || 0}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Клиентов</p>
                      </div>

                      <div className={`text-center p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                        <Activity className="mx-auto mb-2 text-green-500" size={24} />
                        <p className="text-2xl font-bold text-green-500">
                          {stats.stats?.activeSessionsNow || 0}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Активных</p>
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Легенда */}
      <div className="mt-6 flex items-center justify-center gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-500" />
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Чуйская</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500" />
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Иссык-Кульская</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-500" />
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Нарынская</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500" />
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Таласская</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-purple-500" />
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Джалал-Абадская</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-pink-500" />
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Ошская</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-cyan-500" />
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Баткенская</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Активные сессии</span>
        </div>
      </div>
    </div>
  );
};

export default KyrgyzstanMap;

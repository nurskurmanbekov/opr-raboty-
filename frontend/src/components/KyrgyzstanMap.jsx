import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Users, Activity, TrendingUp, Circle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const KyrgyzstanMap = ({ districtStats = [] }) => {
  const { isDark } = useTheme();
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [hoveredDistrict, setHoveredDistrict] = useState(null);
  const [groupByMru, setGroupByMru] = useState(true);

  // Цвета для разных МРУ (по кругу)
  const mruColors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
  ];

  // Группируем районы по МРУ
  const groupedDistricts = districtStats.reduce((acc, district) => {
    const mruName = district.mru?.name || 'Без МРУ';
    if (!acc[mruName]) {
      acc[mruName] = [];
    }
    acc[mruName].push(district);
    return acc;
  }, {});

  // Получаем цвет для МРУ
  const getMruColor = (mruName) => {
    const mruNames = Object.keys(groupedDistricts);
    const index = mruNames.indexOf(mruName);
    return mruColors[index % mruColors.length];
  };

  // Вычисляем размер маркера на основе активности
  const getMarkerSize = (district) => {
    const baseSize = 12;
    const activeBonus = (district.stats?.activeSessionsNow || 0) * 2;
    return Math.min(baseSize + activeBonus, 30);
  };

  // Вычисляем координаты для районов (если нет coordinates в БД)
  const getDistrictPosition = (district, index, total) => {
    // Если есть coordinates в БД, используем их
    if (district.coordinates?.lat && district.coordinates?.lng) {
      // Преобразуем lat/lng в SVG координаты (упрощенно)
      // Кыргызстан: ~39.5-43.5N, ~69-80E
      const x = ((district.coordinates.lng - 69) / (80 - 69)) * 500 + 50;
      const y = ((43.5 - district.coordinates.lat) / (43.5 - 39.5)) * 400 + 100;
      return { x, y };
    }

    // Иначе распределяем равномерно по кругу
    const centerX = 300;
    const centerY = 300;
    const radius = 150;
    const angle = (index / total) * 2 * Math.PI;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  };

  return (
    <div className={`relative rounded-2xl p-6 shadow-xl ${
      isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'
    }`}>
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MapPin className="text-blue-600" size={28} />
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Карта районов Кыргызстана
          </h2>
        </div>
        <button
          onClick={() => setGroupByMru(!groupByMru)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isDark
              ? 'bg-gray-700 hover:bg-gray-600 text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
          }`}
        >
          {groupByMru ? 'По районам' : 'По МРУ'}
        </button>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-blue-50'}`}>
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="text-blue-600" size={20} />
            <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Всего районов
            </span>
          </div>
          <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {districtStats.length}
          </p>
        </div>

        <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-purple-50'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Users className="text-purple-600" size={20} />
            <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Всего клиентов
            </span>
          </div>
          <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {districtStats.reduce((sum, d) => sum + (d.stats?.clients || 0), 0)}
          </p>
        </div>

        <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-green-50'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Activity className="text-green-600" size={20} />
            <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Активных сейчас
            </span>
          </div>
          <p className="text-3xl font-bold text-green-500">
            {districtStats.reduce((sum, d) => sum + (d.stats?.activeSessionsNow || 0), 0)}
          </p>
        </div>
      </div>

      {/* SVG Визуализация карты */}
      <div className="relative mb-6">
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

          {/* Упрощенный контур Кыргызстана (декоративный) */}
          <path
            d="M100,250 Q150,200 250,220 Q350,240 450,200 Q500,180 550,220 L550,400 Q500,450 400,420 Q300,400 200,440 Q150,460 100,420 Z"
            fill={isDark ? '#374151' : '#e5e7eb'}
            fillOpacity="0.3"
            stroke={isDark ? '#4b5563' : '#d1d5db'}
            strokeWidth="2"
          />

          {/* Маркеры районов */}
          {districtStats.map((district, index) => {
            const position = getDistrictPosition(district, index, districtStats.length);
            const size = getMarkerSize(district);
            const isHovered = hoveredDistrict === district.id;
            const isSelected = selectedDistrict?.id === district.id;
            const mruColor = getMruColor(district.mru?.name || 'Без МРУ');

            return (
              <g key={district.id}>
                {/* Пульсирующий круг для активных */}
                {district.stats?.activeSessionsNow > 0 && (
                  <motion.circle
                    cx={position.x}
                    cy={position.y}
                    r={size + 10}
                    fill={mruColor}
                    fillOpacity="0.2"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.3, 0.1, 0.3]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  />
                )}

                {/* Основной маркер */}
                <motion.circle
                  cx={position.x}
                  cy={position.y}
                  r={size}
                  fill={mruColor}
                  fillOpacity={isSelected ? 1 : isHovered ? 0.9 : 0.7}
                  stroke={isDark ? '#fff' : '#000'}
                  strokeWidth={isSelected ? 3 : isHovered ? 2 : 1}
                  strokeOpacity={isSelected || isHovered ? 1 : 0.3}
                  className="cursor-pointer"
                  whileHover={{ scale: 1.3 }}
                  onMouseEnter={() => setHoveredDistrict(district.id)}
                  onMouseLeave={() => setHoveredDistrict(null)}
                  onClick={() => setSelectedDistrict(district)}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.02 }}
                />

                {/* Индикатор активности */}
                {district.stats?.activeSessionsNow > 0 && (
                  <motion.circle
                    cx={position.x}
                    cy={position.y}
                    r={4}
                    fill="#22c55e"
                    animate={{
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                    }}
                  />
                )}

                {/* Название района (при наведении) */}
                {isHovered && (
                  <motion.text
                    x={position.x}
                    y={position.y - size - 10}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="bold"
                    fill={isDark ? '#fff' : '#000'}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {district.name}
                  </motion.text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Tooltip при наведении */}
        <AnimatePresence>
          {hoveredDistrict && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`absolute top-4 right-4 p-4 rounded-xl shadow-2xl ${
                isDark ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
              }`}
              style={{ minWidth: '220px', zIndex: 10 }}
            >
              {(() => {
                const district = districtStats.find(d => d.id === hoveredDistrict);
                if (!district) return null;

                return (
                  <>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {district.name}
                        </h3>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {district.mru?.name || 'МРУ не указано'}
                        </p>
                      </div>
                      <Circle
                        size={12}
                        fill={getMruColor(district.mru?.name || 'Без МРУ')}
                        stroke="none"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          Офицеров:
                        </span>
                        <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {district.stats?.officers || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          Клиентов:
                        </span>
                        <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {district.stats?.clients || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                        <span className={`text-sm flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          <Activity size={14} className="text-green-500" />
                          Активных:
                        </span>
                        <span className="text-sm font-bold text-green-500">
                          {district.stats?.activeSessionsNow || 0}
                        </span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Детальная информация о выбранном районе */}
      <AnimatePresence>
        {selectedDistrict && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`mb-6 p-6 rounded-xl shadow-lg overflow-hidden ${
              isDark ? 'bg-gray-900 border border-gray-700' : 'bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {selectedDistrict.name}
                </h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {selectedDistrict.mru?.name || 'МРУ не указано'} • {selectedDistrict.city}
                </p>
              </div>
              <button
                onClick={() => setSelectedDistrict(null)}
                className={`px-4 py-2 rounded-lg ${
                  isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-white hover:bg-gray-50 text-gray-700'
                } transition-colors`}
              >
                Закрыть
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className={`text-center p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                <Users className={`mx-auto mb-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} size={28} />
                <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {selectedDistrict.stats?.officers || 0}
                </p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Офицеров</p>
              </div>

              <div className={`text-center p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                <Users className={`mx-auto mb-2 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} size={28} />
                <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {selectedDistrict.stats?.clients || 0}
                </p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Клиентов</p>
              </div>

              <div className={`text-center p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
                <Activity className="mx-auto mb-2 text-green-500" size={28} />
                <p className="text-3xl font-bold text-green-500">
                  {selectedDistrict.stats?.activeSessionsNow || 0}
                </p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Активных</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Список районов (сгруппированный или плоский) */}
      <div className="space-y-4">
        {groupByMru ? (
          // Группировка по МРУ
          Object.entries(groupedDistricts).map(([mruName, districts]) => (
            <motion.div
              key={mruName}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}
            >
              <div className="flex items-center gap-2 mb-3">
                <Circle
                  size={16}
                  fill={getMruColor(mruName)}
                  stroke="none"
                />
                <h4 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {mruName} ({districts.length})
                </h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {districts.map(district => (
                  <button
                    key={district.id}
                    onClick={() => {
                      setSelectedDistrict(district);
                      setHoveredDistrict(null);
                    }}
                    className={`p-3 rounded-lg text-left transition-all ${
                      selectedDistrict?.id === district.id
                        ? isDark ? 'bg-gray-600 ring-2 ring-blue-500' : 'bg-white ring-2 ring-blue-500'
                        : isDark ? 'bg-gray-800 hover:bg-gray-600' : 'bg-white hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {district.name}
                      </span>
                      {district.stats?.activeSessionsNow > 0 && (
                        <Circle size={8} fill="#22c55e" className="animate-pulse" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                        👥 {district.stats?.clients || 0}
                      </span>
                      <span className="text-green-500">
                        ⚡ {district.stats?.activeSessionsNow || 0}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          ))
        ) : (
          // Плоский список
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {districtStats.map(district => (
              <button
                key={district.id}
                onClick={() => {
                  setSelectedDistrict(district);
                  setHoveredDistrict(null);
                }}
                onMouseEnter={() => setHoveredDistrict(district.id)}
                onMouseLeave={() => setHoveredDistrict(null)}
                className={`p-4 rounded-lg text-left transition-all ${
                  selectedDistrict?.id === district.id
                    ? isDark ? 'bg-gray-700 ring-2 ring-blue-500' : 'bg-gray-100 ring-2 ring-blue-500'
                    : isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Circle
                    size={12}
                    fill={getMruColor(district.mru?.name || 'Без МРУ')}
                    stroke="none"
                  />
                  <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {district.name}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs mb-1">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                    👥 {district.stats?.clients || 0}
                  </span>
                  {district.stats?.activeSessionsNow > 0 && (
                    <span className="text-green-500 flex items-center gap-1">
                      <Circle size={6} fill="#22c55e" className="animate-pulse" />
                      {district.stats.activeSessionsNow}
                    </span>
                  )}
                </div>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  {district.mru?.name || 'МРУ не указано'}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Легенда */}
      <div className={`mt-6 p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Легенда:
            </span>
            <div className="flex items-center gap-2">
              <Circle size={12} fill="#22c55e" className="animate-pulse" />
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Активные сессии
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-500" />
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Размер маркера = активность района
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KyrgyzstanMap;

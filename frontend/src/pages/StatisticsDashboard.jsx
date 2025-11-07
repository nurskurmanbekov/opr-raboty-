import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { BarChart3, Download, Users, Activity, Building2, Map, UserCog, TrendingUp } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Layout from '../components/Layout';
import { auditorAPI, mruAPI, districtsAPI, exportAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const StatisticsDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [overviewStats, setOverviewStats] = useState(null);
  const [statsByMRU, setStatsByMRU] = useState([]);
  const [statsByDistrict, setStatsByDistrict] = useState([]);
  const [mrus, setMrus] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [permissionsForm, setPermissionsForm] = useState({
    accessType: 'all',
    allowedMruIds: [],
    allowedDistrictIds: [],
    organization: ''
  });

  const isAdmin = user?.role === 'central_admin' || user?.role === 'superadmin';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [overviewRes, mruStatsRes, districtStatsRes, mruListRes, districtListRes] = await Promise.all([
        auditorAPI.getOverviewStatistics(),
        auditorAPI.getStatisticsByMRU(),
        auditorAPI.getStatisticsByDistrict(),
        mruAPI.getAllMRU(),
        districtsAPI.getAllDistricts()
      ]);

      setOverviewStats(overviewRes.data);
      setStatsByMRU(mruStatsRes.data || []);
      setStatsByDistrict(districtStatsRes.data || []);
      setMrus(mruListRes.data || []);
      setDistricts(districtListRes.data || []);
    } catch (error) {
      console.error('Ошибка при загрузке статистики:', error);
      toast.error('Ошибка при загрузке статистики');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPermissions = async (e) => {
    e.preventDefault();
    if (!selectedUserId) {
      toast.error('Выберите пользователя');
      return;
    }

    const loadingToast = toast.loading('Установка прав...');
    try {
      await auditorAPI.setPermissions(selectedUserId, permissionsForm);
      toast.success('Права аудитора успешно установлены', { id: loadingToast });
      setShowPermissionsModal(false);
      setSelectedUserId('');
      setPermissionsForm({
        accessType: 'all',
        allowedMruIds: [],
        allowedDistrictIds: [],
        organization: ''
      });
    } catch (error) {
      console.error('Ошибка при установке прав:', error);
      toast.error(error.message || 'Ошибка при установке прав аудитора', { id: loadingToast });
    }
  };

  const handleExportStatistics = async () => {
    const loadingToast = toast.loading('Экспорт статистики...');
    try {
      const blob = await exportAPI.exportStatisticsToExcel();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `statistics_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Статистика успешно экспортирована', { id: loadingToast });
    } catch (error) {
      console.error('Ошибка при экспорте:', error);
      toast.error('Ошибка при экспорте статистики', { id: loadingToast });
    }
  };

  const handleExportClients = async () => {
    const loadingToast = toast.loading('Экспорт клиентов...');
    try {
      const blob = await exportAPI.exportClientsToExcel();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clients_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Список клиентов успешно экспортирован', { id: loadingToast });
    } catch (error) {
      console.error('Ошибка при экспорте:', error);
      toast.error('Ошибка при экспорте списка клиентов', { id: loadingToast });
    }
  };

  const handleAccessTypeChange = (newType) => {
    setPermissionsForm({
      ...permissionsForm,
      accessType: newType,
      allowedMruIds: [],
      allowedDistrictIds: []
    });
  };

  const toggleMRU = (mruId) => {
    const newAllowedMruIds = permissionsForm.allowedMruIds.includes(mruId)
      ? permissionsForm.allowedMruIds.filter(id => id !== mruId)
      : [...permissionsForm.allowedMruIds, mruId];
    setPermissionsForm({ ...permissionsForm, allowedMruIds: newAllowedMruIds });
  };

  const toggleDistrict = (districtId) => {
    const newAllowedDistrictIds = permissionsForm.allowedDistrictIds.includes(districtId)
      ? permissionsForm.allowedDistrictIds.filter(id => id !== districtId)
      : [...permissionsForm.allowedDistrictIds, districtId];
    setPermissionsForm({ ...permissionsForm, allowedDistrictIds: newAllowedDistrictIds });
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          {/* Skeleton для карточек */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-md animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  // Подготовка данных для графиков
  const pieData = overviewStats ? [
    { name: 'Активные', value: overviewStats.activeClients },
    { name: 'Всего', value: overviewStats.totalClients - overviewStats.activeClients }
  ] : [];

  const barData = statsByMRU.slice(0, 5).map(stat => ({
    name: stat.mruName,
    клиенты: stat.clientsCount,
    офицеры: stat.officersCount
  }));

  return (
    <Layout>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Статистика и отчеты
          </h1>
          <p className="text-gray-600 mt-2">Аналитика работы системы пробации</p>
        </div>
        <div className="flex space-x-3">
          {isAdmin && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowPermissionsModal(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition shadow-md"
            >
              <UserCog size={20} />
              <span>Права аудиторов</span>
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExportStatistics}
            className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition shadow-md"
          >
            <Download size={20} />
            <span>Экспорт статистики</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExportClients}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition shadow-md"
          >
            <Download size={20} />
            <span>Экспорт клиентов</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Overview Statistics */}
      {overviewStats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { title: 'Всего клиентов', value: overviewStats.totalClients, subtitle: `Активных: ${overviewStats.activeClients}`, icon: Users, gradient: 'from-blue-500 to-blue-600', delay: 0 },
              { title: 'Офицеров', value: overviewStats.totalOfficers, subtitle: 'Активных офицеров', icon: UserCog, gradient: 'from-green-500 to-green-600', delay: 0.1 },
              { title: 'МРУ', value: overviewStats.totalMrus, subtitle: 'Межрайонных управлений', icon: Building2, gradient: 'from-purple-500 to-purple-600', delay: 0.2 },
              { title: 'Районов', value: overviewStats.totalDistricts, subtitle: 'Административных районов', icon: Map, gradient: 'from-orange-500 to-orange-600', delay: 0.3 }
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: stat.delay }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className={`bg-gradient-to-br ${stat.gradient} p-6 rounded-xl shadow-lg text-white relative overflow-hidden`}
                >
                  <div className="relative z-10">
                    <p className="text-white/80 text-sm font-medium">{stat.title}</p>
                    <p className="text-4xl font-bold mt-2">{stat.value}</p>
                    <p className="text-white/70 text-xs mt-2">{stat.subtitle}</p>
                  </div>
                  <Icon className="absolute right-4 bottom-4 text-white/20" size={60} />
                </motion.div>
              );
            })}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Bar Chart */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white p-6 rounded-xl shadow-lg"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <BarChart3 className="mr-2 text-blue-600" size={24} />
                ТОП-5 МРУ по нагрузке
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="клиенты" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="офицеры" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Pie Chart */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white p-6 rounded-xl shadow-lg"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Activity className="mr-2 text-purple-600" size={24} />
                Распределение клиентов
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Hours and Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl shadow-lg border border-blue-100"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Часы работы</h3>
                <Activity className="text-blue-600" size={24} />
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Всего отработано</span>
                    <span className="font-semibold text-gray-800">{overviewStats.totalHoursWorked} ч</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 1, delay: 0.8 }}
                      className="bg-gradient-to-r from-blue-600 to-blue-500 h-3 rounded-full"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-blue-200">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">На клиента</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {overviewStats.totalClients > 0
                        ? Math.round(overviewStats.totalHoursWorked / overviewStats.totalClients)
                        : 0} ч
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Активных</p>
                    <p className="text-2xl font-bold text-green-600">{overviewStats.activeClients}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl shadow-lg border border-purple-100"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Распределение</h3>
                <TrendingUp className="text-purple-600" size={24} />
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Клиентов на офицера</span>
                    <span className="font-semibold text-gray-800">
                      {overviewStats.totalOfficers > 0
                        ? (overviewStats.totalClients / overviewStats.totalOfficers).toFixed(1)
                        : 0}
                    </span>
                  </div>
                  <div className="w-full bg-purple-200 rounded-full h-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '75%' }}
                      transition={{ duration: 1, delay: 0.9 }}
                      className="bg-gradient-to-r from-purple-600 to-purple-500 h-3 rounded-full"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-purple-200">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Районов в МРУ</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {overviewStats.totalMrus > 0
                        ? (overviewStats.totalDistricts / overviewStats.totalMrus).toFixed(1)
                        : 0}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Офицеров в районе</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {overviewStats.totalDistricts > 0
                        ? (overviewStats.totalOfficers / overviewStats.totalDistricts).toFixed(1)
                        : 0}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}

      {/* Statistics by MRU */}
      {statsByMRU.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Статистика по МРУ</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">МРУ</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Районов</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Офицеров</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Клиентов</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Активных</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Часов</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {statsByMRU.map((stat, index) => (
                  <motion.tr
                    key={stat.mruId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + index * 0.05 }}
                    className="hover:bg-blue-50 transition"
                  >
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-800">{stat.mruName}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{stat.districtsCount}</td>
                    <td className="px-6 py-4 text-gray-600">{stat.officersCount}</td>
                    <td className="px-6 py-4 text-gray-600">{stat.clientsCount}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                        {stat.activeClientsCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{stat.totalHoursCompleted} ч</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Permissions Modal */}
      <Modal
        isOpen={showPermissionsModal}
        onClose={() => {
          setShowPermissionsModal(false);
          setPermissionsForm({ accessType: 'all', allowedMruIds: [], allowedDistrictIds: [], organization: '' });
        }}
        title="Установить права аудитора"
      >
        <form onSubmit={handleSetPermissions} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ID пользователя (аудитора) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              placeholder="Введите ID пользователя"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Организация
            </label>
            <input
              type="text"
              value={permissionsForm.organization}
              onChange={(e) => setPermissionsForm({ ...permissionsForm, organization: e.target.value })}
              placeholder="Например: Администрация Президента"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Уровень доступа <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {[
                { value: 'all', title: 'Все данные', desc: 'Доступ ко всей статистике системы' },
                { value: 'mru', title: 'Определенные МРУ', desc: 'Доступ к конкретным МРУ' },
                { value: 'district', title: 'Определенные районы', desc: 'Доступ к конкретным районам' }
              ].map((option) => (
                <label key={option.value} className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    value={option.value}
                    checked={permissionsForm.accessType === option.value}
                    onChange={(e) => handleAccessTypeChange(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <p className="font-medium text-gray-800">{option.title}</p>
                    <p className="text-xs text-gray-500">{option.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {permissionsForm.accessType === 'mru' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Выберите МРУ</label>
              <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-2">
                {mrus.map((mru) => (
                  <label key={mru.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissionsForm.allowedMruIds.includes(mru.id)}
                      onChange={() => toggleMRU(mru.id)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">{mru.name} - {mru.region}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {permissionsForm.accessType === 'district' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Выберите районы</label>
              <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-2">
                {districts.map((district) => (
                  <label key={district.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissionsForm.allowedDistrictIds.includes(district.id)}
                      onChange={() => toggleDistrict(district.id)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">{district.name} - {district.city}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition"
            >
              Установить права
            </motion.button>
            <button
              type="button"
              onClick={() => setShowPermissionsModal(false)}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              Отмена
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default StatisticsDashboard;

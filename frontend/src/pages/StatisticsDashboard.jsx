import { useState, useEffect } from 'react';
import { BarChart3, Download, Users, Activity, Building2, Map, Filter, UserCog } from 'lucide-react';
import Layout from '../components/Layout';
import { auditorAPI, mruAPI, districtsAPI, exportAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

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
  const isAuditor = user?.role === 'auditor';

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
      alert('Ошибка при загрузке статистики');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPermissions = async (e) => {
    e.preventDefault();
    if (!selectedUserId) {
      alert('Выберите пользователя');
      return;
    }

    try {
      await auditorAPI.setPermissions(selectedUserId, permissionsForm);
      alert('Права аудитора успешно установлены');
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
      alert(error.message || 'Ошибка при установке прав аудитора');
    }
  };

  const handleExportStatistics = async () => {
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
      alert('Статистика успешно экспортирована');
    } catch (error) {
      console.error('Ошибка при экспорте:', error);
      alert('Ошибка при экспорте статистики');
    }
  };

  const handleExportClients = async () => {
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
      alert('Список клиентов успешно экспортирован');
    } catch (error) {
      console.error('Ошибка при экспорте:', error);
      alert('Ошибка при экспорте списка клиентов');
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
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Статистика и отчеты</h1>
          <p className="text-gray-600 mt-2">Аналитика работы системы пробации</p>
        </div>
        <div className="flex space-x-3">
          {isAdmin && (
            <button
              onClick={() => setShowPermissionsModal(true)}
              className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition shadow-md"
            >
              <UserCog size={20} />
              <span>Права аудиторов</span>
            </button>
          )}
          <button
            onClick={handleExportStatistics}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition shadow-md"
          >
            <Download size={20} />
            <span>Экспорт статистики</span>
          </button>
          <button
            onClick={handleExportClients}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-md"
          >
            <Download size={20} />
            <span>Экспорт клиентов</span>
          </button>
        </div>
      </div>

      {/* Overview Statistics */}
      {overviewStats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Всего клиентов</p>
                  <p className="text-4xl font-bold mt-2">{overviewStats.totalClients}</p>
                  <p className="text-blue-100 text-xs mt-2">
                    Активных: {overviewStats.activeClients}
                  </p>
                </div>
                <Users className="text-blue-200" size={50} opacity={0.5} />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Офицеров</p>
                  <p className="text-4xl font-bold mt-2">{overviewStats.totalOfficers}</p>
                  <p className="text-green-100 text-xs mt-2">
                    Активных офицеров
                  </p>
                </div>
                <UserCog className="text-green-200" size={50} opacity={0.5} />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">МРУ</p>
                  <p className="text-4xl font-bold mt-2">{overviewStats.totalMrus}</p>
                  <p className="text-purple-100 text-xs mt-2">
                    Межрайонных управлений
                  </p>
                </div>
                <Building2 className="text-purple-200" size={50} opacity={0.5} />
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl shadow-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Районов</p>
                  <p className="text-4xl font-bold mt-2">{overviewStats.totalDistricts}</p>
                  <p className="text-orange-100 text-xs mt-2">
                    Административных районов
                  </p>
                </div>
                <Map className="text-orange-200" size={50} opacity={0.5} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Часы работы</h3>
                <Activity className="text-blue-600" size={24} />
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Всего отработано</span>
                    <span className="font-semibold text-gray-800">
                      {overviewStats.totalHoursWorked} ч
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500">Среднее на клиента</p>
                    <p className="text-xl font-bold text-gray-800">
                      {overviewStats.totalClients > 0
                        ? Math.round(overviewStats.totalHoursWorked / overviewStats.totalClients)
                        : 0} ч
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Активных клиентов</p>
                    <p className="text-xl font-bold text-green-600">
                      {overviewStats.activeClients}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Распределение</h3>
                <BarChart3 className="text-purple-600" size={24} />
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Клиентов на офицера</span>
                    <span className="font-semibold text-gray-800">
                      {overviewStats.totalOfficers > 0
                        ? (overviewStats.totalClients / overviewStats.totalOfficers).toFixed(1)
                        : 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: '75%' }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500">Районов в МРУ</p>
                    <p className="text-xl font-bold text-gray-800">
                      {overviewStats.totalMrus > 0
                        ? (overviewStats.totalDistricts / overviewStats.totalMrus).toFixed(1)
                        : 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Офицеров в районе</p>
                    <p className="text-xl font-bold text-gray-800">
                      {overviewStats.totalDistricts > 0
                        ? (overviewStats.totalOfficers / overviewStats.totalDistricts).toFixed(1)
                        : 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Statistics by MRU */}
      {statsByMRU.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Статистика по МРУ</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
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
                {statsByMRU.map((stat) => (
                  <tr key={stat.mruId} className="hover:bg-gray-50 transition">
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Statistics by District */}
      {statsByDistrict.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Статистика по районам</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Район</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Город</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">МРУ</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Офицеров</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Клиентов</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Активных</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Часов</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {statsByDistrict.map((stat) => (
                  <tr key={stat.districtId} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-800">{stat.districtName}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{stat.city}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {stat.mruName}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{stat.officersCount}</td>
                    <td className="px-6 py-4 text-gray-600">{stat.clientsCount}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                        {stat.activeClientsCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{stat.totalHoursCompleted} ч</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Auditor Permissions Modal */}
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
              <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  value="all"
                  checked={permissionsForm.accessType === 'all'}
                  onChange={(e) => handleAccessTypeChange(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <p className="font-medium text-gray-800">Все данные</p>
                  <p className="text-xs text-gray-500">Доступ ко всей статистике системы</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  value="mru"
                  checked={permissionsForm.accessType === 'mru'}
                  onChange={(e) => handleAccessTypeChange(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <p className="font-medium text-gray-800">Определенные МРУ</p>
                  <p className="text-xs text-gray-500">Доступ к конкретным МРУ</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  value="district"
                  checked={permissionsForm.accessType === 'district'}
                  onChange={(e) => handleAccessTypeChange(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <p className="font-medium text-gray-800">Определенные районы</p>
                  <p className="text-xs text-gray-500">Доступ к конкретным районам</p>
                </div>
              </label>
            </div>
          </div>

          {permissionsForm.accessType === 'mru' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Выберите МРУ
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Выберите районы
              </label>
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
            <button
              type="submit"
              className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
            >
              Установить права
            </button>
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

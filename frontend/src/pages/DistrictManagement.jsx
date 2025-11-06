import { useState, useEffect } from 'react';
import { MapPin, Plus, Edit, Trash2, Search, BarChart } from 'lucide-react';
import Layout from '../components/Layout';
import { districtsAPI, mruAPI } from '../api/api';
import Modal from '../components/Modal';

const DistrictManagement = () => {
  const [districts, setDistricts] = useState([]);
  const [mrus, setMrus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [stats, setStats] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, district: null });
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    mruId: '',
    code: ''
  });

  useEffect(() => {
    fetchDistricts();
    fetchMRUs();
  }, []);

  const fetchDistricts = async () => {
    try {
      setLoading(true);
      const response = await districtsAPI.getAllDistricts();
      setDistricts(response.data || []);
    } catch (error) {
      console.error('Ошибка при загрузке районов:', error);
      alert('Ошибка при загрузке районов');
    } finally {
      setLoading(false);
    }
  };

  const fetchMRUs = async () => {
    try {
      const response = await mruAPI.getAllMRU();
      setMrus(response.data || []);
    } catch (error) {
      console.error('Ошибка при загрузке МРУ:', error);
    }
  };

  const handleCreateDistrict = async (e) => {
    e.preventDefault();
    try {
      await districtsAPI.createDistrict(formData);
      setShowCreateModal(false);
      setFormData({ name: '', city: '', mruId: '', code: '' });
      fetchDistricts();
      alert('Район успешно создан');
    } catch (error) {
      console.error('Ошибка при создании района:', error);
      alert(error.message || 'Ошибка при создании района');
    }
  };

  const handleUpdateDistrict = async (e) => {
    e.preventDefault();
    try {
      await districtsAPI.updateDistrict(selectedDistrict.id, formData);
      setShowEditModal(false);
      setSelectedDistrict(null);
      setFormData({ name: '', city: '', mruId: '', code: '' });
      fetchDistricts();
      alert('Район успешно обновлен');
    } catch (error) {
      console.error('Ошибка при обновлении района:', error);
      alert(error.message || 'Ошибка при обновлении района');
    }
  };

  const handleDeleteDistrict = async () => {
    try {
      await districtsAPI.deleteDistrict(deleteModal.district.id);
      setDeleteModal({ open: false, district: null });
      fetchDistricts();
      alert('Район успешно удален');
    } catch (error) {
      console.error('Ошибка при удалении района:', error);
      const errorMessage = error.message || 'Ошибка при удалении района';
      alert(errorMessage);
    }
  };

  const handleShowStats = async (district) => {
    try {
      const response = await districtsAPI.getDistrictStats(district.id);
      setStats(response.data);
      setSelectedDistrict(district);
      setShowStatsModal(true);
    } catch (error) {
      console.error('Ошибка при загрузке статистики:', error);
      alert('Ошибка при загрузке статистики');
    }
  };

  const openEditModal = (district) => {
    setSelectedDistrict(district);
    setFormData({
      name: district.name,
      city: district.city,
      mruId: district.mruId,
      code: district.code || ''
    });
    setShowEditModal(true);
  };

  const getMRUName = (mruId) => {
    const mru = mrus.find(m => m.id === mruId);
    return mru ? mru.name : 'Не указано';
  };

  const filteredDistricts = districts.filter(district =>
    district.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    district.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    district.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getMRUName(district.mruId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Управление районами</h1>
          <p className="text-gray-600 mt-2">Районы в составе МРУ</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition shadow-md"
        >
          <Plus size={20} />
          <span>Добавить район</span>
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Поиск по названию, городу, МРУ или коду..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Districts Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Название
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Город
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    МРУ
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Код
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDistricts.map((district) => (
                  <tr key={district.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <MapPin className="text-green-600" size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{district.name}</p>
                          <p className="text-xs text-gray-500">ID: {district.id.substring(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {district.city}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {getMRUName(district.mruId)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {district.code ? (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono">
                          {district.code}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Не указан</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleShowStats(district)}
                          className="text-green-600 hover:text-green-800 transition"
                          title="Статистика"
                        >
                          <BarChart size={18} />
                        </button>
                        <button
                          onClick={() => openEditModal(district)}
                          className="text-blue-600 hover:text-blue-800 transition"
                          title="Редактировать"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => setDeleteModal({ open: true, district })}
                          className="text-red-600 hover:text-red-800 transition"
                          title="Удалить"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredDistricts.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Районы не найдены
            </div>
          )}
        </div>
      )}

      {/* Create District Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Добавить район"
      >
        <form onSubmit={handleCreateDistrict} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название района <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Например: Первомайский район"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Город <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Например: Бишкек"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              МРУ <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.mruId}
              onChange={(e) => setFormData({ ...formData, mruId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Выберите МРУ</option>
              {mrus.map((mru) => (
                <option key={mru.id} value={mru.id}>
                  {mru.name} - {mru.region}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Код района
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="Например: DIST-01"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Создать
            </button>
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              Отмена
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit District Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedDistrict(null);
          setFormData({ name: '', city: '', mruId: '', code: '' });
        }}
        title="Редактировать район"
      >
        <form onSubmit={handleUpdateDistrict} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название района <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Город <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              МРУ <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.mruId}
              onChange={(e) => setFormData({ ...formData, mruId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Выберите МРУ</option>
              {mrus.map((mru) => (
                <option key={mru.id} value={mru.id}>
                  {mru.name} - {mru.region}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Код района
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Сохранить
            </button>
            <button
              type="button"
              onClick={() => {
                setShowEditModal(false);
                setSelectedDistrict(null);
                setFormData({ name: '', city: '', mruId: '', code: '' });
              }}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              Отмена
            </button>
          </div>
        </form>
      </Modal>

      {/* Stats Modal */}
      <Modal
        isOpen={showStatsModal}
        onClose={() => {
          setShowStatsModal(false);
          setSelectedDistrict(null);
          setStats(null);
        }}
        title={`Статистика: ${selectedDistrict?.name}`}
      >
        {stats && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Офицеров</p>
                <p className="text-2xl font-bold text-green-600">{stats.officersCount}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Клиентов</p>
                <p className="text-2xl font-bold text-purple-600">{stats.clientsCount}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Активных клиентов</p>
                <p className="text-2xl font-bold text-orange-600">{stats.activeClientsCount}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Завершенных часов</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalHoursCompleted}</p>
              </div>
            </div>

            <button
              onClick={() => {
                setShowStatsModal(false);
                setSelectedDistrict(null);
                setStats(null);
              }}
              className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              Закрыть
            </button>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, district: null })}
        title="Подтверждение удаления"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Вы действительно хотите удалить район <strong>{deleteModal.district?.name}</strong>?
          </p>
          <p className="text-sm text-red-600">
            Это действие необратимо. Убедитесь, что в районе нет активных офицеров и клиентов.
          </p>
          <div className="flex space-x-3 pt-4">
            <button
              onClick={handleDeleteDistrict}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Удалить
            </button>
            <button
              onClick={() => setDeleteModal({ open: false, district: null })}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              Отмена
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default DistrictManagement;

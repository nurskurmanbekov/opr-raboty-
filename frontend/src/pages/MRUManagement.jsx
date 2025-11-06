import { useState, useEffect } from 'react';
import { Building2, Plus, Edit, Trash2, Search, BarChart } from 'lucide-react';
import Layout from '../components/Layout';
import { mruAPI } from '../api/api';
import Modal from '../components/Modal';

const MRUManagement = () => {
  const [mrus, setMrus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedMRU, setSelectedMRU] = useState(null);
  const [stats, setStats] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, mru: null });
  const [formData, setFormData] = useState({
    name: '',
    region: '',
    code: ''
  });

  useEffect(() => {
    fetchMRUs();
  }, []);

  const fetchMRUs = async () => {
    try {
      setLoading(true);
      const response = await mruAPI.getAllMRU();
      setMrus(response.data || []);
    } catch (error) {
      console.error('Ошибка при загрузке МРУ:', error);
      alert('Ошибка при загрузке МРУ');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMRU = async (e) => {
    e.preventDefault();
    try {
      await mruAPI.createMRU(formData);
      setShowCreateModal(false);
      setFormData({ name: '', region: '', code: '' });
      fetchMRUs();
      alert('МРУ успешно создано');
    } catch (error) {
      console.error('Ошибка при создании МРУ:', error);
      alert(error.message || 'Ошибка при создании МРУ');
    }
  };

  const handleUpdateMRU = async (e) => {
    e.preventDefault();
    try {
      await mruAPI.updateMRU(selectedMRU.id, formData);
      setShowEditModal(false);
      setSelectedMRU(null);
      setFormData({ name: '', region: '', code: '' });
      fetchMRUs();
      alert('МРУ успешно обновлено');
    } catch (error) {
      console.error('Ошибка при обновлении МРУ:', error);
      alert(error.message || 'Ошибка при обновлении МРУ');
    }
  };

  const handleDeleteMRU = async () => {
    try {
      await mruAPI.deleteMRU(deleteModal.mru.id);
      setDeleteModal({ open: false, mru: null });
      fetchMRUs();
      alert('МРУ успешно удалено');
    } catch (error) {
      console.error('Ошибка при удалении МРУ:', error);
      const errorMessage = error.message || 'Ошибка при удалении МРУ';
      alert(errorMessage);
    }
  };

  const handleShowStats = async (mru) => {
    try {
      const response = await mruAPI.getMRUStats(mru.id);
      setStats(response.data);
      setSelectedMRU(mru);
      setShowStatsModal(true);
    } catch (error) {
      console.error('Ошибка при загрузке статистики:', error);
      alert('Ошибка при загрузке статистики');
    }
  };

  const openEditModal = (mru) => {
    setSelectedMRU(mru);
    setFormData({
      name: mru.name,
      region: mru.region,
      code: mru.code || ''
    });
    setShowEditModal(true);
  };

  const filteredMRUs = mrus.filter(mru =>
    mru.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mru.region?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mru.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Управление МРУ</h1>
          <p className="text-gray-600 mt-2">Межрайонные управления пробации</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition shadow-md"
        >
          <Plus size={20} />
          <span>Добавить МРУ</span>
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Поиск по названию, региону или коду..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* МРУ Table */}
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
                    Регион
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Код
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Районов
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMRUs.map((mru) => (
                  <tr key={mru.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Building2 className="text-blue-600" size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{mru.name}</p>
                          <p className="text-xs text-gray-500">ID: {mru.id.substring(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {mru.region}
                    </td>
                    <td className="px-6 py-4">
                      {mru.code ? (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono">
                          {mru.code}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Не указан</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {mru.districts?.length || 0}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleShowStats(mru)}
                          className="text-green-600 hover:text-green-800 transition"
                          title="Статистика"
                        >
                          <BarChart size={18} />
                        </button>
                        <button
                          onClick={() => openEditModal(mru)}
                          className="text-blue-600 hover:text-blue-800 transition"
                          title="Редактировать"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => setDeleteModal({ open: true, mru })}
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

          {filteredMRUs.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              МРУ не найдены
            </div>
          )}
        </div>
      )}

      {/* Create МРУ Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Добавить МРУ"
      >
        <form onSubmit={handleCreateMRU} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название МРУ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Например: МРУ №1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Регион <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              placeholder="Например: Чуйская область"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Код МРУ
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="Например: MRU-01"
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

      {/* Edit МРУ Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedMRU(null);
          setFormData({ name: '', region: '', code: '' });
        }}
        title="Редактировать МРУ"
      >
        <form onSubmit={handleUpdateMRU} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название МРУ <span className="text-red-500">*</span>
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
              Регион <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Код МРУ
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
                setSelectedMRU(null);
                setFormData({ name: '', region: '', code: '' });
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
          setSelectedMRU(null);
          setStats(null);
        }}
        title={`Статистика: ${selectedMRU?.name}`}
      >
        {stats && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Районов</p>
                <p className="text-2xl font-bold text-blue-600">{stats.districtsCount}</p>
              </div>
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
            </div>

            <button
              onClick={() => {
                setShowStatsModal(false);
                setSelectedMRU(null);
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
        onClose={() => setDeleteModal({ open: false, mru: null })}
        title="Подтверждение удаления"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Вы действительно хотите удалить МРУ <strong>{deleteModal.mru?.name}</strong>?
          </p>
          <p className="text-sm text-red-600">
            Это действие необратимо. Убедитесь, что в МРУ нет активных районов и офицеров.
          </p>
          <div className="flex space-x-3 pt-4">
            <button
              onClick={handleDeleteMRU}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Удалить
            </button>
            <button
              onClick={() => setDeleteModal({ open: false, mru: null })}
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

export default MRUManagement;

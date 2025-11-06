import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
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
      toast.error('Ошибка при загрузке МРУ');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMRU = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading('Создание МРУ...');
    try {
      await mruAPI.createMRU(formData);
      setShowCreateModal(false);
      setFormData({ name: '', region: '', code: '' });
      fetchMRUs();
      toast.success('МРУ успешно создано', { id: loadingToast });
    } catch (error) {
      console.error('Ошибка при создании МРУ:', error);
      toast.error(error.message || 'Ошибка при создании МРУ', { id: loadingToast });
    }
  };

  const handleUpdateMRU = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading('Обновление МРУ...');
    try {
      await mruAPI.updateMRU(selectedMRU.id, formData);
      setShowEditModal(false);
      setSelectedMRU(null);
      setFormData({ name: '', region: '', code: '' });
      fetchMRUs();
      toast.success('МРУ успешно обновлено', { id: loadingToast });
    } catch (error) {
      console.error('Ошибка при обновлении МРУ:', error);
      toast.error(error.message || 'Ошибка при обновлении МРУ', { id: loadingToast });
    }
  };

  const handleDeleteMRU = async () => {
    const loadingToast = toast.loading('Удаление МРУ...');
    try {
      await mruAPI.deleteMRU(deleteModal.mru.id);
      setDeleteModal({ open: false, mru: null });
      fetchMRUs();
      toast.success('МРУ успешно удалено', { id: loadingToast });
    } catch (error) {
      console.error('Ошибка при удалении МРУ:', error);
      toast.error(error.message || 'Ошибка при удалении МРУ', { id: loadingToast });
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
      toast.error('Ошибка при загрузке статистики');
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
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Управление МРУ
          </h1>
          <p className="text-gray-600 mt-2">Межрайонные управления пробации</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition shadow-md"
        >
          <Plus size={20} />
          <span>Добавить МРУ</span>
        </motion.button>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Поиск по названию, региону или коду..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </motion.div>

      {/* МРУ Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-md animate-pulse">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMRUs.map((mru, index) => (
            <motion.div
              key={mru.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all border border-gray-100"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <Building2 className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{mru.name}</h3>
                    <p className="text-sm text-gray-500">{mru.region}</p>
                  </div>
                </div>
              </div>

              {mru.code && (
                <div className="mb-4 inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-mono">
                  {mru.code}
                </div>
              )}

              <div className="text-sm text-gray-600 mb-4">
                <p>Районов: <span className="font-semibold text-gray-800">{mru.districts?.length || 0}</span></p>
              </div>

              <div className="flex space-x-2 pt-4 border-t border-gray-100">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleShowStats(mru)}
                  className="flex-1 flex items-center justify-center space-x-1 text-green-600 hover:bg-green-50 py-2 rounded-lg transition"
                  title="Статистика"
                >
                  <BarChart size={16} />
                  <span className="text-sm">Статистика</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => openEditModal(mru)}
                  className="flex-1 flex items-center justify-center space-x-1 text-blue-600 hover:bg-blue-50 py-2 rounded-lg transition"
                  title="Редактировать"
                >
                  <Edit size={16} />
                  <span className="text-sm">Изменить</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDeleteModal({ open: true, mru })}
                  className="flex items-center justify-center text-red-600 hover:bg-red-50 p-2 rounded-lg transition"
                  title="Удалить"
                >
                  <Trash2 size={16} />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {!loading && filteredMRUs.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <Building2 className="mx-auto text-gray-300 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">МРУ не найдены</h3>
          <p className="text-gray-500 mb-6">Попробуйте изменить критерии поиска</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition"
          >
            Добавить первое МРУ
          </motion.button>
        </motion.div>
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
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition"
            >
              Создать
            </motion.button>
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
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition"
            >
              Сохранить
            </motion.button>
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
              {[
                { label: 'Районов', value: stats.districtsCount, color: 'blue' },
                { label: 'Офицеров', value: stats.officersCount, color: 'green' },
                { label: 'Клиентов', value: stats.clientsCount, color: 'purple' },
                { label: 'Активных клиентов', value: stats.activeClientsCount, color: 'orange' }
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className={`bg-${stat.color}-50 p-4 rounded-lg border border-${stat.color}-200`}
                >
                  <p className={`text-sm text-${stat.color}-600`}>{stat.label}</p>
                  <p className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</p>
                </motion.div>
              ))}
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-gray-700">
              Вы действительно хотите удалить МРУ <strong>{deleteModal.mru?.name}</strong>?
            </p>
            <p className="text-sm text-red-600 mt-2">
              Это действие необратимо. Убедитесь, что в МРУ нет активных районов и офицеров.
            </p>
          </div>
          <div className="flex space-x-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDeleteMRU}
              className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-lg hover:shadow-lg transition"
            >
              Удалить
            </motion.button>
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

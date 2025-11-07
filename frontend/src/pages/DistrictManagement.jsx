import { useState, useEffect } from 'react';
import { MapPin, Plus, Edit, Trash2, Search, BarChart, Users, UserCog } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
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
      toast.error('Ошибка при загрузке районов');
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
      toast.error('Ошибка при загрузке МРУ');
    }
  };

  const handleCreateDistrict = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading('Создание района...');
    try {
      await districtsAPI.createDistrict(formData);
      setShowCreateModal(false);
      setFormData({ name: '', city: '', mruId: '', code: '' });
      fetchDistricts();
      toast.success('Район успешно создан', { id: loadingToast });
    } catch (error) {
      console.error('Ошибка при создании района:', error);
      toast.error(error.message || 'Ошибка при создании района', { id: loadingToast });
    }
  };

  const handleUpdateDistrict = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading('Обновление района...');
    try {
      await districtsAPI.updateDistrict(selectedDistrict.id, formData);
      setShowEditModal(false);
      setSelectedDistrict(null);
      setFormData({ name: '', city: '', mruId: '', code: '' });
      fetchDistricts();
      toast.success('Район успешно обновлен', { id: loadingToast });
    } catch (error) {
      console.error('Ошибка при обновлении района:', error);
      toast.error(error.message || 'Ошибка при обновлении района', { id: loadingToast });
    }
  };

  const handleDeleteDistrict = async () => {
    const loadingToast = toast.loading('Удаление района...');
    try {
      await districtsAPI.deleteDistrict(deleteModal.district.id);
      setDeleteModal({ open: false, district: null });
      fetchDistricts();
      toast.success('Район успешно удален', { id: loadingToast });
    } catch (error) {
      console.error('Ошибка при удалении района:', error);
      const errorMessage = error.message || 'Ошибка при удалении района';
      toast.error(errorMessage, { id: loadingToast });
    }
  };

  const handleShowStats = async (district) => {
    const loadingToast = toast.loading('Загрузка статистики...');
    try {
      const response = await districtsAPI.getDistrictStats(district.id);
      setStats(response.data);
      setSelectedDistrict(district);
      setShowStatsModal(true);
      toast.success('Статистика загружена', { id: loadingToast });
    } catch (error) {
      console.error('Ошибка при загрузке статистики:', error);
      toast.error('Ошибка при загрузке статистики', { id: loadingToast });
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
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
            Управление районами
          </h1>
          <p className="text-gray-600 mt-2">Районы в составе МРУ</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition shadow-md"
        >
          <Plus size={20} />
          <span>Добавить район</span>
        </motion.button>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Поиск по названию, городу, МРУ или коду..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
          />
        </div>
      </motion.div>

      {/* Districts Cards */}
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
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {filteredDistricts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <MapPin className="mx-auto text-gray-300 mb-4" size={64} />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Районы не найдены</h3>
              <p className="text-gray-500 mb-6">Попробуйте изменить критерии поиска</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition"
              >
                Добавить первый район
              </motion.button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDistricts.map((district, index) => (
                <motion.div
                  key={district.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all border border-gray-100"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center">
                      <MapPin className="text-white" size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800">{district.name}</h3>
                      <p className="text-sm text-gray-500">{district.city}</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">МРУ:</span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {getMRUName(district.mruId)}
                      </span>
                    </div>

                    {district.code && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Код:</span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono">
                          {district.code}
                        </span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        ID: {district.id.substring(0, 8)}...
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleShowStats(district)}
                      className="flex-1 flex items-center justify-center space-x-1 text-green-600 hover:bg-green-50 py-2 rounded-lg transition"
                    >
                      <BarChart size={16} />
                      <span className="text-sm">Статистика</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openEditModal(district)}
                      className="flex-1 flex items-center justify-center space-x-1 text-blue-600 hover:bg-blue-50 py-2 rounded-lg transition"
                    >
                      <Edit size={16} />
                      <span className="text-sm">Изменить</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setDeleteModal({ open: true, district })}
                      className="flex items-center justify-center text-red-600 hover:bg-red-50 py-2 px-3 rounded-lg transition"
                    >
                      <Trash2 size={16} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition"
            >
              Создать
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              Отмена
            </motion.button>
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition"
            >
              Сохранить
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => {
                setShowEditModal(false);
                setSelectedDistrict(null);
                setFormData({ name: '', city: '', mruId: '', code: '' });
              }}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              Отмена
            </motion.button>
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
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0 }}
                className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <UserCog className="text-green-600" size={20} />
                  <p className="text-sm text-gray-700 font-medium">Офицеров</p>
                </div>
                <p className="text-3xl font-bold text-green-600">{stats.officersCount}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="text-purple-600" size={20} />
                  <p className="text-sm text-gray-700 font-medium">Клиентов</p>
                </div>
                <p className="text-3xl font-bold text-purple-600">{stats.clientsCount}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="text-orange-600" size={20} />
                  <p className="text-sm text-gray-700 font-medium">Активных</p>
                </div>
                <p className="text-3xl font-bold text-orange-600">{stats.activeClientsCount}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <BarChart className="text-blue-600" size={20} />
                  <p className="text-sm text-gray-700 font-medium">Часов</p>
                </div>
                <p className="text-3xl font-bold text-blue-600">{stats.totalHoursCompleted}</p>
              </motion.div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setShowStatsModal(false);
                setSelectedDistrict(null);
                setStats(null);
              }}
              className="w-full bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:shadow-md transition font-medium"
            >
              Закрыть
            </motion.button>
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
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDeleteDistrict}
              className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-lg hover:shadow-lg transition"
            >
              Удалить
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setDeleteModal({ open: false, district: null })}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              Отмена
            </motion.button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default DistrictManagement;

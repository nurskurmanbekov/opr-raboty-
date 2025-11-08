import { useState, useEffect } from 'react';
import { UserPlus, Edit, Trash2, Check, X, Search, UserCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { usersAPI, mruAPI, districtsAPI } from '../api/api';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { value: 'superadmin', label: 'Супер Администратор', color: 'from-red-500 to-red-600', badge: 'bg-red-100 text-red-800' },
  { value: 'regional_admin', label: 'Региональный Администратор', color: 'from-purple-500 to-purple-600', badge: 'bg-purple-100 text-purple-800' },
  { value: 'district_admin', label: 'Администратор Района', color: 'from-blue-500 to-blue-600', badge: 'bg-blue-100 text-blue-800' },
  { value: 'officer', label: 'Офицер', color: 'from-green-500 to-green-600', badge: 'bg-green-100 text-green-800' },
  { value: 'supervisor', label: 'Супервайзер', color: 'from-yellow-500 to-yellow-600', badge: 'bg-yellow-100 text-yellow-800' },
  { value: 'analyst', label: 'Аналитик', color: 'from-indigo-500 to-indigo-600', badge: 'bg-indigo-100 text-indigo-800' },
  { value: 'observer', label: 'Наблюдатель', color: 'from-gray-500 to-gray-600', badge: 'bg-gray-100 text-gray-800' },
];

const DISTRICTS = ['Bishkek', 'Osh', 'Jalal-Abad', 'Karakol', 'Batken', 'Talas', 'Naryn'];

const Users = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [mrus, setMrus] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, user: null });
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    role: 'officer',
    district: 'Bishkek',
    employeeId: ''
  });

  useEffect(() => {
    fetchUsers();
    fetchMRUs();
    fetchDistricts();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getUsers();
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Ошибка при загрузке пользователей');
    } finally {
      setLoading(false);
    }
  };

  const fetchMRUs = async () => {
    try {
      const response = await mruAPI.getAllMRU();
      setMrus(response.data || []);
    } catch (error) {
      console.error('Error fetching MRUs:', error);
    }
  };

  const fetchDistricts = async () => {
    try {
      const response = await districtsAPI.getAllDistricts();
      setDistricts(response.data || []);
    } catch (error) {
      console.error('Error fetching districts:', error);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading('Создание пользователя...');
    try {
      await usersAPI.createUser(formData);
      setShowCreateModal(false);
      setFormData({
        fullName: '',
        email: '',
        password: '',
        phone: '',
        role: 'officer',
        district: 'Bishkek',
        employeeId: ''
      });
      fetchUsers();
      toast.success('Пользователь успешно создан', { id: loadingToast });
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Ошибка при создании пользователя', { id: loadingToast });
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    const loadingToast = toast.loading('Обновление роли...');
    try {
      await usersAPI.updateUserRole(userId, newRole);
      fetchUsers();
      toast.success('Роль успешно обновлена', { id: loadingToast });
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Ошибка при обновлении роли', { id: loadingToast });
    }
  };

  const handleActivateUser = async (userId) => {
    const loadingToast = toast.loading('Активация пользователя...');
    try {
      await usersAPI.activateUser(userId);
      fetchUsers();
      toast.success('Пользователь активирован', { id: loadingToast });
    } catch (error) {
      console.error('Error activating user:', error);
      toast.error('Ошибка при активации', { id: loadingToast });
    }
  };

  const handleDeactivateUser = async (userId) => {
    const loadingToast = toast.loading('Деактивация пользователя...');
    try {
      await usersAPI.deactivateUser(userId);
      fetchUsers();
      toast.success('Пользователь деактивирован', { id: loadingToast });
    } catch (error) {
      console.error('Error deactivating user:', error);
      toast.error('Ошибка при деактивации', { id: loadingToast });
    }
  };

  const handleDeleteUser = async () => {
    const loadingToast = toast.loading('Удаление пользователя...');
    try {
      await usersAPI.deleteUser(deleteModal.user.id);
      setDeleteModal({ open: false, user: null });
      fetchUsers();
      toast.success('Пользователь успешно удален', { id: loadingToast });
    } catch (error) {
      console.error('Error deleting user:', error);
      const errorMessage = error.response?.data?.message || 'Ошибка при удалении пользователя';
      toast.error(errorMessage, { id: loadingToast });
    }
  };

  const filteredUsers = users.filter(user =>
    user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleInfo = (role) => {
    return ROLES.find(r => r.value === role) || ROLES[ROLES.length - 1];
  };

  const getUserLocation = (user) => {
    // Сначала проверяем districtId (район)
    if (user.districtId) {
      const district = districts.find(d => d.id === user.districtId);
      if (district) {
        return `${district.name} (район)`;
      }
    }

    // Затем проверяем mruId (МРУ)
    if (user.mruId) {
      const mru = mrus.find(m => m.id === user.mruId);
      if (mru) {
        return `${mru.name} (МРУ)`;
      }
    }

    // Fallback на старое поле district
    if (user.district) {
      return user.district;
    }

    return 'Не назначен';
  };

  return (
    <Layout>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Управление пользователями
          </h1>
          <p className="text-gray-600 mt-2">Управление ролями и правами доступа</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition shadow-md"
        >
          <UserPlus size={20} />
          <span>Добавить пользователя</span>
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
            placeholder="Поиск по имени, email или ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>
      </motion.div>

      {/* Users Cards */}
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
          {filteredUsers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <UserCircle className="mx-auto text-gray-300 mb-4" size={64} />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Пользователи не найдены</h3>
              <p className="text-gray-500 mb-6">Попробуйте изменить критерии поиска</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition"
              >
                Добавить первого пользователя
              </motion.button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers.map((user, index) => {
                const roleInfo = getRoleInfo(user.role);
                return (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all border border-gray-100"
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${roleInfo.color} rounded-full flex items-center justify-center`}>
                        <span className="text-white font-bold text-lg">
                          {user.fullName?.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-lg font-bold text-gray-800">{user.fullName}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Роль:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${roleInfo.badge}`}>
                          {roleInfo.label}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Расположение:</span>
                        <span className="text-sm text-gray-800 font-medium">{getUserLocation(user)}</span>
                      </div>

                      {user.employeeId && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">ID:</span>
                          <span className="text-sm text-gray-800 font-mono">{user.employeeId}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <span className="text-sm text-gray-600">Статус:</span>
                        {user.isActive ? (
                          <span className="flex items-center space-x-1 text-green-600 text-sm">
                            <Check size={16} />
                            <span>Активен</span>
                          </span>
                        ) : (
                          <span className="flex items-center space-x-1 text-red-600 text-sm">
                            <X size={16} />
                            <span>Неактивен</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      {user.isActive ? (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDeactivateUser(user.id)}
                          className="flex-1 flex items-center justify-center space-x-1 bg-red-50 text-red-600 hover:bg-red-100 py-2 rounded-lg transition"
                          title="Деактивировать"
                        >
                          <X size={16} />
                          <span className="text-sm">Деактивировать</span>
                        </motion.button>
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleActivateUser(user.id)}
                          className="flex-1 flex items-center justify-center space-x-1 bg-green-50 text-green-600 hover:bg-green-100 py-2 rounded-lg transition"
                          title="Активировать"
                        >
                          <Check size={16} />
                          <span className="text-sm">Активировать</span>
                        </motion.button>
                      )}
                      {currentUser?.role === 'superadmin' && user.id !== currentUser.id && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setDeleteModal({ open: true, user })}
                          className="flex items-center justify-center text-red-600 hover:bg-red-50 py-2 px-3 rounded-lg transition"
                          title="Удалить пользователя"
                        >
                          <Trash2 size={18} />
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Добавить пользователя"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Полное имя
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Пароль
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Телефон
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+996700000000"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Роль
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ROLES.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Район
            </label>
            <select
              value={formData.district}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {DISTRICTS.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ID сотрудника
            </label>
            <input
              type="text"
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
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

      {/* Delete User Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, user: null })}
        title="Подтверждение удаления"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Вы действительно хотите удалить пользователя <strong>{deleteModal.user?.fullName}</strong>?
          </p>
          <p className="text-sm text-red-600">
            Это действие необратимо. Пользователь будет удален из системы.
          </p>
          <div className="flex space-x-3 pt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDeleteUser}
              className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-lg hover:shadow-lg transition"
            >
              Удалить
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setDeleteModal({ open: false, user: null })}
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

export default Users;

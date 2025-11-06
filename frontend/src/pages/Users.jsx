import { useState, useEffect } from 'react';
import { UserPlus, Edit, Trash2, Check, X, Search } from 'lucide-react';
import Layout from '../components/Layout';
import { usersAPI } from '../api/api';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { value: 'superadmin', label: 'Супер Администратор', color: 'bg-red-100 text-red-800' },
  { value: 'regional_admin', label: 'Региональный Администратор', color: 'bg-purple-100 text-purple-800' },
  { value: 'district_admin', label: 'Администратор Района', color: 'bg-blue-100 text-blue-800' },
  { value: 'officer', label: 'Офицер', color: 'bg-green-100 text-green-800' },
  { value: 'supervisor', label: 'Супервайзер', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'analyst', label: 'Аналитик', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'observer', label: 'Наблюдатель', color: 'bg-gray-100 text-gray-800' },
];

const DISTRICTS = ['Bishkek', 'Osh', 'Jalal-Abad', 'Karakol', 'Batken', 'Talas', 'Naryn'];

const Users = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
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
    phoneNumber: '',
    role: 'officer',
    district: 'Bishkek',
    employeeId: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getUsers();
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await usersAPI.createUser(formData);
      setShowCreateModal(false);
      setFormData({
        fullName: '',
        email: '',
        password: '',
        phoneNumber: '',
        role: 'officer',
        district: 'Bishkek',
        employeeId: ''
      });
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Ошибка при создании пользователя');
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await usersAPI.updateUserRole(userId, newRole);
      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Ошибка при обновлении роли');
    }
  };

  const handleActivateUser = async (userId) => {
    try {
      await usersAPI.activateUser(userId);
      fetchUsers();
    } catch (error) {
      console.error('Error activating user:', error);
    }
  };

  const handleDeactivateUser = async (userId) => {
    try {
      await usersAPI.deactivateUser(userId);
      fetchUsers();
    } catch (error) {
      console.error('Error deactivating user:', error);
    }
  };

  const handleDeleteUser = async () => {
    try {
      await usersAPI.deleteUser(deleteModal.user.id);
      setDeleteModal({ open: false, user: null });
      fetchUsers();
      alert('Пользователь успешно удален');
    } catch (error) {
      console.error('Error deleting user:', error);
      const errorMessage = error.response?.data?.message || 'Ошибка при удалении пользователя';
      alert(errorMessage);
    }
  };

  const filteredUsers = users.filter(user =>
    user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeColor = (role) => {
    return ROLES.find(r => r.value === role)?.color || 'bg-gray-100 text-gray-800';
  };

  return (
    <Layout>
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Управление пользователями</h1>
          <p className="text-gray-600 mt-2">Управление ролями и правами доступа</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition shadow-md"
        >
          <UserPlus size={20} />
          <span>Добавить пользователя</span>
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Поиск по имени, email или ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Users Table */}
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
                    Пользователь
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Роль
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Район
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-bold">
                            {user.fullName?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{user.fullName}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                        {ROLES.find(r => r.value === user.role)?.label || user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.district || 'Не назначен'}
                    </td>
                    <td className="px-6 py-4">
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
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {user.isActive ? (
                          <button
                            onClick={() => handleDeactivateUser(user.id)}
                            className="text-red-600 hover:text-red-800 transition"
                            title="Деактивировать"
                          >
                            <X size={18} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivateUser(user.id)}
                            className="text-green-600 hover:text-green-800 transition"
                            title="Активировать"
                          >
                            <Check size={18} />
                          </button>
                        )}
                        {currentUser?.role === 'superadmin' && user.id !== currentUser.id && (
                          <button
                            onClick={() => setDeleteModal({ open: true, user })}
                            className="text-red-600 hover:text-red-800 transition"
                            title="Удалить пользователя"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Пользователи не найдены
            </div>
          )}
        </div>
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
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <button
              onClick={handleDeleteUser}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Удалить
            </button>
            <button
              onClick={() => setDeleteModal({ open: false, user: null })}
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

export default Users;

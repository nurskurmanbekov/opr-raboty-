import { useState, useEffect } from 'react';
import { Plus, Search, User, Clock, Edit, Trash2, Users as UsersIcon, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { clientsAPI } from '../api/api';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import AddClientForm from '../components/AddClientForm';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const STATUS_CONFIG = {
  active: {
    color: 'from-green-500 to-green-600',
    badge: 'bg-green-100 text-green-800 border-green-200',
    label: 'Активен'
  },
  completed: {
    color: 'from-blue-500 to-blue-600',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    label: 'Завершен'
  },
  suspended: {
    color: 'from-yellow-500 to-yellow-600',
    badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    label: 'Приостановлен'
  },
  violated: {
    color: 'from-red-500 to-red-600',
    badge: 'bg-red-100 text-red-800 border-red-200',
    label: 'Нарушение'
  }
};

const Clients = () => {
  const { user: currentUser } = useAuth();
  const [clients, setClients] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editModal, setEditModal] = useState({ open: false, client: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, client: null });
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [clientsRes, usersRes] = await Promise.all([
        api.get('/clients'),
        api.get('/users')
      ]);
      setClients(clientsRes.data.data);
      setOfficers(usersRes.data.data.filter(u => u.role === 'officer'));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Ошибка при загрузке данных');
      setLoading(false);
    }
  };

  const handleDeleteClient = async () => {
    const loadingToast = toast.loading('Удаление клиента...');
    try {
      await clientsAPI.deleteClient(deleteModal.client.id);
      setDeleteModal({ open: false, client: null });
      fetchData();
      toast.success('Клиент успешно удален', { id: loadingToast });
    } catch (error) {
      console.error('Error deleting client:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Ошибка при удалении клиента';
      toast.error(errorMessage, { id: loadingToast });
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.idNumber.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusConfig = (status) => STATUS_CONFIG[status] || STATUS_CONFIG.active;

  return (
    <Layout>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Клиенты пробации
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Управление клиентами и мониторинг прогресса</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 hover:shadow-lg transition shadow-md"
        >
          <Plus size={20} />
          <span>Добавить клиента</span>
        </motion.button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-slate-900 rounded-xl shadow-md p-6 mb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Поиск по имени или ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          >
            <option value="all">Все статусы</option>
            <option value="active">Активные</option>
            <option value="completed">Завершенные</option>
            <option value="suspended">Приостановленные</option>
            <option value="violated">Нарушения</option>
          </select>
        </div>
      </motion.div>

      {/* Clients Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-md animate-pulse">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {filteredClients.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <UsersIcon className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={64} />
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">Клиенты не найдены</h3>
              <p className="text-gray-500 dark:text-gray-500 mb-6">Попробуйте изменить критерии поиска</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsModalOpen(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition"
              >
                Добавить первого клиента
              </motion.button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClients.map((client, index) => {
                const progress = (client.completedHours / client.assignedHours * 100).toFixed(1);
                const statusConfig = getStatusConfig(client.status);
                return (
                  <motion.div
                    key={client.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    onClick={() => navigate(`/clients/${client.id}`)}
                    className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-md hover:shadow-xl transition-all border border-gray-100 dark:border-gray-800 cursor-pointer"
                  >
                    {/* Header */}
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${statusConfig.color} rounded-full flex items-center justify-center`}>
                        <User className="text-white" size={24} />
                      </div>
                      <div className="flex-1">
                        <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{client.fullName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{client.email}</p>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">ID:</span>
                        <span className="text-sm text-gray-800 dark:text-gray-100 font-mono">{client.idNumber}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Район:</span>
                        <span className="text-sm text-gray-800 dark:text-gray-100 flex items-center space-x-1">
                          <MapPin size={14} className="text-gray-400 dark:text-gray-500" />
                          <span>{client.district}</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Куратор:</span>
                        <span className="text-sm text-gray-800 dark:text-gray-100">{client.officer?.fullName || 'Не назначен'}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Статус:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.badge}`}>
                          {statusConfig.label}
                        </span>
                      </div>

                      {/* Progress */}
                      <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center space-x-1">
                            <Clock size={14} className="text-gray-400 dark:text-gray-500" />
                            <span>Прогресс</span>
                          </span>
                          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.8, delay: index * 0.05 + 0.2 }}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 h-3 rounded-full"
                          />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                          {client.completedHours} / {client.assignedHours} часов
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      {(currentUser?.role === 'superadmin' || currentUser?.role === 'district_admin') && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditModal({ open: true, client });
                          }}
                          className="flex-1 flex items-center justify-center space-x-1 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 py-2 rounded-lg transition"
                        >
                          <Edit size={16} />
                          <span className="text-sm">Изменить</span>
                        </motion.button>
                      )}
                      {currentUser?.role === 'superadmin' && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteModal({ open: true, client });
                          }}
                          className="flex items-center justify-center text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 py-2 px-3 rounded-lg transition"
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

      {/* Add Client Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Добавить нового клиента"
      >
        <AddClientForm
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchData}
          officers={officers}
        />
      </Modal>

      {/* Edit Client Modal */}
      <Modal
        isOpen={editModal.open}
        onClose={() => setEditModal({ open: false, client: null })}
        title="Редактировать клиента"
      >
        <AddClientForm
          onClose={() => setEditModal({ open: false, client: null })}
          onSuccess={fetchData}
          officers={officers}
          initialData={editModal.client}
          isEdit={true}
        />
      </Modal>

      {/* Delete Client Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, client: null })}
        title="Подтверждение удаления"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Вы действительно хотите удалить клиента <strong>{deleteModal.client?.fullName}</strong>?
          </p>
          <p className="text-sm text-red-600 dark:text-red-400">
            Это действие необратимо. Все данные клиента будут удалены из системы.
          </p>
          <div className="flex space-x-3 pt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDeleteClient}
              className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-lg hover:shadow-lg transition"
            >
              Удалить
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setDeleteModal({ open: false, client: null })}
              className="flex-1 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition"
            >
              Отмена
            </motion.button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default Clients;

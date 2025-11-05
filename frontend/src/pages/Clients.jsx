import { useState, useEffect } from 'react';
import { Plus, Search, User, Clock } from 'lucide-react';
import api from '../api/axios';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import AddClientForm from '../components/AddClientForm';
import { useNavigate } from 'react-router-dom'; 
const Clients = () => {
  const [clients, setClients] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
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
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.idNumber.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      suspended: 'bg-yellow-100 text-yellow-800',
      violated: 'bg-red-100 text-red-800'
    };
    const labels = {
      active: 'Активен',
      completed: 'Завершен',
      suspended: 'Приостановлен',
      violated: 'Нарушение'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <Layout>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Клиенты пробации</h1>
          <p className="text-gray-600 mt-2">Управление клиентами и мониторинг прогресса</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          <span>Добавить клиента</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Поиск по имени или ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Все статусы</option>
            <option value="active">Активные</option>
            <option value="completed">Завершенные</option>
            <option value="suspended">Приостановленные</option>
            <option value="violated">Нарушения</option>
          </select>
        </div>
      </div>

      {/* Clients Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
  <table className="w-full">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Клиент</th>
        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">ID номер</th>
        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Район</th>
        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Прогресс</th>
        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Куратор</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-200">
      {filteredClients.map((client) => {
        const progress = (client.completedHours / client.assignedHours * 100).toFixed(1);
        return (
          <tr 
            key={client.id} 
            onClick={() => navigate(`/clients/${client.id}`)}
            className="hover:bg-gray-50 cursor-pointer"
          >
            <td className="px-6 py-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{client.fullName}</p>
                  <p className="text-sm text-gray-500">{client.email}</p>
                </div>
              </div>
            </td>
            <td className="px-6 py-4 text-sm text-gray-900">{client.idNumber}</td>
            <td className="px-6 py-4 text-sm text-gray-900">{client.district}</td>
            <td className="px-6 py-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">{client.completedHours} / {client.assignedHours} ч</span>
                  <span className="text-sm font-medium text-gray-900">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </td>
            <td className="px-6 py-4">{getStatusBadge(client.status)}</td>
            <td className="px-6 py-4 text-sm text-gray-900">{client.officer?.fullName}</td>
          </tr>
        );
      })}
    </tbody>
  </table>

  {filteredClients.length === 0 && (
    <div className="text-center py-12 text-gray-500">
      Клиенты не найдены
    </div>
  )}
</div>
      )}

      {/* Modal */}
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
    </Layout>
  );
};

export default Clients;
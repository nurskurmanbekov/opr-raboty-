import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, User, Users, Search, Filter } from 'lucide-react';
import Layout from '../components/Layout';
import { approvalsAPI, mruAPI, districtsAPI } from '../api/api';
import Modal from '../components/Modal';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
};

const STATUS_LABELS = {
  pending: 'Ожидает',
  approved: 'Одобрено',
  rejected: 'Отклонено'
};

const Approvals = () => {
  const [approvals, setApprovals] = useState([]);
  const [mrus, setMrus] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, officer, client
  const [filterStatus, setFilterStatus] = useState('pending'); // all, pending, approved, rejected
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approveFormData, setApproveFormData] = useState({
    assignedMruId: '',
    assignedDistrictId: ''
  });
  const [rejectFormData, setRejectFormData] = useState({
    reason: ''
  });

  useEffect(() => {
    fetchApprovals();
    fetchMRUs();
    fetchDistricts();
  }, []);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const response = await approvalsAPI.getAllApprovals();
      setApprovals(response.data || []);
    } catch (error) {
      console.error('Ошибка при загрузке заявок:', error);
      alert('Ошибка при загрузке заявок');
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

  const fetchDistricts = async () => {
    try {
      const response = await districtsAPI.getAllDistricts();
      setDistricts(response.data || []);
    } catch (error) {
      console.error('Ошибка при загрузке районов:', error);
    }
  };

  const openApproveModal = (approval) => {
    setSelectedApproval(approval);
    setApproveFormData({
      assignedMruId: approval.assignedMruId || '',
      assignedDistrictId: approval.assignedDistrictId || ''
    });
    setShowApproveModal(true);
  };

  const openRejectModal = (approval) => {
    setSelectedApproval(approval);
    setRejectFormData({ reason: '' });
    setShowRejectModal(true);
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    try {
      await approvalsAPI.approveApproval(selectedApproval.id, approveFormData);
      setShowApproveModal(false);
      setSelectedApproval(null);
      setApproveFormData({ assignedMruId: '', assignedDistrictId: '' });
      fetchApprovals();
      alert('Заявка одобрена');
    } catch (error) {
      console.error('Ошибка при одобрении заявки:', error);
      alert(error.message || 'Ошибка при одобрении заявки');
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    try {
      await approvalsAPI.rejectApproval(selectedApproval.id, rejectFormData);
      setShowRejectModal(false);
      setSelectedApproval(null);
      setRejectFormData({ reason: '' });
      fetchApprovals();
      alert('Заявка отклонена');
    } catch (error) {
      console.error('Ошибка при отклонении заявки:', error);
      alert(error.message || 'Ошибка при отклонении заявки');
    }
  };

  const getMRUName = (mruId) => {
    const mru = mrus.find(m => m.id === mruId);
    return mru ? mru.name : 'Не указано';
  };

  const getDistrictName = (districtId) => {
    const district = districts.find(d => d.id === districtId);
    return district ? district.name : 'Не указано';
  };

  const filteredApprovals = approvals.filter(approval => {
    const matchesSearch =
      approval.data?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      approval.data?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      approval.data?.phone?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || approval.type === filterType;
    const matchesStatus = filterStatus === 'all' || approval.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const pendingCount = approvals.filter(a => a.status === 'pending').length;
  const approvedCount = approvals.filter(a => a.status === 'approved').length;
  const rejectedCount = approvals.filter(a => a.status === 'rejected').length;

  return (
    <Layout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Управление заявками</h1>
        <p className="text-gray-600 mt-2">Одобрение заявок офицеров и клиентов</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-yellow-50 p-6 rounded-xl shadow-md border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-sm font-medium">Ожидают</p>
              <p className="text-3xl font-bold text-yellow-700 mt-2">{pendingCount}</p>
            </div>
            <Clock className="text-yellow-500" size={40} />
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-xl shadow-md border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Одобрено</p>
              <p className="text-3xl font-bold text-green-700 mt-2">{approvedCount}</p>
            </div>
            <CheckCircle className="text-green-500" size={40} />
          </div>
        </div>

        <div className="bg-red-50 p-6 rounded-xl shadow-md border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-sm font-medium">Отклонено</p>
              <p className="text-3xl font-bold text-red-700 mt-2">{rejectedCount}</p>
            </div>
            <XCircle className="text-red-500" size={40} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Поиск по имени, email или телефону..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            <option value="all">Все типы</option>
            <option value="officer">Офицеры</option>
            <option value="client">Клиенты</option>
          </select>
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            <option value="all">Все статусы</option>
            <option value="pending">Ожидают</option>
            <option value="approved">Одобрено</option>
            <option value="rejected">Отклонено</option>
          </select>
        </div>
      </div>

      {/* Approvals Table */}
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
                    Заявитель
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Тип
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Дата подачи
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredApprovals.map((approval) => (
                  <tr key={approval.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          approval.type === 'officer' ? 'bg-blue-100' : 'bg-purple-100'
                        }`}>
                          {approval.type === 'officer' ? (
                            <User className={`${approval.type === 'officer' ? 'text-blue-600' : 'text-purple-600'}`} size={20} />
                          ) : (
                            <Users className={`${approval.type === 'officer' ? 'text-blue-600' : 'text-purple-600'}`} size={20} />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{approval.data?.fullName || 'Не указано'}</p>
                          <p className="text-xs text-gray-500">{approval.data?.email}</p>
                          <p className="text-xs text-gray-500">{approval.data?.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        approval.type === 'officer' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {approval.type === 'officer' ? 'Офицер' : 'Клиент'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[approval.status]}`}>
                        {STATUS_LABELS[approval.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(approval.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-6 py-4">
                      {approval.status === 'pending' ? (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openApproveModal(approval)}
                            className="flex items-center space-x-1 text-green-600 hover:text-green-800 transition text-sm"
                            title="Одобрить"
                          >
                            <CheckCircle size={18} />
                            <span>Одобрить</span>
                          </button>
                          <button
                            onClick={() => openRejectModal(approval)}
                            className="flex items-center space-x-1 text-red-600 hover:text-red-800 transition text-sm"
                            title="Отклонить"
                          >
                            <XCircle size={18} />
                            <span>Отклонить</span>
                          </button>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          {approval.status === 'approved' && 'Одобрено'}
                          {approval.status === 'rejected' && (
                            <div>
                              <p>Отклонено</p>
                              {approval.rejectionReason && (
                                <p className="text-xs text-red-600 mt-1">
                                  Причина: {approval.rejectionReason}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredApprovals.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Заявки не найдены
            </div>
          )}
        </div>
      )}

      {/* Approve Modal */}
      <Modal
        isOpen={showApproveModal}
        onClose={() => {
          setShowApproveModal(false);
          setSelectedApproval(null);
          setApproveFormData({ assignedMruId: '', assignedDistrictId: '' });
        }}
        title="Одобрить заявку"
      >
        <form onSubmit={handleApprove} className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Заявитель:</p>
            <p className="font-medium text-gray-800">{selectedApproval?.data?.fullName}</p>
            <p className="text-xs text-gray-500 mt-1">{selectedApproval?.data?.email}</p>
            <p className="text-xs text-gray-500">{selectedApproval?.data?.phone}</p>
          </div>

          {selectedApproval?.type === 'officer' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  МРУ <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={approveFormData.assignedMruId}
                  onChange={(e) => setApproveFormData({ ...approveFormData, assignedMruId: e.target.value })}
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
                  Район <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={approveFormData.assignedDistrictId}
                  onChange={(e) => setApproveFormData({ ...approveFormData, assignedDistrictId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Выберите район</option>
                  {districts
                    .filter(d => !approveFormData.assignedMruId || d.mruId === approveFormData.assignedMruId)
                    .map((district) => (
                      <option key={district.id} value={district.id}>
                        {district.name} - {district.city}
                      </option>
                    ))}
                </select>
              </div>
            </>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Одобрить
            </button>
            <button
              type="button"
              onClick={() => {
                setShowApproveModal(false);
                setSelectedApproval(null);
                setApproveFormData({ assignedMruId: '', assignedDistrictId: '' });
              }}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              Отмена
            </button>
          </div>
        </form>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setSelectedApproval(null);
          setRejectFormData({ reason: '' });
        }}
        title="Отклонить заявку"
      >
        <form onSubmit={handleReject} className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Заявитель:</p>
            <p className="font-medium text-gray-800">{selectedApproval?.data?.fullName}</p>
            <p className="text-xs text-gray-500 mt-1">{selectedApproval?.data?.email}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Причина отклонения <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={rejectFormData.reason}
              onChange={(e) => setRejectFormData({ ...rejectFormData, reason: e.target.value })}
              placeholder="Укажите причину отклонения заявки..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Отклонить
            </button>
            <button
              type="button"
              onClick={() => {
                setShowRejectModal(false);
                setSelectedApproval(null);
                setRejectFormData({ reason: '' });
              }}
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

export default Approvals;

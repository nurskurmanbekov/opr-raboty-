import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, User, Users, Search, Filter, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { approvalsAPI, mruAPI, districtsAPI } from '../api/api';
import Modal from '../components/Modal';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200'
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
      toast.error('Ошибка при загрузке заявок');
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

  const fetchDistricts = async () => {
    try {
      const response = await districtsAPI.getAllDistricts();
      setDistricts(response.data || []);
    } catch (error) {
      console.error('Ошибка при загрузке районов:', error);
      toast.error('Ошибка при загрузке районов');
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
    const loadingToast = toast.loading('Одобрение заявки...');
    try {
      await approvalsAPI.approveApproval(selectedApproval.id, approveFormData);
      setShowApproveModal(false);
      setSelectedApproval(null);
      setApproveFormData({ assignedMruId: '', assignedDistrictId: '' });
      fetchApprovals();
      toast.success('Заявка успешно одобрена', { id: loadingToast });
    } catch (error) {
      console.error('Ошибка при одобрении заявки:', error);
      toast.error(error.message || 'Ошибка при одобрении заявки', { id: loadingToast });
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading('Отклонение заявки...');
    try {
      await approvalsAPI.rejectApproval(selectedApproval.id, rejectFormData);
      setShowRejectModal(false);
      setSelectedApproval(null);
      setRejectFormData({ reason: '' });
      fetchApprovals();
      toast.success('Заявка отклонена', { id: loadingToast });
    } catch (error) {
      console.error('Ошибка при отклонении заявки:', error);
      toast.error(error.message || 'Ошибка при отклонении заявки', { id: loadingToast });
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
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Управление заявками
        </h1>
        <p className="text-gray-600 mt-2">Одобрение заявок офицеров и клиентов</p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          whileHover={{ scale: 1.02, y: -5 }}
          className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl shadow-md border border-yellow-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-sm font-medium">Ожидают</p>
              <p className="text-4xl font-bold text-yellow-700 mt-2">{pendingCount}</p>
            </div>
            <Clock className="text-yellow-500" size={48} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.02, y: -5 }}
          className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-md border border-green-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Одобрено</p>
              <p className="text-4xl font-bold text-green-700 mt-2">{approvedCount}</p>
            </div>
            <CheckCircle className="text-green-500" size={48} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02, y: -5 }}
          className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl shadow-md border border-red-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-sm font-medium">Отклонено</p>
              <p className="text-4xl font-bold text-red-700 mt-2">{rejectedCount}</p>
            </div>
            <XCircle className="text-red-500" size={48} />
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Поиск по имени, email или телефону..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none transition"
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
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none transition"
          >
            <option value="all">Все статусы</option>
            <option value="pending">Ожидают</option>
            <option value="approved">Одобрено</option>
            <option value="rejected">Отклонено</option>
          </select>
        </div>
      </motion.div>

      {/* Approvals Cards */}
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
          {filteredApprovals.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <FileText className="mx-auto text-gray-300 mb-4" size={64} />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Заявки не найдены</h3>
              <p className="text-gray-500">Попробуйте изменить фильтры поиска</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredApprovals.map((approval, index) => (
                <motion.div
                  key={approval.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all border border-gray-100"
                >
                  {/* Card Header */}
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      approval.type === 'officer'
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                        : 'bg-gradient-to-br from-purple-500 to-purple-600'
                    }`}>
                      {approval.type === 'officer' ? (
                        <User className="text-white" size={24} />
                      ) : (
                        <Users className="text-white" size={24} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-800">{approval.data?.fullName || 'Не указано'}</p>
                      <p className="text-xs text-gray-500">{approval.data?.email}</p>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="space-y-3 mb-4">
                    {approval.data?.phone && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Телефон:</span>
                        <span className="text-sm text-gray-800">{approval.data.phone}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Тип:</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        approval.type === 'officer' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {approval.type === 'officer' ? 'Офицер' : 'Клиент'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Статус:</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[approval.status]}`}>
                        {STATUS_LABELS[approval.status]}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Дата:</span>
                      <span className="text-sm text-gray-800">
                        {new Date(approval.createdAt).toLocaleDateString('ru-RU')}
                      </span>
                    </div>

                    {approval.status === 'rejected' && approval.rejectionReason && (
                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-600 mb-1">Причина отклонения:</p>
                        <p className="text-xs text-red-600">{approval.rejectionReason}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {approval.status === 'pending' ? (
                    <div className="flex space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openApproveModal(approval)}
                        className="flex-1 flex items-center justify-center space-x-1 bg-green-50 text-green-600 hover:bg-green-100 py-2 rounded-lg transition font-medium"
                      >
                        <CheckCircle size={16} />
                        <span className="text-sm">Одобрить</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openRejectModal(approval)}
                        className="flex-1 flex items-center justify-center space-x-1 bg-red-50 text-red-600 hover:bg-red-100 py-2 rounded-lg transition font-medium"
                      >
                        <XCircle size={16} />
                        <span className="text-sm">Отклонить</span>
                      </motion.button>
                    </div>
                  ) : (
                    <div className="text-center py-2 text-sm text-gray-500">
                      {approval.status === 'approved' ? '✓ Обработано' : '✕ Отклонено'}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </>
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
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Заявитель:</p>
            <p className="font-bold text-gray-800 text-lg">{selectedApproval?.data?.fullName}</p>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg hover:shadow-lg transition"
            >
              Одобрить
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => {
                setShowApproveModal(false);
                setSelectedApproval(null);
                setApproveFormData({ assignedMruId: '', assignedDistrictId: '' });
              }}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              Отмена
            </motion.button>
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
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Заявитель:</p>
            <p className="font-bold text-gray-800 text-lg">{selectedApproval?.data?.fullName}</p>
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-lg hover:shadow-lg transition"
            >
              Отклонить
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => {
                setShowRejectModal(false);
                setSelectedApproval(null);
                setRejectFormData({ reason: '' });
              }}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              Отмена
            </motion.button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default Approvals;

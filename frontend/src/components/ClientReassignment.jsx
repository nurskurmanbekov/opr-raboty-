import { useState, useEffect } from 'react';
import { Users, AlertCircle } from 'lucide-react';
import Modal from './Modal';
import { usersAPI, reassignmentAPI } from '../api/api';

const ClientReassignment = ({ client, isOpen, onClose, onSuccess }) => {
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    newOfficerId: '',
    reason: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchOfficers();
    }
  }, [isOpen]);

  const fetchOfficers = async () => {
    try {
      const response = await usersAPI.getUsers({ role: 'officer' });
      // Filter out the current officer
      const availableOfficers = (response.data || []).filter(
        officer => officer.id !== client.officerId && officer.isActive
      );
      setOfficers(availableOfficers);
    } catch (error) {
      console.error('Ошибка при загрузке офицеров:', error);
      alert('Ошибка при загрузке офицеров');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.newOfficerId) {
      alert('Выберите нового офицера');
      return;
    }

    try {
      setLoading(true);
      await reassignmentAPI.reassignClient(client.id, formData);
      alert('Клиент успешно переназначен');
      setFormData({ newOfficerId: '', reason: '' });
      onSuccess && onSuccess();
      onClose();
    } catch (error) {
      console.error('Ошибка при переназначении:', error);
      alert(error.message || 'Ошибка при переназначении клиента');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ newOfficerId: '', reason: '' });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Переназначить клиента">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Current Assignment Info */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-600 font-medium mb-2">Текущее назначение</p>
          <div className="space-y-1">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Клиент:</span> {client.fullName}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Текущий офицер:</span> {client.officer?.fullName || 'Не назначен'}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Район:</span> {client.district || 'Не указан'}
            </p>
          </div>
        </div>

        {/* New Officer Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Новый офицер <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={formData.newOfficerId}
            onChange={(e) => setFormData({ ...formData, newOfficerId: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            <option value="">Выберите офицера</option>
            {officers.map((officer) => (
              <option key={officer.id} value={officer.id}>
                {officer.fullName} - {officer.district || 'Район не указан'}
              </option>
            ))}
          </select>
          {officers.length === 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Нет доступных офицеров для переназначения
            </p>
          )}
        </div>

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Причина переназначения
          </label>
          <textarea
            rows={3}
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            placeholder="Укажите причину переназначения (необязательно)..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 flex items-start space-x-3">
          <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-sm text-yellow-800 font-medium">Внимание</p>
            <p className="text-xs text-yellow-700 mt-1">
              История переназначения будет сохранена. Оба офицера (текущий и новый) получат уведомления.
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={loading || !formData.newOfficerId}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <Users size={18} />
            <span>{loading ? 'Переназначение...' : 'Переназначить'}</span>
          </button>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition disabled:bg-gray-100"
          >
            Отмена
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ClientReassignment;

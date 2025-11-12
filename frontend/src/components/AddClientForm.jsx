import { useState, useEffect } from 'react';
import { User, Mail, Phone, Hash, MapPin, Calendar, Clock, FileText } from 'lucide-react';
import api from '../api/axios';
import { districtsAPI } from '../api/api';

const AddClientForm = ({ onClose, onSuccess, officers, initialData = null, isEdit = false }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    idNumber: '',
    phone: '',
    email: '',
    password: '',
    districtId: '',
    assignedHours: '',
    startDate: '',
    officerId: '',
    workLocation: '',
    notes: ''
  });
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDistricts();
  }, []);

  // Заполняем форму при редактировании
  useEffect(() => {
    if (initialData && isEdit) {
      setFormData({
        fullName: initialData.fullName || '',
        idNumber: initialData.idNumber || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        password: '', // Пароль не заполняем при редактировании
        districtId: initialData.districtId || '',
        assignedHours: initialData.assignedHours || '',
        startDate: initialData.startDate ? initialData.startDate.split('T')[0] : '',
        officerId: initialData.officerId || '',
        workLocation: initialData.workLocation || '',
        notes: initialData.notes || ''
      });
    }
  }, [initialData, isEdit]);

  const fetchDistricts = async () => {
    try {
      const response = await districtsAPI.getAllDistricts();
      setDistricts(response.data || []);
    } catch (error) {
      console.error('Error fetching districts:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        ...formData,
        assignedHours: parseInt(formData.assignedHours)
      };

      // Если редактируем и пароль пустой - не отправляем его
      if (isEdit && !formData.password) {
        delete payload.password;
      }

      if (isEdit && initialData?.id) {
        // Режим редактирования - PUT запрос
        await api.put(`/clients/${initialData.id}`, payload);
      } else {
        // Режим создания - POST запрос
        await api.post('/clients', payload);
      }

      onSuccess();
      onClose();
    } catch (error) {
      const errorMessage = isEdit
        ? 'Ошибка при обновлении клиента'
        : 'Ошибка при создании клиента';
      setError(error.response?.data?.message || errorMessage);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center space-x-2">
              <User size={16} />
              <span>ФИО</span>
            </div>
          </label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Иванов Иван Иванович"
            required
          />
        </div>

        {/* ID Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center space-x-2">
              <Hash size={16} />
              <span>ID номер</span>
            </div>
          </label>
          <input
            type="text"
            name="idNumber"
            value={formData.idNumber}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="1234567890123"
            required
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center space-x-2">
              <Phone size={16} />
              <span>Телефон</span>
            </div>
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="+996555123456"
            required
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center space-x-2">
              <Mail size={16} />
              <span>Email (необязательно)</span>
            </div>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="client@example.com"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center space-x-2">
              <span>🔒</span>
              <span>Пароль {isEdit && '(оставьте пустым, чтобы не менять)'}</span>
            </div>
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={isEdit ? "Оставьте пустым, чтобы не менять" : "Минимум 6 символов"}
            required={!isEdit}
            minLength={6}
          />
        </div>

        {/* District */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center space-x-2">
              <MapPin size={16} />
              <span>Район</span>
            </div>
          </label>
          <select
            name="districtId"
            value={formData.districtId}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Выберите район</option>
            {districts.map((district) => (
              <option key={district.id} value={district.id}>
                {district.name} ({district.mru?.name || 'МРУ не указано'})
              </option>
            ))}
          </select>
        </div>

        {/* Assigned Hours */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center space-x-2">
              <Clock size={16} />
              <span>Назначено часов</span>
            </div>
          </label>
          <input
            type="number"
            name="assignedHours"
            value={formData.assignedHours}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="100"
            required
            min="1"
          />
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center space-x-2">
              <Calendar size={16} />
              <span>Дата начала</span>
            </div>
          </label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* Officer */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center space-x-2">
              <User size={16} />
              <span>Куратор</span>
            </div>
          </label>
          <select
            name="officerId"
            value={formData.officerId}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Выберите куратора</option>
            {officers.map(officer => (
              <option key={officer.id} value={officer.id}>
                {officer.fullName}
              </option>
            ))}
          </select>
        </div>

        {/* Work Location */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center space-x-2">
              <MapPin size={16} />
              <span>Место работы</span>
            </div>
          </label>
          <input
            type="text"
            name="workLocation"
            value={formData.workLocation}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Городской парк, ул. Ленина 123"
          />
        </div>

        {/* Notes */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center space-x-2">
              <FileText size={16} />
              <span>Примечания</span>
            </div>
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Дополнительная информация..."
          />
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
        >
          Отмена
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
        >
          {loading
            ? (isEdit ? 'Сохранение...' : 'Создание...')
            : (isEdit ? 'Сохранить изменения' : 'Создать клиента')
          }
        </button>
      </div>
    </form>
  );
};

export default AddClientForm;
import { useState, useEffect } from 'react';
import { User, Mail, Phone, Hash, MapPin, Calendar, Clock, FileText, Camera, Briefcase } from 'lucide-react';
import api from '../api/axios';
import { districtsAPI } from '../api/api';
import FacePhotosUpload from './FacePhotosUpload';

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
  const [mtuLocations, setMtuLocations] = useState([]);
  const [selectedMTUs, setSelectedMTUs] = useState([]);
  const [facePhotos, setFacePhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDistricts();
    fetchMTULocations();
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

  const fetchMTULocations = async () => {
    try {
      const response = await api.get('/mtu');
      setMtuLocations(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching MTU locations:', error);
    }
  };

  const handleMTUToggle = (mtuId) => {
    setSelectedMTUs(prev =>
      prev.includes(mtuId)
        ? prev.filter(id => id !== mtuId)
        : [...prev, mtuId]
    );
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

      let clientId;

      if (isEdit && initialData?.id) {
        // Режим редактирования - PUT запрос
        await api.put(`/clients/${initialData.id}`, payload);
        clientId = initialData.id;
      } else {
        // Режим создания - POST запрос
        const response = await api.post('/clients', payload);
        clientId = response.data?.data?.id || response.data?.id;
      }

      // Upload face photos if provided (only for new clients)
      if (!isEdit && facePhotos.length >= 3 && clientId) {
        try {
          const faceFormData = new FormData();
          faceFormData.append('clientId', clientId);

          facePhotos.forEach((photo) => {
            faceFormData.append('photos', photo.file);
          });

          await api.post('/face-id/register', faceFormData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
        } catch (faceError) {
          console.error('Face registration error:', faceError);
          setError('Клиент создан, но ошибка при регистрации лица: ' + (faceError.response?.data?.message || faceError.message));
          setLoading(false);
          return;
        }
      }

      // Assign MTU locations if selected
      if (selectedMTUs.length > 0 && clientId) {
        try {
          for (const mtuId of selectedMTUs) {
            await api.post(`/mtu/${mtuId}/assign`, {
              clientId: clientId,
              assignedBy: null // Will be set by backend from auth token
            });
          }
        } catch (mtuError) {
          console.error('MTU assignment error:', mtuError);
          setError('Клиент создан, но ошибка при назначении MTU: ' + (mtuError.response?.data?.message || mtuError.message));
          setLoading(false);
          return;
        }
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
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Иванов Иван Иванович"
            required
          />
        </div>

        {/* ID Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="1234567890123"
            required
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="+996555123456"
            required
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="client@example.com"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <div className="flex items-center space-x-2">
              <MapPin size={16} />
              <span>Район</span>
            </div>
          </label>
          <select
            name="districtId"
            value={formData.districtId}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="100"
            required
            min="1"
          />
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* Officer */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <div className="flex items-center space-x-2">
              <User size={16} />
              <span>Куратор</span>
            </div>
          </label>
          <select
            name="officerId"
            value={formData.officerId}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Городской парк, ул. Ленина 123"
          />
        </div>

        {/* Notes */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Дополнительная информация..."
          />
        </div>
      </div>

      {/* Face Photos Upload - Only show for new clients */}
      {!isEdit && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <FacePhotosUpload
            value={facePhotos}
            onChange={setFacePhotos}
            error={facePhotos.length > 0 && facePhotos.length < 3 ? 'Минимум 3 фотографии требуется' : ''}
          />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Необязательно при создании. Фотографии лица можно загрузить позже.
          </p>
        </div>
      )}

      {/* MTU Assignment */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Briefcase className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Назначение на места работы (MTU)
          </h3>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            Выберите одно или несколько мест работы (MTU) для клиента. Необязательно при создании.
          </p>
        </div>

        {mtuLocations.length === 0 ? (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            Нет доступных мест работы
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            {mtuLocations.map((mtu) => (
              <label
                key={mtu.id}
                className={`flex items-start space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedMTUs.includes(mtu.id)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedMTUs.includes(mtu.id)}
                  onChange={() => handleMTUToggle(mtu.id)}
                  className="mt-1 h-4 w-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {mtu.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {mtu.district}
                  </p>
                  {mtu.address && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {mtu.address}
                    </p>
                  )}
                </div>
              </label>
            ))}
          </div>
        )}

        {selectedMTUs.length > 0 && (
          <p className="mt-3 text-sm text-green-600 dark:text-green-400">
            Выбрано мест работы: {selectedMTUs.length}
          </p>
        )}
      </div>

      <div className="flex justify-end space-x-4 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
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
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, MapPin, Download, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';
import MTUMapPicker from '../components/MTUMapPicker';
import axios from 'axios';

const CreateMTUPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    district: '',
    address: '',
    geofenceData: null
  });
  const [errors, setErrors] = useState({});
  const [createdMTU, setCreatedMTU] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleGeofenceChange = (geofenceData) => {
    setFormData(prev => ({
      ...prev,
      geofenceData
    }));

    // Clear geofence error
    if (errors.geofence) {
      setErrors(prev => ({
        ...prev,
        geofence: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Название обязательно';
    }

    if (!formData.district.trim()) {
      newErrors.district = 'Район обязателен';
    }

    if (!formData.geofenceData) {
      newErrors.geofence = 'Выберите геозону на карте';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Пожалуйста, заполните все обязательные поля');
      return;
    }

    setLoading(true);

    try {
      const { geofenceData } = formData;

      const payload = {
        name: formData.name.trim(),
        district: formData.district.trim(),
        address: formData.address.trim() || null,
        geofence_center_lat: geofenceData.center.lat,
        geofence_center_lon: geofenceData.center.lng,
        geofence_size: geofenceData.size
      };

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/mtu/create`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setCreatedMTU(response.data.data);
        toast.success('МТУ успешно создано!');
      }

    } catch (error) {
      console.error('Error creating MTU:', error);
      const message = error.response?.data?.message || 'Ошибка при создании МТУ';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadQR = () => {
    if (createdMTU?.qr_code_url) {
      window.open(`${import.meta.env.VITE_API_URL}${createdMTU.qr_code_url}`, '_blank');
    }
  };

  const handleDownloadPDF = () => {
    if (createdMTU?.qr_pdf_url) {
      window.open(`${import.meta.env.VITE_API_URL}${createdMTU.qr_pdf_url}`, '_blank');
    }
  };

  const handleCreateAnother = () => {
    setFormData({
      name: '',
      district: '',
      address: '',
      geofenceData: null
    });
    setCreatedMTU(null);
    setErrors({});
  };

  const handleGoToList = () => {
    navigate('/mtu');
  };

  // If MTU was just created, show success screen
  if (createdMTU) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Success Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-full">
                  <MapPin className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">МТУ успешно создано!</h1>
                  <p className="text-green-100 mt-1">
                    {createdMTU.name} ({createdMTU.mtu_code})
                  </p>
                </div>
              </div>
            </div>

            {/* MTU Details */}
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Детали МТУ
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Код:</span>
                    <p className="font-mono font-medium text-gray-900 dark:text-white">
                      {createdMTU.mtu_code}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Район:</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {createdMTU.district}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Геозона:</span>
                    <p className="font-mono text-sm text-gray-900 dark:text-white">
                      {createdMTU.geofence.size}м × {createdMTU.geofence.size}м
                    </p>
                  </div>
                </div>
              </div>

              {/* Download Buttons */}
              <div className="space-y-3">
                <h3 className="text-md font-semibold text-gray-900 dark:text-white">
                  Скачать материалы:
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleDownloadQR}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <QrCode className="h-5 w-5" />
                    QR Код (PNG)
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <Download className="h-5 w-5" />
                    PDF с инструкцией
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleCreateAnother}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
                >
                  Создать еще
                </button>
                <button
                  onClick={handleGoToList}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  К списку МТУ
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Regular create form
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Создание МТУ
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Место труда участника с квадратной геозоной и QR кодом
              </p>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
              Отмена
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Основная информация
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Название МТУ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Например: Парк Ата-Тюрк"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              {/* District */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Район <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  placeholder="Например: Бишкек"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.district ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.district && (
                  <p className="text-red-500 text-sm mt-1">{errors.district}</p>
                )}
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Адрес (опционально)
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="ул. Киевская, 1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Map Picker Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <MTUMapPicker
              onChange={handleGeofenceChange}
              value={formData.geofenceData}
              error={errors.geofence}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
            >
              <Save className="h-5 w-5" />
              {loading ? 'Создание...' : 'Создать МТУ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMTUPage;

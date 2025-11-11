import { useState, useEffect } from 'react';
import { MapPin, Plus, Edit, Trash2, AlertTriangle, Search } from 'lucide-react';
import Layout from '../components/Layout';
import { geofencesAPI, districtsAPI, mruAPI } from '../api/api';
import Modal from '../components/Modal';
import MapPicker from '../components/MapPicker';
import { useAuth } from '../context/AuthContext';

const Geofences = () => {
  const { user: currentUser } = useAuth();
  const [geofences, setGeofences] = useState([]);
  const [violations, setViolations] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [mrus, setMRUs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('geofences'); // 'geofences' or 'violations'
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editModal, setEditModal] = useState({ open: false, geofence: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, geofence: null });
  const [formData, setFormData] = useState({
    name: '',
    latitude: '',
    longitude: '',
    radius: 200,
    workLocation: '',
    districtId: '',
    mruId: '',
    isActive: true
  });

  useEffect(() => {
    fetchGeofences();
    fetchViolations();
    fetchDistricts();
    fetchMRUs();
  }, []);

  const fetchGeofences = async () => {
    try {
      setLoading(true);
      const response = await geofencesAPI.getGeofences();
      setGeofences(response.data || []);
    } catch (error) {
      console.error('Error fetching geofences:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchViolations = async () => {
    try {
      const response = await geofencesAPI.getViolations();
      setViolations(response.data || []);
    } catch (error) {
      console.error('Error fetching violations:', error);
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

  const fetchMRUs = async () => {
    try {
      const response = await mruAPI.getAllMRU();
      setMRUs(response.data || []);
    } catch (error) {
      console.error('Error fetching MRUs:', error);
    }
  };

  const getGeofenceLocation = (geofence) => {
    if (geofence.assignedDistrict?.name) {
      const mruName = geofence.assignedDistrict.mru?.name || '';
      return `${geofence.assignedDistrict.name}${mruName ? ` (${mruName})` : ''}`;
    }
    if (geofence.assignedMru?.name) {
      return `${geofence.assignedMru.name} (МРУ)`;
    }
    // Fallback to old district field
    if (geofence.district) {
      return geofence.district;
    }
    return 'Не указан';
  };

  const handleMapLocationChange = (lat, lng) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6)
    }));
  };

  const handleCreateGeofence = async (e) => {
    e.preventDefault();
    try {
      await geofencesAPI.createGeofence({
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        radius: parseInt(formData.radius)
      });
      setShowCreateModal(false);
      setFormData({
        name: '',
        latitude: '',
        longitude: '',
        radius: 200,
        workLocation: '',
        districtId: '',
        mruId: '',
        isActive: true
      });
      fetchGeofences();
      alert('Геозона успешно создана');
    } catch (error) {
      console.error('Error creating geofence:', error);
      alert('Ошибка при создании геозоны');
    }
  };

  const handleUpdateGeofence = async (e) => {
    e.preventDefault();
    try {
      await geofencesAPI.updateGeofence(editModal.geofence.id, {
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        radius: parseInt(formData.radius)
      });
      setEditModal({ open: false, geofence: null });
      setFormData({
        name: '',
        latitude: '',
        longitude: '',
        radius: 200,
        workLocation: '',
        districtId: '',
        mruId: '',
        isActive: true
      });
      fetchGeofences();
      alert('Геозона успешно обновлена');
    } catch (error) {
      console.error('Error updating geofence:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Ошибка при обновлении геозоны';
      alert(errorMessage);
    }
  };

  const handleDeleteGeofence = async () => {
    try {
      await geofencesAPI.deleteGeofence(deleteModal.geofence.id);
      setDeleteModal({ open: false, geofence: null });
      fetchGeofences();
      alert('Геозона успешно удалена');
    } catch (error) {
      console.error('Error deleting geofence:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Ошибка при удалении геозоны';
      alert(errorMessage);
    }
  };

  const filteredGeofences = geofences.filter(gf =>
    gf.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gf.workLocation?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Управление геозонами</h1>
          <p className="text-gray-600 mt-2">Настройка рабочих зон и мониторинг нарушений</p>
        </div>
        {(currentUser?.role === 'superadmin' || currentUser?.role === 'regional_admin' || currentUser?.role === 'district_admin') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition shadow-md"
          >
            <Plus size={20} />
            <span>Добавить геозону</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('geofences')}
          className={`px-6 py-2 rounded-lg transition ${
            activeTab === 'geofences'
              ? 'bg-white text-blue-600 shadow'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Геозоны ({geofences.length})
        </button>
        <button
          onClick={() => setActiveTab('violations')}
          className={`px-6 py-2 rounded-lg transition ${
            activeTab === 'violations'
              ? 'bg-white text-blue-600 shadow'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Нарушения ({violations.length})
        </button>
      </div>

      {activeTab === 'geofences' && (
        <>
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Поиск по названию или адресу..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Geofences Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGeofences.map((geofence) => (
                <div
                  key={geofence.id}
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <MapPin size={24} className="text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">{geofence.name}</h3>
                        <p className="text-sm text-gray-500">{getGeofenceLocation(geofence)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {(currentUser?.role === 'superadmin' || currentUser?.role === 'regional_admin' || currentUser?.role === 'district_admin') && (
                        <button
                          onClick={() => {
                            setFormData({
                              name: geofence.name,
                              latitude: geofence.latitude,
                              longitude: geofence.longitude,
                              radius: geofence.radius,
                              workLocation: geofence.workLocation,
                              districtId: geofence.districtId || '',
                              mruId: geofence.mruId || '',
                              isActive: geofence.isActive
                            });
                            setEditModal({ open: true, geofence });
                          }}
                          className="text-blue-600 hover:text-blue-800 transition p-2 hover:bg-blue-50 rounded-lg"
                          title="Редактировать геозону"
                        >
                          <Edit size={18} />
                        </button>
                      )}
                      {currentUser?.role === 'superadmin' && (
                        <button
                          onClick={() => setDeleteModal({ open: true, geofence })}
                          className="text-red-600 hover:text-red-800 transition p-2 hover:bg-red-50 rounded-lg"
                          title="Удалить геозону"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <p>
                      <span className="font-medium">Адрес:</span> {geofence.workLocation || 'Не указан'}
                    </p>
                    <p>
                      <span className="font-medium">Координаты:</span>{' '}
                      {geofence.latitude.toFixed(6)}, {geofence.longitude.toFixed(6)}
                    </p>
                    <p>
                      <span className="font-medium">Радиус:</span> {geofence.radius} м
                    </p>
                  </div>

                  <div className="mt-4">
                    {geofence.isActive ? (
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        Активна
                      </span>
                    ) : (
                      <span className="inline-block px-3 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                        Неактивна
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredGeofences.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-500">
              Геозоны не найдены
            </div>
          )}
        </>
      )}

      {activeTab === 'violations' && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Клиент
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Геозона
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Тип нарушения
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Расстояние
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Дата
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {violations.map((violation) => (
                  <tr key={violation.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle size={18} className="text-red-500" />
                        <span className="text-sm font-medium text-gray-800">
                          {violation.Client?.fullName || 'Неизвестно'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {violation.Geofence?.name || 'Неизвестно'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          violation.violationType === 'exit'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {violation.violationType === 'exit' ? 'Выход из зоны' : 'Не вошел в зону'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {violation.distanceFromCenter ? `${violation.distanceFromCenter.toFixed(0)} м` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(violation.violationTime).toLocaleString('ru-RU')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {violations.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Нарушений не обнаружено
            </div>
          )}
        </div>
      )}

      {/* Create Geofence Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setFormData({
            name: '',
            latitude: '',
            longitude: '',
            radius: 200,
            workLocation: '',
            districtId: '',
            mruId: '',
            isActive: true
          });
        }}
        title="Добавить геозону"
      >
        <form onSubmit={handleCreateGeofence} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Например: Парк Победы"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Адрес места работы
            </label>
            <input
              type="text"
              required
              value={formData.workLocation}
              onChange={(e) => setFormData({ ...formData, workLocation: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Полный адрес"
            />
          </div>

          {/* Interactive Map */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📍 Выберите точку на карте (кликните по карте)
            </label>
            <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
              <MapPicker
                latitude={formData.latitude}
                longitude={formData.longitude}
                radius={formData.radius}
                onLocationChange={handleMapLocationChange}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 Подсказка: Кликните по карте чтобы выбрать центр геозоны. Синий круг показывает радиус геозоны.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Широта
              </label>
              <input
                type="number"
                step="any"
                required
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="42.8746"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Долгота
              </label>
              <input
                type="number"
                step="any"
                required
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="74.5698"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Радиус (метры)
            </label>
            <input
              type="number"
              required
              value={formData.radius}
              onChange={(e) => setFormData({ ...formData, radius: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Район
            </label>
            <select
              value={formData.districtId}
              onChange={(e) => setFormData({ ...formData, districtId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Выберите район</option>
              {districts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name} ({district.mru?.name || 'МРУ не указано'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              МРУ (опционально)
            </label>
            <select
              value={formData.mruId}
              onChange={(e) => setFormData({ ...formData, mruId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Не указано</option>
              {mrus.map((mru) => (
                <option key={mru.id} value={mru.id}>
                  {mru.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Активная геозона
            </label>
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

      {/* Edit Geofence Modal */}
      <Modal
        isOpen={editModal.open}
        onClose={() => {
          setEditModal({ open: false, geofence: null });
          setFormData({
            name: '',
            latitude: '',
            longitude: '',
            radius: 200,
            workLocation: '',
            districtId: '',
            mruId: '',
            isActive: true
          });
        }}
        title="Редактировать геозону"
      >
        <form onSubmit={handleUpdateGeofence} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Например: Парк Победы"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Адрес места работы
            </label>
            <input
              type="text"
              required
              value={formData.workLocation}
              onChange={(e) => setFormData({ ...formData, workLocation: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Полный адрес"
            />
          </div>

          {/* Interactive Map */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📍 Выберите точку на карте (кликните по карте)
            </label>
            <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
              <MapPicker
                latitude={formData.latitude}
                longitude={formData.longitude}
                radius={formData.radius}
                onLocationChange={handleMapLocationChange}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 Подсказка: Кликните по карте чтобы выбрать центр геозоны. Синий круг показывает радиус геозоны.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Широта
              </label>
              <input
                type="number"
                step="any"
                required
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="42.8746"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Долгота
              </label>
              <input
                type="number"
                step="any"
                required
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="74.5698"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Радиус (метры)
            </label>
            <input
              type="number"
              required
              value={formData.radius}
              onChange={(e) => setFormData({ ...formData, radius: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Район
            </label>
            <select
              value={formData.districtId}
              onChange={(e) => setFormData({ ...formData, districtId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Выберите район</option>
              {districts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name} ({district.mru?.name || 'МРУ не указано'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              МРУ (опционально)
            </label>
            <select
              value={formData.mruId}
              onChange={(e) => setFormData({ ...formData, mruId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Не указано</option>
              {mrus.map((mru) => (
                <option key={mru.id} value={mru.id}>
                  {mru.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="editIsActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="editIsActive" className="text-sm font-medium text-gray-700">
              Активная геозона
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Обновить
            </button>
            <button
              type="button"
              onClick={() => {
                setEditModal({ open: false, geofence: null });
                setFormData({
                  name: '',
                  latitude: '',
                  longitude: '',
                  radius: 200,
                  workLocation: '',
                  districtId: '',
                  mruId: '',
                  isActive: true
                });
              }}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              Отмена
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Geofence Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, geofence: null })}
        title="Подтверждение удаления"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Вы действительно хотите удалить геозону <strong>{deleteModal.geofence?.name}</strong>?
          </p>
          <p className="text-sm text-red-600">
            Это действие необратимо. Геозона будет удалена из системы.
          </p>
          <div className="flex space-x-3 pt-4">
            <button
              onClick={handleDeleteGeofence}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Удалить
            </button>
            <button
              onClick={() => setDeleteModal({ open: false, geofence: null })}
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

export default Geofences;

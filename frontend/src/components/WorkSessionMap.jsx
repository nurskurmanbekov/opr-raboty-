import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Circle, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { X, MapPin, Camera, Clock, AlertTriangle, TrendingUp, Filter } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const startIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const endIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const photoIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to fit map bounds
function MapBoundsHandler({ bounds }) {
  const map = useMap();

  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);

  return null;
}

const WorkSessionMap = ({ sessionId, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [filters, setFilters] = useState({
    showViolationsOnly: false,
    showPhotos: true,
    showRoute: true,
    timeRange: [0, 100]
  });
  const [selectedTimePoint, setSelectedTimePoint] = useState(null);

  useEffect(() => {
    fetchRouteData();
  }, [sessionId]);

  const fetchRouteData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/work-sessions/${sessionId}/route`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching route data:', error);
      setLoading(false);
    }
  };

  // Filter route points based on time range
  const filteredRoute = useMemo(() => {
    if (!data || !data.route || data.route.length === 0) return [];

    const totalPoints = data.route.length;
    const startIndex = Math.floor((filters.timeRange[0] / 100) * totalPoints);
    const endIndex = Math.ceil((filters.timeRange[1] / 100) * totalPoints);

    let filtered = data.route.slice(startIndex, endIndex);

    // If showing violations only, filter to points outside geofence
    if (filters.showViolationsOnly && data.geofence) {
      filtered = filtered.filter(point => {
        const distance = calculateDistance(
          point.latitude,
          point.longitude,
          data.geofence.latitude,
          data.geofence.longitude
        );
        return distance > data.geofence.radius;
      });
    }

    return filtered;
  }, [data, filters]);

  // Filter photos based on time range
  const filteredPhotos = useMemo(() => {
    if (!data || !data.photos || !filters.showPhotos) return [];

    if (data.route.length === 0) return data.photos;

    const startTime = new Date(data.route[0].timestamp).getTime();
    const endTime = new Date(data.route[data.route.length - 1].timestamp).getTime();
    const totalDuration = endTime - startTime;

    return data.photos.filter(photo => {
      if (!photo.timestamp) return true;
      const photoTime = new Date(photo.timestamp).getTime();
      const photoPosition = ((photoTime - startTime) / totalDuration) * 100;
      return photoPosition >= filters.timeRange[0] && photoPosition <= filters.timeRange[1];
    });
  }, [data, filters]);

  // Calculate map bounds
  const mapBounds = useMemo(() => {
    if (!data) return null;

    const bounds = [];

    // Add start/end points
    if (data.session.startLatitude && data.session.startLongitude) {
      bounds.push([data.session.startLatitude, data.session.startLongitude]);
    }
    if (data.session.endLatitude && data.session.endLongitude) {
      bounds.push([data.session.endLatitude, data.session.endLongitude]);
    }

    // Add route points
    filteredRoute.forEach(point => {
      bounds.push([point.latitude, point.longitude]);
    });

    // Add geofence bounds
    if (data.geofence) {
      bounds.push([data.geofence.latitude, data.geofence.longitude]);
    }

    return bounds.length > 0 ? bounds : null;
  }, [data, filteredRoute]);

  // Calculate center
  const mapCenter = useMemo(() => {
    if (!data) return [42.8746, 74.5698]; // Default: Bishkek

    if (data.geofence) {
      return [data.geofence.latitude, data.geofence.longitude];
    }

    if (data.session.startLatitude && data.session.startLongitude) {
      return [data.session.startLatitude, data.session.startLongitude];
    }

    return [42.8746, 74.5698];
  }, [data]);

  // Helper function to calculate distance
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // Format time
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format date
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка карты...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">
          <p className="text-gray-600">Нет данных для отображения</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
            Закрыть
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-auto">
      <div className="min-h-screen p-4 md:p-8">
        <div className="bg-white rounded-xl shadow-2xl max-w-7xl mx-auto">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
                <MapPin className="text-blue-600" />
                <span>GPS Маршрут работы</span>
              </h2>
              <p className="text-gray-600 mt-1">
                {data.session.client.fullName} • {formatDate(data.session.startTime)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <X size={28} />
            </button>
          </div>

          {/* Statistics Cards */}
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-blue-600 mb-1">
                  <Clock size={18} />
                  <span className="text-xs font-medium">Всего часов</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">{data.session.hoursWorked || 0}</p>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-green-600 mb-1">
                  <TrendingUp size={18} />
                  <span className="text-xs font-medium">В геозоне</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">{data.statistics.timeInGeofence} мин</p>
                <div className="w-full bg-green-200 rounded-full h-1.5 mt-2">
                  <div
                    className="bg-green-600 h-1.5 rounded-full"
                    style={{
                      width: `${(data.statistics.timeInGeofence / (data.statistics.timeInGeofence + data.statistics.timeOutGeofence)) * 100}%`
                    }}
                  ></div>
                </div>
              </div>

              <div className="bg-red-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-red-600 mb-1">
                  <AlertTriangle size={18} />
                  <span className="text-xs font-medium">Вне геозоны</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">{data.statistics.timeOutGeofence} мин</p>
                <div className="w-full bg-red-200 rounded-full h-1.5 mt-2">
                  <div
                    className="bg-red-600 h-1.5 rounded-full"
                    style={{
                      width: `${(data.statistics.timeOutGeofence / (data.statistics.timeInGeofence + data.statistics.timeOutGeofence)) * 100}%`
                    }}
                  ></div>
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-purple-600 mb-1">
                  <Camera size={18} />
                  <span className="text-xs font-medium">Фото</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">{data.statistics.photosCount}</p>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-yellow-600 mb-1">
                  <MapPin size={18} />
                  <span className="text-xs font-medium">GPS точек</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">{data.statistics.gpsPointsCount}</p>
              </div>

              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-orange-600 mb-1">
                  <TrendingUp size={18} />
                  <span className="text-xs font-medium">Дистанция</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">{(data.statistics.totalDistance / 1000).toFixed(2)} км</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2 mb-4">
              <Filter size={20} className="text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-800">Фильтры</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Checkboxes */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.showViolationsOnly}
                    onChange={(e) => setFilters({ ...filters, showViolationsOnly: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Показать только нарушения (вне геозоны)</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.showPhotos}
                    onChange={(e) => setFilters({ ...filters, showPhotos: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Показать фото на карте</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.showRoute}
                    onChange={(e) => setFilters({ ...filters, showRoute: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Показать маршрут</span>
                </label>
              </div>

              {/* Time Range Slider */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Временной диапазон
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max={filters.timeRange[1]}
                    value={filters.timeRange[0]}
                    onChange={(e) => setFilters({
                      ...filters,
                      timeRange: [parseInt(e.target.value), filters.timeRange[1]]
                    })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <input
                    type="range"
                    min={filters.timeRange[0]}
                    max="100"
                    value={filters.timeRange[1]}
                    onChange={(e) => setFilters({
                      ...filters,
                      timeRange: [filters.timeRange[0], parseInt(e.target.value)]
                    })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{filters.timeRange[0]}%</span>
                    <span>{filters.timeRange[1]}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="p-6">
            <div style={{ height: '600px', width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
              <MapContainer
                center={mapCenter}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapBoundsHandler bounds={mapBounds} />

                {/* Geofence Circle */}
                {data.geofence && (
                  <Circle
                    center={[data.geofence.latitude, data.geofence.longitude]}
                    radius={data.geofence.radius}
                    pathOptions={{
                      color: 'blue',
                      fillColor: 'blue',
                      fillOpacity: 0.1,
                      weight: 2
                    }}
                  >
                    <Popup>
                      <div className="text-center">
                        <p className="font-bold text-blue-600">{data.geofence.name}</p>
                        <p className="text-sm text-gray-600">{data.geofence.workLocation}</p>
                        <p className="text-xs text-gray-500 mt-1">Радиус: {data.geofence.radius}м</p>
                      </div>
                    </Popup>
                  </Circle>
                )}

                {/* Start Marker */}
                {data.session.startLatitude && data.session.startLongitude && (
                  <Marker
                    position={[data.session.startLatitude, data.session.startLongitude]}
                    icon={startIcon}
                  >
                    <Popup>
                      <div className="text-center">
                        <p className="font-bold text-green-600">Начало работы</p>
                        <p className="text-sm text-gray-600">{formatTime(data.session.startTime)}</p>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* End Marker */}
                {data.session.endLatitude && data.session.endLongitude && (
                  <Marker
                    position={[data.session.endLatitude, data.session.endLongitude]}
                    icon={endIcon}
                  >
                    <Popup>
                      <div className="text-center">
                        <p className="font-bold text-red-600">Конец работы</p>
                        <p className="text-sm text-gray-600">{formatTime(data.session.endTime)}</p>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Route Polyline */}
                {filters.showRoute && filteredRoute.length > 0 && (
                  <Polyline
                    positions={filteredRoute.map(point => [point.latitude, point.longitude])}
                    pathOptions={{
                      color: '#3B82F6',
                      weight: 3,
                      opacity: 0.7
                    }}
                  />
                )}

                {/* Photo Markers */}
                {filteredPhotos.map((photo) => (
                  photo.latitude && photo.longitude && (
                    <Marker
                      key={photo.id}
                      position={[photo.latitude, photo.longitude]}
                      icon={photoIcon}
                      eventHandlers={{
                        click: () => setSelectedPhoto(photo)
                      }}
                    >
                      <Popup>
                        <div className="text-center">
                          <p className="font-bold text-purple-600 flex items-center space-x-1">
                            <Camera size={16} />
                            <span>Фото</span>
                          </p>
                          <p className="text-sm text-gray-600">{formatTime(photo.timestamp)}</p>
                          <button
                            onClick={() => setSelectedPhoto(photo)}
                            className="mt-2 text-xs bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
                          >
                            Посмотреть
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  )
                ))}
              </MapContainer>
            </div>
          </div>

          {/* Timeline */}
          {data.route.length > 0 && (
            <div className="p-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Временная шкала</h3>
              <div className="relative">
                <div className="flex justify-between text-xs text-gray-600 mb-2">
                  <span>{formatTime(data.session.startTime)}</span>
                  <span>{formatTime(data.session.endTime || data.session.startTime)}</span>
                </div>
                <div className="w-full h-8 bg-gray-200 rounded-lg relative overflow-hidden">
                  {/* Time segments */}
                  {data.route.map((point, index) => {
                    if (index === data.route.length - 1) return null;

                    const nextPoint = data.route[index + 1];
                    const startTime = new Date(data.route[0].timestamp).getTime();
                    const endTime = new Date(data.route[data.route.length - 1].timestamp).getTime();
                    const totalDuration = endTime - startTime;

                    const pointTime = new Date(point.timestamp).getTime();
                    const nextPointTime = new Date(nextPoint.timestamp).getTime();

                    const left = ((pointTime - startTime) / totalDuration) * 100;
                    const width = ((nextPointTime - pointTime) / totalDuration) * 100;

                    // Determine if point is inside or outside geofence
                    let isInside = true;
                    if (data.geofence) {
                      const distance = calculateDistance(
                        point.latitude,
                        point.longitude,
                        data.geofence.latitude,
                        data.geofence.longitude
                      );
                      isInside = distance <= data.geofence.radius;
                    }

                    return (
                      <div
                        key={index}
                        className={`absolute h-full ${isInside ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{
                          left: `${left}%`,
                          width: `${width}%`
                        }}
                        title={`${formatTime(point.timestamp)} - ${isInside ? 'В геозоне' : 'Вне геозоны'}`}
                      ></div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-xs text-gray-600">В геозоне</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span className="text-xs text-gray-600">Вне геозоны</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60]"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="bg-white rounded-xl p-6 max-w-2xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                <Camera className="text-purple-600" />
                <span>Фото работы</span>
              </h3>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <img
              src={`http://localhost:5000/${selectedPhoto.filePath}`}
              alt="Work photo"
              className="w-full rounded-lg mb-4"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/400x300?text=Фото+не+найдено';
              }}
            />

            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Время:</strong> {formatTime(selectedPhoto.timestamp)}</p>
              <p><strong>Тип:</strong> {selectedPhoto.photoType === 'start' ? 'Начало' : selectedPhoto.photoType === 'end' ? 'Конец' : 'Процесс'}</p>
              {selectedPhoto.latitude && selectedPhoto.longitude && (
                <p><strong>Координаты:</strong> {selectedPhoto.latitude.toFixed(6)}, {selectedPhoto.longitude.toFixed(6)}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkSessionMap;

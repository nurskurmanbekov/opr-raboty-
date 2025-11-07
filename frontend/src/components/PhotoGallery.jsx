import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Camera, MapPin, Clock } from 'lucide-react';

// Smart server URL detection for static files (images, uploads)
const getServerUrl = () => {
  // 1. If VITE_API_URL is set, remove '/api' from the end
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/api$/, '');
  }

  // 2. If accessing via localhost/127.0.0.1 - use localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5000';
  }

  // 3. If accessing via IP address - use the same IP for server
  const hostname = window.location.hostname;
  return `http://${hostname}:5000`;
};

const PhotoGallery = ({ photos, onClose, sessionInfo }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!photos || photos.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-md">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Нет фотографий</h3>
          <p className="text-gray-600 mb-6">В этой сессии пока нет загруженных фотографий.</p>
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Закрыть
          </button>
        </div>
      </div>
    );
  }

  const currentPhoto = photos[currentIndex];
  const API_URL = getServerUrl();

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const goToPhoto = (index) => {
    setCurrentIndex(index);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getPhotoTypeLabel = (type) => {
    const labels = {
      start: 'Начало работы',
      end: 'Окончание работы',
      process: 'Процесс работы'
    };
    return labels[type] || type;
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') goToPrevious();
    if (e.key === 'ArrowRight') goToNext();
    if (e.key === 'Escape') onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 z-50 overflow-auto"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="min-h-screen flex flex-col p-4" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center mb-4 text-white">
          <div>
            <h2 className="text-2xl font-bold flex items-center space-x-2">
              <Camera size={28} />
              <span>Фотографии рабочей сессии</span>
            </h2>
            {sessionInfo && (
              <p className="text-gray-300 mt-1">
                {sessionInfo.clientName} • {formatDate(sessionInfo.date)}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 transition p-2"
          >
            <X size={32} />
          </button>
        </div>

        {/* Main Photo Container */}
        <div className="flex-1 flex items-center justify-center mb-4">
          <div className="relative max-w-5xl w-full">
            {/* Navigation Buttons */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition z-10"
                >
                  <ChevronLeft size={32} />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition z-10"
                >
                  <ChevronRight size={32} />
                </button>
              </>
            )}

            {/* Photo Counter */}
            <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg">
              {currentIndex + 1} / {photos.length}
            </div>

            {/* Main Image */}
            <img
              src={`${API_URL}/${currentPhoto.filePath}`}
              alt={`Photo ${currentIndex + 1}`}
              className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/800x600?text=Фото+не+найдено';
              }}
            />
          </div>
        </div>

        {/* Photo Info */}
        <div className="bg-white rounded-xl p-6 mb-4 max-w-5xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <Clock size={20} className="text-blue-600" />
              <div>
                <p className="text-xs text-gray-500">Время</p>
                <p className="text-sm font-medium text-gray-800">
                  {formatTime(currentPhoto.timestamp)}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Camera size={20} className="text-purple-600" />
              <div>
                <p className="text-xs text-gray-500">Тип</p>
                <p className="text-sm font-medium text-gray-800">
                  {getPhotoTypeLabel(currentPhoto.photoType)}
                </p>
              </div>
            </div>

            {currentPhoto.latitude && currentPhoto.longitude && (
              <div className="flex items-center space-x-3">
                <MapPin size={20} className="text-green-600" />
                <div>
                  <p className="text-xs text-gray-500">Координаты</p>
                  <p className="text-sm font-medium text-gray-800">
                    {currentPhoto.latitude.toFixed(6)}, {currentPhoto.longitude.toFixed(6)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Thumbnails */}
        {photos.length > 1 && (
          <div className="bg-white rounded-xl p-4 max-w-5xl mx-auto w-full">
            <div className="flex space-x-2 overflow-x-auto">
              {photos.map((photo, index) => (
                <button
                  key={photo.id}
                  onClick={() => goToPhoto(index)}
                  className={`flex-shrink-0 rounded-lg overflow-hidden transition ${
                    index === currentIndex
                      ? 'ring-4 ring-blue-600'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={`${API_URL}/${photo.filePath}`}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-20 h-20 object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/80?text=?';
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-center text-gray-400 text-sm mt-4">
          <p>Используйте ← → для навигации, Esc для закрытия</p>
        </div>
      </div>
    </div>
  );
};

export default PhotoGallery;

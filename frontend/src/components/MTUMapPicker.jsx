import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Rectangle, Marker, useMapEvents, useMap } from 'react-leaflet';
import { Map, MapPin, Square, Maximize2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

/**
 * Calculate square geofence boundaries from center and size
 */
const calculateSquareBounds = (centerLat, centerLon, sizeMeters) => {
  // 1 degree latitude ≈ 111,000 meters
  const latDelta = (sizeMeters / 2) / 111000;

  // 1 degree longitude varies with latitude
  const lonDelta = (sizeMeters / 2) / (111000 * Math.cos(centerLat * Math.PI / 180));

  return {
    north: centerLat + latDelta,
    south: centerLat - latDelta,
    east: centerLon + lonDelta,
    west: centerLon - lonDelta
  };
};

/**
 * MapClickHandler Component
 * Handles map clicks to set center point
 */
const MapClickHandler = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng);
    }
  });
  return null;
};

/**
 * MapUpdater Component
 * Updates map view when center changes
 */
const MapUpdater = ({ center }) => {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.flyTo(center, map.getZoom());
    }
  }, [center, map]);

  return null;
};

/**
 * MTUMapPicker Component
 *
 * Interactive map for selecting MTU location with square geofence
 * Features:
 * - Click on map to set center
 * - Slider to adjust square size (50m - 1000m)
 * - Visual rectangle showing geofence
 * - Coordinates display
 * - Auto-calculate boundaries
 */
const MTUMapPicker = ({ onChange, value, error }) => {
  const [center, setCenter] = useState(value?.center || { lat: 42.8746, lng: 74.5698 }); // Bishkek center
  const [size, setSize] = useState(value?.size || 200); // Default 200 meters
  const [bounds, setBounds] = useState(null);

  useEffect(() => {
    if (center) {
      const calculatedBounds = calculateSquareBounds(center.lat, center.lng, size);
      setBounds(calculatedBounds);

      if (onChange) {
        onChange({
          center,
          size,
          bounds: calculatedBounds
        });
      }
    }
  }, [center, size, onChange]);

  const handleLocationSelect = (latlng) => {
    setCenter(latlng);
  };

  const handleSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    setSize(newSize);
  };

  // Convert bounds to rectangle coordinates for Leaflet
  const rectangleBounds = bounds
    ? [
        [bounds.south, bounds.west],
        [bounds.north, bounds.east]
      ]
    : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Map className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Выбор геозоны МТУ
        </h3>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>Инструкция:</strong> Нажмите на карту, чтобы выбрать центр геозоны.
          Используйте ползунок для изменения размера квадратной зоны (50м - 1000м).
        </p>
      </div>

      {/* Size Slider */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Square className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Размер геозоны
            </label>
          </div>
          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {size} метров
          </span>
        </div>

        <input
          type="range"
          min="50"
          max="1000"
          step="50"
          value={size}
          onChange={handleSizeChange}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />

        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>50м</span>
          <span>500м</span>
          <span>1000м</span>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600 shadow-lg">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={15}
          style={{ height: '450px', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapClickHandler onLocationSelect={handleLocationSelect} />
          <MapUpdater center={center} />

          {/* Center Marker */}
          <Marker position={[center.lat, center.lng]} />

          {/* Square Geofence */}
          {rectangleBounds && (
            <Rectangle
              bounds={rectangleBounds}
              pathOptions={{
                color: '#3b82f6',
                fillColor: '#3b82f6',
                fillOpacity: 0.2,
                weight: 3
              }}
            />
          )}
        </MapContainer>
      </div>

      {/* Coordinates Display */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
              Центр
            </span>
          </div>
          <p className="text-sm font-mono text-gray-900 dark:text-white">
            {center.lat.toFixed(6)}, {center.lng.toFixed(6)}
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <Maximize2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
              Размер
            </span>
          </div>
          <p className="text-sm font-mono text-gray-900 dark:text-white">
            {size}м × {size}м
          </p>
        </div>
      </div>

      {/* Boundaries */}
      {bounds && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
            Границы геозоны:
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono text-gray-700 dark:text-gray-300">
            <div>
              <span className="text-gray-500">Север:</span> {bounds.north.toFixed(6)}
            </div>
            <div>
              <span className="text-gray-500">Юг:</span> {bounds.south.toFixed(6)}
            </div>
            <div>
              <span className="text-gray-500">Восток:</span> {bounds.east.toFixed(6)}
            </div>
            <div>
              <span className="text-gray-500">Запад:</span> {bounds.west.toFixed(6)}
            </div>
          </div>
        </div>
      )}

      {/* Validation Error */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default MTUMapPicker;

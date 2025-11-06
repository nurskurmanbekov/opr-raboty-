import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map clicks
function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : <Marker position={position} />;
}

const MapPicker = ({ latitude, longitude, radius, onLocationChange }) => {
  const [position, setPosition] = useState(null);

  // Initialize position from props
  useEffect(() => {
    if (latitude && longitude) {
      setPosition({ lat: parseFloat(latitude), lng: parseFloat(longitude) });
    } else {
      // Default to Bishkek, Kyrgyzstan
      setPosition({ lat: 42.8746, lng: 74.5698 });
    }
  }, [latitude, longitude]);

  // Call parent callback when position changes
  useEffect(() => {
    if (position && onLocationChange) {
      onLocationChange(position.lat, position.lng);
    }
  }, [position, onLocationChange]);

  if (!position) return <div>Loading map...</div>;

  return (
    <div style={{ height: '400px', width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
      <MapContainer
        center={position}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} setPosition={setPosition} />
        {radius && position && (
          <Circle
            center={position}
            radius={parseInt(radius) || 200}
            pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.2 }}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default MapPicker;

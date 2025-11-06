/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in meters
 */
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * Check if a point is inside a geofence
 * @param {number} userLat - User's latitude
 * @param {number} userLon - User's longitude
 * @param {object} geofence - Geofence object with latitude, longitude, radius
 * @returns {boolean} True if inside geofence
 */
const isInGeofence = (userLat, userLon, geofence) => {
  const distance = haversineDistance(
    userLat,
    userLon,
    geofence.latitude,
    geofence.longitude
  );
  return distance <= geofence.radius;
};

/**
 * Find the nearest geofence to a point
 * @param {number} lat - Point latitude
 * @param {number} lon - Point longitude
 * @param {array} geofences - Array of geofence objects
 * @returns {object} Nearest geofence with distance
 */
const findNearestGeofence = (lat, lon, geofences) => {
  if (!geofences || geofences.length === 0) {
    return null;
  }

  let nearest = null;
  let minDistance = Infinity;

  for (const geofence of geofences) {
    const distance = haversineDistance(
      lat,
      lon,
      geofence.latitude,
      geofence.longitude
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearest = { geofence, distance };
    }
  }

  return nearest;
};

/**
 * Check if coordinates are valid
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {boolean} True if valid
 */
const areCoordinatesValid = (lat, lon) => {
  return (
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
};

module.exports = {
  haversineDistance,
  isInGeofence,
  findNearestGeofence,
  areCoordinatesValid
};

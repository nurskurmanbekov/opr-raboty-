/**
 * Utility functions for square geofence calculations
 * Based on FULL_SYSTEM_SPECIFICATION_FOR_CLAUDE_CODE.md
 */

/**
 * Check if a coordinate point is inside a square geofence
 * @param {number} lat - Latitude to check
 * @param {number} lon - Longitude to check
 * @param {object} bounds - Square boundaries {north, south, east, west}
 * @returns {boolean} - True if inside square
 */
function isInSquare(lat, lon, bounds) {
  return (
    lat >= bounds.south &&
    lat <= bounds.north &&
    lon >= bounds.west &&
    lon <= bounds.east
  );
}

/**
 * Calculate square geofence boundaries from center point and size
 * @param {number} centerLat - Center latitude
 * @param {number} centerLon - Center longitude
 * @param {number} sizeMeters - Size of square in meters (50-1000)
 * @returns {object} - Boundaries {north, south, east, west}
 */
function calculateSquareBounds(centerLat, centerLon, sizeMeters) {
  // Validate size
  if (sizeMeters < 50 || sizeMeters > 1000) {
    throw new Error('Square size must be between 50 and 1000 meters');
  }

  // Calculate half-distance in degrees
  // 1 degree latitude ≈ 111,000 meters
  const latDelta = (sizeMeters / 2) / 111000;

  // 1 degree longitude varies with latitude
  // At equator: 1 degree ≈ 111,000 meters
  // Formula: cos(latitude) * 111,000 meters
  const lonDelta = (sizeMeters / 2) / (111000 * Math.cos(centerLat * Math.PI / 180));

  return {
    north: centerLat + latDelta,
    south: centerLat - latDelta,
    east: centerLon + lonDelta,
    west: centerLon - lonDelta
  };
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param {number} lat1 - First latitude
 * @param {number} lon1 - First longitude
 * @param {number} lat2 - Second latitude
 * @param {number} lon2 - Second longitude
 * @returns {number} - Distance in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Get center point from square boundaries
 * @param {object} bounds - Square boundaries {north, south, east, west}
 * @returns {object} - Center point {lat, lon}
 */
function getCenterFromBounds(bounds) {
  return {
    lat: (bounds.north + bounds.south) / 2,
    lon: (bounds.east + bounds.west) / 2
  };
}

/**
 * Calculate actual size of square from boundaries (in meters)
 * @param {object} bounds - Square boundaries {north, south, east, west}
 * @returns {number} - Approximate size in meters
 */
function getSquareSize(bounds) {
  const center = getCenterFromBounds(bounds);
  const northPoint = { lat: bounds.north, lon: center.lon };

  // Distance from center to north edge * 2 = total size
  const halfSize = calculateDistance(center.lat, center.lon, northPoint.lat, northPoint.lon);
  return Math.round(halfSize * 2);
}

/**
 * Validate square geofence boundaries
 * @param {object} bounds - Square boundaries {north, south, east, west}
 * @returns {object} - {valid: boolean, error: string}
 */
function validateSquareBounds(bounds) {
  if (!bounds || typeof bounds !== 'object') {
    return { valid: false, error: 'Bounds must be an object' };
  }

  const { north, south, east, west } = bounds;

  if (typeof north !== 'number' || typeof south !== 'number' ||
      typeof east !== 'number' || typeof west !== 'number') {
    return { valid: false, error: 'All boundaries must be numbers' };
  }

  if (north <= south) {
    return { valid: false, error: 'North must be greater than south' };
  }

  if (east <= west) {
    return { valid: false, error: 'East must be greater than west' };
  }

  // Validate lat/lon ranges
  if (north > 90 || north < -90 || south > 90 || south < -90) {
    return { valid: false, error: 'Latitude must be between -90 and 90' };
  }

  if (east > 180 || east < -180 || west > 180 || west < -180) {
    return { valid: false, error: 'Longitude must be between -180 and 180' };
  }

  // Check size constraints (50m - 1000m)
  const size = getSquareSize(bounds);
  if (size < 50 || size > 1000) {
    return { valid: false, error: `Square size (${size}m) must be between 50 and 1000 meters` };
  }

  return { valid: true };
}

/**
 * Format coordinates for display
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {string} - Formatted string
 */
function formatCoordinates(lat, lon) {
  return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
}

/**
 * Get square corner coordinates
 * @param {object} bounds - Square boundaries {north, south, east, west}
 * @returns {array} - Array of corner points [{lat, lon}, ...]
 */
function getSquareCorners(bounds) {
  return [
    { lat: bounds.north, lon: bounds.west }, // Northwest
    { lat: bounds.north, lon: bounds.east }, // Northeast
    { lat: bounds.south, lon: bounds.east }, // Southeast
    { lat: bounds.south, lon: bounds.west }  // Southwest
  ];
}

module.exports = {
  isInSquare,
  calculateSquareBounds,
  calculateDistance,
  getCenterFromBounds,
  getSquareSize,
  validateSquareBounds,
  formatCoordinates,
  getSquareCorners
};

/**
 * Map Screen - Display Current Location and GPS Tracking
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MapView, {Marker, Polyline, PROVIDER_GOOGLE} from 'react-native-maps';
import GPSService from '../services/gps';

const MapScreen = () => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [trackingPoints, setTrackingPoints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mapRef, setMapRef] = useState(null);

  useEffect(() => {
    loadInitialLocation();

    // Update location every 5 seconds
    const locationInterval = setInterval(() => {
      updateLocation();
    }, 5000);

    return () => clearInterval(locationInterval);
  }, []);

  const loadInitialLocation = async () => {
    try {
      const location = await GPSService.getCurrentPosition();
      setCurrentLocation(location);

      // Load tracking points if tracking is active
      const points = GPSService.getTrackingPoints();
      setTrackingPoints(points);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Ошибка GPS',
        'Не удалось получить текущее местоположение. Проверьте настройки GPS.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const updateLocation = async () => {
    try {
      const location = await GPSService.getCurrentPosition();
      setCurrentLocation(location);

      // Update tracking points
      const points = GPSService.getTrackingPoints();
      setTrackingPoints(points);
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const handleCenterOnLocation = () => {
    if (currentLocation && mapRef) {
      mapRef.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Загрузка карты...</Text>
      </View>
    );
  }

  if (!currentLocation) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Не удалось определить местоположение
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={loadInitialLocation}>
          <Text style={styles.retryButtonText}>Повторить</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={ref => setMapRef(ref)}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}>
        {/* Current Location Marker */}
        <Marker
          coordinate={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          }}
          title="Текущая позиция"
          description={`Точность: ±${Math.round(currentLocation.accuracy)}м`}
          pinColor="blue"
        />

        {/* Tracking Route */}
        {trackingPoints.length > 1 && (
          <Polyline
            coordinates={trackingPoints.map(point => ({
              latitude: point.latitude,
              longitude: point.longitude,
            }))}
            strokeColor="#007AFF"
            strokeWidth={4}
          />
        )}
      </MapView>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Широта:</Text>
          <Text style={styles.infoValue}>
            {currentLocation.latitude.toFixed(6)}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Долгота:</Text>
          <Text style={styles.infoValue}>
            {currentLocation.longitude.toFixed(6)}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Точность:</Text>
          <Text style={styles.infoValue}>
            ±{Math.round(currentLocation.accuracy)}м
          </Text>
        </View>
        {trackingPoints.length > 0 && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Точек трека:</Text>
            <Text style={styles.infoValue}>{trackingPoints.length}</Text>
          </View>
        )}
      </View>

      {/* Center Button */}
      <TouchableOpacity
        style={styles.centerButton}
        onPress={handleCenterOnLocation}>
        <Text style={styles.centerButtonText}>📍</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  map: {
    flex: 1,
  },
  infoCard: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  centerButton: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  centerButtonText: {
    fontSize: 24,
  },
});

export default MapScreen;

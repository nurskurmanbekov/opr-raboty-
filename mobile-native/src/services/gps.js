/**
 * GPS Service - Background Location Tracking
 * Handles continuous GPS tracking during work sessions
 */

import Geolocation from '@react-native-community/geolocation';
import BackgroundGeolocation from 'react-native-background-geolocation';
import {PermissionsAndroid, Platform, Alert} from 'react-native';
import {gpsAPI, workSessionsAPI} from '../api/client';
import StorageService from './storage';

class GPSService {
  constructor() {
    this.isTracking = false;
    this.currentSessionId = null;
    this.locationUpdateInterval = null;
    this.trackingPoints = [];
  }

  // Request location permissions
  async requestPermissions() {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
        ]);

        return (
          granted['android.permission.ACCESS_FINE_LOCATION'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.ACCESS_COARSE_LOCATION'] ===
            PermissionsAndroid.RESULTS.GRANTED
        );
      } catch (err) {
        console.error('Permission error:', err);
        return false;
      }
    }
    return true;
  }

  // Get current position
  async getCurrentPosition() {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        position => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          });
        },
        error => {
          console.error('GPS error:', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        },
      );
    });
  }

  // Start background tracking
  async startTracking(sessionId) {
    if (this.isTracking) {
      console.log('Already tracking');
      return;
    }

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      Alert.alert(
        'Требуется разрешение',
        'Для отслеживания местоположения необходим доступ к GPS',
      );
      return;
    }

    this.currentSessionId = sessionId;
    this.isTracking = true;
    this.trackingPoints = [];

    // Configure background geolocation
    BackgroundGeolocation.ready(
      {
        // Geolocation Config
        desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
        distanceFilter: 10, // Update every 10 meters
        stopTimeout: 5, // Minutes
        debug: false,
        logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,

        // Activity Recognition
        stopOnTerminate: false,
        startOnBoot: true,

        // HTTP / SQLite config
        batchSync: true,
        autoSync: true,
        maxBatchSize: 50,

        // Application config
        stopOnStationary: false,
        locationUpdateInterval: 5000, // 5 seconds
        fastestLocationUpdateInterval: 3000, // 3 seconds
      },
      state => {
        console.log('BackgroundGeolocation is configured and ready:', state);

        if (!state.enabled) {
          BackgroundGeolocation.start();
        }
      },
    );

    // Listen to location updates
    BackgroundGeolocation.onLocation(
      location => {
        console.log('[location] -', location);
        this.handleLocationUpdate(location);
      },
      error => {
        console.log('[location] ERROR -', error);
      },
    );

    // Start tracking
    BackgroundGeolocation.start();

    console.log('GPS tracking started for session:', sessionId);
  }

  // Handle location update
  async handleLocationUpdate(location) {
    const locationData = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      speed: location.coords.speed,
      heading: location.coords.heading,
      altitude: location.coords.altitude,
      timestamp: new Date(location.timestamp).toISOString(),
    };

    // Add to tracking points
    this.trackingPoints.push(locationData);

    // Send to server (with offline queue support)
    if (this.currentSessionId) {
      try {
        await workSessionsAPI.updateLocation(
          this.currentSessionId,
          locationData,
        );
      } catch (error) {
        console.error('Failed to update location:', error);
        // Queue for offline sync
        await StorageService.queueOfflineAction({
          type: 'UPDATE_LOCATION',
          sessionId: this.currentSessionId,
          data: locationData,
        });
      }
    }
  }

  // Stop tracking
  async stopTracking() {
    if (!this.isTracking) {
      return;
    }

    BackgroundGeolocation.stop();
    this.isTracking = false;

    const points = [...this.trackingPoints];
    this.trackingPoints = [];
    this.currentSessionId = null;

    console.log('GPS tracking stopped');

    return points;
  }

  // Get tracking status
  getTrackingStatus() {
    return {
      isTracking: this.isTracking,
      sessionId: this.currentSessionId,
      pointsCount: this.trackingPoints.length,
    };
  }

  // Get all tracking points
  getTrackingPoints() {
    return [...this.trackingPoints];
  }

  // Check if location is in geofence
  async checkGeofence(latitude, longitude) {
    try {
      const result = await gpsAPI.checkGeofence({latitude, longitude});
      return result;
    } catch (error) {
      console.error('Geofence check failed:', error);
      return null;
    }
  }
}

export default new GPSService();

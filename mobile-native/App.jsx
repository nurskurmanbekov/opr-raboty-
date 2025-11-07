/**
 * Main App Component
 * Probation System Mobile Application
 */

import React, {useEffect} from 'react';
import {StatusBar, LogBox} from 'react-native';
import {AuthProvider} from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import SyncService from './src/services/sync';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

const App = () => {
  useEffect(() => {
    // Start periodic sync on app launch
    SyncService.startPeriodicSync();

    // Cleanup on unmount
    return () => {
      SyncService.stopPeriodicSync();
    };
  }, []);

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </>
  );
};

export default App;

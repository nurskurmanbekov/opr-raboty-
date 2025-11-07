/**
 * Auth Context - Global Authentication State Management
 */

import React, {createContext, useState, useContext, useEffect} from 'react';
import {Alert} from 'react-native';
import {authAPI} from '../api/client';
import StorageService from '../services/storage';

const AuthContext = createContext({});

export const AuthProvider = ({children}) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load user on app start
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = await StorageService.getAuthToken();
      const savedUser = await StorageService.getUser();

      if (token && savedUser) {
        setUser(savedUser);
        setIsAuthenticated(true);

        // Verify token is still valid
        try {
          const currentUser = await authAPI.getCurrentUser();
          setUser(currentUser);
          await StorageService.setUser(currentUser);
        } catch (error) {
          console.log('Token expired, clearing auth');
          await logout();
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      const response = await authAPI.login(email, password);

      if (response.success && response.token) {
        await StorageService.setAuthToken(response.token);
        await StorageService.setUser(response.user);

        setUser(response.user);
        setIsAuthenticated(true);

        return {success: true};
      } else {
        return {
          success: false,
          message: response.message || 'Ошибка входа',
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.message || 'Ошибка подключения к серверу',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await StorageService.removeAuthToken();
      await StorageService.removeUser();
      await StorageService.removeActiveSession();
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const updateUser = async userData => {
    try {
      setUser(prevUser => ({...prevUser, ...userData}));
      await StorageService.setUser({...user, ...userData});
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = await authAPI.getCurrentUser();
      setUser(currentUser);
      await StorageService.setUser(currentUser);
      return currentUser;
    } catch (error) {
      console.error('Error refreshing user:', error);
      throw error;
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;

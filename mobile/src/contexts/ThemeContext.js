import React, { createContext, useState, useEffect } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from '../theme/colors';

const THEME_STORAGE_KEY = '@app_theme';

export const ThemeContext = createContext({
  theme: 'light',
  colors: lightColors,
  isDark: false,
  toggleTheme: () => {},
  setTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState('system');
  const [systemTheme, setSystemTheme] = useState(Appearance.getColorScheme() || 'light');

  // Определяем активную тему
  const activeTheme = theme === 'system' ? systemTheme : theme;
  const isDark = activeTheme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  // Загрузка сохраненной темы при старте
  useEffect(() => {
    loadTheme();
  }, []);

  // Слушаем изменения системной темы
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemTheme(colorScheme || 'light');
    });

    return () => subscription.remove();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setThemeState(savedTheme);
      }
    } catch (error) {
      console.error('Ошибка загрузки темы:', error);
    }
  };

  const setTheme = async (newTheme) => {
    try {
      if (['light', 'dark', 'system'].includes(newTheme)) {
        setThemeState(newTheme);
        await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
      }
    } catch (error) {
      console.error('Ошибка сохранения темы:', error);
    }
  };

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    setTheme(newTheme);
  };

  const value = {
    theme: activeTheme,
    colors,
    isDark,
    toggleTheme,
    setTheme,
    themePreference: theme, // 'light', 'dark', или 'system'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

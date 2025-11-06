import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { lightTheme, darkTheme } from '../theme/theme';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Get initial theme from localStorage or system preference
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    }

    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  };

  const [themeMode, setThemeMode] = useState(getInitialTheme);
  const theme = useMemo(() => (themeMode === 'dark' ? darkTheme : lightTheme), [themeMode]);

  // Update localStorage when theme changes
  useEffect(() => {
    localStorage.setItem('theme', themeMode);
  }, [themeMode]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;

    // Remove old theme class
    root.classList.remove('light-theme', 'dark-theme');

    // Add new theme class
    root.classList.add(`${themeMode}-theme`);

    // Set CSS variables
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // Set meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme.colors.primary);
    }
  }, [theme, themeMode]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e) => {
      const autoTheme = localStorage.getItem('autoTheme');
      if (autoTheme === 'true') {
        setThemeMode(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (mode) => {
    if (mode === 'light' || mode === 'dark') {
      setThemeMode(mode);
    }
  };

  const enableAutoTheme = () => {
    localStorage.setItem('autoTheme', 'true');
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setThemeMode(isDark ? 'dark' : 'light');
  };

  const disableAutoTheme = () => {
    localStorage.setItem('autoTheme', 'false');
  };

  const isAutoTheme = () => {
    return localStorage.getItem('autoTheme') === 'true';
  };

  const value = {
    theme,
    themeMode,
    toggleTheme,
    setTheme,
    enableAutoTheme,
    disableAutoTheme,
    isAutoTheme,
    isDark: themeMode === 'dark',
    isLight: themeMode === 'light'
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export default ThemeContext;

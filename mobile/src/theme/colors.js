// Цветовая схема для светлой и темной темы
export const lightColors = {
  // Основные цвета
  primary: '#3b82f6',
  primaryDark: '#1d4ed8',
  primaryLight: '#60a5fa',

  // Фоны
  background: '#f3f4f6',
  backgroundSecondary: '#fff',
  backgroundTertiary: '#f9fafb',

  // Карточки и поверхности
  card: '#fff',
  surface: '#fff',

  // Текст
  text: '#1f2937',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  textLight: '#bfdbfe',
  textOnPrimary: '#fff',

  // Границы
  border: '#d1d5db',
  borderLight: '#e5e7eb',

  // Состояния
  success: '#10b981',
  successBackground: '#d1fae5',
  successText: '#065f46',

  error: '#ef4444',
  errorBackground: '#fee2e2',
  errorText: '#991b1b',

  warning: '#fbbf24',
  warningBackground: '#fef3c7',
  warningText: '#78350f',

  info: '#3b82f6',
  infoBackground: '#dbeafe',
  infoLight: '#eff6ff',
  infoText: '#1e40af',

  // Специфичные цвета для компонентов
  disabled: '#9ca3af',
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(255, 255, 255, 0.2)',

  // Аватар и акценты
  avatar: '#1d4ed8',
  purple: '#8b5cf6',

  // Статистика и прогресс
  progressBar: '#e5e7eb',
  progressFill: '#3b82f6',
  statBlue: '#dbeafe',
  statGreen: '#d1fae5',
};

export const darkColors = {
  // Основные цвета (немного ярче для контраста на темном фоне)
  primary: '#60a5fa',
  primaryDark: '#3b82f6',
  primaryLight: '#93c5fd',

  // Фоны
  background: '#111827',
  backgroundSecondary: '#1f2937',
  backgroundTertiary: '#374151',

  // Карточки и поверхности
  card: '#1f2937',
  surface: '#374151',

  // Текст
  text: '#f9fafb',
  textSecondary: '#d1d5db',
  textTertiary: '#9ca3af',
  textLight: '#93c5fd',
  textOnPrimary: '#fff',

  // Границы
  border: '#4b5563',
  borderLight: '#374151',

  // Состояния (более яркие для темного фона)
  success: '#34d399',
  successBackground: '#065f46',
  successText: '#d1fae5',

  error: '#f87171',
  errorBackground: '#7f1d1d',
  errorText: '#fecaca',

  warning: '#fbbf24',
  warningBackground: '#78350f',
  warningText: '#fef3c7',

  info: '#60a5fa',
  infoBackground: '#1e3a8a',
  infoLight: '#1e40af',
  infoText: '#dbeafe',

  // Специфичные цвета для компонентов
  disabled: '#6b7280',
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(255, 255, 255, 0.1)',

  // Аватар и акценты
  avatar: '#3b82f6',
  purple: '#a78bfa',

  // Статистика и прогресс
  progressBar: '#4b5563',
  progressFill: '#60a5fa',
  statBlue: '#1e3a8a',
  statGreen: '#065f46',
};

// Экспорт по умолчанию
export default {
  light: lightColors,
  dark: darkColors,
};

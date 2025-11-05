/**
 * Theme configuration for light and dark modes
 */

export const lightTheme = {
  mode: 'light',
  colors: {
    // Primary colors
    primary: '#1976d2',
    primaryLight: '#42a5f5',
    primaryDark: '#1565c0',
    primaryContrast: '#ffffff',

    // Secondary colors
    secondary: '#dc004e',
    secondaryLight: '#f50057',
    secondaryDark: '#c51162',
    secondaryContrast: '#ffffff',

    // Background colors
    background: '#ffffff',
    backgroundPaper: '#f5f5f5',
    backgroundDefault: '#fafafa',

    // Text colors
    textPrimary: 'rgba(0, 0, 0, 0.87)',
    textSecondary: 'rgba(0, 0, 0, 0.6)',
    textDisabled: 'rgba(0, 0, 0, 0.38)',

    // Status colors
    success: '#4caf50',
    successLight: '#81c784',
    successDark: '#388e3c',

    error: '#f44336',
    errorLight: '#e57373',
    errorDark: '#d32f2f',

    warning: '#ff9800',
    warningLight: '#ffb74d',
    warningDark: '#f57c00',

    info: '#2196f3',
    infoLight: '#64b5f6',
    infoDark: '#1976d2',

    // UI colors
    divider: 'rgba(0, 0, 0, 0.12)',
    border: 'rgba(0, 0, 0, 0.23)',
    hover: 'rgba(0, 0, 0, 0.04)',
    selected: 'rgba(25, 118, 210, 0.08)',
    disabled: 'rgba(0, 0, 0, 0.26)',

    // Specific component colors
    appBar: '#1976d2',
    card: '#ffffff',
    cardHover: '#f5f5f5',
    input: '#ffffff',
    inputBorder: 'rgba(0, 0, 0, 0.23)',
    shadow: 'rgba(0, 0, 0, 0.2)'
  },

  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.12)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 25px rgba(0, 0, 0, 0.15)',
    xl: '0 20px 40px rgba(0, 0, 0, 0.2)'
  },

  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px'
  },

  spacing: (multiplier) => `${8 * multiplier}px`,

  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      md: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem'
    },
    fontWeight: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75
    }
  },

  transitions: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)'
    }
  },

  breakpoints: {
    xs: '0px',
    sm: '600px',
    md: '960px',
    lg: '1280px',
    xl: '1920px'
  },

  zIndex: {
    appBar: 1100,
    drawer: 1200,
    modal: 1300,
    snackbar: 1400,
    tooltip: 1500
  }
};

export const darkTheme = {
  mode: 'dark',
  colors: {
    // Primary colors
    primary: '#90caf9',
    primaryLight: '#e3f2fd',
    primaryDark: '#42a5f5',
    primaryContrast: '#000000',

    // Secondary colors
    secondary: '#f48fb1',
    secondaryLight: '#f8bbd0',
    secondaryDark: '#ec407a',
    secondaryContrast: '#000000',

    // Background colors
    background: '#121212',
    backgroundPaper: '#1e1e1e',
    backgroundDefault: '#181818',

    // Text colors
    textPrimary: 'rgba(255, 255, 255, 0.87)',
    textSecondary: 'rgba(255, 255, 255, 0.6)',
    textDisabled: 'rgba(255, 255, 255, 0.38)',

    // Status colors
    success: '#66bb6a',
    successLight: '#81c784',
    successDark: '#4caf50',

    error: '#f44336',
    errorLight: '#e57373',
    errorDark: '#d32f2f',

    warning: '#ffa726',
    warningLight: '#ffb74d',
    warningDark: '#f57c00',

    info: '#29b6f6',
    infoLight: '#4fc3f7',
    infoDark: '#0288d1',

    // UI colors
    divider: 'rgba(255, 255, 255, 0.12)',
    border: 'rgba(255, 255, 255, 0.23)',
    hover: 'rgba(255, 255, 255, 0.08)',
    selected: 'rgba(144, 202, 249, 0.16)',
    disabled: 'rgba(255, 255, 255, 0.3)',

    // Specific component colors
    appBar: '#1e1e1e',
    card: '#1e1e1e',
    cardHover: '#2a2a2a',
    input: '#2a2a2a',
    inputBorder: 'rgba(255, 255, 255, 0.23)',
    shadow: 'rgba(0, 0, 0, 0.5)'
  },

  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.5)',
    md: '0 4px 6px rgba(0, 0, 0, 0.4)',
    lg: '0 10px 25px rgba(0, 0, 0, 0.5)',
    xl: '0 20px 40px rgba(0, 0, 0, 0.6)'
  },

  borderRadius: lightTheme.borderRadius,
  spacing: lightTheme.spacing,
  typography: lightTheme.typography,
  transitions: lightTheme.transitions,
  breakpoints: lightTheme.breakpoints,
  zIndex: lightTheme.zIndex
};

export const themes = {
  light: lightTheme,
  dark: darkTheme
};

export default themes;

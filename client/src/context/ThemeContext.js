import React, { createContext, useState, useContext } from 'react';
import { createTheme } from '@mui/material';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: {
        main: isDarkMode ? '#90caf9' : '#1976d2',
      },
      secondary: {
        main: isDarkMode ? '#f48fb1' : '#dc004e',
      },
      background: {
        default: isDarkMode ? '#121212' : '#ffffff',
        paper: isDarkMode ? '#1e1e1e' : '#ffffff',
      },
      text: {
        primary: isDarkMode ? '#ffffff' : '#000000',
        secondary: isDarkMode ? '#b0b0b0' : '#666666',
      },
    },
  });

  const toggleTheme = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 
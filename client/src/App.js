import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Register from './components/Register';
import Login from './components/Login';
import AuthSuccess from './components/AuthSuccess';

const AppContent = () => {
  const { theme } = useTheme();
  
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/success" element={<AuthSuccess />} />
          <Route path="/" element={<Login />} />
        </Routes>
      </Router>
    </MuiThemeProvider>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;

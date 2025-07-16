import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  IconButton,
  InputAdornment,
  Box,
  Divider,
  useTheme as useMuiTheme
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Google as GoogleIcon,
  GitHub as GitHubIcon,
  Brightness4 as MoonIcon,
  Brightness7 as SunIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const Login = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const muiTheme = useMuiTheme();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', formData);
      if (response.data.success) {
        navigate('/auth/success');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  const handleGithubLogin = () => {
    window.location.href = 'http://localhost:5000/api/auth/github';
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1 }}>
        <IconButton onClick={toggleTheme} color="inherit">
          {isDarkMode ? <SunIcon /> : <MoonIcon />}
        </IconButton>
      </Box>
      
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          mt: 4,
          backgroundColor: muiTheme.palette.background.paper,
          color: muiTheme.palette.text.primary
        }}
      >
        <Typography variant="h4" align="center" gutterBottom>
          Login
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            required
            margin="normal"
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
          />

          <TextField
            fullWidth
            required
            margin="normal"
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {error && (
            <Typography color="error" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}

          <Button
            fullWidth
            variant="contained"
            color="primary"
            type="submit"
            sx={{ mt: 3 }}
          >
            Login
          </Button>

          <Divider sx={{ my: 3 }}>OR</Divider>

          <Button
            fullWidth
            variant="outlined"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleLogin}
            sx={{ mb: 2 }}
          >
            Sign in with Google
          </Button>

          <Button
            fullWidth
            variant="outlined"
            startIcon={<GitHubIcon />}
            onClick={handleGithubLogin}
          >
            Sign in with GitHub
          </Button>
        </form>
      </Paper>
    </Container>
  );
};

export default Login; 
import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  IconButton,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Box,
  Divider,
  Grid,
  CircularProgress,
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

const OTP_LENGTH = 6;
const OTP_RESEND_TIMER = 30; // seconds

const Register = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const muiTheme = useMuiTheme();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    requirements: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false
    }
  });
  const [otpDialog, setOtpDialog] = useState(false);
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [otpValidation, setOtpValidation] = useState(Array(OTP_LENGTH).fill(null));
  const [resendTimer, setResendTimer] = useState(OTP_RESEND_TIMER);
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [storedOtp, setStoredOtp] = useState('');

  const checkPasswordStrength = (password) => {
    const requirements = {
      length: password.length >= 8 && password.length <= 16,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const score = Object.values(requirements).filter(Boolean).length;
    setPasswordStrength({ score, requirements });
  };

  const checkEmailExists = async (email) => {
    try {
      const response = await axios.post('/api/auth/check-email', { email });
      setEmailExists(response.data.exists);
    } catch (error) {
      console.error('Error checking email:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'password') {
      checkPasswordStrength(value);
    }
    if (name === 'email') {
      checkEmailExists(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      // First, send OTP to email
      const response = await axios.post('http://localhost:5000/api/auth/send-otp', { 
        email: formData.email 
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        // Store the OTP
        setStoredOtp(response.data.otp);
        // Show the OTP dialog immediately
        setOtpDialog(true);
        // Reset OTP input fields
        setOtp(Array(OTP_LENGTH).fill(''));
        setOtpValidation(Array(OTP_LENGTH).fill(null));
        // Start the resend timer
        setResendTimer(OTP_RESEND_TIMER);
        setCanResend(false);
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      if (error.response) {
        alert(error.response.data.message || 'Failed to send OTP');
      } else {
        alert('An error occurred. Please try again.');
      }
    }
  };

  useEffect(() => {
    let timer;
    if (otpDialog && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [otpDialog, resendTimer]);

  const handleOtpChange = (index, value) => {
    if (value.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Validate the digit against the stored OTP
      const newValidation = [...otpValidation];
      if (value && storedOtp && storedOtp.length > 0) {
        // Compare the entered digit with the corresponding digit in storedOtp
        newValidation[index] = value === storedOtp[index];
      } else {
        newValidation[index] = null;
      }
      setOtpValidation(newValidation);

      // Move to next input if current input is filled
      if (value && index < OTP_LENGTH - 1) {
        const nextInput = document.getElementById(`otp-input-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleResendOtp = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/resend-otp', { email: formData.email });
      if (response.data.success) {
        // Initialize storedOtp with the new OTP
        setStoredOtp(response.data.otp);
        setResendTimer(OTP_RESEND_TIMER);
        setCanResend(false);
        setOtp(Array(OTP_LENGTH).fill(''));
        setOtpValidation(Array(OTP_LENGTH).fill(null));
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
      if (error.response) {
        alert(error.response.data.message || 'Failed to resend OTP');
      } else {
        alert('An error occurred while resending OTP. Please try again.');
      }
    }
  };

  const handleOtpSubmit = async () => {
    try {
      setIsVerifying(true);
      const otpString = otp.join('');
      
      // First verify the OTP
      const verifyResponse = await axios.post('http://localhost:5000/api/auth/verify-otp', {
        email: formData.email,
        otp: otpString
      });

      if (verifyResponse.data.success) {
        // Only create account if OTP is valid
        const registerResponse = await axios.post('http://localhost:5000/api/auth/register', formData, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (registerResponse.data.success) {
          // Close OTP dialog and redirect to login
          setOtpDialog(false);
          navigate('/login');
        }
      } else {
        // If OTP is incorrect, show error and don't create account
        setOtpValidation(Array(OTP_LENGTH).fill(false));
        alert('Invalid OTP. Please try again.');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      // Mark all digits as incorrect
      setOtpValidation(Array(OTP_LENGTH).fill(false));
      if (error.response) {
        alert(error.response.data.message || 'Invalid OTP');
      } else {
        alert('An error occurred during verification. Please try again.');
      }
    } finally {
      setIsVerifying(false);
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
          Register
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            required
            margin="normal"
            label="First Name"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
          />

          <TextField
            fullWidth
            margin="normal"
            label="Last Name"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
          />

          <TextField
            fullWidth
            required
            margin="normal"
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={emailExists}
            helperText={emailExists ? 'Email already exists' : ''}
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

          <Box sx={{ mt: 1 }}>
            <LinearProgress
              variant="determinate"
              value={(passwordStrength.score / 5) * 100}
              sx={{
                '& .MuiLinearProgress-bar': {
                  backgroundColor: 
                    passwordStrength.score < 2 ? '#f44336' :
                    passwordStrength.score < 4 ? '#ff9800' : '#4caf50'
                }
              }}
            />
            <Typography variant="caption" color="textSecondary">
              Password must contain:
            </Typography>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li style={{ color: passwordStrength.requirements.length ? 'green' : 'red' }}>
                8-16 characters
              </li>
              <li style={{ color: passwordStrength.requirements.uppercase ? 'green' : 'red' }}>
                At least one uppercase letter
              </li>
              <li style={{ color: passwordStrength.requirements.lowercase ? 'green' : 'red' }}>
                At least one lowercase letter
              </li>
              <li style={{ color: passwordStrength.requirements.number ? 'green' : 'red' }}>
                At least one number
              </li>
              <li style={{ color: passwordStrength.requirements.special ? 'green' : 'red' }}>
                At least one special character
              </li>
            </ul>
          </Box>

          <TextField
            fullWidth
            required
            margin="normal"
            label="Confirm Password"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={handleChange}
            error={formData.password !== formData.confirmPassword && formData.confirmPassword !== ''}
            helperText={
              formData.password !== formData.confirmPassword && formData.confirmPassword !== ''
                ? 'Passwords do not match'
                : ''
            }
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            fullWidth
            variant="contained"
            color="primary"
            type="submit"
            sx={{ mt: 3 }}
            disabled={
              emailExists ||
              formData.password !== formData.confirmPassword ||
              passwordStrength.score < 5
            }
          >
            Register
          </Button>

          <Divider sx={{ my: 3 }}>OR</Divider>

          <Button
            fullWidth
            variant="outlined"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleLogin}
            sx={{ mb: 2 }}
          >
            Sign up with Google
          </Button>

          <Button
            fullWidth
            variant="outlined"
            startIcon={<GitHubIcon />}
            onClick={handleGithubLogin}
          >
            Sign up with GitHub
          </Button>
        </form>

        <Dialog open={otpDialog} onClose={() => setOtpDialog(false)}>
          <DialogTitle>Enter OTP</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Please enter the 6-digit OTP sent to your email
            </Typography>
            <Grid container spacing={2} justifyContent="center" sx={{ mt: 2 }}>
              {otp.map((digit, index) => (
                <Grid item key={index}>
                  <TextField
                    id={`otp-input-${index}`}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    inputProps={{
                      maxLength: 1,
                      style: { 
                        textAlign: 'center',
                        fontSize: '1.5rem',
                        padding: '8px'
                      }
                    }}
                    sx={{
                      width: '50px',
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: otpValidation[index] === true ? '#e8f5e9' : 
                                       otpValidation[index] === false ? '#ffebee' : 'white',
                        '& fieldset': {
                          borderColor: otpValidation[index] === true ? '#4caf50' : 
                                     otpValidation[index] === false ? '#f44336' : 'rgba(0, 0, 0, 0.23)',
                        },
                      },
                    }}
                  />
                </Grid>
              ))}
            </Grid>
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button
                onClick={handleResendOtp}
                disabled={!canResend}
                color="primary"
                variant="outlined"
                sx={{ mb: 2 }}
              >
                {canResend ? 'Resend OTP' : `Resend in ${resendTimer}s`}
              </Button>
              {isVerifying && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOtpDialog(false)}>Cancel</Button>
            <Button
              onClick={handleOtpSubmit}
              variant="contained"
              color="primary"
              disabled={otp.some(digit => !digit) || isVerifying}
            >
              {isVerifying ? 'Verifying...' : 'Verify'}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default Register; 
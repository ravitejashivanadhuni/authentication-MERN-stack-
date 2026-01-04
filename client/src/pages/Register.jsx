import React, { useState, useEffect } from 'react';
import { EyeIcon, EyeOffIcon, SunIcon, MoonIcon } from "lucide-react";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Link } from 'react-router-dom';

const OTP_LENGTH = 6;
const OTP_RESEND_TIMER = 30; // seconds

const Register = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();

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
  const [error, setError] = useState('');

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

  if (formData.password !== formData.confirmPassword) {
    alert('Passwords do not match');
    return;
  }

  try {
    const response = await axios.post(
      'http://localhost:5000/api/auth/send-otp',
      {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (response.data.success) {
      setOtpDialog(true);
      setOtp(Array(OTP_LENGTH).fill(''));
      setOtpValidation(Array(OTP_LENGTH).fill(null));
      setResendTimer(OTP_RESEND_TIMER);
      setCanResend(false);
    }
  } catch (error) {
    console.error('Error sending OTP:', error);
    alert(error.response?.data?.message || 'Failed to send OTP');
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

// Verify OTP and register user
const handleOtpSubmit = async () => {
  setIsVerifying(true);

  try {
    const otpString = otp.join(""); // combine OTP digits

    // Call verifyOtp API (this will also register the user in backend)
    const verifyResponse = await axios.post('http://localhost:5000/api/auth/verify-otp', {
      email: formData.email,
      otp: otpString
    });

    if (verifyResponse.data.success) {
      // Close OTP dialog and redirect to login
      setOtpDialog(false);
      alert('Registration successful! You can now log in.');
      navigate('/login');
    } else {
      // If OTP is incorrect
      setOtpValidation(Array(OTP_LENGTH).fill(false));
      alert(verifyResponse.data.message || 'Invalid OTP. Please try again.');
    }
  } catch (error) {
    console.error('OTP verification error:', error);
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


  // const handleGoogleLogin = () => {
  //   window.location.href = 'http://localhost:5000/api/auth/google';
  // };

  // const handleGithubLogin = () => {
  //   window.location.href = 'http://localhost:5000/api/auth/github';
  // };

 return (
    <div className={`flex justify-center items-center min-h-screen ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"}`}>
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2 rounded-full bg-gray-200 dark:bg-gray-700"
      >
        {isDarkMode ? <SunIcon size={20} /> : <MoonIcon size={20} />}
      </button>

      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-center mb-4">Register</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="firstName"
            placeholder="First Name"
            value={formData.firstName}
            onChange={handleChange}
            required
            className="w-full p-3 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
          />

          <input
            type="text"
            name="lastName"
            placeholder="Last Name"
            value={formData.lastName}
            onChange={handleChange}
            className="w-full p-3 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            className={`w-full p-3 rounded-lg border ${emailExists ? "border-red-500" : "border-gray-300"} dark:border-gray-600 bg-gray-50 dark:bg-gray-700`}
          />
          {emailExists && <p className="text-red-500 text-sm">Email already exists</p>}

          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full p-3 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
            />
            <button
              type="button"
              className="absolute right-3 top-3"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
            </button>
          </div>

          {/* Password Strength */}
          <div className="space-y-1">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${passwordStrength.score < 2 ? "bg-red-500" : passwordStrength.score < 4 ? "bg-yellow-500" : "bg-green-500"}`}
                style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Password must contain:</p>
            <ul className="text-xs space-y-1">
              <li className={passwordStrength.requirements.length ? "text-green-500" : "text-red-500"}>8-16 characters</li>
              <li className={passwordStrength.requirements.uppercase ? "text-green-500" : "text-red-500"}>At least one uppercase</li>
              <li className={passwordStrength.requirements.lowercase ? "text-green-500" : "text-red-500"}>At least one lowercase</li>
              <li className={passwordStrength.requirements.number ? "text-green-500" : "text-red-500"}>At least one number</li>
              <li className={passwordStrength.requirements.special ? "text-green-500" : "text-red-500"}>At least one special character</li>
            </ul>
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className={`w-full p-3 rounded-lg border ${formData.password !== formData.confirmPassword && formData.confirmPassword !== "" ? "border-red-500" : "border-gray-300"} dark:border-gray-600 bg-gray-50 dark:bg-gray-700`}
            />
            <button
              type="button"
              className="absolute right-3 top-3"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
            </button>
          </div>

          {/* Password mismatch message */}
          {formData.confirmPassword && formData.password !== formData.confirmPassword && (
            <p className="text-red-500 text-sm">Passwords do not match</p>
          )}

          {/* Error */}
          {error && <p className="text-red-500 text-sm">{error}</p>}

          {/* Register Button */}
          <button
            type="submit"
            disabled={emailExists || formData.password !== formData.confirmPassword || passwordStrength.score < 5}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-semibold disabled:bg-gray-400"
          >
            Register
          </button>

          {/* Already have an account */}
          <div className="mt-4">
            <p className="text-sm text-gray-500">
              Already have an account?{" "}
              <Link to="/login" className="text-blue-600 hover:underline">
                Log in
              </Link>
            </p>
          </div>

          {/* <div className="flex items-center gap-2 my-2">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="text-gray-500 text-sm">OR</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div> */}

          {/* Social Logins */}
          {/* <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full border border-gray-300 dark:border-gray-600 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
            Sign up with Google
          </button> */}

          {/* <button
            type="button"
            onClick={handleGithubLogin}
            className="w-full border border-gray-300 dark:border-gray-600 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <img src="https://www.svgrepo.com/show/512317/github-142.svg" alt="GitHub" className="w-5 h-5" />
            Sign up with GitHub
          </button> */}
        </form>
      </div>

      {/* OTP Modal */}
      {otpDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm relative">
            <h3 className="text-xl font-semibold mb-4 text-center">Enter OTP</h3>

            <div className="flex justify-center gap-2 mb-4">
              {otp.map((digit, index) => (
                <input key={index} id={`otp-input-${index}`} type="text" value={digit} onChange={(e) => handleOtpChange(index, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(index, e)} className={`w-10 h-12 text-center border rounded-lg ${otpValidation[index] === false ? "border-red-500" : "border-gray-300"} dark:border-gray-600`} />
              ))}
            </div>

            <button onClick={handleOtpSubmit} disabled={isVerifying} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg mb-2 disabled:bg-gray-400">
              {isVerifying ? 'Verifying...' : 'Verify OTP'}
            </button>

            <button onClick={handleResendOtp} disabled={!canResend} className="w-full border border-gray-300 dark:border-gray-600 py-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
              {canResend ? 'Resend OTP' : `Resend OTP in ${resendTimer}s`}
            </button>

            <button onClick={() => setOtpDialog(false)} className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:hover:text-white">
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
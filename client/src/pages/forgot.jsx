import React, { useState, useEffect } from 'react';
import { EyeIcon, EyeOffIcon, SunIcon, MoonIcon } from "lucide-react";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const OTP_LENGTH = 6;
const OTP_RESEND_TIMER = 30; // seconds

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [otpValidation, setOtpValidation] = useState(Array(OTP_LENGTH).fill(null));
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(OTP_RESEND_TIMER);
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  // Send OTP to email
  const handleSendOtp = async () => {
    if (!email) {
      setError('Please enter your email');
      return;
    }
    try {
      const response = await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
      if (response.data.success) {
        setOtpSent(true);
        setResendTimer(OTP_RESEND_TIMER);
        setCanResend(false);
        setOtp(Array(OTP_LENGTH).fill(''));
        setOtpValidation(Array(OTP_LENGTH).fill(null));
        setError('');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to send OTP');
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
      if (response.data.success) {
        setResendTimer(OTP_RESEND_TIMER);
        setCanResend(false);
        setOtp(Array(OTP_LENGTH).fill(''));
        setOtpValidation(Array(OTP_LENGTH).fill(null));
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to resend OTP');
    }
  };

  // OTP timer
  useEffect(() => {
    let timer;
    if (otpSent && resendTimer > 0) {
      timer = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    } else if (resendTimer === 0) setCanResend(true);
    return () => clearInterval(timer);
  }, [otpSent, resendTimer]);

  const handleOtpChange = (index, value) => {
    if (value.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      const newValidation = [...otpValidation];
      newValidation[index] = value ? true : null;
      setOtpValidation(newValidation);

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

  // Verify OTP and reset password
  const handleResetPassword = async () => {
    const otpString = otp.join("");
    if (!otpString || !newPassword) {
      setError('Please fill all fields');
      return;
    }

    setIsVerifying(true);
    try {
      const response = await axios.post('http://localhost:5000/api/auth/reset-password', {
        email,
        otp: otpString,
        newPassword
      });

      if (response.data.success) {
        alert('Password reset successful! You can now login.');
        navigate('/login');
      } else {
        setOtpValidation(Array(OTP_LENGTH).fill(false));
        setError(response.data.message || 'Invalid OTP');
      }
    } catch (err) {
      console.error(err);
      setOtpValidation(Array(OTP_LENGTH).fill(false));
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className={`flex justify-center items-center min-h-screen ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"}`}>
      {/* Theme Toggle */}
      <button onClick={toggleTheme} className="absolute top-4 right-4 p-2 rounded-full bg-gray-200 dark:bg-gray-700">
        {isDarkMode ? <SunIcon size={20} /> : <MoonIcon size={20} />}
      </button>

      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-center mb-4">Reset Password</h2>

        {!otpSent && (
          <>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full p-3 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-700 mb-4"
            />
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

            <button
              onClick={handleSendOtp}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-semibold"
            >
              Send OTP
            </button>
          </>
        )}

        {otpSent && (
          <>
            <p className="text-sm text-center mb-4">Enter the OTP sent to your email</p>

            <div className="flex justify-center gap-2 mb-4">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-input-${index}`}
                  type="text"
                  value={digit}
                  onChange={e => handleOtpChange(index, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(index, e)}
                  className={`w-10 h-12 text-center border rounded-lg ${otpValidation[index] === false ? "border-red-500" : "border-gray-300"} dark:border-gray-600`}
                />
              ))}
            </div>

            <div className="relative mb-4">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full p-3 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
              />
              <button type="button" className="absolute right-3 top-3" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            </div>

            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

            <button
              onClick={handleResetPassword}
              disabled={isVerifying}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-semibold mb-2 disabled:bg-gray-400"
            >
              {isVerifying ? 'Verifying...' : 'Reset Password'}
            </button>

            <button
              onClick={handleResendOtp}
              disabled={!canResend}
              className="w-full border border-gray-300 dark:border-gray-600 py-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {canResend ? 'Resend OTP' : `Resend OTP in ${resendTimer}s`}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;

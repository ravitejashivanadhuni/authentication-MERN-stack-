const User = require('../models/User');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const bcrypt = require('bcryptjs');

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Temporary OTP store (use Redis/DB in production)
const otpStore = new Map();

// Generate OTP
const generateOTP = () => crypto.randomInt(100000, 999999).toString();

/**
 * Send OTP
 */
exports.sendOtp = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    // prevent OTP spamming (60s gap)
    const existingOtpData = otpStore.get(email);
    if (existingOtpData && Date.now() - existingOtpData.timestamp < 60 * 1000) {
      return res.status(429).json({ success: false, message: 'OTP already sent, please wait before retrying' });
    }

    const otp = generateOTP();

    otpStore.set(email, {
      otp,
      firstName,
      lastName,
      password, // raw password (hash happens in model pre-save)
      timestamp: Date.now(),
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP for Registration',
      text: `Your OTP is: ${otp}. It will expire in 5 minutes.`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ success: true, message: 'OTP sent to email' });
  } catch (error) {
    console.error('Send OTP Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error while sending OTP' });
  }
};

/**
 * Verify OTP & Create User
 */
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const storedData = otpStore.get(email);
    if (!storedData) {
      return res.status(400).json({ success: false, message: 'OTP expired or not found' });
    }

    if (Date.now() - storedData.timestamp > 5 * 60 * 1000) {
      otpStore.delete(email);
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }

    if (storedData.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    const newUser = new User({
      firstName: storedData.firstName,
      lastName: storedData.lastName,
      email,
      password: storedData.password, // raw password → gets hashed by model
      isVerified: true,
    });

    await newUser.save();
    otpStore.delete(email);

    res.status(201).json({ success: true, message: 'User registered successfully' });
    // Optionally, send welcome email here
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: newUser.email,
      subject: 'Welcome to Our Service',
      text: `Hello ${newUser.firstName},\n\nWelcome to our service! Your registration was successful. We're glad to have you on board.`,
    };
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Verify OTP Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error while verifying OTP' });
  }
};

/**
 * Login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'User with this email does not exist' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect Password!' });
    }

    if (!user.isVerified) {
      return res.status(400).json({ success: false, message: 'Please verify your email first' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    console.log('Generated JWT Token:', token);
    const time = new Date().toISOString();
    const deviceInfo = req.headers['user-agent'] || 'Unknown device';
    const location = req.ip || req.connection.remoteAddress || 'Unknown location';
    //send user a mail that he has logged in
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'New Login Alert',
      text: `Hello ${user.firstName},\n\nWe noticed a new login to your account on ${time} from ${deviceInfo}, IP: ${location}. If this was you, no further action is needed. If you did not log in, please reset your password immediately.`,
    };
    await transporter.sendMail(mailOptions);
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
    });
  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error while logging in' });
  }
};

// ✅ Check if email exists
exports.checkEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email });

    if (user) {
      return res.json({ exists: true });
    } else {
      return res.json({ exists: false });
    }
  } catch (error) {
    console.error('Error checking email:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const existingOtpData = otpStore.get(email);

    if (!existingOtpData) {
      return res.status(404).json({ success: false, message: 'No OTP request found for this email' });
    }

    // prevent spamming (again 60s cooldown)
    if (Date.now() - existingOtpData.timestamp < 60 * 1000) {
      return res.status(429).json({ success: false, message: 'Please wait before requesting a new OTP' });
    }

    const otp = generateOTP();

    otpStore.set(email, {
      ...existingOtpData, // keep firstName, lastName, password
      otp,
      timestamp: Date.now(),
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your New OTP for Registration',
      text: `Your new OTP is: ${otp}. It will expire in 5 minutes.`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: 'New OTP sent to email',
      otp, // ⚠️ In production, DO NOT send OTP back in response
    });
  } catch (error) {
    console.error('Resend OTP Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error while resending OTP' });
  }
};

// Forgot Password: send OTP to email
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP + expiry in user document
    user.resetPasswordOtp = otp;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Send OTP via email (using nodemailer)
    const transporter = nodemailer.createTransport({
      service: 'gmail', // or your preferred email service
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Password Reset OTP',
      text: `Your OTP for password reset is: ${otp}. It will expire in 10 minutes.`,
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: 'OTP sent to your email' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });

    const enteredOtp = String(otp).trim();
    const storedOtp = String(user.resetPasswordOtp || '').trim();

    console.log('Entered OTP:', enteredOtp);
    console.log('Stored OTP:', storedOtp);

    if (!storedOtp || storedOtp !== enteredOtp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    if (!user.resetPasswordExpires || Date.now() > user.resetPasswordExpires) {
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }

    // ✅ Let pre-save hook handle hashing
    user.password = newPassword;

    // Clear OTP fields
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ success: true, message: 'Password reset successful' });
    // Optionally, send confirmation email here
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Password Reset Successful',
      text: `Hello ${user.firstName},\n\nYour password has been successfully reset. If you did not perform this action, please contact support immediately.`,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

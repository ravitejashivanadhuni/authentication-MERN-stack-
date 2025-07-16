const User = require('../models/User');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Create a transporter for sending emails
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Store OTPs temporarily (in production, use Redis or similar)
const otpStore = new Map();

// Generate a random 6-digit OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Send OTP to user's email
exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP with timestamp
    otpStore.set(email, {
      otp,
      timestamp: Date.now()
    });

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP for Registration',
      text: `Your OTP for registration is: ${otp}. This OTP will expire in 5 minutes.`
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully'
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP'
    });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const storedData = otpStore.get(email);

    if (!storedData) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired or not found'
      });
    }

    // Check if OTP is expired (5 minutes)
    if (Date.now() - storedData.timestamp > 5 * 60 * 1000) {
      otpStore.delete(email);
      return res.status(400).json({
        success: false,
        message: 'OTP expired'
      });
    }

    if (storedData.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // OTP is valid, remove it from store
    otpStore.delete(email);

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully'
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP'
    });
  }
}; 
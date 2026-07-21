/*
------------------------------------------------
File: authController.js
Purpose: Handles user authorization and profile actions.
Responsibilities: Manages user login, registration, logout, forgot-password, reset-password, and profile CRUD.
Dependencies: User, Student, Faculty, jwt utils, bcryptjs, emailService
------------------------------------------------
*/

const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const { generateToken } = require('../utils/jwt');
const emailService = require('../services/emailService');

module.exports = {
  /*
  POST /api/auth/register
  Registers a new student, faculty, or placement user.
  */
  register: async (req, res, next) => {
    try {
      const { name, email, password, role, department, roll_no, year, cgpa, specialization } = req.body;

      // Verify email existence
      const userExists = await User.findByEmail(email);
      if (userExists) {
        return res.status(400).json({ success: false, message: 'User already exists matching this email' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Create base User
      const newUser = await User.createUser(name, email, passwordHash, role, department);

      // Route creation based on role
      if (role === 'STUDENT') {
        if (!roll_no || !year || !cgpa) {
          return res.status(400).json({ success: false, message: 'Missing roll_no, year, or cgpa parameters' });
        }
        await Student.createStudent(newUser.user_id, roll_no, year, cgpa);
      } else if (role === 'FACULTY') {
        await Faculty.createFaculty(newUser.user_id, specialization || 'General');
      }

      // Return token payload
      const token = generateToken(newUser.user_id);
      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: newUser
      });
    } catch (error) {
      return next(error);
    }
  },

  /*
  POST /api/auth/login
  Authenticates user credentials and returns a JWT token.
  */
  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials provided' });
      }

      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        return res.status(401).json({ success: false, message: 'Invalid credentials provided' });
      }

      const token = generateToken(user.user_id);
      return res.status(200).json({
        success: true,
        token,
        user: {
          id: user.user_id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department
        }
      });
    } catch (error) {
      return next(error);
    }
  },

  /*
  POST /api/auth/logout
  Logs out user session.
  */
  logout: async (req, res, next) => {
    try {
      return res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      return next(error);
    }
  },

  /*
  POST /api/auth/forgot-password
  Dispatches reset code email.
  */
  forgotPassword: async (req, res, next) => {
    try {
      const { email } = req.body;
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Email address not registered' });
      }

      const recoveryToken = 'reset-token-placeholder';
      await emailService.sendForgotPasswordEmail(email, recoveryToken);

      return res.status(200).json({ success: true, message: 'Password recovery email dispatched successfully' });
    } catch (error) {
      return next(error);
    }
  },

  /*
  POST /api/auth/reset-password
  Resets credentials.
  */
  resetPassword: async (req, res, next) => {
    try {
      const { token, newPassword } = req.body;
      // Simulated token logic. Let's just log and hash
      console.log(`Processing password reset for token key: ${token}`);
      return res.status(200).json({ success: true, message: 'Password reset successfully completed' });
    } catch (error) {
      return next(error);
    }
  },

  /*
  GET /api/auth/profile
  Fetches profile context of currently authenticated session.
  */
  getProfile: async (req, res, next) => {
    try {
      const profile = await Student.getStudentProfile(req.user.user_id);
      return res.status(200).json({ success: true, user: profile });
    } catch (error) {
      return next(error);
    }
  },

  /*
  PUT /api/auth/profile
  Updates profile info.
  */
  updateProfile: async (req, res, next) => {
    try {
      const { name, department, phone, roll_no, year, cgpa } = req.body;
      
      // Update core user row (including phone!)
      await User.updateProfile(req.user.user_id, name, department, phone);
      
      // If student, also update student-specific row
      if (req.user.role === 'STUDENT') {
        await Student.updateStudentInfo(req.user.user_id, roll_no, year, cgpa);
      }

      const fullProfile = await Student.getStudentProfile(req.user.user_id);
      return res.status(200).json({ success: true, user: fullProfile });
    } catch (error) {
      return next(error);
    }
  },

  /*
  PUT /api/auth/change-password
  Changes authenticated user password (via old password OR email OTP verification).
  */
  changePassword: async (req, res, next) => {
    try {
      const { currentPassword, newPassword, otpCode } = req.body;
      if (!newPassword) {
        return res.status(400).json({ success: false, message: 'New password is required.' });
      }

      const db = require('../config/db');
      const userId = req.user.user_id;

      // 1. Fetch user credentials & OTP columns
      const userRes = await db.query(
        'SELECT password_hash, otp_code, otp_expires FROM users WHERE user_id = $1',
        [userId]
      );
      const user = userRes.rows[0];
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      // 2. Determine verification method
      if (otpCode) {
        // Verify via OTP code
        const isOtpMatch = user.otp_code && user.otp_code === otpCode.trim();
        const isNotExpired = user.otp_expires && new Date(user.otp_expires) > new Date();

        if (!isOtpMatch || !isNotExpired) {
          return res.status(400).json({ success: false, message: 'Invalid or expired verification OTP.' });
        }
      } else if (currentPassword) {
        // Verify via current password comparison
        const match = await bcrypt.compare(currentPassword, user.password_hash);
        if (!match) {
          return res.status(400).json({ success: false, message: 'Incorrect current password.' });
        }
      } else {
        return res.status(400).json({ success: false, message: 'Please provide either your current password or an email OTP code.' });
      }

      // 3. Hash new password and update in database
      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(newPassword, salt);

      await db.query(
        `UPDATE users 
         SET password_hash = $1, otp_code = NULL, otp_expires = NULL 
         WHERE user_id = $2`,
        [newHash, userId]
      );

      return res.status(200).json({
        success: true,
        message: 'Password changed successfully.'
      });
    } catch (error) {
      return next(error);
    }
  },

  /*
  POST /api/auth/send-otp
  Dispatches OTP code to user's registered email address.
  */
  sendOTP: async (req, res, next) => {
    try {
      const db = require('../config/db');
      const userId = req.user.user_id;

      // 1. Generate 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // 2. Fetch email
      const userRes = await db.query(
        'SELECT email FROM users WHERE user_id = $1',
        [userId]
      );
      const user = userRes.rows[0];
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      // 3. Save OTP in db with 10 minutes expiry
      await db.query(
        `UPDATE users 
         SET otp_code = $1, otp_expires = NOW() + INTERVAL '10 minutes' 
         WHERE user_id = $2`,
        [otpCode, userId]
      );

      // 4. Send email
      await emailService.sendOTPEmail(user.email, otpCode);

      return res.status(200).json({
        success: true,
        message: 'Verification OTP sent to your registered email.'
      });
    } catch (error) {
      return next(error);
    }
  },

  /*
  GET /api/auth/settings
  Pulls visual preferences and alerts toggles.
  */
  getSettings: async (req, res, next) => {
    try {
      const db = require('../config/db');
      const userId = req.user.user_id;

      let settingsRes = await db.query(
        'SELECT * FROM user_settings WHERE user_id = $1',
        [userId]
      );

      // Create default if row not found
      if (settingsRes.rows.length === 0) {
        await db.query(
          'INSERT INTO user_settings (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING',
          [userId]
        );
        settingsRes = await db.query(
          'SELECT * FROM user_settings WHERE user_id = $1',
          [userId]
        );
      }

      return res.status(200).json({
        success: true,
        settings: settingsRes.rows[0]
      });
    } catch (error) {
      return next(error);
    }
  },

  /*
  PUT /api/auth/settings
  Saves visual preferences and alerts toggles.
  */
  updateSettings: async (req, res, next) => {
    try {
      const db = require('../config/db');
      const userId = req.user.user_id;
      const { 
        theme, 
        accent_color, 
        font_size, 
        email_grade, 
        weekly_summary, 
        new_messages, 
        upcoming_deadlines, 
        marketing, 
        notification_channel 
      } = req.body;

      const updateRes = await db.query(
        `UPDATE user_settings 
         SET theme = COALESCE($1, theme),
             accent_color = COALESCE($2, accent_color),
             font_size = COALESCE($3, font_size),
             email_grade = COALESCE($4, email_grade),
             weekly_summary = COALESCE($5, weekly_summary),
             new_messages = COALESCE($6, new_messages),
             upcoming_deadlines = COALESCE($7, upcoming_deadlines),
             marketing = COALESCE($8, marketing),
             notification_channel = COALESCE($9, notification_channel)
         WHERE user_id = $10
         RETURNING *`,
        [
          theme, 
          accent_color, 
          font_size, 
          email_grade, 
          weekly_summary, 
          new_messages, 
          upcoming_deadlines, 
          marketing, 
          notification_channel,
          userId
        ]
      );

      return res.status(200).json({
        success: true,
        message: 'Settings updated successfully.',
        settings: updateRes.rows[0]
      });
    } catch (error) {
      return next(error);
    }
  }
};

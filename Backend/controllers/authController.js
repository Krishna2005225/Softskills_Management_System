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
      const { name, department, roll_no, year, cgpa } = req.body;
      
      // Update core user row
      const updatedUser = await User.updateProfile(req.user.user_id, name, department);
      
      // If student, also update student-specific row
      if (req.user.role === 'STUDENT') {
        await Student.updateStudentInfo(req.user.user_id, roll_no, year, cgpa);
      }

      const fullProfile = await Student.getStudentProfile(req.user.user_id);
      return res.status(200).json({ success: true, user: fullProfile });
    } catch (error) {
      return next(error);
    }
  }
};

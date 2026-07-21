/*
------------------------------------------------
File: authRoutes.js
Purpose: Maps user session actions and profile CRUD endpoints.
Responsibilities: Mounts register, login, profile edit routes, binding validations.
Dependencies: express, authController, authMiddleware
------------------------------------------------
*/

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

/*
POST /api/auth/register
Registers a student or faculty account.
*/
router.post('/register', authController.register);

/*
POST /api/auth/login
Authenticates credentials.
*/
router.post('/login', authController.login);

/*
POST /api/auth/logout
Destroys session references.
*/
router.post('/logout', protect, authController.logout);

/*
POST /api/auth/forgot-password
Dispatches reset code email.
*/
router.post('/forgot-password', authController.forgotPassword);

/*
POST /api/auth/reset-password
Resets credentials.
*/
router.post('/reset-password', authController.resetPassword);

/*
GET /api/auth/profile
Pulls authenticated profile parameters.
*/
router.get('/profile', protect, authController.getProfile);

/*
PUT /api/auth/profile
Saves profile changes.
*/
router.put('/profile', protect, authController.updateProfile);
router.put('/change-password', protect, authController.changePassword);
router.post('/send-otp', protect, authController.sendOTP);
router.get('/settings', protect, authController.getSettings);
router.put('/settings', protect, authController.updateSettings);

module.exports = router;

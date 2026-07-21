/*
------------------------------------------------
File: adminRoutes.js
Purpose: Maps system administrator endpoints.
Responsibilities: Restricts routing paths using authentication protection and role authorization middlewares.
Dependencies: express, adminController, authMiddleware, roleMiddleware
------------------------------------------------
*/

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Require ADMIN role for all routes under /api/admin
router.use(protect, authorize('ADMIN'));

/*
GET /api/admin/users
List all user accounts.
*/
router.get('/users', adminController.listUsers);

/*
PUT /api/admin/users/:userId/role
Update user role status.
*/
router.put('/users/:userId/role', adminController.updateUserRole);

/*
GET /api/admin/stats
Pulls system stats summary.
*/
router.get('/stats', adminController.getSystemStats);

module.exports = router;

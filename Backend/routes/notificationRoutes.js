/*
------------------------------------------------
File: notificationRoutes.js
Purpose: Routes for user notification management.
Dependencies: express, notificationController, authMiddleware
------------------------------------------------
*/

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

/*
GET /api/notifications
Get all notifications for the logged-in user.
*/
router.get('/', protect, notificationController.getMyNotifications);

/*
GET /api/notifications/count
Get unread notification count (for bell badge).
*/
router.get('/count', protect, notificationController.getUnreadCount);

/*
PUT /api/notifications/mark-all-read
Mark all notifications as read.
*/
router.put('/mark-all-read', protect, notificationController.markAllRead);

/*
PUT /api/notifications/:id/read
Mark one notification as read.
*/
router.put('/:id/read', protect, notificationController.markAsRead);

/*
DELETE /api/notifications/:id
Delete a notification.
*/
router.delete('/:id', protect, notificationController.deleteNotification);

module.exports = router;

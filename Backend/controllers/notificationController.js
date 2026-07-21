/*
------------------------------------------------
File: notificationController.js
Purpose: Handles notification fetching, marking as read, and unread count.
Responsibilities: Get all user notifications, mark individual/all as read, get unread count.
Dependencies: db.js
------------------------------------------------
*/

const db = require('../config/db');

module.exports = {

  /*
  GET /api/notifications
  Get all notifications for the logged-in user (newest first).
  */
  getMyNotifications: async (req, res) => {
    try {
      const userId = req.user.user_id;
      const result = await db.query(`
        SELECT notification_id, message, is_read, created_at
        FROM notifications
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 50
      `, [userId]);

      res.json({ success: true, notifications: result.rows });
    } catch (err) {
      console.error('getMyNotifications error:', err);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  },

  /*
  GET /api/notifications/count
  Returns just the unread notification count for bell badge display.
  */
  getUnreadCount: async (req, res) => {
    try {
      const userId = req.user.user_id;
      const result = await db.query(`
        SELECT COUNT(*) AS unread_count
        FROM notifications
        WHERE user_id = $1 AND is_read = FALSE
      `, [userId]);

      res.json({ success: true, count: parseInt(result.rows[0].unread_count) });
    } catch (err) {
      console.error('getUnreadCount error:', err);
      res.status(500).json({ error: 'Failed to fetch unread count' });
    }
  },

  /*
  PUT /api/notifications/:id/read
  Mark a single notification as read.
  */
  markAsRead: async (req, res) => {
    try {
      const userId = req.user.user_id;
      const { id } = req.params;

      await db.query(`
        UPDATE notifications
        SET is_read = TRUE
        WHERE notification_id = $1 AND user_id = $2
      `, [id, userId]);

      res.json({ success: true, message: 'Notification marked as read.' });
    } catch (err) {
      console.error('markAsRead error:', err);
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  },

  /*
  PUT /api/notifications/mark-all-read
  Mark ALL notifications as read for the logged-in user.
  */
  markAllRead: async (req, res) => {
    try {
      const userId = req.user.user_id;

      await db.query(`
        UPDATE notifications
        SET is_read = TRUE
        WHERE user_id = $1 AND is_read = FALSE
      `, [userId]);

      res.json({ success: true, message: 'All notifications marked as read.' });
    } catch (err) {
      console.error('markAllRead error:', err);
      res.status(500).json({ error: 'Failed to mark all as read' });
    }
  },

  /*
  DELETE /api/notifications/:id
  Delete a single notification.
  */
  deleteNotification: async (req, res) => {
    try {
      const userId = req.user.user_id;
      const { id } = req.params;

      await db.query(
        'DELETE FROM notifications WHERE notification_id = $1 AND user_id = $2',
        [id, userId]
      );

      res.json({ success: true, message: 'Notification deleted.' });
    } catch (err) {
      console.error('deleteNotification error:', err);
      res.status(500).json({ error: 'Failed to delete notification' });
    }
  }
};

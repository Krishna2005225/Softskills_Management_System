/*
------------------------------------------------
File: adminController.js
Purpose: Manages administrator tasks, credentials monitoring, system stats, and user accounts.
Responsibilities: Lists system users, updates user role states, toggles global flags.
Dependencies: db.js
------------------------------------------------
*/

const db = require('../config/db');

module.exports = {
  /*
  GET /api/admin/users
  Returns all registered user accounts.
  */
  listUsers: async (req, res, next) => {
    try {
      const result = await db.query(
        'SELECT user_id AS id, name, email, role, department FROM users ORDER BY created_at DESC'
      );
      return res.status(200).json({
        success: true,
        users: result.rows
      });
    } catch (error) {
      return next(error);
    }
  },

  /*
  PUT /api/admin/users/:userId/role
  Updates a user's authorization role.
  */
  updateUserRole: async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      if (!['STUDENT', 'FACULTY', 'PLACEMENT_OFFICER', 'ADMIN'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid role state requested.' });
      }

      const result = await db.query(
        'UPDATE users SET role = $1 WHERE user_id = $2 RETURNING user_id AS id, name, email, role, department',
        [role, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      return res.status(200).json({
        success: true,
        message: 'User role updated successfully',
        user: result.rows[0]
      });
    } catch (error) {
      return next(error);
    }
  },

  /*
  GET /api/admin/stats
  Returns system diagnostics and accounts counts.
  */
  getSystemStats: async (req, res, next) => {
    try {
      const countRes = await db.query('SELECT COUNT(*) FROM users');
      const totalAccounts = parseInt(countRes.rows[0].count) || 0;

      return res.status(200).json({
        success: true,
        stats: {
          totalAccounts,
          activeEndpoints: 48,
          dbStatus: 'Connected',
          status: 'Operational'
        }
      });
    } catch (error) {
      return next(error);
    }
  }
};

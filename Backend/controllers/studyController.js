/*
------------------------------------------------
File: studyController.js
Purpose: Manages study session timer check-in, check-out, and logs.
Responsibilities: Handles check-in (starts timer), check-out (saves duration), and history fetching.
Dependencies: db.js
------------------------------------------------
*/

const db = require('../config/db');

module.exports = {
  /*
  Fetches currently active study session for the logged-in student.
  */
  getActiveSession: async (req, res) => {
    try {
      const studentId = req.user.user_id;
      const result = await db.query(
        'SELECT session_id, start_time FROM study_sessions WHERE student_id = $1 AND end_time IS NULL LIMIT 1',
        [studentId]
      );
      res.json({ success: true, activeSession: result.rows[0] || null });
    } catch (err) {
      console.error('getActiveSession error:', err);
      res.status(500).json({ error: 'Failed to fetch active study session' });
    }
  },

  /*
  Starts a new study session (Check-In).
  */
  checkIn: async (req, res) => {
    try {
      const studentId = req.user.user_id;
      
      // Ensure no active session exists
      const active = await db.query(
        'SELECT session_id FROM study_sessions WHERE student_id = $1 AND end_time IS NULL LIMIT 1',
        [studentId]
      );
      if (active.rows.length > 0) {
        return res.status(400).json({ error: 'A study session is already active.' });
      }

      const result = await db.query(
        'INSERT INTO study_sessions (student_id, start_time) VALUES ($1, CURRENT_TIMESTAMP) RETURNING *',
        [studentId]
      );
      res.json({ success: true, session: result.rows[0] });
    } catch (err) {
      console.error('checkIn error:', err);
      res.status(500).json({ error: 'Failed to check-in study session' });
    }
  },

  /*
  Ends currently active study session (Check-Out) and calculates duration.
  */
  checkOut: async (req, res) => {
    try {
      const studentId = req.user.user_id;
      
      const active = await db.query(
        'SELECT session_id, start_time FROM study_sessions WHERE student_id = $1 AND end_time IS NULL LIMIT 1',
        [studentId]
      );
      if (!active.rows.length) {
        return res.status(400).json({ error: 'No active study session to check-out.' });
      }

      const session = active.rows[0];
      const sessionId = session.session_id;

      // Update study session: set end_time = NOW and calculate duration in minutes
      await db.query(`
        UPDATE study_sessions
        SET end_time = CURRENT_TIMESTAMP,
            duration = ROUND(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - start_time)) / 60)
        WHERE session_id = $1
      `, [sessionId]);

      res.json({ success: true, message: 'Checked out successfully.' });
    } catch (err) {
      console.error('checkOut error:', err);
      res.status(500).json({ error: 'Failed to check-out study session' });
    }
  },

  /*
  Fetches history of study sessions (last 10).
  */
  getHistory: async (req, res) => {
    try {
      const studentId = req.user.user_id;
      const result = await db.query(
        'SELECT session_id, start_time, end_time, duration, created_at FROM study_sessions WHERE student_id = $1 AND end_time IS NOT NULL ORDER BY created_at DESC LIMIT 10',
        [studentId]
      );
      res.json({ success: true, history: result.rows });
    } catch (err) {
      console.error('getHistory error:', err);
      res.status(500).json({ error: 'Failed to fetch study sessions history' });
    }
  }
};

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
    console.log('[StudyController] getActiveSession check for user:', req.user?.user_id);
    try {
      const studentId = req.user.user_id;
      const result = await db.query(
        'SELECT session_id, start_time FROM study_sessions WHERE student_id = $1 AND end_time IS NULL LIMIT 1',
        [studentId]
      );
      console.log('[StudyController] active session result:', result.rows[0] || 'none');
      res.json({ success: true, activeSession: result.rows[0] || null });
    } catch (err) {
      console.error('[StudyController] getActiveSession error:', err);
      res.status(500).json({ error: 'Failed to fetch active study session: ' + err.message });
    }
  },

  /*
  Starts a new study session (Check-In).
  */
  checkIn: async (req, res) => {
    console.log('[StudyController] checkIn request for user:', req.user?.user_id);
    try {
      const studentId = req.user.user_id;
      
      // Ensure no active session exists
      const active = await db.query(
        'SELECT session_id FROM study_sessions WHERE student_id = $1 AND end_time IS NULL LIMIT 1',
        [studentId]
      );
      console.log('[StudyController] active check count:', active.rows.length);
      if (active.rows.length > 0) {
        return res.status(400).json({ error: 'A study session is already active.' });
      }

      console.log('[StudyController] Inserting new session for student:', studentId);
      const result = await db.query(
        'INSERT INTO study_sessions (student_id, start_time) VALUES ($1, CURRENT_TIMESTAMP) RETURNING *',
        [studentId]
      );
      console.log('[StudyController] Insert success:', result.rows[0]);
      res.json({ success: true, session: result.rows[0] });
    } catch (err) {
      console.error('[StudyController] checkIn error caught:', err);
      res.status(500).json({ error: 'Failed to check-in study session: ' + err.message });
    }
  },

  /*
  Ends currently active study session (Check-Out) and calculates duration.
  */
  checkOut: async (req, res) => {
    console.log('[StudyController] checkOut request for user:', req.user?.user_id);
    try {
      const studentId = req.user.user_id;
      
      const active = await db.query(
        'SELECT session_id, start_time FROM study_sessions WHERE student_id = $1 AND end_time IS NULL LIMIT 1',
        [studentId]
      );
      console.log('[StudyController] checkOut active check count:', active.rows.length);
      if (!active.rows.length) {
        return res.status(400).json({ error: 'No active study session to check-out.' });
      }

      const session = active.rows[0];
      const sessionId = session.session_id;

      console.log('[StudyController] Updating session end_time and duration for session:', sessionId);
      // Update study session: set end_time = NOW and calculate duration in minutes
      await db.query(`
        UPDATE study_sessions
        SET end_time = CURRENT_TIMESTAMP,
            duration = ROUND(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - start_time)) / 60)
        WHERE session_id = $1
      `, [sessionId]);

      console.log('[StudyController] checkOut complete.');
      res.json({ success: true, message: 'Checked out successfully.' });
    } catch (err) {
      console.error('[StudyController] checkOut error:', err);
      res.status(500).json({ error: 'Failed to check-out study session: ' + err.message });
    }
  },

  /*
  Fetches history of study sessions (last 10).
  */
  getHistory: async (req, res) => {
    console.log('[StudyController] getHistory request for user:', req.user?.user_id);
    try {
      const studentId = req.user.user_id;
      const result = await db.query(
        'SELECT session_id, start_time, end_time, duration, created_at FROM study_sessions WHERE student_id = $1 AND end_time IS NOT NULL ORDER BY created_at DESC LIMIT 10',
        [studentId]
      );
      res.json({ success: true, history: result.rows });
    } catch (err) {
      console.error('[StudyController] getHistory error:', err);
      res.status(500).json({ error: 'Failed to fetch study sessions history: ' + err.message });
    }
  }
};

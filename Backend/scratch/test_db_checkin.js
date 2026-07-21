/*
------------------------------------------------
File: test_db_checkin.js
Purpose: Simulate DB queries of checkin directly to inspect database errors.
------------------------------------------------
*/

const db = require('../config/db');
const studentId = '23ffe0d8-60c7-4f4a-be51-d555107b7c47'; // KARTHIK THALIPINENI

async function run() {
  try {
    console.log('Simulating SELECT check...');
    const active = await db.query(
      'SELECT session_id FROM study_sessions WHERE student_id = $1 AND end_time IS NULL LIMIT 1',
      [studentId]
    );
    console.log('Active check result:', active.rows);

    console.log('Simulating INSERT checkin...');
    const result = await db.query(
      'INSERT INTO study_sessions (student_id, start_time) VALUES ($1, CURRENT_TIMESTAMP) RETURNING *',
      [studentId]
    );
    console.log('Insert result:', result.rows);
    
    // Rollback session insert if it succeeded, to keep database state clean
    if (result.rows[0]) {
      console.log('Rolling back insert to keep database state clean...');
      await db.query('DELETE FROM study_sessions WHERE session_id = $1', [result.rows[0].session_id]);
      console.log('Rollback successful.');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('DATABASE ERROR DETECTED:', err.message, err.stack);
    process.exit(1);
  }
}

run();

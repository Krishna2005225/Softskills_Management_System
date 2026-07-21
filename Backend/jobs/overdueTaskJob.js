/*
------------------------------------------------
File: overdueTaskJob.js
Purpose: Background cron job that marks overdue task assignments.
Responsibilities: Every 30 minutes, checks all ASSIGNED/IN_PROGRESS task_assignments
                  whose tasks have a due_date in the past and marks them OVERDUE.
                  Also notifies students whose tasks became overdue.
Dependencies: db.js
------------------------------------------------
*/

const db = require('../config/db');

/*
Marks all past-due task_assignments as OVERDUE and notifies affected students.
Run this on server start and then on interval.
*/
const markOverdueTasks = async () => {
  try {
    // Find assignments that are overdue: status is still ASSIGNED/IN_PROGRESS but due_date has passed
    const overdueResult = await db.query(`
      UPDATE task_assignments ta
      SET status = 'OVERDUE'
      FROM tasks t
      WHERE ta.task_id = t.task_id
        AND t.due_date IS NOT NULL
        AND t.due_date < NOW()
        AND ta.status IN ('ASSIGNED', 'IN_PROGRESS')
      RETURNING ta.student_id, ta.task_id, t.title AS task_title
    `);

    if (overdueResult.rows.length > 0) {
      console.log(`[OverdueJob] Marked ${overdueResult.rows.length} task assignment(s) as OVERDUE`);

      // Send notifications to affected students
      for (const row of overdueResult.rows) {
        try {
          await db.query(`
            INSERT INTO notifications (user_id, message)
            VALUES ($1, $2)
          `, [row.student_id, `⚠️ Your task "${row.task_title}" is now overdue. Please contact your faculty.`]);
        } catch (notifErr) {
          // Don't crash the job if one notification fails
          console.error('[OverdueJob] Notification error:', notifErr.message);
        }
      }
    } else {
      console.log('[OverdueJob] No overdue tasks found at', new Date().toLocaleTimeString());
    }
  } catch (err) {
    console.error('[OverdueJob] Error running overdue check:', err.message);
  }
};

/*
Starts the overdue task checker.
Runs immediately on first call, then every 30 minutes.
*/
const startOverdueTaskJob = () => {
  console.log('[OverdueJob] Starting overdue task background job (runs every 30 min)...');
  
  // Run immediately at startup
  markOverdueTasks();

  // Then run every 30 minutes (30 * 60 * 1000 ms)
  setInterval(markOverdueTasks, 30 * 60 * 1000);
};

module.exports = { startOverdueTaskJob, markOverdueTasks };

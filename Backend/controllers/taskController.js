/*
------------------------------------------------
File: taskController.js
Purpose: Task management APIs — create, assign, submit, evaluate tasks.
Responsibilities: Full task lifecycle from faculty creation to student submission and faculty evaluation.
Dependencies: db.js, authMiddleware.js
------------------------------------------------
*/

const db = require('../config/db');

module.exports = {

  /*
  Create a new task (Faculty only).
  Body: { title, description, task_type, due_date, max_score, instructions, resources_url }
  */
  createTask: async (req, res) => {
    try {
      const facultyId = req.user.user_id;
      const { title, description, task_type, due_date, max_score, instructions, resources_url } = req.body;

      if (!title || !task_type) {
        return res.status(400).json({ error: 'title and task_type are required' });
      }

      const validTypes = ['MOCK_INTERVIEW', 'GD_PRACTICE', 'APTITUDE_TEST', 'RESUME_REVIEW', 'CODING_CHALLENGE', 'READING', 'CUSTOM'];
      if (!validTypes.includes(task_type)) {
        return res.status(400).json({ error: `Invalid task_type. Must be one of: ${validTypes.join(', ')}` });
      }

      const result = await db.query(`
        INSERT INTO tasks (created_by, title, description, task_type, due_date, max_score, instructions, resources_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [facultyId, title, description, task_type, due_date || null, max_score || 100, instructions, resources_url]);

      res.status(201).json({ success: true, task: result.rows[0] });
    } catch (err) {
      console.error('createTask error:', err);
      res.status(500).json({ error: 'Failed to create task' });
    }
  },

  /*
  Get all tasks created by the logged-in faculty with submission stats.
  */
  getMyTasks: async (req, res) => {
    try {
      const facultyId = req.user.user_id;

      const result = await db.query(`
        SELECT
          t.*,
          COUNT(ta.id) AS total_assigned,
          COUNT(ta.id) FILTER (WHERE ta.status = 'SUBMITTED') AS submitted_count,
          COUNT(ta.id) FILTER (WHERE ta.status = 'EVALUATED') AS evaluated_count,
          COUNT(ta.id) FILTER (WHERE ta.status = 'OVERDUE') AS overdue_count
        FROM tasks t
        LEFT JOIN task_assignments ta ON ta.task_id = t.task_id
        WHERE t.created_by = $1
        GROUP BY t.task_id
        ORDER BY t.created_at DESC
      `, [facultyId]);

      res.json({ success: true, tasks: result.rows });
    } catch (err) {
      console.error('getMyTasks error:', err);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  },

  /*
  Get a single task by ID (with its assignment list).
  Params: id (task_id)
  */
  getTaskById: async (req, res) => {
    try {
      const { id } = req.params;
      const taskResult = await db.query('SELECT * FROM tasks WHERE task_id = $1', [id]);

      if (!taskResult.rows.length) {
        return res.status(404).json({ error: 'Task not found' });
      }

      const assignmentsResult = await db.query(`
        SELECT ta.*, u.name AS student_name, s.roll_no
        FROM task_assignments ta
        JOIN users u ON u.user_id = ta.student_id
        JOIN students s ON s.student_id = ta.student_id
        WHERE ta.task_id = $1
        ORDER BY ta.status
      `, [id]);

      res.json({ success: true, task: taskResult.rows[0], assignments: assignmentsResult.rows });
    } catch (err) {
      console.error('getTaskById error:', err);
      res.status(500).json({ error: 'Failed to fetch task' });
    }
  },

  /*
  Edit a task (Faculty only, must be creator).
  Params: id (task_id)
  Body: { title, description, due_date, instructions, resources_url }
  */
  updateTask: async (req, res) => {
    try {
      const facultyId = req.user.user_id;
      const { id } = req.params;
      const { title, description, due_date, instructions, resources_url, max_score } = req.body;

      const result = await db.query(`
        UPDATE tasks
        SET
          title = COALESCE($1, title),
          description = COALESCE($2, description),
          due_date = COALESCE($3, due_date),
          instructions = COALESCE($4, instructions),
          resources_url = COALESCE($5, resources_url),
          max_score = COALESCE($6, max_score)
        WHERE task_id = $7 AND created_by = $8
        RETURNING *
      `, [title, description, due_date, instructions, resources_url, max_score, id, facultyId]);

      if (!result.rows.length) {
        return res.status(404).json({ error: 'Task not found or you are not the creator' });
      }

      res.json({ success: true, task: result.rows[0] });
    } catch (err) {
      console.error('updateTask error:', err);
      res.status(500).json({ error: 'Failed to update task' });
    }
  },

  /*
  Delete a task (Faculty only, must be creator).
  Params: id (task_id)
  */
  deleteTask: async (req, res) => {
    try {
      const facultyId = req.user.user_id;
      const { id } = req.params;

      const result = await db.query(
        'DELETE FROM tasks WHERE task_id = $1 AND created_by = $2 RETURNING task_id',
        [id, facultyId]
      );

      if (!result.rows.length) {
        return res.status(404).json({ error: 'Task not found or you are not the creator' });
      }

      res.json({ success: true, message: 'Task deleted successfully.' });
    } catch (err) {
      console.error('deleteTask error:', err);
      res.status(500).json({ error: 'Failed to delete task' });
    }
  },

  /*
  Assign an existing task to one or more students.
  Params: id (task_id)
  Body: { studentIds: [uuid, uuid, ...] }  OR  { assignAll: true } to assign to all batch students
  */
  assignTaskToStudents: async (req, res) => {
    try {
      const facultyId = req.user.user_id;
      const { id: taskId } = req.params;
      let { studentIds, assignAll } = req.body;

      // Verify task belongs to faculty
      const taskCheck = await db.query(
        'SELECT task_id, title FROM tasks WHERE task_id = $1 AND created_by = $2',
        [taskId, facultyId]
      );
      if (!taskCheck.rows.length) {
        return res.status(404).json({ error: 'Task not found or not authorized' });
      }

      const taskTitle = taskCheck.rows[0].title;

      // If assignAll, get all batch students
      if (assignAll) {
        const batchResult = await db.query(
          'SELECT student_id FROM faculty_student_assignments WHERE faculty_id = $1',
          [facultyId]
        );
        studentIds = batchResult.rows.map(r => r.student_id);
      }

      if (!studentIds || studentIds.length === 0) {
        return res.status(400).json({ error: 'No students to assign' });
      }

      let assigned = 0;
      for (const studentId of studentIds) {
        // Insert assignment (skip if already assigned)
        const insertResult = await db.query(`
          INSERT INTO task_assignments (task_id, student_id)
          VALUES ($1, $2)
          ON CONFLICT (task_id, student_id) DO NOTHING
          RETURNING id
        `, [taskId, studentId]);

        if (insertResult.rows.length > 0) {
          assigned++;
          // Notify student
          await db.query(`
            INSERT INTO notifications (user_id, message)
            VALUES ($1, $2)
          `, [studentId, `New task assigned to you: "${taskTitle}". Please check your task board.`]);
        }
      }

      res.json({ success: true, message: `Task assigned to ${assigned} student(s).`, assignedCount: assigned });
    } catch (err) {
      console.error('assignTaskToStudents error:', err);
      res.status(500).json({ error: 'Failed to assign task' });
    }
  },

  /*
  Get all submissions for a task (Faculty view).
  Params: id (task_id)
  */
  getTaskSubmissions: async (req, res) => {
    try {
      const { id: taskId } = req.params;

      const result = await db.query(`
        SELECT
          ta.*,
          u.name AS student_name,
          u.email AS student_email,
          s.roll_no,
          s.cgpa,
          s.placement_score
        FROM task_assignments ta
        JOIN users u ON u.user_id = ta.student_id
        JOIN students s ON s.student_id = ta.student_id
        WHERE ta.task_id = $1
        ORDER BY ta.submitted_at DESC NULLS LAST
      `, [taskId]);

      res.json({ success: true, submissions: result.rows });
    } catch (err) {
      console.error('getTaskSubmissions error:', err);
      res.status(500).json({ error: 'Failed to fetch submissions' });
    }
  },

  /*
  Faculty evaluates a student's task submission.
  Params: id (task_id), studentId
  Body: { score, feedback }
  */
  evaluateSubmission: async (req, res) => {
    try {
      const facultyId = req.user.user_id;
      const { id: taskId, studentId } = req.params;
      const { score, feedback } = req.body;

      if (score === undefined || score === null) {
        return res.status(400).json({ error: 'score is required' });
      }
      if (score < 0 || score > 100) {
        return res.status(400).json({ error: 'score must be between 0 and 100' });
      }

      const result = await db.query(`
        UPDATE task_assignments
        SET
          score = $1,
          feedback = $2,
          status = 'EVALUATED',
          evaluated_by = $3,
          evaluated_at = CURRENT_TIMESTAMP
        WHERE task_id = $4 AND student_id = $5
        RETURNING *
      `, [score, feedback, facultyId, taskId, studentId]);

      if (!result.rows.length) {
        return res.status(404).json({ error: 'Assignment not found' });
      }

      // Fetch task title for notification
      const taskResult = await db.query('SELECT title FROM tasks WHERE task_id = $1', [taskId]);
      const taskTitle = taskResult.rows[0]?.title || 'your task';

      // Notify student of their grade
      await db.query(`
        INSERT INTO notifications (user_id, message)
        VALUES ($1, $2)
      `, [studentId, `Your task "${taskTitle}" has been evaluated. Score: ${score}/100. ${feedback ? 'Feedback: ' + feedback.substring(0, 80) + '...' : ''}`]);

      // Recalculate placement_score for the student
      // Average of all evaluated task scores weighted at 20% influence
      const allScoresResult = await db.query(`
        SELECT AVG(score) as avg_task_score FROM task_assignments
        WHERE student_id = $1 AND status = 'EVALUATED' AND score IS NOT NULL
      `, [studentId]);

      const avgTaskScore = allScoresResult.rows[0]?.avg_task_score;
      if (avgTaskScore !== null && avgTaskScore !== undefined) {
        // Blend: 80% existing placement_score + 20% from task score average
        await db.query(`
          UPDATE students
          SET placement_score = LEAST(100, GREATEST(0,
            ROUND(0.8 * placement_score + 0.2 * $1)
          ))
          WHERE student_id = $2
        `, [Math.round(avgTaskScore), studentId]);
      }

      res.json({ success: true, message: 'Evaluation submitted.', assignment: result.rows[0] });
    } catch (err) {
      console.error('evaluateSubmission error:', err);
      res.status(500).json({ error: 'Failed to evaluate submission' });
    }
  },

  /*
  Student submits a task.
  Params: id (task_assignment_id or task_id via route)
  Body: { submission_text } or file upload (submission_url)
  */
  submitTask: async (req, res) => {
    try {
      const studentId = req.user.user_id;
      const { taskId } = req.params;
      const { submission_text, submission_url } = req.body;

      if (!submission_text && !submission_url) {
        return res.status(400).json({ error: 'submission_text or submission_url is required' });
      }

      const result = await db.query(`
        UPDATE task_assignments
        SET
          status = 'SUBMITTED',
          submission_text = COALESCE($1, submission_text),
          submission_url = COALESCE($2, submission_url),
          submitted_at = CURRENT_TIMESTAMP
        WHERE task_id = $3 AND student_id = $4 AND status IN ('ASSIGNED', 'IN_PROGRESS')
        RETURNING *
      `, [submission_text, submission_url, taskId, studentId]);

      if (!result.rows.length) {
        return res.status(404).json({ error: 'Task not found or already submitted' });
      }

      // Notify the faculty who created the task
      const taskResult = await db.query(
        'SELECT t.title, t.created_by, u.name AS student_name FROM tasks t JOIN users u ON u.user_id = $1 WHERE t.task_id = $2',
        [studentId, taskId]
      );
      if (taskResult.rows.length) {
        const { title, created_by, student_name } = taskResult.rows[0];
        await db.query(`
          INSERT INTO notifications (user_id, message)
          VALUES ($1, $2)
        `, [created_by, `${student_name} has submitted the task: "${title}". Ready for evaluation.`]);
      }

      res.json({ success: true, message: 'Task submitted successfully.', assignment: result.rows[0] });
    } catch (err) {
      console.error('submitTask error:', err);
      res.status(500).json({ error: 'Failed to submit task' });
    }
  },

  /*
  Student views all tasks assigned to them.
  Returns: Task info + assignment status + score/feedback if evaluated.
  */
  getMyAssignedTasks: async (req, res) => {
    try {
      const studentId = req.user.user_id;

      const result = await db.query(`
        SELECT
          ta.id AS assignment_id,
          ta.status,
          ta.submitted_at,
          ta.score,
          ta.feedback,
          ta.submission_text,
          ta.submission_url,
          ta.evaluated_at,
          t.task_id,
          t.title,
          t.description,
          t.task_type,
          t.due_date,
          t.instructions,
          t.resources_url,
          t.max_score,
          u.name AS faculty_name
        FROM task_assignments ta
        JOIN tasks t ON t.task_id = ta.task_id
        JOIN users u ON u.user_id = t.created_by
        WHERE ta.student_id = $1
        ORDER BY
          CASE ta.status
            WHEN 'ASSIGNED' THEN 1
            WHEN 'IN_PROGRESS' THEN 2
            WHEN 'SUBMITTED' THEN 3
            WHEN 'OVERDUE' THEN 4
            WHEN 'EVALUATED' THEN 5
          END,
          t.due_date ASC
      `, [studentId]);

      res.json({ success: true, tasks: result.rows });
    } catch (err) {
      console.error('getMyAssignedTasks error:', err);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  }
};

/*
------------------------------------------------
File: facultyController.js
Purpose: Faculty management APIs — student viewing, batch assignment, and performance tracking.
Responsibilities: Get all students, assign/unassign students to faculty, view student profiles, batch analytics.
Dependencies: db.js, authMiddleware.js
------------------------------------------------
*/

const db = require('../config/db');

module.exports = {

  /*
  Get all students in the system (Faculty or Admin access).
  Returns: list of all student users with profile + performance data.
  */
  getAllStudents: async (req, res) => {
    try {
      const result = await db.query(`
        SELECT
          u.user_id,
          u.name,
          u.email,
          u.department,
          s.roll_no,
          s.year,
          s.cgpa,
          s.placement_score,
          (
            SELECT COUNT(*) FROM task_assignments ta
            WHERE ta.student_id = s.student_id AND ta.status NOT IN ('EVALUATED')
          ) AS pending_tasks,
          (
            SELECT MAX(r.created_at) FROM resumes r WHERE r.student_id = s.student_id
          ) AS last_active
        FROM users u
        JOIN students s ON s.student_id = u.user_id
        WHERE u.role = 'STUDENT'
        ORDER BY s.placement_score DESC
      `);
      res.json({ success: true, students: result.rows });
    } catch (err) {
      console.error('getAllStudents error:', err);
      res.status(500).json({ error: 'Failed to fetch students' });
    }
  },

  /*
  Get only students assigned to the logged-in faculty.
  Returns: list of assigned student profiles with task stats.
  */
  getMyStudents: async (req, res) => {
    try {
      const facultyId = req.user.user_id;
      const result = await db.query(`
        SELECT
          u.user_id,
          u.name,
          u.email,
          u.department,
          s.roll_no,
          s.year,
          s.cgpa,
          s.placement_score,
          (
            SELECT COUNT(*) FROM task_assignments ta
            WHERE ta.student_id = s.student_id AND ta.status = 'ASSIGNED'
          ) AS pending_tasks,
          (
            SELECT COUNT(*) FROM task_assignments ta
            WHERE ta.student_id = s.student_id AND ta.status = 'EVALUATED'
          ) AS completed_tasks,
          fsa.assigned_at
        FROM faculty_student_assignments fsa
        JOIN users u ON u.user_id = fsa.student_id
        JOIN students s ON s.student_id = fsa.student_id
        WHERE fsa.faculty_id = $1
        ORDER BY s.placement_score DESC
      `, [facultyId]);
      res.json({ success: true, students: result.rows });
    } catch (err) {
      console.error('getMyStudents error:', err);
      res.status(500).json({ error: 'Failed to fetch assigned students' });
    }
  },

  /*
  Assign a student to the logged-in faculty's batch.
  Body: { studentId }
  */
  assignStudent: async (req, res) => {
    try {
      const facultyId = req.user.user_id;
      const { studentId } = req.body;
      if (!studentId) return res.status(400).json({ error: 'studentId is required' });

      await db.query(`
        INSERT INTO faculty_student_assignments (faculty_id, student_id)
        VALUES ($1, $2)
        ON CONFLICT (faculty_id, student_id) DO NOTHING
      `, [facultyId, studentId]);

      // Send notification to student
      const facultyResult = await db.query(
        'SELECT name FROM users WHERE user_id = $1', [facultyId]
      );
      const facultyName = facultyResult.rows[0]?.name || 'A faculty member';
      await db.query(`
        INSERT INTO notifications (user_id, message)
        VALUES ($1, $2)
      `, [studentId, `You have been added to ${facultyName}'s batch.`]);

      res.json({ success: true, message: 'Student assigned to your batch.' });
    } catch (err) {
      console.error('assignStudent error:', err);
      res.status(500).json({ error: 'Failed to assign student' });
    }
  },

  /*
  Unassign a student from the logged-in faculty's batch.
  Params: studentId
  */
  unassignStudent: async (req, res) => {
    try {
      const facultyId = req.user.user_id;
      const { studentId } = req.params;

      await db.query(`
        DELETE FROM faculty_student_assignments
        WHERE faculty_id = $1 AND student_id = $2
      `, [facultyId, studentId]);

      res.json({ success: true, message: 'Student removed from your batch.' });
    } catch (err) {
      console.error('unassignStudent error:', err);
      res.status(500).json({ error: 'Failed to unassign student' });
    }
  },

  /*
  Get full profile of a single student.
  Params: id (student user_id)
  Returns: Profile, latest resume ATS score, performance averages.
  */
  getStudentProfile: async (req, res) => {
    try {
      const { id } = req.params;

      // Basic info
      const profileResult = await db.query(`
        SELECT u.user_id, u.name, u.email, u.department,
               s.roll_no, s.year, s.cgpa, s.placement_score
        FROM users u JOIN students s ON s.student_id = u.user_id
        WHERE u.user_id = $1
      `, [id]);

      if (!profileResult.rows.length) {
        return res.status(404).json({ error: 'Student not found' });
      }
      const profile = profileResult.rows[0];

      // Latest resume ATS score
      const resumeResult = await db.query(`
        SELECT ats_score, ai_suggestions, created_at
        FROM resumes WHERE student_id = $1
        ORDER BY created_at DESC LIMIT 1
      `, [id]);

      // Mock interview average
      const interviewResult = await db.query(`
        SELECT ROUND(AVG(score)) AS avg_score, COUNT(*) AS count
        FROM mock_interviews WHERE student_id = $1 AND status = 'COMPLETED'
      `, [id]);

      // Aptitude average
      const aptitudeResult = await db.query(`
        SELECT ROUND(AVG(score)) AS avg_score, COUNT(*) AS count
        FROM aptitude_tests WHERE student_id = $1
      `, [id]);

      // GD average
      const gdResult = await db.query(`
        SELECT ROUND(AVG(gs.score)) AS avg_score, COUNT(*) AS count
        FROM gd_scores gs WHERE gs.student_id = $1
      `, [id]);

      // Total Study Time
      const studyResult = await db.query(`
        SELECT COALESCE(SUM(duration), 0)::int AS total_duration
        FROM study_sessions WHERE student_id = $1
      `, [id]);

      // Task stats
      const taskResult = await db.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'ASSIGNED') AS assigned,
          COUNT(*) FILTER (WHERE status = 'SUBMITTED') AS submitted,
          COUNT(*) FILTER (WHERE status = 'EVALUATED') AS evaluated,
          COUNT(*) FILTER (WHERE status = 'OVERDUE') AS overdue
        FROM task_assignments WHERE student_id = $1
      `, [id]);

      // Detailed tasks list
      const taskListResult = await db.query(`
        SELECT ta.id AS assignment_id, ta.task_id, ta.status, ta.score, ta.feedback,
               ta.submission_text, ta.submission_url, ta.submitted_at,
               t.title, t.task_type, t.due_date, t.max_score
        FROM task_assignments ta
        JOIN tasks t ON ta.task_id = t.task_id
        WHERE ta.student_id = $1
        ORDER BY t.due_date DESC, t.created_at DESC
      `, [id]);

      res.json({
        success: true,
        profile,
        resume: resumeResult.rows[0] || null,
        performance: {
          interview: interviewResult.rows[0],
          aptitude: aptitudeResult.rows[0],
          gd: gdResult.rows[0]
        },
        studyTime: studyResult.rows[0].total_duration,
        tasks: taskResult.rows[0],
        taskList: taskListResult.rows
      });
    } catch (err) {
      console.error('getStudentProfile error:', err);
      res.status(500).json({ error: 'Failed to fetch student profile' });
    }
  },

  /*
  Get batch analytics for all students assigned to the logged-in faculty.
  Returns: Aggregated stats, score distribution, top/bottom performers.
  */
  getBatchAnalytics: async (req, res) => {
    try {
      const facultyId = req.user.user_id;

      // All assigned students
      const studentsResult = await db.query(`
        SELECT s.student_id, u.name, s.placement_score, s.cgpa
        FROM faculty_student_assignments fsa
        JOIN students s ON s.student_id = fsa.student_id
        JOIN users u ON u.user_id = fsa.student_id
        WHERE fsa.faculty_id = $1
      `, [facultyId]);

      const students = studentsResult.rows;
      const total = students.length;

      if (total === 0) {
        return res.json({ success: true, message: 'No students assigned yet.', analytics: null });
      }

      // Score distribution buckets
      const buckets = { '0-40': 0, '41-70': 0, '71-90': 0, '91-100': 0 };
      let totalScore = 0;
      students.forEach(s => {
        const sc = s.placement_score || 0;
        totalScore += sc;
        if (sc <= 40) buckets['0-40']++;
        else if (sc <= 70) buckets['41-70']++;
        else if (sc <= 90) buckets['71-90']++;
        else buckets['91-100']++;
      });
      const avgScore = Math.round(totalScore / total);

      // Top 3 and Bottom 3 by placement score
      const sorted = [...students].sort((a, b) => b.placement_score - a.placement_score);
      const top3 = sorted.slice(0, 3);
      const bottom3 = sorted.slice(-3).reverse();

      // Task stats
      const taskResult = await db.query(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE status = 'SUBMITTED') AS pending,
          COUNT(*) FILTER (WHERE status = 'EVALUATED') AS completed,
          COUNT(*) FILTER (WHERE status = 'OVERDUE') AS overdue
        FROM task_assignments ta
        WHERE ta.student_id = ANY(
          SELECT student_id FROM faculty_student_assignments WHERE faculty_id = $1
        )
      `, [facultyId]);

      const taskStats = taskResult.rows[0];
      const completionRate = taskStats.total > 0
        ? Math.round((taskStats.completed / taskStats.total) * 100)
        : 0;

      // Real Recent Activity Feed
      const recentActivityRes = await db.query(`
        SELECT ta.submitted_at, ta.evaluated_at, ta.status, u.name AS student_name, t.title AS task_title
        FROM task_assignments ta
        JOIN users u ON u.user_id = ta.student_id
        JOIN tasks t ON t.task_id = ta.task_id
        WHERE ta.student_id = ANY(
          SELECT student_id FROM faculty_student_assignments WHERE faculty_id = $1
        )
        AND ta.status IN ('SUBMITTED', 'EVALUATED')
        ORDER BY COALESCE(ta.submitted_at, ta.evaluated_at) DESC
        LIMIT 4
      `, [facultyId]);

      res.json({
        success: true,
        analytics: {
          totalStudents: total,
          averagePlacementScore: avgScore,
          scoreDistribution: buckets,
          top3Performers: top3,
          bottom3Performers: bottom3,
          taskCompletionRate: completionRate,
          taskStats,
          recentActivity: recentActivityRes.rows
        }
      });
    } catch (err) {
      console.error('getBatchAnalytics error:', err);
      res.status(500).json({ error: 'Failed to generate batch analytics' });
    }
  },

  /*
  Import bulk questions from CSV or JSON format (Faculty only).
  Used by ManageQuestions.jsx page.
  Body: { csvText, listType } where listType is 'csv' or 'json'
  */
  importQuestions: async (req, res) => {
    try {
      const { csvText, listType } = req.body;
      const createdBy = req.user.user_id;

      if (!csvText || !csvText.trim()) {
        return res.status(400).json({ success: false, message: 'No question data provided.' });
      }

      let questions = [];

      if (listType === 'json') {
        // Parse JSON format
        try {
          questions = JSON.parse(csvText);
          if (!Array.isArray(questions)) questions = [questions];
        } catch {
          return res.status(400).json({ success: false, message: 'Invalid JSON format.' });
        }
      } else {
        // Parse CSV format: CATEGORY,Question Text,Option1;Option2;Option3;Option4,CorrectOption
        const lines = csvText.split('\n').filter(l => l.trim());
        for (const line of lines) {
          const parts = line.split(',');
          if (parts.length < 2) continue;
          const category = parts[0].trim().toUpperCase();
          const question_text = parts[1].trim();
          const optionStr = parts[2]?.trim() || '';
          const correct_answer = parts[3]?.trim() || null;
          const options = optionStr ? optionStr.split(';').map(o => o.trim()) : null;
          questions.push({ category, question_text, options, correct_answer });
        }
      }

      if (questions.length === 0) {
        return res.status(400).json({ success: false, message: 'No valid questions found in the data.' });
      }

      let imported = 0;
      let skipped = 0;

      for (const q of questions) {
        if (!q.question_text || !q.category) { skipped++; continue; }
        try {
          await db.query(`
            INSERT INTO questions (category, question_text, options, correct_answer, created_by)
            VALUES ($1, $2, $3, $4, $5)
          `, [
            q.category?.toUpperCase(),
            q.question_text,
            q.options ? JSON.stringify(q.options) : null,
            q.correct_answer || null,
            createdBy
          ]);
          imported++;
        } catch {
          skipped++;
        }
      }

      res.json({
        success: true,
        message: `Import complete. ${imported} question(s) added, ${skipped} skipped (duplicates or invalid).`,
        imported,
        skipped
      });
    } catch (err) {
      console.error('importQuestions error:', err);
      res.status(500).json({ success: false, message: 'Failed to import questions.' });
    }
  }
};


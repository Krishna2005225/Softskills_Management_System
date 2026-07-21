/*
------------------------------------------------
File: studentController.js
Purpose: Manages student profile requests.
Responsibilities: Fetches student dashboards, attendance details, and progress scopes.
Dependencies: Student, Attendance
------------------------------------------------
*/

const Student = require('../models/Student');
const Attendance = require('../models/Attendance');

module.exports = {
  /*
  GET /api/student/dashboard
  Returns placement scores, attendance aggregates, upcoming modules.
  */
  getDashboardStats: async (req, res, next) => {
    try {
      const stats = await Student.getDashboardStats(req.user.user_id);
      return res.status(200).json({
        success: true,
        stats
      });
    } catch (error) {
      return next(error);
    }
  },

  /*
  GET /api/student/progress-graphs
  Returns mock weekly/monthly development graphs arrays.
  */
  getProgressGraphs: async (req, res, next) => {
    try {
      const detailed = await Student.getDetailedProgressReport(req.user.user_id);
      
      const aptAvg = detailed.aptitude.average || 0; 
      const mockAvg = detailed.interview.average || 0;
      const resumeAvg = detailed.resume.average || 0;
      const writtenAvg = detailed.writtenAnswers.average || 0;

      const db = require('../config/db');
      const recentAptTests = await db.query(
        'SELECT (score::float / total_questions * 100)::int as score FROM aptitude_tests WHERE student_id = $1 ORDER BY date DESC LIMIT 5',
        [req.user.user_id]
      );
      const weekly = recentAptTests.rows.length > 0 ? recentAptTests.rows.map(r => r.score).reverse() : [0, 0, 0, 0, 0];

      return res.status(200).json({
        success: true,
        graphs: {
          weekly,
          monthly: weekly,
          categories: ['Aptitude', 'Mock Interview', 'Resume ATS', 'Written Answers'],
          scores: [aptAvg, mockAvg, resumeAvg, writtenAvg]
        }
      });
    } catch (error) {
      return next(error);
    }
  },

  /*
  GET /api/student/attendance
  Returns historical student attendance logs.
  */
  getAttendance: async (req, res, next) => {
    try {
      const logs = await Attendance.findByStudentId(req.user.user_id);
      return res.status(200).json({
        success: true,
        attendance: logs
      });
    } catch (error) {
      return next(error);
    }
  },

  /*
  GET /api/student/faculties
  Get list of all system faculty members.
  */
  getFaculties: async (req, res, next) => {
    try {
      const db = require('../config/db');
      const result = await db.query(`
        SELECT u.user_id AS faculty_id, u.name, u.email, u.department, f.specialization
        FROM users u
        JOIN faculties f ON f.faculty_id = u.user_id
        ORDER BY u.name ASC
      `);
      return res.status(200).json({
        success: true,
        faculties: result.rows
      });
    } catch (error) {
      return next(error);
    }
  },

  /*
  GET /api/student/my-faculty
  Get currently assigned faculty mentor.
  */
  getMyFaculty: async (req, res, next) => {
    try {
      const db = require('../config/db');
      const studentId = req.user.user_id;
      const result = await db.query(`
        SELECT fsa.faculty_id, u.name, u.email, u.department
        FROM faculty_student_assignments fsa
        JOIN users u ON u.user_id = fsa.faculty_id
        WHERE fsa.student_id = $1
      `, [studentId]);
      return res.status(200).json({
        success: true,
        faculty: result.rows[0] || null
      });
    } catch (error) {
      return next(error);
    }
  },

  /*
  POST /api/student/assign-faculty
  Assign/update student mentor choice.
  Body: { facultyId }
  */
  assignFaculty: async (req, res, next) => {
    try {
      const db = require('../config/db');
      const studentId = req.user.user_id;
      const { facultyId } = req.body;

      if (!facultyId) {
        return res.status(400).json({ success: false, message: 'Faculty ID is required.' });
      }

      // Delete existing mentor assignments to maintain 1-to-1 mentor relationship
      await db.query('DELETE FROM faculty_student_assignments WHERE student_id = $1', [studentId]);

      // Insert new assignment
      const result = await db.query(`
        INSERT INTO faculty_student_assignments (faculty_id, student_id)
        VALUES ($1, $2)
        RETURNING *
      `, [facultyId, studentId]);

      // Get mentor's name for success message
      const mentorResult = await db.query('SELECT name FROM users WHERE user_id = $1', [facultyId]);
      const mentorName = mentorResult.rows[0]?.name || 'Faculty';

      // Insert notification for the faculty member
      await db.query(`
        INSERT INTO notifications (user_id, message)
        VALUES ($1, $2)
      `, [facultyId, `💼 Student ${req.user.name} has selected you as their Faculty Mentor.`]);

      return res.status(200).json({
        success: true,
        message: `Successfully assigned ${mentorName} as your Faculty Mentor.`,
        assignment: result.rows[0]
      });
    } catch (error) {
      return next(error);
    }
  }
};

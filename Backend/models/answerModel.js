/*
------------------------------------------------
File: answerModel.js
Purpose: Manages student_answers table database queries.
Responsibilities: Logs student written responses and faculty evaluation ratings.
Dependencies: db.js
------------------------------------------------
*/

const db = require('../config/db');

module.exports = {
  /*
  Saves or updates a student's answer for a specific question.
  Params: studentId (UUID), questionId (UUID), submittedAnswer (string).
  Returns: Database row of the newly inserted or updated answer.
  */
  submitAnswer: async (studentId, questionId, submittedAnswer, score = null, feedback = null) => {
    const res = await db.query(
      `INSERT INTO student_answers (student_id, question_id, submitted_answer, score, feedback)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (student_id, question_id) 
       DO UPDATE SET submitted_answer = EXCLUDED.submitted_answer, score = EXCLUDED.score, feedback = EXCLUDED.feedback, created_at = NOW()
       RETURNING *`,
      [studentId, questionId, submittedAnswer, score, feedback]
    );
    return res.rows[0];
  },

  /*
  Assigns a score rating and feedback comment to a student answer.
  Params: answerId (UUID), score (number), feedback (string).
  Returns: Database row of the graded answer.
  */
  gradeAnswer: async (answerId, score, feedback) => {
    const res = await db.query(
      `UPDATE student_answers
       SET score = $1, feedback = $2
       WHERE answer_id = $3
       RETURNING *`,
      [score, feedback, answerId]
    );
    return res.rows[0];
  },

  /*
  Fetches all answers submitted by a student.
  Params: studentId (UUID).
  Returns: Array of student answers.
  */
  findByStudentId: async (studentId) => {
    const res = await db.query(
      `SELECT sa.*, q.question_text, q.category, q.options
       FROM student_answers sa
       JOIN questions q ON sa.question_id = q.question_id
       WHERE sa.student_id = $1
       ORDER BY sa.created_at DESC`,
      [studentId]
    );
    return res.rows;
  }
};

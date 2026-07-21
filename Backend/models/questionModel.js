/*
------------------------------------------------
File: questionModel.js
Purpose: Manages questions table database queries.
Responsibilities: Logs single questions, performs bulk inserts (for CSV imports), and queries questions by category.
Dependencies: db.js
------------------------------------------------
*/

const db = require('../config/db');

module.exports = {
  /*
  Creates a single question record in the database.
  Params: category (string), text (string), options (array of strings or null), correctAnswer (string or null), createdBy (UUID).
  Returns: Database row of the newly inserted question.
  */
  createQuestion: async (category, text, options, correctAnswer, createdBy) => {
    const res = await db.query(
      `INSERT INTO questions (category, question_text, options, correct_answer, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [category, text, options ? JSON.stringify(options) : null, correctAnswer, createdBy]
    );
    return res.rows[0];
  },

  /*
  Performs a bulk query insert for questions lists.
  Used in CSV uploads and copy-paste bulk actions.
  Params: questionsList (array of objects: { category, question_text, options, correct_answer, created_by }).
  Returns: Count of successfully inserted questions.
  */
  bulkInsert: async (questionsList) => {
    // If the list is empty, exit early
    if (!questionsList || questionsList.length === 0) return 0;
    
    let queryText = 'INSERT INTO questions (category, question_text, options, correct_answer, created_by) VALUES ';
    const queryParams = [];
    
    questionsList.forEach((q, idx) => {
      const offset = idx * 5;
      queryText += `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})${idx < questionsList.length - 1 ? ', ' : ''}`;
      queryParams.push(
        q.category,
        q.question_text,
        q.options ? JSON.stringify(q.options) : null,
        q.correct_answer || null,
        q.created_by || null
      );
    });

    const res = await db.query(queryText, queryParams);
    return res.rowCount;
  },

  /*
  Retrieves questions matching a specific category.
  Params: category (string).
  Returns: Array of questions matching the category.
  */
  getQuestionsByCategory: async (category) => {
    const res = await db.query(
      'SELECT * FROM questions WHERE category = $1 ORDER BY created_at DESC',
      [category]
    );
    return res.rows;
  }
};

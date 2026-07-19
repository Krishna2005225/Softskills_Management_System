/*
------------------------------------------------
File: aptitudeController.js
Purpose: Handles aptitude categories quizzes.
Responsibilities: Exposes timed test question banks, saves results, and resolves leaderboards.
Dependencies: Aptitude, Student
------------------------------------------------
*/

const Aptitude = require('../models/Aptitude');
const Student = require('../models/Student');
const Question = require('../models/questionModel');
const Answer = require('../models/answerModel');

module.exports = {
  /*
  GET /api/aptitude/questions
  Returns list of timed aptitude questions dynamically from the database.
  */
  getQuestions: async (req, res, next) => {
    try {
      const category = req.query.category || 'Quantitative';
      
      // Fetch dynamic questions from PostgreSQL
      const dbQuestions = await Question.getQuestionsByCategory(category.toUpperCase());
      
      // Fallback placeholder questions if database is empty for this category
      const fallbackQuestions = [
        { question_id: 'apt-1', question_text: 'Find the next term in: 3, 5, 9, 17, 33...', options: ['65', '60', '55', '50'], correct_answer: '65' },
        { question_id: 'apt-2', question_text: 'A train 100m long passes a bridge in 10s at 72km/h. Bridge length is...', options: ['100m', '150m', '200m', '250m'], correct_answer: '100m' }
      ];

      const questionsList = dbQuestions.length > 0 ? dbQuestions : fallbackQuestions;

      return res.status(200).json({
        success: true,
        category,
        questions: questionsList
      });
    } catch (error) {
      return next(error);
    }
  },

  /*
  POST /api/aptitude/submit
  Grades user submission and updates student placement score index.
  */
  submitTest: async (req, res, next) => {
    try {
      const { score, totalQuestions, category } = req.body;
      const record = await Aptitude.submitTestResult(req.user.user_id, score, totalQuestions, category);

      // Compute score adjustments
      const percentage = (score / totalQuestions) * 100;
      const stats = await Student.getDashboardStats(req.user.user_id);
      const newPlacementScore = Math.min(100, Math.round((stats.placementScore + percentage) / 2));
      await Student.updatePlacementScore(req.user.user_id, newPlacementScore);

      return res.status(200).json({
        success: true,
        message: 'Aptitude test score logged',
        record,
        newPlacementScore
      });
    } catch (error) {
      return next(error);
    }
  },

  /*
  POST /api/aptitude/answers/submit
  Saves written subjective student answers to the database and evaluates them instantly using Gemini.
  */
  submitWrittenAnswers: async (req, res, next) => {
    try {
      const { answers } = req.body; // Array of { questionId, submittedAnswer }
      if (!answers || !Array.isArray(answers)) {
        return res.status(400).json({ success: false, message: 'Answers array is required.' });
      }

      const results = [];
      const aiService = require('../services/aiService');
      const db = require('../config/db');

      for (const ans of answers) {
        // Query database to retrieve the question text
        const qRes = await db.query('SELECT question_text FROM questions WHERE question_id = $1', [ans.questionId]);
        const questionText = qRes.rows[0] ? qRes.rows[0].question_text : 'Subjective verbal question response.';
        
        // Grade dynamically using Gemini AI API helper
        const evalResult = await aiService.evaluateSubjectiveAnswer(questionText, ans.submittedAnswer);
        
        // Submit answer with score and feedback to PostgreSQL
        const row = await Answer.submitAnswer(
          req.user.user_id, 
          ans.questionId, 
          ans.submittedAnswer, 
          evalResult.score, 
          evalResult.feedback
        );
        
        results.push({
          ...row,
          evaluation: evalResult
        });
      }

      return res.status(200).json({
        success: true,
        message: `Successfully logged and graded ${results.length} answers.`,
        answers: results
      });
    } catch (error) {
      return next(error);
    }
  },

  /*
  GET /api/aptitude/leaderboard
  Returns placement scores rankings.
  */
  getLeaderboard: async (req, res, next) => {
    try {
      const list = await Aptitude.getLeaderboard();
      return res.status(200).json({
        success: true,
        leaderboard: list
      });
    } catch (error) {
      return next(error);
    }
  }
};

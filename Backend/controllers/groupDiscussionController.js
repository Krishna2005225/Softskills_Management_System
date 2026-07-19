/*
------------------------------------------------
File: groupDiscussionController.js
Purpose: Handles Group Discussion sessions.
Responsibilities: Creates GD events, records participant scores, and lists events.
Dependencies: GroupDiscussion, Student
------------------------------------------------
*/

const GroupDiscussion = require('../models/GroupDiscussion');
const aiService = require('../services/aiService');

module.exports = {
  /*
  POST /api/group-discussion/create
  Creates a new GD event.
  */
  createDiscussion: async (req, res, next) => {
    try {
      const { topic } = req.body;
      const gd = await GroupDiscussion.createGD(topic, req.user.user_id);
      return res.status(201).json({
        success: true,
        message: 'GD topic and event logged successfully',
        gd
      });
    } catch (error) {
      return next(error);
    }
  },

  /*
  POST /api/group-discussion/evaluate
  Submits discussion performance grades for students.
  */
  recordScores: async (req, res, next) => {
    try {
      const { studentId, gdId, score, feedback } = req.body;
      const record = await GroupDiscussion.scoreParticipant(studentId, gdId, score, feedback);
      return res.status(200).json({
        success: true,
        message: 'Participant scored successfully',
        score: record
      });
    } catch (error) {
      return next(error);
    }
  },

  /*
  GET /api/group-discussion/list
  Lists discussion events.
  */
  listDiscussions: async (req, res, next) => {
    try {
      const list = await GroupDiscussion.findAll();
      return res.status(200).json({
        success: true,
        discussions: list
      });
    } catch (error) {
      return next(error);
    }
  },

  /*
  POST /api/group-discussion/ai-coach
  Simulates a GD coach/panel evaluation of an argument stance.
  */
  aiGDCoach: async (req, res, next) => {
    try {
      const { topic, stance, argument } = req.body;
      if (!topic || !argument) {
        return res.status(400).json({ success: false, message: 'GD topic and argument text are required.' });
      }

      const evaluation = await aiService.evaluateGDArgument(topic, stance, argument);
      return res.status(200).json(evaluation);
    } catch (error) {
      return next(error);
    }
  }
};

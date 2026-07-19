/*
------------------------------------------------
File: resumeController.js
Purpose: Manages resume scoring, builder edits, and uploads.
Responsibilities: Commits resume files, initiates ATS checks and recommendations templates.
Dependencies: Resume, aiService, storageService
------------------------------------------------
*/

const Resume = require('../models/Resume');
const aiService = require('../services/aiService');
const storageService = require('../services/storageService');

module.exports = {
  /*
  POST /api/resume/upload
  Uploads file to Cloudinary and triggers ATS evaluation.
  */
  uploadResume: async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No resume document supplied' });
      }

      const filePath = req.file.path;
      
      // Upload to Cloudinary wrapper
      const cloudRes = await storageService.uploadFile(filePath, 'resumes');

      // AI parser analysis
      const parsedText = 'Simulated extracted resume text content';
      const aiFeedback = await aiService.analyzeResumeATS(parsedText);

      // Save database log
      const record = await Resume.saveResume(
        req.user.user_id, 
        cloudRes.url, 
        aiFeedback.atsScore, 
        aiFeedback
      );

      return res.status(201).json({
        success: true,
        message: 'Resume processed successfully',
        resume: record
      });
    } catch (error) {
      return next(error);
    }
  },

  /*
  GET /api/resume/history
  Pulls previous scores logs.
  */
  getHistory: async (req, res, next) => {
    try {
      const list = await Resume.findByStudentId(req.user.user_id);
      return res.status(200).json({
        success: true,
        history: list
      });
    } catch (error) {
      return next(error);
    }
  },

  /*
  POST /api/resume/ai-rewrite
  Rewrites resume bullet-points using Gemini.
  */
  aiRewriteResume: async (req, res, next) => {
    try {
      const { sectionType, rawText } = req.body;
      if (!rawText) {
        return res.status(400).json({ success: false, message: 'Raw text content is required.' });
      }

      const rewritten = await aiService.rewriteResumeSection(sectionType, rawText);
      return res.status(200).json(rewritten);
    } catch (error) {
      return next(error);
    }
  }
};

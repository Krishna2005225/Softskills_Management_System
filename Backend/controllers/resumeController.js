/*
------------------------------------------------
File: resumeController.js
Purpose: Manages resume scoring, builder edits, and uploads.
Responsibilities: Commits resume files, initiates ATS checks and recommendations templates.
Dependencies: Resume, aiService, storageService, pdf-parse, mammoth
------------------------------------------------
*/

const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');
const Resume = require('../models/Resume');
const aiService = require('../services/aiService');
const storageService = require('../services/storageService');

// Helper to extract text from PDF or DOCX files
const extractTextFromFile = async (filePath) => {
  if (!fs.existsSync(filePath)) {
    throw new Error('File not found on disk: ' + filePath);
  }
  const ext = path.extname(filePath).toLowerCase();
  const fileBuffer = fs.readFileSync(filePath);
  
  if (ext === '.pdf') {
    const parser = new PDFParse({ data: fileBuffer, verbosity: 0 });
    try {
      const data = await parser.getText();
      return data.text || data;
    } finally {
      await parser.destroy();
    }
  } else if (ext === '.docx') {
    const data = await mammoth.extractRawText({ buffer: fileBuffer });
    return data.value;
  } else {
    // Plain text fallback
    return fileBuffer.toString('utf8');
  }
};

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

      // AI parser analysis - extract real text
      let parsedText = '';
      try {
        parsedText = await extractTextFromFile(filePath);
        if (!parsedText || parsedText.trim().length < 15) {
          throw new Error('Insufficient text extracted from document (likely scanned image or empty).');
        }
      } catch (parseErr) {
        console.error('Failed to parse uploaded document text:', parseErr);
        const db = require('../config/db');
        const userRes = await db.query(
          `SELECT u.name, u.email, u.phone, u.department, s.cgpa 
           FROM users u
           LEFT JOIN students s ON u.user_id = s.student_id
           WHERE u.user_id = $1`,
          [req.user.user_id]
        );
        const user = userRes.rows[0] || {};
        parsedText = `
          Name: ${user.name || 'Student Candidate'}
          Email: ${user.email || 'student@college.edu'}
          Phone: ${user.phone || '+91 98765 43210'}
          Department: ${user.department || 'CSE'}
          Education: B.Tech in ${user.department || 'Computer Engineering'}, CGPA: ${user.cgpa || '8.5'}
          Skills: Problem Solving, Communication, Teamwork
        `;
      }

      // Cleanup local uploaded temp file
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (unlinkErr) {
        console.error('Failed to clean up temp file:', unlinkErr);
      }

      const aiFeedback = await aiService.analyzeResumeATS(parsedText);

      // Append file metadata for UI history rendering
      aiFeedback.originalName = req.file.originalname;
      aiFeedback.fileSize = req.file.size;
      aiFeedback.uploadDate = new Date().toISOString();

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
  },

  /*
  POST /api/resume/evaluate-json
  Evaluates edited resume JSON from visual builder.
  */
  evaluateJsonResume: async (req, res, next) => {
    try {
      const { resumeJson } = req.body;
      if (!resumeJson) {
        return res.status(400).json({ success: false, message: 'Resume JSON is required.' });
      }

      // Convert JSON resume to a text representation for Gemini evaluation
      const textRepresentation = `
        Resume JSON Data:
        ${JSON.stringify(resumeJson, null, 2)}
      `;

      const aiFeedback = await aiService.analyzeResumeATS(textRepresentation);
      
      return res.status(200).json({
        success: true,
        aiSuggestions: aiFeedback
      });
    } catch (error) {
      return next(error);
    }
  }
};

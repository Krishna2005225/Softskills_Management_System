/*
------------------------------------------------
File: resumeRoutes.js
Purpose: Maps resume ATS checker and builder actions.
Responsibilities: Integrates PDF file uploads and routes history lists.
Dependencies: express, multer, resumeController, authMiddleware
------------------------------------------------
*/

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const resumeController = require('../controllers/resumeController');
const { protect } = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

/*
POST /api/resume/upload
Receives file, uploads to Cloudinary, runs ATS checks, returns score and AI recommendations.
*/
router.post('/upload', protect, upload.single('resume'), resumeController.uploadResume);

/*
GET /api/resume/history
Retrieves previous ATS evaluation scores log.
*/
router.get('/history', protect, resumeController.getHistory);

/*
POST /api/resume/ai-rewrite
Rewrites a portion of user resume.
*/
router.post('/ai-rewrite', protect, resumeController.aiRewriteResume);

module.exports = router;

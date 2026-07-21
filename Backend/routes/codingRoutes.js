/*
------------------------------------------------
File: codingRoutes.js
Purpose: Maps placement coding challenges endpoints.
Responsibilities: Exposes routes for challenge lists and code execution run triggers.
Dependencies: express, codingController, authMiddleware
------------------------------------------------
*/

const express = require('express');
const router = express.Router();
const codingController = require('../controllers/codingController');
const { protect } = require('../middleware/authMiddleware');

/*
GET /api/coding/challenges
Returns list of active coding assessments.
*/
router.get('/challenges', protect, codingController.getChallenges);

/*
POST /api/coding/run
Evaluates student submitted code logic.
*/
router.post('/run', protect, codingController.runTestCases);

module.exports = router;

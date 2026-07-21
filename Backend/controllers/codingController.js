/*
------------------------------------------------
File: codingController.js
Purpose: Manages placement coding challenges and execution reports.
Responsibilities: Exposes starter codes, initiates Gemini-driven LeetCode online judge verification.
Dependencies: db.js, aiService
------------------------------------------------
*/

const db = require('../config/db');
const aiService = require('../services/aiService');

const defaultChallenges = [
  {
    challenge_id: 'code-1',
    title: 'Two Sum Search',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.',
    difficulty: 'EASY',
    starterCode: {
      javascript: `function twoSum(nums, target) {\n  // type your JavaScript solution here\n  return [];\n}`,
      python: `def two_sum(nums, target):\n    # type your Python solution here\n    return []`
    },
    testCases: [
      { input: 'nums = [2,7,11,15], target = 9', expected: '[0,1]' },
      { input: 'nums = [3,2,4], target = 6', expected: '[1,2]' }
    ]
  },
  {
    challenge_id: 'code-2',
    title: 'Reverse Integer',
    description: 'Given a signed 32-bit integer x, return x with its digits reversed. If reversing x causes the value to go outside the signed 32-bit integer range [-2^31, 2^31 - 1], then return 0.',
    difficulty: 'MEDIUM',
    starterCode: {
      javascript: `function reverse(x) {\n  // type your JavaScript solution here\n  return 0;\n}`,
      python: `def reverse(x):\n    # type your Python solution here\n    return 0`
    },
    testCases: [
      { input: 'x = 123', expected: '321' },
      { input: 'x = -123', expected: '-321' }
    ]
  },
  {
    challenge_id: 'code-3',
    title: 'Valid Parentheses',
    description: 'Given a string s containing just the characters "(", ")", "{", "}", "[" and "]", determine if the input string is valid.',
    difficulty: 'EASY',
    starterCode: {
      javascript: `function isValid(s) {\n  // type your JavaScript solution here\n  return false;\n}`,
      python: `def is_valid(s):\n    # type your Python solution here\n    return False`
    },
    testCases: [
      { input: 's = "()"', expected: 'true' },
      { input: 's = "()[]{}"', expected: 'true' }
    ]
  }
];

module.exports = {
  /*
  GET /api/coding/challenges
  Returns available coding challenges list.
  */
  getChallenges: async (req, res, next) => {
    try {
      const dbRes = await db.query('SELECT * FROM coding_challenges ORDER BY created_at DESC');
      const challenges = dbRes.rows.length > 0 
        ? dbRes.rows.map(row => ({
            challenge_id: row.challenge_id,
            title: row.title,
            description: row.description,
            difficulty: row.difficulty,
            starterCode: typeof row.starter_code === 'string' ? JSON.parse(row.starter_code) : row.starter_code,
            testCases: typeof row.test_cases === 'string' ? JSON.parse(row.test_cases) : row.test_cases
          }))
        : defaultChallenges;

      return res.status(200).json({
        success: true,
        challenges
      });
    } catch (error) {
      return next(error);
    }
  },

  /*
  POST /api/coding/run
  Submits code execution against test cases.
  */
  runTestCases: async (req, res, next) => {
    try {
      const { challengeId, code, language } = req.body;
      if (!challengeId || !code || !language) {
        return res.status(400).json({ success: false, message: 'Challenge ID, code content, and programming language are required.' });
      }

      // Resolve selected challenge details
      let challenge = defaultChallenges.find(c => c.challenge_id === challengeId);
      if (!challenge) {
        const dbRes = await db.query('SELECT * FROM coding_challenges WHERE challenge_id = $1', [challengeId]);
        if (dbRes.rows[0]) {
          const row = dbRes.rows[0];
          challenge = {
            title: row.title,
            description: row.description,
            testCases: typeof row.test_cases === 'string' ? JSON.parse(row.test_cases) : row.test_cases
          };
        }
      }

      if (!challenge) {
        return res.status(404).json({ success: false, message: 'Requested coding challenge not found.' });
      }

      // Execute and evaluate via Gemini LeetCode sandbox
      const auditReport = await aiService.evaluateCodingChallenge(
        challenge.title,
        challenge.description,
        code,
        language,
        challenge.testCases
      );

      return res.status(200).json({
        success: true,
        report: auditReport
      });
    } catch (error) {
      return next(error);
    }
  }
};

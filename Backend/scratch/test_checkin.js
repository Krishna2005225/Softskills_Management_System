/*
------------------------------------------------
File: test_checkin.js
Purpose: Simulate student check-in request with signed JWT to inspect exact error.
------------------------------------------------
*/

const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

const SECRET = process.env.JWT_SECRET || 'supersecrettokenkeyhere';
const userId = '23ffe0d8-60c7-4f4a-be51-d555107b7c47'; // KARTHIK THALIPINENI

// Generate JWT token
const token = jwt.sign({ id: userId, role: 'STUDENT' }, SECRET, { expiresIn: '1d' });

async function run() {
  try {
    console.log('Sending check-in request to http://localhost:5001/api/student/study-session/checkin...');
    const response = await axios.post(
      'http://localhost:5001/api/student/study-session/checkin',
      {},
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    console.log('Success response:', response.status, response.data);
  } catch (err) {
    if (err.response) {
      console.log('Error response status:', err.response.status);
      console.log('Error response data:', err.response.data);
    } else {
      console.log('Error details:', err.message);
    }
  }
}

run();

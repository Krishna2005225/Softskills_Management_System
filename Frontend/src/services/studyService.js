/*
------------------------------------------------
File: studyService.js
Purpose: HTTP interface for student study session tracking.
Responsibilities: Check-in, check-out, active session monitoring, and session logs.
Dependencies: axiosClient
------------------------------------------------
*/

import axiosClient from '../api/axiosClient';

const studyService = {
  /** Get active study session if it exists */
  getActiveSession: () =>
    axiosClient.get('/student/study-session/active').then(r => r.data),

  /** Start a new study session (Check-In) */
  checkIn: () =>
    axiosClient.post('/student/study-session/checkin').then(r => r.data),

  /** End the active study session (Check-Out) */
  checkOut: () =>
    axiosClient.post('/student/study-session/checkout').then(r => r.data),

  /** Get logs of past study sessions */
  getHistory: () =>
    axiosClient.get('/student/study-session/history').then(r => r.data),
};

export default studyService;

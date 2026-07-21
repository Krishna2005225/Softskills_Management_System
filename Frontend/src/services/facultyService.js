/*
------------------------------------------------
File: facultyService.js
Purpose: HTTP service layer for Faculty API calls.
Responsibilities: Wraps all faculty-related API requests — student management, batch analytics, task creation/assignment/evaluation.
Dependencies: axiosClient
------------------------------------------------
*/

import axiosClient from '../api/axiosClient';

const facultyService = {

  // --- STUDENT MANAGEMENT ---

  /** Get all students in the system */
  getAllStudents: () =>
    axiosClient.get('/faculty/students').then(r => r.data),

  /** Get only students assigned to the logged-in faculty */
  getMyStudents: () =>
    axiosClient.get('/faculty/my-students').then(r => r.data),

  /** Assign a student to the faculty's batch */
  assignStudent: (studentId) =>
    axiosClient.post('/faculty/assign-student', { studentId }).then(r => r.data),

  /** Remove a student from the faculty's batch */
  unassignStudent: (studentId) =>
    axiosClient.delete(`/faculty/unassign-student/${studentId}`).then(r => r.data),

  /** Get full performance profile of a student */
  getStudentProfile: (studentId) =>
    axiosClient.get(`/faculty/student/${studentId}/profile`).then(r => r.data),

  /** Get aggregated batch analytics */
  getBatchAnalytics: () =>
    axiosClient.get('/faculty/batch-analytics').then(r => r.data),


  // --- TASK MANAGEMENT ---

  /** Create a new task */
  createTask: (taskData) =>
    axiosClient.post('/faculty/tasks', taskData).then(r => r.data),

  /** Get all tasks created by the faculty */
  getMyTasks: () =>
    axiosClient.get('/faculty/tasks').then(r => r.data),

  /** Get a single task with its assignment details */
  getTaskById: (taskId) =>
    axiosClient.get(`/faculty/tasks/${taskId}`).then(r => r.data),

  /** Update an existing task */
  updateTask: (taskId, updates) =>
    axiosClient.put(`/faculty/tasks/${taskId}`, updates).then(r => r.data),

  /** Delete a task */
  deleteTask: (taskId) =>
    axiosClient.delete(`/faculty/tasks/${taskId}`).then(r => r.data),

  /** Assign task to students */
  assignTask: (taskId, { studentIds, assignAll }) =>
    axiosClient.post(`/faculty/tasks/${taskId}/assign`, { studentIds, assignAll }).then(r => r.data),

  /** Get all student submissions for a task */
  getTaskSubmissions: (taskId) =>
    axiosClient.get(`/faculty/tasks/${taskId}/submissions`).then(r => r.data),

  /** Evaluate a student's submission */
  evaluateSubmission: (taskId, studentId, { score, feedback }) =>
    axiosClient.put(`/faculty/tasks/${taskId}/evaluate/${studentId}`, { score, feedback }).then(r => r.data),
};

export default facultyService;

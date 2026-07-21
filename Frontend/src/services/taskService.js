/*
------------------------------------------------
File: taskService.js
Purpose: HTTP service layer for Student Task API calls.
Responsibilities: Wraps all student-task-related API requests — fetch assigned tasks, submit tasks.
Dependencies: axiosClient
------------------------------------------------
*/

import axiosClient from '../api/axiosClient';

const taskService = {

  /** Get all tasks assigned to the logged-in student */
  getMyTasks: () =>
    axiosClient.get('/student/my-tasks').then(r => r.data),

  /** Submit a task (text or file URL) */
  submitTask: (taskId, { submission_text, submission_url }) =>
    axiosClient.put(`/student/my-tasks/${taskId}/submit`, { submission_text, submission_url }).then(r => r.data),
};

export default taskService;

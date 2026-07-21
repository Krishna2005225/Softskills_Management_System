/*
------------------------------------------------
File: studentRoutes.js
Purpose: Maps student metrics endpoints.
Responsibilities: Exposes dashboard, attendance, and progress analytics routes.
Dependencies: express, studentController, authMiddleware, roleMiddleware
------------------------------------------------
*/

const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const taskController = require('../controllers/taskController');
const studyController = require('../controllers/studyController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

/*
GET /api/student/dashboard
Returns cumulative scores, attendances, and events maps.
Only roles STUDENT, FACULTY, PLACEMENT_OFFICER, or ADMIN allowed.
*/
router.get('/dashboard', protect, authorize('STUDENT', 'FACULTY', 'PLACEMENT_OFFICER', 'ADMIN'), studentController.getDashboardStats);

/*
GET /api/student/progress-graphs
Returns weekly/monthly graphs dataset parameters.
*/
router.get('/progress-graphs', protect, authorize('STUDENT', 'FACULTY', 'PLACEMENT_OFFICER', 'ADMIN'), studentController.getProgressGraphs);

/*
GET /api/student/attendance
Returns historical logs.
*/
router.get('/attendance', protect, authorize('STUDENT', 'FACULTY', 'PLACEMENT_OFFICER', 'ADMIN'), studentController.getAttendance);

/*
GET /api/student/my-tasks
Student views all tasks assigned to them with status and feedback.
*/
router.get('/my-tasks', protect, authorize('STUDENT'), taskController.getMyAssignedTasks);

/*
PUT /api/student/my-tasks/:taskId/submit
Student submits a task (text or file URL).
Body: { submission_text } or { submission_url }
*/
router.put('/my-tasks/:taskId/submit', protect, authorize('STUDENT'), taskController.submitTask);

/*
GET /api/student/faculties
List of all faculty members.
*/
router.get('/faculties', protect, authorize('STUDENT'), studentController.getFaculties);

/*
GET /api/student/my-faculty
Currently assigned faculty advisor.
*/
router.get('/my-faculty', protect, authorize('STUDENT'), studentController.getMyFaculty);

/*
POST /api/student/assign-faculty
Select/update faculty advisor.
Body: { facultyId }
*/
router.post('/assign-faculty', protect, authorize('STUDENT'), studentController.assignFaculty);

/*
Study session tracking endpoints
*/
router.get('/study-session/active', protect, authorize('STUDENT'), studyController.getActiveSession);
router.post('/study-session/checkin', protect, authorize('STUDENT'), studyController.checkIn);
router.post('/study-session/checkout', protect, authorize('STUDENT'), studyController.checkOut);
router.get('/study-session/history', protect, authorize('STUDENT'), studyController.getHistory);

module.exports = router;

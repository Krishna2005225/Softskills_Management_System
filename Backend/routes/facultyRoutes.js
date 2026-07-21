/*
------------------------------------------------
File: facultyRoutes.js
Purpose: Faculty management API routes.
Responsibilities: Student viewing, batch assignment, student profiles, batch analytics, task routes.
Dependencies: express, facultyController, taskController, authMiddleware, roleMiddleware
------------------------------------------------
*/

const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/facultyController');
const taskController = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// --- STUDENT MANAGEMENT ---

/*
GET /api/faculty/students
Get all students in the system.
Access: FACULTY, ADMIN
*/
router.get('/students', protect, authorize('FACULTY', 'ADMIN'), facultyController.getAllStudents);

/*
GET /api/faculty/my-students
Get only students assigned to the logged-in faculty.
Access: FACULTY
*/
router.get('/my-students', protect, authorize('FACULTY', 'ADMIN'), facultyController.getMyStudents);

/*
POST /api/faculty/assign-student
Assign a student to the logged-in faculty's batch.
Body: { studentId }
Access: FACULTY, ADMIN
*/
router.post('/assign-student', protect, authorize('FACULTY', 'ADMIN'), facultyController.assignStudent);

/*
DELETE /api/faculty/unassign-student/:studentId
Remove a student from the logged-in faculty's batch.
Access: FACULTY, ADMIN
*/
router.delete('/unassign-student/:studentId', protect, authorize('FACULTY', 'ADMIN'), facultyController.unassignStudent);

/*
GET /api/faculty/student/:id/profile
Get full performance profile for a single student.
Access: FACULTY, ADMIN
*/
router.get('/student/:id/profile', protect, authorize('FACULTY', 'ADMIN'), facultyController.getStudentProfile);

/*
GET /api/faculty/batch-analytics
Get aggregated performance analytics for the faculty's batch.
Access: FACULTY, ADMIN
*/
router.get('/batch-analytics', protect, authorize('FACULTY', 'ADMIN'), facultyController.getBatchAnalytics);


// --- TASK MANAGEMENT (Faculty side) ---

/*
POST /api/faculty/tasks
Create a new task.
Body: { title, description, task_type, due_date, max_score, instructions, resources_url }
Access: FACULTY, ADMIN
*/
router.post('/tasks', protect, authorize('FACULTY', 'ADMIN'), taskController.createTask);

/*
GET /api/faculty/tasks
Get all tasks created by the logged-in faculty.
Access: FACULTY, ADMIN
*/
router.get('/tasks', protect, authorize('FACULTY', 'ADMIN'), taskController.getMyTasks);

/*
GET /api/faculty/tasks/:id
Get a single task with its assignment list.
Access: FACULTY, ADMIN
*/
router.get('/tasks/:id', protect, authorize('FACULTY', 'ADMIN'), taskController.getTaskById);

/*
PUT /api/faculty/tasks/:id
Edit an existing task.
Body: { title, description, due_date, instructions, resources_url, max_score }
Access: FACULTY, ADMIN
*/
router.put('/tasks/:id', protect, authorize('FACULTY', 'ADMIN'), taskController.updateTask);

/*
DELETE /api/faculty/tasks/:id
Delete a task.
Access: FACULTY, ADMIN
*/
router.delete('/tasks/:id', protect, authorize('FACULTY', 'ADMIN'), taskController.deleteTask);

/*
POST /api/faculty/tasks/:id/assign
Assign a task to one or more students.
Body: { studentIds: [...] } OR { assignAll: true }
Access: FACULTY, ADMIN
*/
router.post('/tasks/:id/assign', protect, authorize('FACULTY', 'ADMIN'), taskController.assignTaskToStudents);

/*
GET /api/faculty/tasks/:id/submissions
View all student submissions for a task.
Access: FACULTY, ADMIN
*/
router.get('/tasks/:id/submissions', protect, authorize('FACULTY', 'ADMIN'), taskController.getTaskSubmissions);

/*
PUT /api/faculty/tasks/:id/evaluate/:studentId
Evaluate and grade a student's submission.
Body: { score, feedback }
Access: FACULTY, ADMIN
*/
router.put('/tasks/:id/evaluate/:studentId', protect, authorize('FACULTY', 'ADMIN'), taskController.evaluateSubmission);

/*
POST /api/faculty/questions/import
Import bulk questions from CSV or JSON (used by ManageQuestions page).
Body: { csvText, listType }
Access: FACULTY, ADMIN
*/
router.post('/questions/import', protect, authorize('FACULTY', 'ADMIN'), facultyController.importQuestions);

module.exports = router;

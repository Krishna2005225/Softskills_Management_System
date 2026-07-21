/*
------------------------------------------------
File: server.js
Purpose: Entry server file.
Responsibilities: Mounts express, global middlewares, routing hubs, database connection test, and port listeners.
Dependencies: express, cors, dotenv, routes registry, middlewares registry
------------------------------------------------
*/

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Bypass proxy configuration that hangs outgoing network requests on this system
delete process.env.HTTP_PROXY;
delete process.env.HTTPS_PROXY;
delete process.env.http_proxy;
delete process.env.https_proxy;

// Middleware imports
const { requestLogger } = require('./middleware/loggingMiddleware');
const { errorHandler } = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const placementRoutes = require('./routes/placementRoutes');
const communicationRoutes = require('./routes/communicationRoutes');
const mockInterviewRoutes = require('./routes/mockInterviewRoutes');
const groupDiscussionRoutes = require('./routes/groupDiscussionRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const aptitudeRoutes = require('./routes/aptitudeRoutes');
const reportRoutes = require('./routes/reportRoutes');
const advisorRoutes = require('./routes/advisorRoutes');
const forumRoutes = require('./routes/forumRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const codingRoutes = require('./routes/codingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Background Jobs
const { startOverdueTaskJob } = require('./jobs/overdueTaskJob');

// Initialize application
const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Static uploads path mapping for local storage files buffering
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health Check API
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    success: true, 
    status: 'UP', 
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Mount Specific API Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/placement', placementRoutes);
app.use('/api/communication', communicationRoutes);
app.use('/api/mock-interview', mockInterviewRoutes);
app.use('/api/group-discussion', groupDiscussionRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/aptitude', aptitudeRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/advisor', advisorRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/coding', codingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// Fallback Route (404 Page)
app.use((req, res, next) => {
  res.status(404);
  const error = new Error(`Not Found - ${req.originalUrl}`);
  next(error);
});

// Centralized Error Interceptor
app.use(errorHandler);

// Listen
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server started in ${process.env.NODE_ENV || 'development'} mode on port: ${PORT}`);
  // Start background jobs
  startOverdueTaskJob();
});

// Resilient Crash Prevention Handlers
process.on('unhandledRejection', (err) => {
  console.error(`CRITICAL SYSTEM ERROR (Unhandled Rejection): ${err.message}`);
});

process.on('uncaughtException', (err) => {
  console.error(`CRITICAL SYSTEM ERROR (Uncaught Exception): ${err.message}`);
});

module.exports = app;

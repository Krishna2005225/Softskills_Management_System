/*
------------------------------------------------
File: AppRoutes.jsx
Purpose: Configures route mapping tables.
Responsibilities: Organizes public layouts and protected dashboard routers paths.
Dependencies: react-router-dom, ProtectedRoute, layout frames, page registries
------------------------------------------------
*/

import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Layouts
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import ProtectedRoute from './ProtectedRoute';

// Public Pages
import Landing from '../pages/Landing';
import About from '../pages/About';
import Contact from '../pages/Contact';

// Auth Pages
import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';

// Dashboards
import StudentDashboard from '../pages/StudentDashboard';
import FacultyDashboard from '../pages/FacultyDashboard';
import PlacementDashboard from '../pages/PlacementDashboard';
import AdminDashboard from '../pages/AdminDashboard';
import ManageQuestions from '../pages/ManageQuestions';

// Training Modules
import CommunicationModule from '../pages/CommunicationModule';
import MockInterview from '../pages/MockInterview';
import GroupDiscussion from '../pages/GroupDiscussion';
import ResumeBuilder from '../pages/ResumeBuilder';
import Aptitude from '../pages/Aptitude';

// Analytical Pages & Commons
import Leaderboard from '../pages/Leaderboard';
import Reports from '../pages/Reports';
import Notifications from '../pages/Notifications';
import Settings from '../pages/Settings';
import Profile from '../pages/Profile';
import NotFound from '../pages/NotFound';
import CareerAdvisor from '../pages/CareerAdvisor';
import DiscussionForum from '../pages/DiscussionForum';
import CodingArena from '../pages/CodingArena';
import FacultyStudentProfile from '../pages/FacultyStudentProfile';
import FacultyTaskManager from '../pages/FacultyTaskManager';
import StudentTaskBoard from '../pages/StudentTaskBoard';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Route>

      {/* Auth Pages */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      {/* Protected Dashboards & Modules */}
      <Route element={<DashboardLayout />}>
        {/* Student Specific */}
        <Route 
          path="/student/dashboard" 
          element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentDashboard /></ProtectedRoute>} 
        />
        <Route 
          path="/communication" 
          element={<ProtectedRoute allowedRoles={['STUDENT']}><CommunicationModule /></ProtectedRoute>} 
        />
        <Route 
          path="/mock-interview" 
          element={<ProtectedRoute allowedRoles={['STUDENT']}><MockInterview /></ProtectedRoute>} 
        />
        <Route 
          path="/resume-builder" 
          element={<ProtectedRoute allowedRoles={['STUDENT']}><ResumeBuilder /></ProtectedRoute>} 
        />
        <Route 
          path="/aptitude" 
          element={<ProtectedRoute allowedRoles={['STUDENT']}><Aptitude /></ProtectedRoute>} 
        />
        <Route 
          path="/leaderboard" 
          element={<ProtectedRoute allowedRoles={['STUDENT']}><Leaderboard /></ProtectedRoute>} 
        />
        <Route 
          path="/student/tasks" 
          element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentTaskBoard /></ProtectedRoute>} 
        />

        {/* Faculty Specific */}
        <Route 
          path="/faculty/dashboard" 
          element={<ProtectedRoute allowedRoles={['FACULTY']}><FacultyDashboard /></ProtectedRoute>} 
        />
        <Route 
          path="/faculty/questions" 
          element={<ProtectedRoute allowedRoles={['FACULTY']}><ManageQuestions /></ProtectedRoute>} 
        />
        <Route 
          path="/faculty/activities" 
          element={<ProtectedRoute allowedRoles={['FACULTY']}><FacultyDashboard /></ProtectedRoute>} 
        />
        <Route 
          path="/faculty/evaluations" 
          element={<ProtectedRoute allowedRoles={['FACULTY']}><FacultyDashboard /></ProtectedRoute>} 
        />
        <Route 
          path="/faculty/tasks" 
          element={<ProtectedRoute allowedRoles={['FACULTY', 'ADMIN']}><FacultyTaskManager /></ProtectedRoute>} 
        />
        <Route 
          path="/faculty/student/:id" 
          element={<ProtectedRoute allowedRoles={['FACULTY', 'ADMIN']}><FacultyStudentProfile /></ProtectedRoute>} 
        />

        {/* Placement Specific */}
        <Route 
          path="/placement/dashboard" 
          element={<ProtectedRoute allowedRoles={['PLACEMENT_OFFICER']}><PlacementDashboard /></ProtectedRoute>} 
        />
        <Route 
          path="/placement/eligible" 
          element={<ProtectedRoute allowedRoles={['PLACEMENT_OFFICER']}><PlacementDashboard /></ProtectedRoute>} 
        />
        <Route 
          path="/placement/comparison" 
          element={<ProtectedRoute allowedRoles={['PLACEMENT_OFFICER']}><PlacementDashboard /></ProtectedRoute>} 
        />

        {/* Admin Specific */}
        <Route 
          path="/admin/dashboard" 
          element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} 
        />
        <Route 
          path="/admin/users" 
          element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} 
        />

        {/* Shared Protected Pages */}
        <Route 
          path="/group-discussion" 
          element={<ProtectedRoute allowedRoles={['STUDENT', 'FACULTY', 'PLACEMENT_OFFICER', 'ADMIN']}><GroupDiscussion /></ProtectedRoute>} 
        />
        <Route 
          path="/reports" 
          element={<ProtectedRoute allowedRoles={['STUDENT', 'FACULTY', 'PLACEMENT_OFFICER', 'ADMIN']}><Reports /></ProtectedRoute>} 
        />
        <Route 
          path="/notifications" 
          element={<ProtectedRoute allowedRoles={['STUDENT', 'FACULTY', 'PLACEMENT_OFFICER', 'ADMIN']}><Notifications /></ProtectedRoute>} 
        />
        <Route 
          path="/settings" 
          element={<ProtectedRoute allowedRoles={['STUDENT', 'FACULTY', 'PLACEMENT_OFFICER', 'ADMIN']}><Settings /></ProtectedRoute>} 
        />
        <Route 
          path="/profile" 
          element={<ProtectedRoute allowedRoles={['STUDENT', 'FACULTY', 'PLACEMENT_OFFICER', 'ADMIN']}><Profile /></ProtectedRoute>} 
        />
        <Route 
          path="/advisor" 
          element={<ProtectedRoute allowedRoles={['STUDENT']}><CareerAdvisor /></ProtectedRoute>} 
        />
        <Route 
          path="/forum" 
          element={<ProtectedRoute allowedRoles={['STUDENT', 'FACULTY', 'PLACEMENT_OFFICER', 'ADMIN']}><DiscussionForum /></ProtectedRoute>} 
        />
        <Route 
          path="/coding" 
          element={<ProtectedRoute allowedRoles={['STUDENT']}><CodingArena /></ProtectedRoute>} 
        />
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;

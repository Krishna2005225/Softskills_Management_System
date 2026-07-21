/*
------------------------------------------------
File: studentService.js
Purpose: Service interface for student dashboards.
Responsibilities: Pulls progress values, scores details, and attendance tables.
Dependencies: axiosClient
------------------------------------------------
*/

import axiosClient from '../api/axiosClient';

export default {
  /*
  Fetches student dashboard info.
  */
  getDashboardStats: () => {
    return axiosClient.get('/student/dashboard').then(res => res.data);
  },

  /*
  Fetches weekly and monthly graphs arrays.
  */
  getProgressGraphs: () => {
    return axiosClient.get('/student/progress-graphs').then(res => res.data);
  },

  /*
  Fetches historical attendance records.
  */
  getAttendance: () => {
    return axiosClient.get('/student/attendance').then(res => res.data);
  },

  /*
  Fetches list of all faculty members.
  */
  getFaculties: () => {
    return axiosClient.get('/student/faculties').then(res => res.data);
  },

  /*
  Fetches student's assigned faculty mentor.
  */
  getMyFaculty: () => {
    return axiosClient.get('/student/my-faculty').then(res => res.data);
  },

  /*
  Assigns a faculty advisor to the student.
  */
  assignFaculty: (facultyId) => {
    return axiosClient.post('/student/assign-faculty', { facultyId }).then(res => res.data);
  }
};

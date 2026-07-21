/*
------------------------------------------------
File: axiosClient.js
Purpose: Configurations central client Axios instance.
Responsibilities: Sets global base URLs, injects Bearer token headers, maps errors routing.
Dependencies: axios
------------------------------------------------
*/

import axios from 'axios';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  timeout: 60000,
});

// Outbound request interceptor configuration
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response error handler configurations
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized request, purging credential cache...');
      localStorage.removeItem('token');
      // Optional: window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default instance;

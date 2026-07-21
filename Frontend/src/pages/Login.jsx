/*
------------------------------------------------
File: Login.jsx
Purpose: Authenticates user credentials.
Responsibilities: Stores token context and routes user to role-specific dashboard views.
Dependencies: react, react-router-dom, useAuth, Button
------------------------------------------------
*/

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/Button';

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await login(email, password, role);
    setLoading(false);

    if (res.success) {
      const userRole = res.user?.role || role;
      if (userRole === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (userRole === 'FACULTY') {
        navigate('/faculty/dashboard');
      } else if (userRole === 'PLACEMENT_OFFICER') {
        navigate('/placement/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-center text-3xl font-extrabold text-slate-800 dark:text-gray-100">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Or{' '}
          <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
            register a new profile
          </Link>
        </p>
      </div>

      {/* Role Selector Tabs */}
      <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl">
        {[
          { id: 'STUDENT', label: 'Student' },
          { id: 'FACULTY', label: 'Faculty' },
          { id: 'ADMIN', label: 'Admin' }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setRole(tab.id)}
            className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all duration-300 transform active:scale-95 ${
              role === tab.id
                ? 'bg-white dark:bg-slate-900 shadow-sm text-blue-600 dark:text-blue-400 font-extrabold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 font-medium'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Email address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 block w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="name@college.edu"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Password
            </label>
            <Link to="/forgot-password" className="text-xs font-semibold text-blue-600 hover:underline">
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 block w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="••••••••"
          />
        </div>

        <Button type="submit" variant="primary" loading={loading} className="w-full py-3">
          Sign In
        </Button>
      </form>
    </div>
  );
};

export default Login;

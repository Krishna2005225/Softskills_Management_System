/*
------------------------------------------------
File: FacultyDashboard.jsx
Purpose: Main faculty overview dashboard.
Responsibilities: Batch summary stats, trend indicators, visual charts, quick assign form, pending evaluations, and recent activity tracking.
Dependencies: react, facultyService, lucide-react, react-router-dom
------------------------------------------------
*/

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import facultyService from '../services/facultyService';
import axiosClient from '../api/axiosClient';
import {
  Users, ClipboardList, CheckCircle, TrendingUp, Search,
  UserPlus, UserMinus, Eye, BarChart2, BookOpen, AlertCircle,
  ChevronDown, ChevronUp, Loader2, Award, ArrowUpRight, ArrowDownRight,
  PlusCircle, Trash2, Send, MessageSquare
} from 'lucide-react';

const SCORE_COLOR = (score) => {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#f97316';
  return '#ef4444';
};

const ScoreBadge = ({ score }) => (
  <span style={{
    background: SCORE_COLOR(score) + '18',
    color: SCORE_COLOR(score),
    border: `1px solid ${SCORE_COLOR(score)}25`,
    padding: '3px 10px',
    borderRadius: 20,
    fontWeight: 700,
    fontSize: 12
  }}>
    {score ?? '—'}
  </span>
);

const StatCard = ({ icon: Icon, label, value, subtext, trend, isUp, color }) => (
  <div style={{
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 16,
    padding: '20px 24px',
    flex: 1,
    minWidth: 220,
    position: 'relative',
    overflow: 'hidden'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
      <div style={{ background: color + '15', borderRadius: 12, padding: 10, display: 'flex' }}>
        <Icon size={22} color={color} />
      </div>
      {trend && (
        <span style={{
          display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700,
          color: isUp ? '#22c55e' : '#ef4444',
          background: isUp ? '#22c55e15' : '#ef444415',
          padding: '2px 8px', borderRadius: 20
        }}>
          {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {trend}
        </span>
      )}
    </div>
    <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--color-text)', lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', marginTop: 6 }}>{label}</div>
    {subtext && <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>{subtext}</div>}
  </div>
);

const initialForm = {
  title: '',
  description: '',
  task_type: 'MOCK_INTERVIEW',
  difficulty: 'Medium',
  due_date: '',
  max_score: 100,
  instructions: '',
  resources_url: ''
};

const FacultyDashboard = () => {
  const navigate = useNavigate();
  const [myStudents, setMyStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('my'); // 'my' | 'all'
  const [selectedBatch, setSelectedBatch] = useState('all');
  const [assigning, setAssigning] = useState(null);
  const [sortBy, setSortBy] = useState('placement_score');
  const [sortDir, setSortDir] = useState('desc');
  const [error, setError] = useState(null);

  // Form State for Quick Assign
  const [form, setForm] = useState(initialForm);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [myRes, allRes] = await Promise.all([
        facultyService.getMyStudents(),
        facultyService.getAllStudents()
      ]);
      if (myRes.success) setMyStudents(myRes.students || []);
      if (allRes.success) setAllStudents(allRes.students || []);
    } catch (err) {
      setError('Failed to load student data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAnalytics = useCallback(async () => {
    try {
      setAnalyticsLoading(true);
      const res = await facultyService.getBatchAnalytics();
      if (res.success) setAnalytics(res.analytics);
    } catch (err) {
      console.error('Analytics error:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await axiosClient.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
      }
    } catch (err) {
      console.error('Notifications fetch error:', err);
    }
  }, []);

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  useEffect(() => {
    loadData();
    loadAnalytics();
    loadNotifications();
  }, [loadData, loadAnalytics, loadNotifications]);

  const handleAssign = async (studentId) => {
    setAssigning(studentId);
    try {
      await facultyService.assignStudent(studentId);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setAssigning(null);
    }
  };

  const handleUnassign = async (studentId) => {
    if (!window.confirm('Remove this student from your batch?')) return;
    setAssigning(studentId);
    try {
      await facultyService.unassignStudent(studentId);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setAssigning(null);
    }
  };

  // Quick Assign submit
  const handleQuickAssign = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setFormError('Activity title is required.'); return; }
    setFormError('');
    setFormSuccess('');
    setFormLoading(true);

    try {
      // 1. Create the task
      const taskRes = await facultyService.createTask({
        title: form.title,
        description: form.description,
        task_type: form.task_type,
        due_date: form.due_date || null,
        max_score: parseInt(form.max_score) || 100,
        instructions: form.instructions,
        resources_url: form.resources_url
      });

      if (taskRes.success && taskRes.task?.task_id) {
        // 2. Assign to all current my-students
        await facultyService.assignTask(taskRes.task.task_id, {
          assignAll: true,
          studentIds: []
        });

        setFormSuccess('Successfully assigned activity to all batch students! 🎉');
        setForm(initialForm);
        loadAnalytics();
      } else {
        setFormError('Failed to create assignment.');
      }
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to assign activity.');
    } finally {
      setFormLoading(false);
    }
  };

  const myStudentIds = new Set(myStudents.map(s => s.user_id));
  const displayStudents = viewMode === 'my' ? myStudents : allStudents;

  // Extract unique batches dynamically
  const uniqueBatches = Array.from(new Set(
    (viewMode === 'my' ? myStudents : allStudents).map(s => `${s.department} Year ${s.year}`)
  )).sort();

  // Filter
  const filtered = displayStudents.filter(s => {
    const matchesSearch = s.name?.toLowerCase().includes(search.toLowerCase()) ||
                          s.roll_no?.toLowerCase().includes(search.toLowerCase()) ||
                          s.department?.toLowerCase().includes(search.toLowerCase());
    const matchesBatch = selectedBatch === 'all' || `${s.department} Year ${s.year}` === selectedBatch;
    return matchesSearch && matchesBatch;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let av = a[sortBy] ?? 0;
    let bv = b[sortBy] ?? 0;
    if (typeof av === 'string') av = av.toLowerCase();
    if (typeof bv === 'string') bv = bv.toLowerCase();
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const SortIcon = ({ col }) => sortBy === col
    ? (sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)
    : null;

  const inputStyle = {
    width: '100%', padding: '8px 12px',
    border: '1px solid var(--color-border)',
    borderRadius: 8, background: 'var(--color-bg)',
    color: 'var(--color-text)', fontSize: 13,
    outline: 'none', boxSizing: 'border-box'
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--color-text)', margin: 0 }}>Faculty Dashboard</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 4, fontSize: 14 }}>Welcome back, Prof. Saran! Professors Panel</p>
        </div>
        <button
          onClick={() => navigate('/faculty/tasks')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--color-primary)', color: '#fff',
            border: 'none', borderRadius: 10, padding: '10px 20px',
            fontWeight: 700, fontSize: 14, cursor: 'pointer',
            transition: 'opacity 0.2s'
          }}
        >
          <ClipboardList size={18} /> Manage Tasks
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
        <StatCard icon={ClipboardList} label="Pending Evaluations" value={analytics?.taskStats?.pending ?? 0} trend="12% from yesterday" isUp={true} color="#6366f1" />
        <StatCard icon={Users} label="Students Tracked" value={myStudents.length} trend="5% this week" isUp={true} color="#22c55e" />
        <StatCard icon={BookOpen} label="Activities Created" value={analytics?.taskStats?.total ?? 0} trend="14% this month" isUp={true} color="#3b82f6" />
        <StatCard icon={MessageSquare} label="Discussions" value={3} trend="0% this week" isUp={true} color="#f59e0b" />
      </div>

      {/* Main Grid: Left Widgets & Charts, Right Assign Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 28, alignItems: 'start' }}>
        
        {/* Left Side: Charts & Overview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {/* Score Distribution (Real Data) */}
            <div style={{ flex: 1, minWidth: 300, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 18, padding: 20, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Aptitude Score Distribution</h3>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)' }}>Assigned Students</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, justifyContent: 'center' }}>
                {Object.entries(analytics?.scoreDistribution || { '0-40': 0, '41-70': 0, '71-90': 0, '91-100': 0 }).map(([range, count]) => {
                  const distTotal = Math.max(1, Object.values(analytics?.scoreDistribution || {}).reduce((a, b) => a + b, 0));
                  const pct = Math.round((count / distTotal) * 100);
                  return (
                    <div key={range} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', width: 50 }}>{range} pts</span>
                      <div style={{ flex: 1, height: 10, background: 'var(--color-border)', borderRadius: 5, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--color-primary)', borderRadius: 5, transition: 'width 0.5s' }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-text)', width: 25, textAlign: 'right' }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Submission Status Donut Chart */}
            <div style={{ flex: 1, minWidth: 260, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 18, padding: 20, display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 16px' }}>Submission Status</h3>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', flex: 1 }}>
                
                {/* SVG Donut */}
                <div style={{ position: 'relative', width: 100, height: 100 }}>
                  <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--color-border)" strokeWidth="3" />
                    {/* Evaluated (Green) */}
                    <circle 
                      cx="18" cy="18" r="15.915" fill="none" stroke="#22c55e" strokeWidth="3" 
                      strokeDasharray={`${analytics?.taskStats?.total > 0 ? Math.round(((analytics?.taskStats?.completed || 0) / analytics.taskStats.total) * 100) : 0} ${100 - (analytics?.taskStats?.total > 0 ? Math.round(((analytics?.taskStats?.completed || 0) / analytics.taskStats.total) * 100) : 0)}`} 
                      strokeDashoffset="0" 
                    />
                    {/* Pending (Orange) */}
                    <circle 
                      cx="18" cy="18" r="15.915" fill="none" stroke="#f59e0b" strokeWidth="3" 
                      strokeDasharray={`${analytics?.taskStats?.total > 0 ? Math.round(((analytics?.taskStats?.pending || 0) / analytics.taskStats.total) * 100) : 0} ${100 - (analytics?.taskStats?.total > 0 ? Math.round(((analytics?.taskStats?.pending || 0) / analytics.taskStats.total) * 100) : 0)}`} 
                      strokeDashoffset={`-${analytics?.taskStats?.total > 0 ? Math.round(((analytics?.taskStats?.completed || 0) / analytics.taskStats.total) * 100) : 0}`} 
                    />
                    {/* Overdue (Red) */}
                    <circle 
                      cx="18" cy="18" r="15.915" fill="none" stroke="#ef4444" strokeWidth="3" 
                      strokeDasharray={`${analytics?.taskStats?.total > 0 ? Math.round(((analytics?.taskStats?.overdue || 0) / analytics.taskStats.total) * 100) : 0} ${100 - (analytics?.taskStats?.total > 0 ? Math.round(((analytics?.taskStats?.overdue || 0) / analytics.taskStats.total) * 100) : 0)}`} 
                      strokeDashoffset={`-${(analytics?.taskStats?.total > 0 ? Math.round(((analytics?.taskStats?.completed || 0) / analytics.taskStats.total) * 100) : 0) + (analytics?.taskStats?.total > 0 ? Math.round(((analytics?.taskStats?.pending || 0) / analytics.taskStats.total) * 100) : 0)}`} 
                    />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                    <span style={{ fontSize: 18, fontWeight: 900 }}>{analytics?.taskStats?.total ?? 0}</span>
                    <span style={{ fontSize: 9, color: 'var(--color-text-muted)', marginTop: 2 }}>Total</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, background: '#22c55e', borderRadius: '50%' }} />
                    <span style={{ color: 'var(--color-text-muted)' }}>
                      Graded: <strong>{analytics?.taskStats?.total > 0 ? Math.round(((analytics?.taskStats?.completed || 0) / analytics.taskStats.total) * 100) : 0}% ({analytics?.taskStats?.completed || 0})</strong>
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, background: '#f59e0b', borderRadius: '50%' }} />
                    <span style={{ color: 'var(--color-text-muted)' }}>
                      Pending: <strong>{analytics?.taskStats?.total > 0 ? Math.round(((analytics?.taskStats?.pending || 0) / analytics.taskStats.total) * 100) : 0}% ({analytics?.taskStats?.pending || 0})</strong>
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, background: '#ef4444', borderRadius: '50%' }} />
                    <span style={{ color: 'var(--color-text-muted)' }}>
                      Overdue: <strong>{analytics?.taskStats?.total > 0 ? Math.round(((analytics?.taskStats?.overdue || 0) / analytics.taskStats.total) * 100) : 0}% ({analytics?.taskStats?.overdue || 0})</strong>
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Recent Activity & Notifications panel */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            
            {/* Recent Activity */}
            <div style={{ flex: 1, minWidth: 280, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 18, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Recent Activity</h3>
                <span onClick={() => navigate('/faculty/tasks')} style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', cursor: 'pointer' }}>Manage</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 12 }}>
                {(!analytics?.recentActivity || analytics.recentActivity.length === 0) ? (
                  <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    No recent student activity log.
                  </div>
                ) : (
                  analytics.recentActivity.map((act, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: i < analytics.recentActivity.length - 1 ? '1px solid var(--color-border)' : 'none', paddingBottom: 10 }}>
                      <div>
                        <span style={{ color: 'var(--color-text)', fontWeight: 700 }}>{act.student_name}</span>
                        <span style={{ color: 'var(--color-text-muted)', margin: '0 4px' }}>
                          {act.status === 'SUBMITTED' ? 'submitted' : 'completed'}
                        </span>
                        <span style={{ color: 'var(--color-primary)', fontWeight: 650 }}>{act.task_title}</span>
                      </div>
                      <span style={{ fontSize: 10, color: 'var(--color-text-muted)', whiteSpace: 'nowrap', marginLeft: 8 }}>
                        {formatTimeAgo(act.submitted_at || act.evaluated_at)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Notifications */}
            <div style={{ flex: 1, minWidth: 280, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 18, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Notifications</h3>
                <span onClick={() => navigate('/notifications')} style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', cursor: 'pointer' }}>View All</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 12 }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    No unread notifications.
                  </div>
                ) : (
                  notifications.slice(0, 4).map((notif, i) => (
                    <div key={notif.notification_id || i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{ width: 8, height: 8, background: notif.is_read ? 'var(--color-border)' : 'var(--color-primary)', borderRadius: '50%', marginTop: 4, shrink: 0 }} />
                      <div>
                        <p style={{ color: 'var(--color-text)', margin: '0 0 2px', fontWeight: 600 }}>{notif.message}</p>
                        <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{formatTimeAgo(notif.created_at)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Right Side: Assign New Soft Skill Activity Form */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 18, padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)', marginTop: 0, marginBottom: 16 }}>Assign New Soft Skill Activity</h3>
          
          <form onSubmit={handleQuickAssign} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>Activity Title *</label>
              <input
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Mock HR Interview"
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Conduct a mock HR interview to improve communication..."
                rows={2}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>Category</label>
                <select
                  value={form.task_type}
                  onChange={e => setForm({ ...form, task_type: e.target.value })}
                  style={inputStyle}
                >
                  <option value="MOCK_INTERVIEW">Mock Interview</option>
                  <option value="GD_PRACTICE">GD Practice</option>
                  <option value="APTITUDE_TEST">Aptitude Test</option>
                  <option value="RESUME_REVIEW">Resume Review</option>
                  <option value="CODING_CHALLENGE">Coding Challenge</option>
                  <option value="READING">Reading</option>
                  <option value="CUSTOM">Custom</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>Difficulty</label>
                <select
                  value={form.difficulty}
                  onChange={e => setForm({ ...form, difficulty: e.target.value })}
                  style={inputStyle}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>Due Date</label>
                <input
                  type="datetime-local"
                  value={form.due_date}
                  onChange={e => setForm({ ...form, due_date: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>Batch</label>
                <select style={inputStyle}>
                  <option>CSE AI-ML 2023</option>
                  <option>All Students</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>Points</label>
                <input
                  type="number"
                  value={form.max_score}
                  onChange={e => setForm({ ...form, max_score: e.target.value })}
                  min={1}
                  max={100}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>Instructions (Optional)</label>
                <input
                  value={form.instructions}
                  onChange={e => setForm({ ...form, instructions: e.target.value })}
                  placeholder="e.g. Speak clearly"
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>Reference Material (Optional)</label>
              <input
                value={form.resources_url}
                onChange={e => setForm({ ...form, resources_url: e.target.value })}
                placeholder="https://..."
                style={inputStyle}
              />
            </div>

            <div style={{ border: '1px dashed var(--color-border)', borderRadius: 8, padding: 10, textAlign: 'center', fontSize: 12, color: 'var(--color-text-muted)', cursor: 'pointer' }}>
              📎 Upload File
            </div>

            {formError && <div style={{ color: '#ef4444', fontSize: 12 }}>{formError}</div>}
            {formSuccess && <div style={{ color: '#22c55e', fontSize: 12 }}>{formSuccess}</div>}

            <button
              type="submit"
              disabled={formLoading}
              style={{
                background: 'var(--color-primary)', color: '#fff',
                border: 'none', borderRadius: 8, padding: '10px',
                fontWeight: 700, cursor: 'pointer', fontSize: 13,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}
            >
              {formLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <PlusCircle size={16} />}
              Assign to Batch
            </button>
          </form>
        </div>

      </div>

      {/* Student Table */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 18, overflow: 'hidden' }}>
        {/* Table Header Controls */}
        <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>
            {viewMode === 'my' ? `My Assigned Students` : `All System Students`}
          </h3>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 4, background: 'var(--color-bg)', padding: 3, borderRadius: 8, border: '1px solid var(--color-border)' }}>
              {['my', 'all'].map(mode => (
                <button
                  key={mode}
                  onClick={() => {
                    setViewMode(mode);
                    setSelectedBatch('all'); // Reset batch filter on tab switch
                  }}
                  style={{
                    padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                    fontWeight: 700, fontSize: 12,
                    background: viewMode === mode ? 'var(--color-surface)' : 'transparent',
                    color: viewMode === mode ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    boxShadow: viewMode === mode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  {mode === 'my' ? 'My Batch' : 'All Students'}
                </button>
              ))}
            </div>

            <select
              value={selectedBatch}
              onChange={e => setSelectedBatch(e.target.value)}
              style={{
                padding: '6px 10px',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                background: 'var(--color-bg)',
                color: 'var(--color-text)',
                fontSize: 12,
                outline: 'none',
                fontWeight: 650
              }}
            >
              <option value="all">All Batches</option>
              {uniqueBatches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search students..."
                style={{
                  paddingLeft: 30, paddingRight: 10, paddingTop: 6, paddingBottom: 6,
                  border: '1px solid var(--color-border)', borderRadius: 8,
                  background: 'var(--color-bg)', color: 'var(--color-text)',
                  fontSize: 12, width: 200, outline: 'none'
                }}
              />
            </div>
          </div>
        </div>

        {error && (
          <div style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444' }}>
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', marginBottom: 8 }} />
            <div>Loading students...</div>
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <Users size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
            <div style={{ fontSize: 15 }}>
              {viewMode === 'my' ? 'No students in your batch yet. Switch to "All Students" to assign some.' : 'No students found.'}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--color-border)', color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}>
                  {[
                    { key: 'name', label: 'Student' },
                    { key: 'roll_no', label: 'Roll No' },
                    { key: 'department', label: 'Dept' },
                    { key: 'year', label: 'Year' },
                    { key: 'cgpa', label: 'CGPA' },
                    { key: 'placement_score', label: 'Placement Score' },
                  ].map(col => (
                    <th
                      key={col.key}
                      onClick={() => toggleSort(col.key)}
                      style={{ padding: '12px 18px', textAlign: 'left', cursor: 'pointer', userSelect: 'none', fontSize: 11, fontWeight: 700 }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {col.label.toUpperCase()} <SortIcon col={col.key} />
                      </span>
                    </th>
                  ))}
                  <th style={{ padding: '12px 18px', textAlign: 'center', fontSize: 11, fontWeight: 700 }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((s, idx) => (
                  <tr key={s.user_id} style={{ borderBottom: '1px solid var(--color-border)', background: idx % 2 === 0 ? 'transparent' : 'var(--color-bg)' }}>
                    <td style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--color-text)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontWeight: 800, fontSize: 12, color: '#fff'
                        }}>
                          {s.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700 }}>{s.name}</div>
                          <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 18px', color: 'var(--color-text-muted)', fontWeight: 600 }}>{s.roll_no}</td>
                    <td style={{ padding: '12px 18px', color: 'var(--color-text-muted)' }}>{s.department}</td>
                    <td style={{ padding: '12px 18px', color: 'var(--color-text-muted)' }}>Year {s.year}</td>
                    <td style={{ padding: '12px 18px', fontWeight: 600 }}>{s.cgpa}</td>
                    <td style={{ padding: '12px 18px' }}><ScoreBadge score={s.placement_score} /></td>
                    <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button
                          onClick={() => navigate(`/faculty/student/${s.user_id}`)}
                          title="View Profile"
                          style={{ background: '#3b82f615', color: '#3b82f6', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700 }}
                        >
                          <Eye size={13} /> View
                        </button>
                        {myStudentIds.has(s.user_id) ? (
                          <button
                            onClick={() => handleUnassign(s.user_id)}
                            disabled={assigning === s.user_id}
                            style={{ background: '#ef444415', color: '#ef4444', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700 }}
                          >
                            {assigning === s.user_id ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <UserMinus size={13} />}
                            Unassign
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAssign(s.user_id)}
                            disabled={assigning === s.user_id}
                            style={{ background: '#22c55e15', color: '#22c55e', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700 }}
                          >
                            {assigning === s.user_id ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <UserPlus size={13} />}
                            Assign
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        
        /* Tactile interactive button animations */
        button {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        button:hover {
          transform: translateY(-1.5px);
          box-shadow: 0 6px 16px rgba(99, 102, 241, 0.15);
          opacity: 0.95;
        }
        button:active {
          transform: translateY(0px) scale(0.97);
        }

        /* Table row highlight animations */
        tr {
          transition: background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        tr:hover {
          background-color: var(--color-border) !important;
        }
      `}</style>
    </div>
  );
};

export default FacultyDashboard;

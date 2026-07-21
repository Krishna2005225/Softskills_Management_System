/*
------------------------------------------------
File: StudentTaskBoard.jsx
Purpose: Student view for all assigned tasks — view, start, and submit tasks.
Responsibilities: Fetch assigned tasks, show status-grouped cards, allow text submission.
Dependencies: react, taskService, lucide-react
------------------------------------------------
*/

import React, { useState, useEffect, useCallback } from 'react';
import taskService from '../services/taskService';
import {
  ClipboardList, Clock, CheckCircle, AlertTriangle, Loader2,
  Mic, Brain, MessageSquare, FileText, BookOpen, Award,
  ChevronDown, ChevronUp, Send, X
} from 'lucide-react';

const TASK_TYPES = {
  MOCK_INTERVIEW:   { label: 'Mock Interview',     icon: Mic,           color: '#6366f1' },
  GD_PRACTICE:      { label: 'GD Practice',        icon: MessageSquare, color: '#8b5cf6' },
  APTITUDE_TEST:    { label: 'Aptitude Test',       icon: Brain,         color: '#3b82f6' },
  RESUME_REVIEW:    { label: 'Resume Review',       icon: FileText,      color: '#22c55e' },
  CODING_CHALLENGE: { label: 'Coding Challenge',    icon: BookOpen,      color: '#f59e0b' },
  READING:          { label: 'Reading / Research',  icon: BookOpen,      color: '#06b6d4' },
  CUSTOM:           { label: 'Custom Task',         icon: Award,         color: '#ec4899' },
};

const STATUS_CONFIG = {
  ASSIGNED:    { label: 'Pending',     color: '#3b82f6', bg: '#3b82f622', icon: Clock },
  IN_PROGRESS: { label: 'In Progress', color: '#f59e0b', bg: '#f59e0b22', icon: Loader2 },
  SUBMITTED:   { label: 'Submitted',   color: '#6366f1', bg: '#6366f122', icon: Send },
  EVALUATED:   { label: 'Graded',      color: '#22c55e', bg: '#22c55e22', icon: CheckCircle },
  OVERDUE:     { label: 'Overdue',     color: '#ef4444', bg: '#ef444422', icon: AlertTriangle },
};

const getDaysLeft = (dueDate) => {
  if (!dueDate) return null;
  const diff = new Date(dueDate) - new Date();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days;
};

const DueDateBadge = ({ dueDate }) => {
  if (!dueDate) return null;
  const days = getDaysLeft(dueDate);
  const color = days < 0 ? '#ef4444' : days <= 2 ? '#f59e0b' : '#22c55e';
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color, background: color + '22', padding: '2px 8px', borderRadius: 20 }}>
      {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `${days}d left`}
    </span>
  );
};

const SubmitModal = ({ task, onClose, onSuccess }) => {
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!text.trim() && !url.trim()) {
      setError('Please write your response or provide a file URL.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await taskService.submitTask(task.task_id, {
        submission_text: text.trim() || undefined,
        submission_url: url.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '9px 12px',
    border: '1px solid var(--color-border)',
    borderRadius: 8, background: 'var(--color-bg)',
    color: 'var(--color-text)', fontSize: 14,
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit'
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#00000088', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: 18, padding: 28, maxWidth: 520, width: '100%', boxShadow: '0 20px 60px #0006' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>Submit Task</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={20} /></button>
        </div>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4, marginBottom: 20 }}>{task.title}</p>

        {task.instructions && (
          <div style={{ background: '#6366f111', border: '1px solid #6366f133', borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 13, color: 'var(--color-text)' }}>
            <strong>Instructions:</strong> {task.instructions}
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 5 }}>Your Response</label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={5}
            placeholder="Type your answer, argument, or description here..."
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 5 }}>Or Upload File URL (if applicable)</label>
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://drive.google.com/... or uploaded file link"
            style={inputStyle}
          />
        </div>

        {error && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</div>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{ width: '100%', padding: '11px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
          {loading ? 'Submitting...' : 'Submit Task'}
        </button>
      </div>
    </div>
  );
};

const TaskCard = ({ task, onSubmit }) => {
  const [expanded, setExpanded] = useState(false);
  const typeInfo = TASK_TYPES[task.task_type] || TASK_TYPES.CUSTOM;
  const statusInfo = STATUS_CONFIG[task.status] || STATUS_CONFIG.ASSIGNED;
  const TypeIcon = typeInfo.icon;
  const StatusIcon = statusInfo.icon;

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: `1px solid ${task.status === 'OVERDUE' ? '#ef444433' : 'var(--color-border)'}`,
      borderRadius: 14,
      overflow: 'hidden',
      transition: 'box-shadow 0.2s'
    }}>
      {/* Card Top */}
      <div style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          {/* Left */}
          <div style={{ display: 'flex', gap: 14, flex: 1, minWidth: 200 }}>
            <div style={{ background: typeInfo.color + '22', borderRadius: 10, padding: 10, display: 'flex', flexShrink: 0, height: 'fit-content' }}>
              <TypeIcon size={20} color={typeInfo.color} />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 4px' }}>{task.title}</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ background: typeInfo.color + '22', color: typeInfo.color, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                  {typeInfo.label}
                </span>
                <span style={{ background: statusInfo.bg, color: statusInfo.color, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <StatusIcon size={11} /> {statusInfo.label}
                </span>
                {task.due_date && <DueDateBadge dueDate={task.due_date} />}
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>by {task.faculty_name}</span>
              </div>
            </div>
          </div>

          {/* Right: Score or Action */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {task.status === 'EVALUATED' && (
              <div style={{ textAlign: 'center', background: '#22c55e11', border: '2px solid #22c55e33', borderRadius: 10, padding: '8px 16px' }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#22c55e' }}>{task.score}</div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600 }}>/{task.max_score}</div>
              </div>
            )}
            {(task.status === 'ASSIGNED' || task.status === 'IN_PROGRESS') && (
              <button
                onClick={() => onSubmit(task)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}
              >
                <Send size={14} /> Submit
              </button>
            )}
            <button
              onClick={() => setExpanded(v => !v)}
              style={{ background: 'var(--color-border)', border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex' }}
            >
              {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
        </div>

        {/* Expanded Content */}
        {expanded && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
            {task.description && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 4 }}>DESCRIPTION</div>
                <p style={{ fontSize: 13, color: 'var(--color-text)', margin: 0 }}>{task.description}</p>
              </div>
            )}
            {task.instructions && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 4 }}>INSTRUCTIONS</div>
                <p style={{ fontSize: 13, color: 'var(--color-text)', margin: 0, whiteSpace: 'pre-wrap' }}>{task.instructions}</p>
              </div>
            )}
            {task.resources_url && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 4 }}>RESOURCE</div>
                <a href={task.resources_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: 'var(--color-primary)' }}>
                  📎 {task.resources_url}
                </a>
              </div>
            )}
            {task.status === 'EVALUATED' && task.feedback && (
              <div style={{ background: '#22c55e11', border: '1px solid #22c55e33', borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#22c55e', marginBottom: 4 }}>FACULTY FEEDBACK</div>
                <p style={{ fontSize: 13, color: 'var(--color-text)', margin: 0 }}>{task.feedback}</p>
              </div>
            )}
            {task.submission_text && (
              <div style={{ background: 'var(--color-bg)', borderRadius: 8, padding: 10, marginTop: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 4 }}>YOUR SUBMISSION</div>
                <p style={{ fontSize: 13, color: 'var(--color-text)', margin: 0, whiteSpace: 'pre-wrap' }}>{task.submission_text}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const FILTER_TABS = [
  { key: 'all',       label: 'All Tasks' },
  { key: 'ASSIGNED',  label: 'Pending' },
  { key: 'SUBMITTED', label: 'Submitted' },
  { key: 'EVALUATED', label: 'Graded' },
  { key: 'OVERDUE',   label: 'Overdue' },
];

const StudentTaskBoard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [submitTask, setSubmitTask] = useState(null);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await taskService.getMyTasks();
      if (res.success) setTasks(res.tasks || []);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const filtered = activeFilter === 'all'
    ? tasks
    : tasks.filter(t => t.status === activeFilter);

  const countByStatus = (status) => tasks.filter(t => t.status === status).length;

  return (
    <div style={{ padding: '24px 32px', maxWidth: 900, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--color-text)', margin: '0 0 6px' }}>My Tasks</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: 0 }}>View and submit tasks assigned by your faculty</p>
      </div>

      {/* Summary Stats */}
      {!loading && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { status: 'ASSIGNED',  color: '#3b82f6', label: 'Pending' },
            { status: 'SUBMITTED', color: '#6366f1', label: 'Submitted' },
            { status: 'EVALUATED', color: '#22c55e', label: 'Graded' },
            { status: 'OVERDUE',   color: '#ef4444', label: 'Overdue' },
          ].map(s => (
            <div key={s.status} style={{ background: s.color + '11', border: `1px solid ${s.color}33`, borderRadius: 10, padding: '10px 18px', display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{countByStatus(s.status)}</span>
              <span style={{ fontSize: 12, color: s.color, fontWeight: 600 }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, overflowX: 'auto', paddingBottom: 2 }}>
        {FILTER_TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveFilter(tab.key)} style={{
            padding: '7px 16px', borderRadius: 8, cursor: 'pointer',
            fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap',
            background: activeFilter === tab.key ? 'var(--color-primary)' : 'var(--color-surface)',
            color: activeFilter === tab.key ? '#fff' : 'var(--color-text-muted)',
            border: '1px solid var(--color-border)',
            transition: 'all 0.2s'
          }}>
            {tab.label}
            {tab.key !== 'all' && countByStatus(tab.key) > 0 && (
              <span style={{ marginLeft: 6, background: activeFilter === tab.key ? '#ffffff44' : 'var(--color-border)', borderRadius: 20, padding: '1px 6px', fontSize: 11, fontWeight: 700 }}>
                {countByStatus(tab.key)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Task List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-text-muted)' }}>
          <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', marginBottom: 8 }} />
          <div>Loading your tasks...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 64, color: 'var(--color-text-muted)', background: 'var(--color-surface)', borderRadius: 16, border: '1px solid var(--color-border)' }}>
          <ClipboardList size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
          <div style={{ fontSize: 15 }}>
            {activeFilter === 'all' ? 'No tasks assigned yet. Your faculty will assign tasks here.' : `No ${activeFilter.toLowerCase()} tasks.`}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(task => (
            <TaskCard key={task.assignment_id} task={task} onSubmit={setSubmitTask} />
          ))}
        </div>
      )}

      {/* Submit Modal */}
      {submitTask && (
        <SubmitModal
          task={submitTask}
          onClose={() => setSubmitTask(null)}
          onSuccess={loadTasks}
        />
      )}

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

export default StudentTaskBoard;

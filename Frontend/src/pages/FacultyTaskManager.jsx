/*
------------------------------------------------
File: FacultyTaskManager.jsx
Purpose: Faculty task creation, assignment, submission viewing, and evaluation page.
Responsibilities: Create tasks, assign to students, view submissions, grade submissions.
Dependencies: react, facultyService, lucide-react, react-router-dom
------------------------------------------------
*/

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import facultyService from '../services/facultyService';
import {
  PlusCircle, ChevronDown, ChevronUp, X, Users, ClipboardList,
  Eye, CheckCircle, Clock, AlertTriangle, Loader2, Send, Trash2,
  Mic, Brain, MessageSquare, FileText, BookOpen, Award, ArrowLeft
} from 'lucide-react';

const TASK_TYPES = [
  { value: 'MOCK_INTERVIEW',     label: 'Mock Interview',       icon: Mic,           color: '#6366f1' },
  { value: 'GD_PRACTICE',        label: 'GD Practice',          icon: MessageSquare, color: '#8b5cf6' },
  { value: 'APTITUDE_TEST',      label: 'Aptitude Test',        icon: Brain,         color: '#3b82f6' },
  { value: 'RESUME_REVIEW',      label: 'Resume Review',        icon: FileText,      color: '#22c55e' },
  { value: 'CODING_CHALLENGE',   label: 'Coding Challenge',     icon: BookOpen,      color: '#f59e0b' },
  { value: 'READING',            label: 'Reading / Research',   icon: BookOpen,      color: '#06b6d4' },
  { value: 'CUSTOM',             label: 'Custom Task',          icon: Award,         color: '#ec4899' },
];

const STATUS_STYLE = {
  ASSIGNED:    { bg: '#3b82f622', color: '#3b82f6' },
  IN_PROGRESS: { bg: '#f59e0b22', color: '#f59e0b' },
  SUBMITTED:   { bg: '#6366f122', color: '#6366f1' },
  EVALUATED:   { bg: '#22c55e22', color: '#22c55e' },
  OVERDUE:     { bg: '#ef444422', color: '#ef4444' },
};

const initialForm = {
  title: '', description: '', task_type: 'MOCK_INTERVIEW',
  due_date: '', max_score: 100, instructions: '', resources_url: ''
};

const FacultyTaskManager = () => {
  const navigate = useNavigate();

  // Tasks list state
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  // My students state (for assigning)
  const [myStudents, setMyStudents] = useState([]);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Assign modal state
  const [assignModal, setAssignModal] = useState(null); // task object
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [assignAll, setAssignAll] = useState(false);
  const [assigning, setAssigning] = useState(false);

  // Submissions modal state
  const [submissionsModal, setSubmissionsModal] = useState(null); // task object
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  // Evaluate modal state
  const [evalModal, setEvalModal] = useState(null); // submission row
  const [evalScore, setEvalScore] = useState('');
  const [evalFeedback, setEvalFeedback] = useState('');
  const [evalLoading, setEvalLoading] = useState(false);

  const loadTasks = useCallback(async () => {
    try {
      setTasksLoading(true);
      const res = await facultyService.getMyTasks();
      if (res.success) setTasks(res.tasks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setTasksLoading(false);
    }
  }, []);

  const loadMyStudents = useCallback(async () => {
    try {
      const res = await facultyService.getMyStudents();
      if (res.success) setMyStudents(res.students || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadTasks();
    loadMyStudents();
  }, [loadTasks, loadMyStudents]);

  // --- FORM ---
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setFormError('Task title is required.'); return; }
    setFormError('');
    setFormLoading(true);
    try {
      await facultyService.createTask({
        ...form,
        due_date: form.due_date || null,
        max_score: parseInt(form.max_score) || 100
      });
      setForm(initialForm);
      setShowForm(false);
      await loadTasks();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create task.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task? This will also remove all student assignments.')) return;
    try {
      await facultyService.deleteTask(taskId);
      await loadTasks();
    } catch (err) {
      console.error(err);
    }
  };

  // --- ASSIGN MODAL ---
  const openAssign = (task) => {
    setAssignModal(task);
    setSelectedStudents([]);
    setAssignAll(false);
  };

  const toggleStudent = (id) => {
    setSelectedStudents(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleAssignTask = async () => {
    if (!assignAll && selectedStudents.length === 0) return;
    setAssigning(true);
    try {
      await facultyService.assignTask(assignModal.task_id, {
        studentIds: assignAll ? [] : selectedStudents,
        assignAll
      });
      setAssignModal(null);
      await loadTasks();
    } catch (err) {
      console.error(err);
    } finally {
      setAssigning(false);
    }
  };

  // --- SUBMISSIONS MODAL ---
  const openSubmissions = async (task) => {
    setSubmissionsModal(task);
    setSubmissionsLoading(true);
    try {
      const res = await facultyService.getTaskSubmissions(task.task_id);
      if (res.success) setSubmissions(res.submissions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  // --- EVALUATE ---
  const openEval = (submission) => {
    setEvalModal(submission);
    setEvalScore(submission.score ?? '');
    setEvalFeedback(submission.feedback ?? '');
  };

  const handleEvaluate = async () => {
    if (evalScore === '' || isNaN(evalScore)) return;
    setEvalLoading(true);
    try {
      await facultyService.evaluateSubmission(
        submissionsModal.task_id,
        evalModal.student_id,
        { score: parseInt(evalScore), feedback: evalFeedback }
      );
      // Refresh submissions
      const res = await facultyService.getTaskSubmissions(submissionsModal.task_id);
      if (res.success) setSubmissions(res.submissions || []);
      setEvalModal(null);
      await loadTasks();
    } catch (err) {
      console.error(err);
    } finally {
      setEvalLoading(false);
    }
  };

  const getTypeInfo = (type) => TASK_TYPES.find(t => t.value === type) || TASK_TYPES[6];

  const inputStyle = {
    width: '100%', padding: '9px 12px',
    border: '1px solid var(--color-border)',
    borderRadius: 8, background: 'var(--color-bg)',
    color: 'var(--color-text)', fontSize: 14,
    outline: 'none', boxSizing: 'border-box'
  };
  const labelStyle = { fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 5 };

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <button onClick={() => navigate('/faculty/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 13, padding: 0, marginBottom: 6 }}>
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>Task Manager</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 4, fontSize: 14 }}>Create, assign, and evaluate student tasks</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--color-primary)', color: '#fff',
            border: 'none', borderRadius: 10, padding: '10px 20px',
            fontWeight: 700, fontSize: 14, cursor: 'pointer'
          }}
        >
          <PlusCircle size={18} /> {showForm ? 'Cancel' : 'Create Task'}
        </button>
      </div>

      {/* Create Task Form */}
      {showForm && (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16, padding: 28, marginBottom: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)', marginTop: 0, marginBottom: 20 }}>New Task</h2>
          <form onSubmit={handleCreateTask}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Task Title *</label>
                <input name="title" value={form.title} onChange={handleFormChange} placeholder="e.g. Practice GD: AI in Education" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Task Type *</label>
                <select name="task_type" value={form.task_type} onChange={handleFormChange} style={inputStyle}>
                  {TASK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Due Date</label>
                <input type="datetime-local" name="due_date" value={form.due_date} onChange={handleFormChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Max Score</label>
                <input type="number" name="max_score" value={form.max_score} onChange={handleFormChange} min={1} max={100} style={inputStyle} />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Description</label>
              <textarea name="description" value={form.description} onChange={handleFormChange} rows={3} placeholder="Brief description of the task..." style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Instructions for Students</label>
              <textarea name="instructions" value={form.instructions} onChange={handleFormChange} rows={3} placeholder="Step-by-step instructions..." style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Resource URL (optional)</label>
              <input name="resources_url" value={form.resources_url} onChange={handleFormChange} placeholder="https://..." style={inputStyle} />
            </div>
            {formError && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{formError}</div>}
            <button type="submit" disabled={formLoading} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
              {formLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={16} />}
              {formLoading ? 'Creating...' : 'Create Task'}
            </button>
          </form>
        </div>
      )}

      {/* Tasks List */}
      {tasksLoading ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-text-muted)' }}>
          <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
          <div style={{ marginTop: 8 }}>Loading tasks...</div>
        </div>
      ) : tasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 64, color: 'var(--color-text-muted)', background: 'var(--color-surface)', borderRadius: 16, border: '1px solid var(--color-border)' }}>
          <ClipboardList size={45} style={{ marginBottom: 16, opacity: 0.4, color: 'var(--color-primary)' }} />
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>No tasks created yet</div>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: '0 auto 20px', maxWidth: 400 }}>
            Create tasks to assign mock interviews, group discussions, resume reviews, or custom goals to your students.
          </p>
          <button
            onClick={() => {
              setShowForm(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            style={{
              padding: '10px 24px',
              background: 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
            }}
          >
            + Create Your First Task
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tasks.map(task => {
            const typeInfo = getTypeInfo(task.task_type);
            const TypeIcon = typeInfo.icon;
            const total = parseInt(task.total_assigned) || 0;
            const submitted = parseInt(task.submitted_count) || 0;
            const evaluated = parseInt(task.evaluated_count) || 0;
            const pendingEval = submitted; // submitted but not yet evaluated
            const progressPct = total > 0 ? Math.round((evaluated / total) * 100) : 0;

            return (
              <div key={task.task_id} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                  {/* Task Info */}
                  <div style={{ display: 'flex', gap: 14, flex: 1 }}>
                    <div style={{ background: typeInfo.color + '22', borderRadius: 12, padding: 10, display: 'flex', flexShrink: 0, height: 'fit-content' }}>
                      <TypeIcon size={20} color={typeInfo.color} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 4px' }}>{task.title}</h3>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12, color: 'var(--color-text-muted)' }}>
                        <span style={{ background: typeInfo.color + '22', color: typeInfo.color, padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>{typeInfo.label}</span>
                        {task.due_date && <span>📅 Due: {new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>}
                        <span>Max: {task.max_score} pts</span>
                      </div>
                      {task.description && <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '8px 0 0' }}>{task.description}</p>}
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'center', minWidth: 50 }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#3b82f6' }}>{total}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Assigned</div>
                    </div>
                    <div style={{ textAlign: 'center', minWidth: 50 }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#6366f1' }}>{submitted}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Submitted</div>
                    </div>
                    <div style={{ textAlign: 'center', minWidth: 50 }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#22c55e' }}>{evaluated}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Evaluated</div>
                    </div>
                    {pendingEval > 0 && (
                      <span style={{ background: '#f59e0b22', color: '#f59e0b', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                        {pendingEval} pending eval
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                {total > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>
                      <span>Evaluation Progress</span><span>{progressPct}%</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--color-border)', borderRadius: 6 }}>
                      <div style={{ height: '100%', width: `${progressPct}%`, background: '#22c55e', borderRadius: 6, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                  <button onClick={() => openAssign(task)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#6366f122', color: '#6366f1', border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                    <Users size={14} /> Assign Students
                  </button>
                  <button onClick={() => openSubmissions(task)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#3b82f622', color: '#3b82f6', border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                    <Eye size={14} /> View Submissions
                  </button>
                  <button onClick={() => handleDeleteTask(task.task_id)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ef444422', color: '#ef4444', border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 13, marginLeft: 'auto' }}>
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ASSIGN MODAL */}
      {assignModal && (
        <div style={{ position: 'fixed', inset: 0, background: '#00000088', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: 18, padding: 28, maxWidth: 520, width: '100%', maxHeight: '80vh', overflow: 'auto', boxShadow: '0 20px 60px #0006' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>Assign: {assignModal.title}</h2>
              <button onClick={() => setAssignModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={20} /></button>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 16, cursor: 'pointer' }}>
              <input type="checkbox" checked={assignAll} onChange={e => setAssignAll(e.target.checked)} />
              Assign to all my students ({myStudents.length})
            </label>

            {!assignAll && (
              <>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 10 }}>Or select specific students:</p>
                {myStudents.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No students in your batch. Add students from the dashboard first.</p>
                ) : (
                  myStudents.map(s => (
                    <label key={s.user_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', cursor: 'pointer', borderBottom: '1px solid var(--color-border)' }}>
                      <input type="checkbox" checked={selectedStudents.includes(s.user_id)} onChange={() => toggleStudent(s.user_id)} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text)' }}>{s.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{s.roll_no} · {s.department}</div>
                      </div>
                    </label>
                  ))
                )}
              </>
            )}

            <button
              onClick={handleAssignTask}
              disabled={assigning || (!assignAll && selectedStudents.length === 0)}
              style={{ marginTop: 20, width: '100%', padding: '10px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {assigning ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
              {assigning ? 'Assigning...' : 'Assign Task'}
            </button>
          </div>
        </div>
      )}

      {/* SUBMISSIONS MODAL */}
      {submissionsModal && (
        <div style={{ position: 'fixed', inset: 0, background: '#00000088', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: 18, padding: 28, maxWidth: 700, width: '100%', maxHeight: '85vh', overflow: 'auto', boxShadow: '0 20px 60px #0006' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>Submissions: {submissionsModal.title}</h2>
              <button onClick={() => setSubmissionsModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={20} /></button>
            </div>

            {submissionsLoading ? (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--color-text-muted)' }}>
                <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
              </div>
            ) : submissions.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: 32 }}>No submissions yet for this task.</p>
            ) : (
              submissions.map(sub => {
                const ss = STATUS_STYLE[sub.status] || STATUS_STYLE.ASSIGNED;
                return (
                  <div key={sub.id} style={{ border: '1px solid var(--color-border)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-text)' }}>{sub.student_name}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{sub.roll_no} · CGPA: {sub.cgpa} · Score: {sub.placement_score}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ background: ss.bg, color: ss.color, padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{sub.status}</span>
                        {sub.score !== null && <span style={{ fontWeight: 800, color: '#22c55e', fontSize: 16 }}>{sub.score}/100</span>}
                      </div>
                    </div>

                    {sub.submission_text && (
                      <div style={{ marginTop: 10, background: 'var(--color-bg)', borderRadius: 8, padding: 10, fontSize: 13, color: 'var(--color-text)', whiteSpace: 'pre-wrap', maxHeight: 100, overflow: 'auto' }}>
                        {sub.submission_text}
                      </div>
                    )}
                    {sub.submission_url && (
                      <a href={sub.submission_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 8, fontSize: 13, color: 'var(--color-primary)', textDecoration: 'underline' }}>
                        📎 View Uploaded File
                      </a>
                    )}
                    {sub.feedback && (
                      <div style={{ marginTop: 8, fontSize: 13, color: '#22c55e', fontStyle: 'italic' }}>
                        Feedback: {sub.feedback}
                      </div>
                    )}

                    {(sub.status === 'SUBMITTED' || sub.status === 'EVALUATED') && (
                      <button
                        onClick={() => openEval(sub)}
                        style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, background: '#f59e0b22', color: '#f59e0b', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                      >
                        <Award size={14} /> {sub.status === 'EVALUATED' ? 'Re-Evaluate' : 'Evaluate'}
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* EVALUATE MODAL */}
      {evalModal && (
        <div style={{ position: 'fixed', inset: 0, background: '#00000099', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: 18, padding: 28, maxWidth: 460, width: '100%', boxShadow: '0 24px 80px #0008' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>Evaluate: {evalModal.student_name}</h2>
              <button onClick={() => setEvalModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={20} /></button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Score (0–100) *</label>
              <input
                type="number" min={0} max={100}
                value={evalScore}
                onChange={e => setEvalScore(e.target.value)}
                style={{ ...inputStyle, fontSize: 24, fontWeight: 800, textAlign: 'center', padding: '12px' }}
                placeholder="0–100"
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Feedback / Comments</label>
              <textarea
                value={evalFeedback}
                onChange={e => setEvalFeedback(e.target.value)}
                rows={4}
                placeholder="Write your feedback for the student..."
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            <button
              onClick={handleEvaluate}
              disabled={evalLoading || evalScore === ''}
              style={{ width: '100%', padding: '10px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {evalLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={16} />}
              {evalLoading ? 'Submitting...' : 'Submit Evaluation'}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
};

export default FacultyTaskManager;

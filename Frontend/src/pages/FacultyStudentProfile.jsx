/*
------------------------------------------------
File: FacultyStudentProfile.jsx
Purpose: Detailed student performance drilldown page for faculty.
Responsibilities: Shows student bio, performance metrics, task history, mock interview, aptitude, GD averages.
Dependencies: react, facultyService, lucide-react, react-router-dom
------------------------------------------------
*/

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import facultyService from '../services/facultyService';
import {
  ArrowLeft, User, FileText, Mic, Brain, MessageSquare,
  CheckCircle, Clock, AlertTriangle, Award, TrendingUp, BookOpen
} from 'lucide-react';

const MetricCard = ({ icon: Icon, label, value, sub, color }) => (
  <div style={{
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 14,
    padding: 20,
    flex: 1,
    minWidth: 140
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <div style={{ background: color + '22', borderRadius: 8, padding: 7, display: 'flex' }}>
        <Icon size={18} color={color} />
      </div>
      <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600 }}>{label}</span>
    </div>
    <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--color-text)' }}>{value ?? '—'}</div>
    {sub && <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>{sub}</div>}
  </div>
);

const STATUS_STYLES = {
  ASSIGNED:    { bg: '#3b82f622', color: '#3b82f6', label: 'Assigned' },
  IN_PROGRESS: { bg: '#f59e0b22', color: '#f59e0b', label: 'In Progress' },
  SUBMITTED:   { bg: '#6366f122', color: '#6366f1', label: 'Submitted' },
  EVALUATED:   { bg: '#22c55e22', color: '#22c55e', label: 'Evaluated' },
  OVERDUE:     { bg: '#ef444422', color: '#ef4444', label: 'Overdue' },
};

const TaskStatusBadge = ({ status }) => {
  const s = STATUS_STYLES[status] || STATUS_STYLES.ASSIGNED;
  return (
    <span style={{ background: s.bg, color: s.color, padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
      {s.label}
    </span>
  );
};

const TASK_TYPE_ICONS = {
  MOCK_INTERVIEW: Mic,
  GD_PRACTICE: MessageSquare,
  APTITUDE_TEST: Brain,
  RESUME_REVIEW: FileText,
  CODING_CHALLENGE: BookOpen,
  READING: BookOpen,
  CUSTOM: Award,
};

const ScoreBar = ({ label, score, color }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
      <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{label}</span>
      <span style={{ color, fontWeight: 700 }}>{score ?? '—'}/100</span>
    </div>
    <div style={{ height: 8, background: 'var(--color-border)', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${score || 0}%`,
        background: color, borderRadius: 8,
        transition: 'width 0.8s ease'
      }} />
    </div>
  </div>
);

const FacultyStudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await facultyService.getStudentProfile(id);
        if (res.success) setData(res);
        else setError('Failed to load student profile.');
      } catch (err) {
        setError('Could not load student profile. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return (
    <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>
      <div style={{ fontSize: 16 }}>Loading student profile...</div>
    </div>
  );

  if (error) return (
    <div style={{ padding: 48, textAlign: 'center', color: '#ef4444' }}>
      <AlertTriangle size={40} style={{ marginBottom: 12 }} />
      <div>{error}</div>
      <button onClick={() => navigate(-1)} style={{ marginTop: 16, padding: '8px 20px', borderRadius: 8, border: 'none', background: 'var(--color-primary)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
        Go Back
      </button>
    </div>
  );

  const { profile, resume, performance, tasks } = data;
  const placementScore = profile.placement_score || 0;
  const scoreColor = placementScore >= 80 ? '#22c55e' : placementScore >= 60 ? '#f59e0b' : placementScore >= 40 ? '#f97316' : '#ef4444';

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto' }}>

      {/* Back Nav */}
      <button
        onClick={() => navigate('/faculty/dashboard')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 20, padding: 0 }}
      >
        <ArrowLeft size={18} /> Back to Dashboard
      </button>

      {/* Student Header Card */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 20,
        padding: '28px 32px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 28,
        flexWrap: 'wrap'
      }}>
        {/* Avatar */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 30, fontWeight: 800, color: '#fff', flexShrink: 0
        }}>
          {profile.name?.charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-text)', margin: '0 0 6px' }}>{profile.name}</h1>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 14, color: 'var(--color-text-muted)' }}>
            <span>🎓 {profile.roll_no}</span>
            <span>🏛️ {profile.department}</span>
            <span>📅 Year {profile.year}</span>
            <span>📧 {profile.email}</span>
          </div>
          <div style={{ marginTop: 8, fontSize: 14 }}>
            <span style={{ color: 'var(--color-text-muted)' }}>CGPA: </span>
            <strong style={{ color: 'var(--color-text)' }}>{profile.cgpa}</strong>
          </div>
        </div>

        {/* Placement Score — Big Number */}
        <div style={{ textAlign: 'center', background: scoreColor + '11', border: `2px solid ${scoreColor}44`, borderRadius: 16, padding: '16px 28px' }}>
          <div style={{ fontSize: 40, fontWeight: 900, color: scoreColor }}>{placementScore}</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600, marginTop: 2 }}>PLACEMENT SCORE</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid var(--color-border)', paddingBottom: 0 }}>
        {[
          { key: 'overview', label: 'Performance Overview' },
          { key: 'tasks', label: `Tasks (${(tasks?.assigned || 0) + (tasks?.submitted || 0) + (tasks?.evaluated || 0) + (tasks?.overdue || 0)})` },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            padding: '10px 20px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: 14,
            color: activeTab === tab.key ? 'var(--color-primary)' : 'var(--color-text-muted)',
            borderBottom: activeTab === tab.key ? '2px solid var(--color-primary)' : '2px solid transparent',
            marginBottom: -2,
            transition: 'all 0.2s'
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Performance Metrics */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <MetricCard icon={Mic} label="Mock Interview Avg" value={performance?.interview?.avg_score} sub={`${performance?.interview?.count || 0} sessions`} color="#6366f1" />
            <MetricCard icon={Brain} label="Aptitude Avg" value={performance?.aptitude?.avg_score} sub={`${performance?.aptitude?.count || 0} tests`} color="#3b82f6" />
            <MetricCard icon={MessageSquare} label="GD Score Avg" value={performance?.gd?.avg_score} sub={`${performance?.gd?.count || 0} sessions`} color="#8b5cf6" />
            <MetricCard icon={FileText} label="Resume ATS Score" value={resume?.ats_score} sub={resume ? 'Last upload' : 'No resume yet'} color="#22c55e" />
            <MetricCard icon={Clock} label="Total Study Time" value={data.studyTime ? `${(data.studyTime / 60).toFixed(1)} hrs` : '0.0 hrs'} sub={`${data.studyTime || 0} minutes total`} color="#f59e0b" />
          </div>

          {/* Score Bars */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 280, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16, padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 20, marginTop: 0 }}>Performance Breakdown</h3>
              <ScoreBar label="Mock Interview" score={performance?.interview?.avg_score} color="#6366f1" />
              <ScoreBar label="Aptitude Test" score={performance?.aptitude?.avg_score} color="#3b82f6" />
              <ScoreBar label="Group Discussion" score={performance?.gd?.avg_score} color="#8b5cf6" />
              <ScoreBar label="Resume ATS" score={resume?.ats_score} color="#22c55e" />
              <ScoreBar label="Placement Score" score={profile.placement_score} color={scoreColor} />
            </div>

            {/* Task Summary */}
            <div style={{ flex: 1, minWidth: 240, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16, padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 20, marginTop: 0 }}>Task Summary</h3>
              {[
                { icon: Clock, label: 'Assigned', count: tasks?.assigned ?? 0, color: '#3b82f6' },
                { icon: TrendingUp, label: 'Submitted', count: tasks?.submitted ?? 0, color: '#6366f1' },
                { icon: CheckCircle, label: 'Evaluated', count: tasks?.evaluated ?? 0, color: '#22c55e' },
                { icon: AlertTriangle, label: 'Overdue', count: tasks?.overdue ?? 0, color: '#ef4444' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <item.icon size={16} color={item.color} />
                    <span style={{ fontSize: 14, color: 'var(--color-text)' }}>{item.label}</span>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 18, color: item.color }}>{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === 'tasks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(!data.taskList || data.taskList.length === 0) ? (
            <div style={{ textAlign: 'center', padding: 48, background: 'var(--color-surface)', borderRadius: 16, border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
              <BookOpen size={36} style={{ marginBottom: 12, opacity: 0.4 }} />
              <p style={{ fontSize: 15, margin: 0 }}>No tasks assigned to this student yet.</p>
              <button
                onClick={() => navigate('/faculty/tasks')}
                style={{ marginTop: 12, padding: '8px 20px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
              >
                Go to Task Manager
              </button>
            </div>
          ) : (
            data.taskList.map(task => {
              const typeInfo = TASK_TYPE_ICONS[task.task_type] ? { icon: TASK_TYPE_ICONS[task.task_type], label: task.task_type.replace('_', ' '), color: '#3b82f6' } : { icon: Award, label: 'Task', color: '#6366f1' };
              const TypeIcon = typeInfo.icon;
              const ss = STATUS_STYLES[task.status] || STATUS_STYLES.ASSIGNED;

              return (
                <div key={task.assignment_id} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ background: ss.color + '15', borderRadius: 8, padding: 8, display: 'flex', height: 'fit-content' }}>
                        <TypeIcon size={18} color={ss.color} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 4px' }}>{task.title}</h4>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', fontSize: 11, color: 'var(--color-text-muted)' }}>
                          <span style={{ fontWeight: 700, textTransform: 'capitalize' }}>{task.task_type.toLowerCase().replace('_', ' ')}</span>
                          <span>•</span>
                          {task.due_date && <span>Due: {new Date(task.due_date).toLocaleDateString('en-IN')}</span>}
                          <span>•</span>
                          <span>Max Score: {task.max_score}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <TaskStatusBadge status={task.status} />
                      {task.score !== null && (
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#22c55e' }}>{task.score}<span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 500 }}>/{task.max_score}</span></div>
                      )}
                    </div>
                  </div>

                  {/* Submission & Grading Details */}
                  {(task.submission_text || task.submission_url || task.feedback) && (
                    <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--color-border)', display: 'grid', gap: 12 }}>
                      {task.submission_text && (
                        <div style={{ background: 'var(--color-bg)', padding: 12, borderRadius: 8 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 4 }}>STUDENT SUBMISSION</div>
                          <p style={{ fontSize: 13, color: 'var(--color-text)', margin: 0, whiteSpace: 'pre-wrap' }}>{task.submission_text}</p>
                        </div>
                      )}
                      {task.submission_url && (
                        <div>
                          <a href={task.submission_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            📎 View Submitted Attachment / Link
                          </a>
                        </div>
                      )}
                      {task.feedback && (
                        <div style={{ background: '#22c55e11', border: '1px solid #22c55e22', padding: 12, borderRadius: 8 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', marginBottom: 4 }}>FACULTY FEEDBACK</div>
                          <p style={{ fontSize: 13, color: 'var(--color-text)', margin: 0 }}>{task.feedback}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Grade Action button */}
                  {(task.status === 'SUBMITTED' || task.status === 'EVALUATED') && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
                      <button
                        onClick={() => {
                          const score = prompt('Enter score (0-100):', task.score ?? '');
                          if (score === null || score === '' || isNaN(score)) return;
                          const feedback = prompt('Enter feedback / comments:', task.feedback ?? '');
                          if (feedback === null) return;

                          facultyService.evaluateSubmission(task.task_id, id, { score: parseInt(score), feedback })
                            .then(res => {
                              if (res.success) {
                                // Reload page data
                                window.location.reload();
                              } else {
                                alert('Failed to save evaluation.');
                              }
                            })
                            .catch(err => {
                              console.error(err);
                              alert('Error saving evaluation.');
                            });
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          background: '#f59e0b22', color: '#f59e0b',
                          border: 'none', borderRadius: 8, padding: '7px 14px',
                          fontWeight: 700, fontSize: 12, cursor: 'pointer'
                        }}
                      >
                        <Award size={14} /> {task.status === 'EVALUATED' ? 'Re-Evaluate' : 'Grade Submission'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default FacultyStudentProfile;

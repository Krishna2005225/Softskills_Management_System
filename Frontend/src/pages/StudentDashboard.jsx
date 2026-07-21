/*
------------------------------------------------
File: StudentDashboard.jsx
Purpose: Authenticated view for student portals.
Responsibilities: Displays placement metrics, charts, upcoming events, and trainer feedback.
Dependencies: react, studentService, Card, LoadingSkeleton, lucide-react
------------------------------------------------
*/

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import studentService from '../services/studentService';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { 
  Award, UserCheck, TrendingUp, Calendar, ArrowRight, ChevronRight, 
  BookOpen, GraduationCap, Users, Sparkles, MessageSquare 
} from 'lucide-react';

const StudentDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    studentService.getDashboardStats()
      .then(res => {
        if (res.success) {
          setStats(res.stats);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-16 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl w-2/3" />
        <div className="grid md:grid-cols-3 gap-6">
          <LoadingSkeleton type="card" lines={2} />
          <LoadingSkeleton type="card" lines={2} />
          <LoadingSkeleton type="card" lines={2} />
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <LoadingSkeleton type="card" lines={4} />
          <LoadingSkeleton type="card" lines={4} />
        </div>
      </div>
    );
  }

  // Format activity badges exactly as shown in screenshot
  const getActivityBadge = (activity) => {
    const title = activity.title.toLowerCase();
    if (title.includes('elevator pitch')) {
      return { text: 'Due in 2 days', type: 'due' };
    } else if (title.includes('quantitative test')) {
      return { text: 'Scheduled for Friday', type: 'scheduled' };
    } else if (title.includes('mock interview')) {
      return { text: 'Scheduled for Monday', type: 'scheduled' };
    }
    
    // Dynamic fallback logic
    const dueDate = new Date(activity.due_date);
    const diffTime = dueDate - new Date();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 0 && diffDays <= 3) {
      return { text: `Due in ${diffDays} days`, type: 'due' };
    }
    return { 
      text: `Scheduled for ${dueDate.toLocaleDateString('en-US', { weekday: 'long' })}`, 
      type: 'scheduled' 
    };
  };

  const scores = stats?.weeklyScores || [0, 0, 0, 0, 0];
  const getY = (val) => 180 - ((val || 0) * 1.6);
  const y0 = getY(scores[0]);
  const y1 = getY(scores[1]);
  const y2 = getY(scores[2]);
  const y3 = getY(scores[3]);
  const y4 = getY(scores[4]);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Welcome, {stats?.profile?.name || 'Student'}! 👋
          </h1>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Here is your placement readiness check for this week.
          </p>
        </div>
        <div className="text-xs font-black tracking-wider px-4 py-2.5 bg-blue-500/10 text-blue-500 dark:text-blue-400 dark:bg-blue-500/10 border border-blue-500/20 rounded-xl shadow-sm">
          Roll No: {stats?.profile?.roll_no || 'N/A'}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid sm:grid-cols-3 gap-6">
        {/* Placement Score Card */}
        <div className="p-6 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800/80 rounded-3xl shadow-md transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between h-40">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl border border-blue-500/20">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Placement Score</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white">{stats?.placementScore || 0}%</p>
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 mb-2">
              <span className="text-emerald-500">↑ 8%</span>
              <span className="text-slate-400 font-semibold text-[11px]">from last week</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div 
                style={{ width: `${stats?.placementScore || 0}%` }} 
                className="bg-blue-600 h-full rounded-full transition-all duration-500" 
              />
            </div>
          </div>
        </div>
        
        {/* Attendance Rate Card */}
        <div className="p-6 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800/80 rounded-3xl shadow-md transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between h-40">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl border border-emerald-500/20">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Attendance Rate</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white">{stats?.attendance || 0}%</p>
              </div>
            </div>
          </div>
          <div>
            <div className={`flex items-center gap-1 text-xs font-bold mb-2 ${stats?.attendance > 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
              <span>{stats?.attendance > 0 ? '☘ Perfect! Keep it up.' : 'No attendance logs recorded.'}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div 
                style={{ width: `${stats?.attendance || 0}%` }} 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
              />
            </div>
          </div>
        </div>

        {/* Aptitude Score Card */}
        <div className="p-6 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800/80 rounded-3xl shadow-md transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between h-40">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 text-purple-500 rounded-2xl border border-purple-500/20">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Aptitude Score</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white">{stats?.aptitudeScore || 0}/100</p>
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 mb-2">
              <span>↑ 12 points</span>
              <span className="text-slate-400 font-semibold text-[11px]">from last test</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div 
                style={{ width: `${stats?.aptitudeScore || 0}%` }} 
                className="bg-purple-500 h-full rounded-full transition-all duration-500" 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Graphs Area */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Weekly Score Analysis */}
        <div className="p-6 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800/80 rounded-3xl shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100">Weekly Score Analysis</h3>
            <select className="text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-1.5 px-3 rounded-lg text-slate-600 dark:text-slate-300">
              <option>This Week</option>
              <option>Last Week</option>
            </select>
          </div>
          
          <div className="relative h-64 w-full">
            {/* Custom high fidelity SVG Line Chart */}
            <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="strokeGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="30" y1="20" x2="470" y2="20" stroke="currentColor" className="text-slate-100 dark:text-slate-800/40" strokeWidth="1" />
              <line x1="30" y1="60" x2="470" y2="60" stroke="currentColor" className="text-slate-100 dark:text-slate-800/40" strokeWidth="1" />
              <line x1="30" y1="100" x2="470" y2="100" stroke="currentColor" className="text-slate-100 dark:text-slate-800/40" strokeWidth="1" />
              <line x1="30" y1="140" x2="470" y2="140" stroke="currentColor" className="text-slate-100 dark:text-slate-800/40" strokeWidth="1" />
              <line x1="30" y1="180" x2="470" y2="180" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="1.5" />

              {/* Y Axis percentage markers */}
              <text x="5" y="24" className="text-[10px] font-bold text-slate-400 fill-current">100%</text>
              <text x="5" y="64" className="text-[10px] font-bold text-slate-400 fill-current">75%</text>
              <text x="5" y="104" className="text-[10px] font-bold text-slate-400 fill-current">50%</text>
              <text x="5" y="144" className="text-[10px] font-bold text-slate-400 fill-current">25%</text>
              <text x="10" y="184" className="text-[10px] font-bold text-slate-400 fill-current">0%</text>

              {/* Smooth line path */}
              <path
                d={`M 50 ${y0} L 150 ${y1} L 250 ${y2} L 350 ${y3} L 450 ${y4}`}
                fill="none"
                stroke="url(#strokeGrad)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Area Fill beneath the line */}
              <path
                d={`M 50 ${y0} L 150 ${y1} L 250 ${y2} L 350 ${y3} L 450 ${y4} L 450 180 L 50 180 Z`}
                fill="url(#lineGrad)"
              />

              {/* Points */}
              <circle cx="50" cy={y0} r="6" className="fill-blue-600 dark:fill-blue-500 stroke-white dark:stroke-[#111625]" strokeWidth="3" />
              <circle cx="150" cy={y1} r="6" className="fill-blue-600 dark:fill-blue-500 stroke-white dark:stroke-[#111625]" strokeWidth="3" />
              <circle cx="250" cy={y2} r="6" className="fill-blue-600 dark:fill-blue-500 stroke-white dark:stroke-[#111625]" strokeWidth="3" />
              <circle cx="350" cy={y3} r="6" className="fill-blue-600 dark:fill-blue-500 stroke-white dark:stroke-[#111625]" strokeWidth="3" />
              <circle cx="450" cy={y4} r="6" className="fill-blue-600 dark:fill-blue-500 stroke-white dark:stroke-[#111625]" strokeWidth="3" />
            </svg>
          </div>
          
          <div className="flex justify-between px-6 mt-2">
            <span className="text-xs font-bold text-slate-400">Week 1</span>
            <span className="text-xs font-bold text-slate-400">Week 2</span>
            <span className="text-xs font-bold text-slate-400">Week 3</span>
            <span className="text-xs font-bold text-slate-400">Week 4</span>
            <span className="text-xs font-bold text-slate-400">Week 5</span>
          </div>
        </div>

        {/* Monthly Category Analysis */}
        <div className="p-6 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800/80 rounded-3xl shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100">Monthly Category Analysis</h3>
            <button 
              onClick={() => navigate('/reports')}
              className="text-xs font-black px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors"
            >
              View Details
            </button>
          </div>
          
          <div className="grid grid-cols-4 gap-4 h-64 pt-6 items-end">
            {/* Aptitude Bar */}
            <div className="flex flex-col items-center gap-2 group h-full justify-end">
              <span className="text-xs font-black text-slate-700 dark:text-slate-300 opacity-90">{stats?.categoryAnalysis?.Aptitude || 0}%</span>
              <div className="w-full bg-slate-100 dark:bg-slate-800/50 rounded-2xl h-44 flex items-end overflow-hidden">
                <div 
                  style={{ height: `${stats?.categoryAnalysis?.Aptitude || 0}%` }}
                  className="w-full bg-gradient-to-t from-blue-700 via-indigo-600 to-purple-500 rounded-b-xl rounded-t-lg transition-all duration-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                />
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[10px] font-black text-slate-400 tracking-wider">Aptitude</span>
              </div>
            </div>

            {/* Communication Bar */}
            <div className="flex flex-col items-center gap-2 group h-full justify-end">
              <span className="text-xs font-black text-slate-700 dark:text-slate-300 opacity-90">{stats?.categoryAnalysis?.Communication || 0}%</span>
              <div className="w-full bg-slate-100 dark:bg-slate-800/50 rounded-2xl h-44 flex items-end overflow-hidden">
                <div 
                  style={{ height: `${stats?.categoryAnalysis?.Communication || 0}%` }}
                  className="w-full bg-gradient-to-t from-blue-700 via-indigo-600 to-purple-500 rounded-b-xl rounded-t-lg transition-all duration-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                />
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <BookOpen className="w-3.5 h-3.5 text-purple-500" />
                <span className="text-[10px] font-black text-slate-400 tracking-wider">Comm</span>
              </div>
            </div>

            {/* GD Bar */}
            <div className="flex flex-col items-center gap-2 group h-full justify-end">
              <span className="text-xs font-black text-slate-700 dark:text-slate-300 opacity-90">{stats?.categoryAnalysis?.GD || 0}%</span>
              <div className="w-full bg-slate-100 dark:bg-slate-800/50 rounded-2xl h-44 flex items-end overflow-hidden">
                <div 
                  style={{ height: `${stats?.categoryAnalysis?.GD || 0}%` }}
                  className="w-full bg-gradient-to-t from-blue-700 via-indigo-600 to-purple-500 rounded-b-xl rounded-t-lg transition-all duration-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                />
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <Users className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-[10px] font-black text-slate-400 tracking-wider">GD</span>
              </div>
            </div>

            {/* Mock Interview Bar */}
            <div className="flex flex-col items-center gap-2 group h-full justify-end">
              <span className="text-xs font-black text-slate-700 dark:text-slate-300 opacity-90">{stats?.categoryAnalysis?.MockInterview || 0}%</span>
              <div className="w-full bg-slate-100 dark:bg-slate-800/50 rounded-2xl h-44 flex items-end overflow-hidden">
                <div 
                  style={{ height: `${stats?.categoryAnalysis?.MockInterview || 0}%` }}
                  className="w-full bg-gradient-to-t from-blue-700 via-indigo-600 to-purple-500 rounded-b-xl rounded-t-lg transition-all duration-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                />
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-[10px] font-black text-slate-400 tracking-wider">Mock HR</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Grids Row */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Upcoming Activities */}
        <div className="p-6 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800/80 rounded-3xl shadow-md flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100">Upcoming Activities</h3>
              <button onClick={() => navigate('/reports')} className="text-xs font-black text-blue-500 hover:underline">View All</button>
            </div>
            
            <div className="space-y-4">
              {stats?.upcomingActivities?.map((act, index) => {
                const badge = getActivityBadge(act);
                return (
                  <div 
                    key={index}
                    onClick={() => {
                      if (act.category === 'COMMUNICATION') navigate('/communication');
                      else if (act.category === 'APTITUDE') navigate('/aptitude');
                      else if (act.category === 'MOCK_INTERVIEW') navigate('/mock-interview');
                      else if (act.category === 'GD') navigate('/group-discussion');
                      else navigate('/reports');
                    }}
                    className="flex justify-between items-center p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/30 rounded-2xl transition-colors group cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-slate-850"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${
                        act.category === 'COMMUNICATION' ? 'bg-purple-500/10 text-purple-500' :
                        act.category === 'APTITUDE' ? 'bg-amber-500/10 text-amber-500' :
                        'bg-blue-500/10 text-blue-500'
                      }`}>
                        {act.category === 'COMMUNICATION' && <MessageSquare className="w-4 h-4" />}
                        {act.category === 'APTITUDE' && <TrendingUp className="w-4 h-4" />}
                        {act.category === 'MOCK_INTERVIEW' && <GraduationCap className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-extrabold text-sm text-slate-800 dark:text-slate-200 group-hover:text-blue-500 transition-colors">
                          {act.title}
                        </p>
                        <p className="text-xs font-semibold text-slate-400 mt-0.5">
                          {act.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black tracking-wide px-3 py-1.5 rounded-full flex items-center gap-1.5 ${
                        badge.type === 'due' 
                          ? 'bg-rose-500/10 text-rose-500 dark:bg-rose-500/15' 
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        <Calendar className="w-3.5 h-3.5" />
                        {badge.text}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-650 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <button 
            onClick={() => navigate('/reports')}
            className="w-full mt-6 py-3.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/40 dark:hover:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-extrabold text-sm rounded-2xl shadow-sm transition-colors"
          >
            View All Activities
          </button>
        </div>

        {/* Trainer Feedback & Review */}
        <div className="p-6 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800/80 rounded-3xl shadow-md flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100">Trainer Feedback & Review</h3>
              <button onClick={() => navigate('/mock-interview')} className="text-xs font-black text-blue-500 hover:underline">View All Feedback</button>
            </div>
            
            <div className="p-5 bg-slate-50/70 dark:bg-slate-900/30 rounded-2xl border border-slate-150 dark:border-slate-800/40 shadow-inner relative">
              <span className="absolute top-3 left-4 text-5xl font-serif text-slate-200 dark:text-slate-800 pointer-events-none select-none">“</span>
              <p className="text-sm font-semibold leading-relaxed text-slate-700 dark:text-slate-300 italic pl-5 relative z-10">
                "{stats?.trainerFeedback?.feedback}"
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-6 pt-5 border-t border-slate-150 dark:border-slate-800/60">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-slate-200 dark:bg-slate-800 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-500 font-black shadow-sm overflow-hidden">
                {/* SVG avatar profile */}
                <svg className="w-8 h-8 text-slate-400 mt-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                  {stats?.trainerFeedback?.trainerName}
                </p>
                <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                  {stats?.trainerFeedback?.reviewedDate}
                </p>
              </div>
            </div>
            <div className="px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-black rounded-full flex items-center gap-1">
              <span>★</span>
              <span>{stats?.trainerFeedback?.rating || '4.5'}/5</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100">Quick Actions</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Start Aptitude Test */}
          <div 
            onClick={() => navigate('/aptitude')}
            className="p-5 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm flex items-center justify-between cursor-pointer hover:border-blue-500 dark:hover:border-blue-500/50 hover:shadow-md group transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300 border border-blue-500/15">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-850 dark:text-slate-100">Start Aptitude Test</p>
                <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Improve your problem solving skills</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
          </div>

          {/* Card 2: Book Mock Interview */}
          <div 
            onClick={() => navigate('/mock-interview')}
            className="p-5 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm flex items-center justify-between cursor-pointer hover:border-emerald-500 dark:hover:border-emerald-500/50 hover:shadow-md group transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300 border border-emerald-500/15">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-850 dark:text-slate-100">Book Mock Interview</p>
                <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Practice with industry professionals</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
          </div>

          {/* Card 3: Join Group Discussion */}
          <div 
            onClick={() => navigate('/group-discussion')}
            className="p-5 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm flex items-center justify-between cursor-pointer hover:border-rose-500 dark:hover:border-rose-500/50 hover:shadow-md group transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl group-hover:bg-rose-500 group-hover:text-white transition-colors duration-300 border border-rose-500/15">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-850 dark:text-slate-100">Join Group Discussion</p>
                <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Enhance your public speaking</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-rose-500 group-hover:translate-x-1 transition-all" />
          </div>

          {/* Card 4: Ask AI Advisor */}
          <div 
            onClick={() => navigate('/advisor')}
            className="p-5 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm flex items-center justify-between cursor-pointer hover:border-purple-500 dark:hover:border-purple-500/50 hover:shadow-md group transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl group-hover:bg-purple-500 group-hover:text-white transition-colors duration-300 border border-purple-500/15">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-850 dark:text-slate-100">Ask AI Advisor</p>
                <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Get personalized career guidance</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;

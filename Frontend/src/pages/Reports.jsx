/*
------------------------------------------------
File: Reports.jsx
Purpose: Analytical summaries visual representation of student placement training progress.
Responsibilities: Gathers evaluation reports metrics, displays competency progress bars, circular progress meters, activity completed stats, SVG trend lines, and export reports.
Dependencies: react, axiosClient, Card, lucide-react
------------------------------------------------
*/

import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import Card from '../components/Card';
import Button from '../components/Button';
import { 
  BarChart3, 
  FileText, 
  Download, 
  CheckCircle, 
  TrendingUp, 
  Star, 
  Clock, 
  Code, 
  Users, 
  MessageSquare,
  Bot,
  Calendar,
  Sparkles,
  ArrowUpRight,
  MoreHorizontal
} from 'lucide-react';

const Reports = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axiosClient.get('/reports/monthly');
        if (res.data.success) {
          setStats(res.data.report);
        }
      } catch (err) {
        console.error('Failed to load progress reports:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleExport = () => {
    window.print();
  };

  // Extract variables with defaults
  const breakdown = stats?.competencyBreakdown || {
    aptitude: 0,
    coding: 0,
    communication: 0,
    softSkills: 0,
    technical: 0,
    overallScore: 0
  };

  const completion = stats?.activityCompletion || {
    overallCompletion: 0,
    testsCompleted: 0,
    testsTotal: 32,
    mockInterviews: 0,
    mockInterviewsTotal: 15,
    codingChallenges: 0,
    codingChallengesTotal: 20,
    gdSessions: 0,
    gdSessionsTotal: 12,
    aiAdvisorSessions: 0,
    aiAdvisorSessionsTotal: 8
  };

  const overview = stats?.overview || {
    averageScore: 0,
    averageGrade: 'N/A',
    tasksCompleted: 0,
    tasksTotal: 87,
    learningTimeHours: 0,
    learningTimeMinutes: 0
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 font-sans">
      
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <span>Progress Reports</span>
          <BarChart3 className="w-6 h-6 text-blue-500" />
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          View your active training metrics, average grades, and completion counters in real time.
        </p>
      </div>

      {/* Row 1: Competency & Activity Completion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Card 1: Placement Readiness Competency Breakdown */}
        <Card 
          title="Placement Readiness Competency Breakdown" 
          headerAction={<button className="text-slate-400 hover:text-slate-200"><MoreHorizontal className="w-4 h-4" /></button>}
        >
          {loading ? (
            <p className="text-xs text-slate-400 py-12 text-center">Loading breakdown details...</p>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-around gap-8">
                
                {/* Left Side: Score Doughnut Visual */}
                <div className="relative flex-shrink-0">
                  <svg className="w-36 h-36 transform -rotate-90">
                    <circle cx="72" cy="72" r="55" fill="transparent" stroke="#f1f5f9" strokeWidth="10" className="dark:stroke-slate-800" />
                    <circle 
                      cx="72" 
                      cy="72" 
                      r="55" 
                      fill="transparent" 
                      stroke="url(#purpleBlueGrad)" 
                      strokeWidth="10" 
                      strokeDasharray="345" 
                      strokeDashoffset={345 - (345 * breakdown.overallScore) / 100}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="purpleBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-extrabold text-2xl text-slate-800 dark:text-white">{breakdown.overallScore}%</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Overall Score</span>
                  </div>
                </div>

                {/* Right Side: Progress bars */}
                <div className="flex-1 w-full space-y-3.5 text-xs">
                  {/* Aptitude */}
                  <div className="space-y-1">
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-600 dark:text-slate-400">Aptitude</span>
                      <span className="text-slate-800 dark:text-slate-200">{breakdown.aptitude}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-purple-500 h-full rounded-full" style={{ width: `${breakdown.aptitude}%` }} />
                    </div>
                  </div>

                  {/* Coding */}
                  <div className="space-y-1">
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-600 dark:text-slate-400">Coding</span>
                      <span className="text-slate-800 dark:text-slate-200">{breakdown.coding}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: `${breakdown.coding}%` }} />
                    </div>
                  </div>

                  {/* Communication */}
                  <div className="space-y-1">
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-600 dark:text-slate-400">Communication</span>
                      <span className="text-slate-800 dark:text-slate-200">{breakdown.communication}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-teal-500 h-full rounded-full" style={{ width: `${breakdown.communication}%` }} />
                    </div>
                  </div>

                  {/* Soft Skills */}
                  <div className="space-y-1">
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-600 dark:text-slate-400">Soft Skills</span>
                      <span className="text-slate-800 dark:text-slate-200">{breakdown.softSkills}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-orange-500 h-full rounded-full" style={{ width: `${breakdown.softSkills}%` }} />
                    </div>
                  </div>

                  {/* Technical Knowledge */}
                  <div className="space-y-1">
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-600 dark:text-slate-400">Technical Knowledge</span>
                      <span className="text-slate-800 dark:text-slate-200">{breakdown.technical}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-rose-500 h-full rounded-full" style={{ width: `${breakdown.technical}%` }} />
                    </div>
                  </div>
                </div>

              </div>

              <div className="pt-2 text-center">
                <button className="text-blue-500 hover:text-blue-400 text-xs font-bold transition-colors">
                  View Detailed Breakdown ➜
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* Card 2: Activity Completion Metrics */}
        <Card title="Activity Completion Metrics">
          {loading ? (
            <p className="text-xs text-slate-400 py-12 text-center">Loading completion details...</p>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-around gap-8">
                
                {/* Left Side: Completion Doughnut Visual */}
                <div className="relative flex-shrink-0">
                  <svg className="w-36 h-36 transform -rotate-90">
                    <circle cx="72" cy="72" r="55" fill="transparent" stroke="#f1f5f9" strokeWidth="10" className="dark:stroke-slate-800" />
                    <circle 
                      cx="72" 
                      cy="72" 
                      r="55" 
                      fill="transparent" 
                      stroke="url(#purpleIndigoGrad)" 
                      strokeWidth="10" 
                      strokeDasharray="345" 
                      strokeDashoffset={345 - (345 * completion.overallCompletion) / 100}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="purpleIndigoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#6366f1" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-extrabold text-2xl text-slate-800 dark:text-white">{completion.overallCompletion}%</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 text-center px-4 leading-none">Overall Completion</span>
                  </div>
                </div>

                {/* Right Side: List items with counts */}
                <div className="flex-1 w-full space-y-3.5 text-xs font-semibold text-slate-500">
                  {/* Tests Completed */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="p-1 bg-slate-100 dark:bg-slate-800 rounded-lg"><FileText className="w-3.5 h-3.5" /></span>
                      <span className="dark:text-slate-450 font-bold">Tests Completed</span>
                    </div>
                    <span className="text-emerald-500 font-extrabold">{completion.testsCompleted} <span className="text-slate-400">/ {completion.testsTotal}</span></span>
                  </div>

                  {/* Mock Interviews */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="p-1 bg-slate-100 dark:bg-slate-800 rounded-lg"><Users className="w-3.5 h-3.5" /></span>
                      <span className="dark:text-slate-450 font-bold">Mock Interviews</span>
                    </div>
                    <span className="text-emerald-500 font-extrabold">{completion.mockInterviews} <span className="text-slate-400">/ {completion.mockInterviewsTotal}</span></span>
                  </div>

                  {/* Coding Challenges */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="p-1 bg-slate-100 dark:bg-slate-800 rounded-lg"><Code className="w-3.5 h-3.5" /></span>
                      <span className="dark:text-slate-450 font-bold">Coding Challenges</span>
                    </div>
                    <span className="text-emerald-500 font-extrabold">{completion.codingChallenges} <span className="text-slate-400">/ {completion.codingChallengesTotal}</span></span>
                  </div>

                  {/* GD Sessions */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="p-1 bg-slate-100 dark:bg-slate-800 rounded-lg"><Users className="w-3.5 h-3.5" /></span>
                      <span className="dark:text-slate-450 font-bold">GD Sessions</span>
                    </div>
                    <span className="text-emerald-500 font-extrabold">{completion.gdSessions} <span className="text-slate-400">/ {completion.gdSessionsTotal}</span></span>
                  </div>

                  {/* AI Advisor Sessions */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="p-1 bg-slate-100 dark:bg-slate-800 rounded-lg"><Bot className="w-3.5 h-3.5" /></span>
                      <span className="dark:text-slate-450 font-bold">AI Advisor Sessions</span>
                    </div>
                    <span className="text-emerald-500 font-extrabold">{completion.aiAdvisorSessions} <span className="text-slate-400">/ {completion.aiAdvisorSessionsTotal}</span></span>
                  </div>
                </div>

              </div>

              <div className="pt-2 text-center">
                <button className="text-blue-500 hover:text-blue-400 text-xs font-bold transition-colors">
                  View All Activities ➜
                </button>
              </div>
            </div>
          )}
        </Card>

      </div>

      {/* Row 2: Progress Overview & Trend Line chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Your Progress Overview */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Your Progress Overview">
            {loading ? (
              <p className="text-xs text-slate-400 py-12 text-center">Loading progress overview...</p>
            ) : (
              <div className="space-y-6 font-sans">
                {/* 4 Cards Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Card 1: Average Score */}
                  <div className="p-4 bg-slate-50/50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-850 rounded-2xl flex items-start gap-3">
                    <div className="p-2.5 bg-purple-500/10 text-purple-505 rounded-xl">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Average Score</p>
                      <h4 className="font-extrabold text-xl text-slate-800 dark:text-slate-200 mt-1">{overview.averageScore}%</h4>
                      <p className="text-[9px] text-emerald-500 font-bold mt-1">↑ 6% vs last month</p>
                    </div>
                  </div>

                  {/* Card 2: Average Grade */}
                  <div className="p-4 bg-slate-50/50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-850 rounded-2xl flex items-start gap-3">
                    <div className="p-2.5 bg-blue-500/10 text-blue-505 rounded-xl">
                      <Star className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Average Grade</p>
                      <h4 className="font-extrabold text-xl text-slate-800 dark:text-slate-200 mt-1">{overview.averageGrade}</h4>
                      <p className="text-[9px] text-emerald-500 font-bold mt-1">↑ 1 grade vs last month</p>
                    </div>
                  </div>

                  {/* Card 3: Tasks Completed */}
                  <div className="p-4 bg-slate-50/50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-850 rounded-2xl flex items-start gap-3">
                    <div className="p-2.5 bg-emerald-500/10 text-emerald-505 rounded-xl">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Tasks Completed</p>
                      <h4 className="font-extrabold text-xl text-slate-800 dark:text-slate-200 mt-1">{overview.tasksCompleted} / {overview.tasksTotal}</h4>
                      <p className="text-[9px] text-emerald-500 font-bold mt-1">↑ 12 vs last month</p>
                    </div>
                  </div>

                  {/* Card 4: Total Learning Time */}
                  <div className="p-4 bg-slate-50/50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-850 rounded-2xl flex items-start gap-3">
                    <div className="p-2.5 bg-orange-500/10 text-orange-505 rounded-xl">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Total Learning Time</p>
                      <h4 className="font-extrabold text-xl text-slate-800 dark:text-slate-200 mt-1">{overview.learningTimeHours}h {overview.learningTimeMinutes}m</h4>
                      <p className="text-[9px] text-emerald-500 font-bold mt-1">↑ 7h 15m vs last month</p>
                    </div>
                  </div>
                </div>

                {/* Recommendation Banner */}
                <div className="p-4 bg-slate-900 dark:bg-[#0d1220] border border-slate-855 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/15 text-blue-500 rounded-full shrink-0 flex items-center justify-center">
                      <Star className="w-4 h-4 fill-current" />
                    </div>
                    <p className="text-xs font-semibold text-slate-300 leading-normal">
                      Great job, {stats?.profile?.name || 'Krishna'}! You're consistently improving. Keep up the momentum and achieve your placement goals.
                    </p>
                  </div>
                  <Button 
                    onClick={() => navigate('/advisor')}
                    className="text-xs px-3 py-1.5 h-auto shrink-0 flex items-center gap-1 uppercase font-black tracking-wider"
                  >
                    <Sparkles className="w-3.5 h-3.5 fill-current" /> View Recommendations
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right: Weekly Progress Trend Line Chart */}
        <div className="lg:col-span-1 space-y-6">
          <Card title="Weekly Progress Trend">
            {loading ? (
              <p className="text-xs text-slate-400 py-12 text-center">Loading trend analytics...</p>
            ) : (
              <div className="space-y-4 font-sans">
                {/* SVG Graph Layout */}
                <div className="h-40 w-full relative pt-2">
                  <svg className="w-full h-full" viewBox="0 0 300 120" preserveAspectRatio="none">
                    {/* Glowing Grid lines */}
                    <line x1="0" y1="20" x2="300" y2="20" stroke="#f1f5f9" strokeWidth="0.5" className="dark:stroke-slate-900" />
                    <line x1="0" y1="60" x2="300" y2="60" stroke="#f1f5f9" strokeWidth="0.5" className="dark:stroke-slate-900" />
                    <line x1="0" y1="100" x2="300" y2="100" stroke="#f1f5f9" strokeWidth="0.5" className="dark:stroke-slate-900" />
                    
                    {/* Line 1: Score (%) (Glowing purple line) */}
                    <path 
                      d="M 10 90 Q 70 70 130 55 T 250 25" 
                      fill="none" 
                      stroke="#8b5cf6" 
                      strokeWidth="2.5" 
                    />
                    <circle cx="10" cy="90" r="3" fill="#8b5cf6" />
                    <circle cx="70" cy="70" r="3" fill="#8b5cf6" />
                    <circle cx="130" cy="55" r="3" fill="#8b5cf6" />
                    <circle cx="250" cy="25" r="3" fill="#8b5cf6" />

                    {/* Line 2: Completion (%) (Glowing blue line) */}
                    <path 
                      d="M 10 105 Q 70 85 130 75 T 250 50" 
                      fill="none" 
                      stroke="#3b82f6" 
                      strokeWidth="2.5" 
                    />
                    <circle cx="10" cy="105" r="3" fill="#3b82f6" />
                    <circle cx="70" cy="85" r="3" fill="#3b82f6" />
                    <circle cx="130" cy="75" r="3" fill="#3b82f6" />
                    <circle cx="250" cy="50" r="3" fill="#3b82f6" />
                  </svg>
                  
                  {/* Chart X Labels matching the dates from the screenshot */}
                  <div className="flex justify-between text-[8px] font-bold text-slate-400 mt-2 uppercase tracking-wide px-1">
                    <span>May 19</span>
                    <span>May 20</span>
                    <span>May 21</span>
                    <span>May 22</span>
                    <span>May 23</span>
                    <span>May 24</span>
                    <span>May 25</span>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-6 text-[9px] font-bold text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-0.5 bg-purple-500"></span>
                    <span>Score (%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-0.5 bg-blue-500"></span>
                    <span>Completion (%)</span>
                  </div>
                </div>

                <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-900/60">
                  <button className="text-blue-500 hover:text-blue-400 text-xs font-bold transition-colors">
                    View Full Analytics ➜
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>

      </div>

      {/* Row 3: Footer bar */}
      <div className="p-4 bg-slate-50 dark:bg-[#111625] border border-slate-200 dark:border-slate-805 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-blue-500" />
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
            Reports are updated in real-time as you complete activities across the platform.
          </p>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-black text-white rounded-xl uppercase tracking-wider transition-all shadow-sm"
        >
          <Download className="w-4 h-4" /> Export Report
        </button>
      </div>

    </div>
  );
};

export default Reports;

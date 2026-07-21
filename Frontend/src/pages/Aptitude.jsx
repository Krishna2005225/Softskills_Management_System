/*
------------------------------------------------
File: Aptitude.jsx
Purpose: Renders the premium Aptitude Practice Engine and test dashboard.
Responsibilities: Manages timed quizzes, displays real-time score statistics, draws progress charts, and integrates the sidebar AI resume rewriter.
Dependencies: react, axiosClient, Card, Button, lucide-react
------------------------------------------------
*/

import React, { useState, useEffect, useRef } from 'react';
import axiosClient from '../api/axiosClient';
import Card from '../components/Card';
import Button from '../components/Button';
import { 
  Timer, Award, CheckCircle2, HelpCircle, FileText, 
  TrendingUp, CheckSquare, Target, ChevronRight, Sparkles, 
  BookOpen, Clock, Activity, AlertCircle, ArrowRight
} from 'lucide-react';

const Aptitude = () => {
  // Navigation & Category states
  const [category, setCategory] = useState('QUANTITATIVE');
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);

  // Test content states
  const [questions, setQuestions] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [writtenAnswers, setWrittenAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Timer state
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes (600s)
  const timerRef = useRef(null);

  // Dashboard Stats states
  const [stats, setStats] = useState({
    testsCompleted: 0,
    avgScore: 0,
    accuracyRate: 0,
    bestScore: 0,
    avgTime: 0,
    chartData: []
  });

  // Sidebar AI Optimizer states
  const [optSection, setOptSection] = useState('Work Experience');
  const [optRawText, setOptRawText] = useState('');
  const [optLoading, setOptLoading] = useState(false);
  const [optOutput, setOptOutput] = useState(null);

  // Fetch Dashboard Stats & Questions
  useEffect(() => {
    fetchStats();
    loadQuestions();
  }, [category]);

  // Timer countdown hook
  useEffect(() => {
    if (started) {
      setTimeLeft(600);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleSubmit(); // Auto submit
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [started]);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await axiosClient.get('/aptitude/stats');
      if (res.data.success && res.data.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error("Failed to load aptitude stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadQuestions = async () => {
    try {
      const res = await axiosClient.get(`/aptitude/questions?category=${category}`);
      if (res.data.success) {
        setQuestions(res.data.questions);
      }
    } catch (err) {
      console.error('Failed to load questions:', err);
    }
  };

  const handleStart = () => {
    setStarted(true);
    setScore(null);
    setSubmitSuccess(false);
    setSelectedAnswers({});
    setWrittenAnswers({});
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const mcqQuestions = questions.filter(q => q.options && q.options.length > 0);
      const subjectiveQuestions = questions.filter(q => !q.options || q.options.length === 0);

      // 1. Grade and submit MCQ answers if any exist
      if (mcqQuestions.length > 0) {
        let correctCount = 0;
        mcqQuestions.forEach((q) => {
          const qId = q.question_id || q.id;
          if (selectedAnswers[qId] === q.correct_answer) {
            correctCount++;
          }
        });

        await axiosClient.post('/aptitude/submit', {
          score: correctCount,
          totalQuestions: mcqQuestions.length,
          category
        });
        setScore(`${correctCount} / ${mcqQuestions.length}`);
      }

      // 2. Submit subjective written responses if any exist
      if (subjectiveQuestions.length > 0) {
        const payload = subjectiveQuestions.map(q => {
          const qId = q.question_id || q.id;
          return {
            questionId: qId,
            submittedAnswer: writtenAnswers[qId] || ''
          };
        });

        await axiosClient.post('/aptitude/answers/submit', {
          answers: payload
        });
        setSubmitSuccess(true);
      }

      // Fetch refreshed database stats immediately
      await fetchStats();
      setStarted(false);
    } catch (err) {
      console.error('Submission error:', err);
      alert('Failed to submit answers. Check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  // Sidebar AI Optimizer submission
  const handleSidebarOptimize = async (e) => {
    e.preventDefault();
    if (!optRawText.trim()) return;

    setOptLoading(true);
    setOptOutput(null);

    try {
      const res = await axiosClient.post('/resume/ai-rewrite', {
        sectionType: optSection,
        rawText: optRawText
      });
      if (res.data.success) {
        setOptOutput({
          original: optRawText,
          optimized: res.data.rewrittenPoints
        });
      }
    } catch (err) {
      console.error(err);
      alert("AI optimization failed.");
    } finally {
      setOptLoading(false);
    }
  };

  // Format category human-friendly title
  const getCategoryTitle = () => {
    if (category === 'QUANTITATIVE') return "Quantitative";
    if (category === 'LOGICAL') return "Logical Fallacies";
    if (category === 'VERBAL') return "Verbal Articulation";
    return category;
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  // SVG Line Chart plotting variables
  const getChartCoordinates = (data, key, height, width, maxVal = 100) => {
    const pointsCount = data.length;
    if (pointsCount === 0) return "";
    const xInterval = (width - 60) / Math.max(1, pointsCount - 1);
    
    return data.map((item, idx) => {
      const x = 40 + idx * xInterval;
      // Flip coordinate since SVG y increases downwards
      const y = (height - 30) - (item[key] / maxVal) * (height - 50);
      return `${x},${y}`;
    }).join(" ");
  };

  const chartWidth = 480;
  const chartHeight = 160;

  return (
    <div className="space-y-8">
      
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Aptitude Practice Engine</h1>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">Take timed tests across logical, quantitative, and verbal reasoning categories.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Assessment, Stats & Chart */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          
          {/* Main Assessment Control Panel */}
          {!started && score === null && !submitSuccess && (
            <Card className="p-6 relative overflow-hidden bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800/80 rounded-3xl transition duration-300 hover:scale-[1.005]">
              {/* Graphic Atom Icon in background */}
              <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-15 dark:opacity-10 text-indigo-500">
                <svg className="w-24 h-24 animate-spin-slow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <ellipse cx="12" cy="12" rx="3" ry="9" transform="rotate(0 12 12)" />
                  <ellipse cx="12" cy="12" rx="3" ry="9" transform="rotate(60 12 12)" />
                  <ellipse cx="12" cy="12" rx="3" ry="9" transform="rotate(120 12 12)" />
                </svg>
              </div>

              <div className="space-y-4 max-w-md">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">{getCategoryTitle()} Preparation Assessment</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                  Evaluate your skill levels. Dynamic questions will be loaded directly from our database.
                </p>
                <div className="pt-2">
                  <Button onClick={handleStart} variant="primary" className="bg-gradient-to-r from-blue-600 to-indigo-600 font-extrabold text-xs py-3 px-6 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-500/20">
                    <Clock className="w-4.5 h-4.5" /> Start Timed Test
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Test Session Mode */}
          {started && (
            <Card title={`${getCategoryTitle()} Timed Evaluation`}>
              <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-900 px-4 py-2.5 rounded-2xl mb-6 border border-slate-200/50 dark:border-slate-800/60">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-450">{questions.length} Questions loaded</span>
                <span className={`text-xs font-black flex items-center gap-1.5 ${timeLeft < 60 ? 'text-rose-500 animate-pulse' : 'text-blue-500 dark:text-blue-400'}`}>
                  <Timer className="w-4.5 h-4.5" /> {formatTime(timeLeft)} remaining
                </span>
              </div>

              {questions.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading evaluation questions...</div>
              ) : (
                <div className="space-y-8">
                  {questions.map((q, idx) => {
                    const qId = q.question_id || q.id;
                    const isMCQ = q.options && q.options.length > 0;

                    return (
                      <div key={qId} className="space-y-4 border-b border-slate-100 dark:border-slate-850 pb-6 last:border-b-0 last:pb-0">
                        <p className="font-extrabold text-xs text-slate-800 dark:text-slate-200 flex gap-2">
                          <span className="text-blue-500 font-black">{idx + 1}.</span> {q.question_text}
                        </p>
                        
                        {isMCQ ? (
                          <div className="grid sm:grid-cols-2 gap-4">
                            {q.options.map((opt) => {
                              const isSelected = selectedAnswers[qId] === opt;
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => setSelectedAnswers({ ...selectedAnswers, [qId]: opt })}
                                  className={`p-3.5 text-[11px] font-bold border rounded-2xl text-left transition-all ${
                                    isSelected 
                                      ? 'border-blue-600 bg-blue-600/10 text-blue-600 dark:text-blue-400' 
                                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 text-slate-600 dark:text-slate-400'
                                  }`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Write your response explanation:</label>
                            <textarea
                              rows="4"
                              value={writtenAnswers[qId] || ''}
                              onChange={(e) => setWrittenAnswers({ ...writtenAnswers, [qId]: e.target.value })}
                              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 bg-transparent rounded-2xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-450 dark:text-slate-200 leading-relaxed font-sans"
                              placeholder="Describe your reasoning and final answer..."
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <Button onClick={handleSubmit} loading={loading} variant="primary" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 font-extrabold uppercase py-3.5 rounded-2xl text-xs tracking-wider shadow-lg shadow-indigo-500/25">
                    Submit Test Answers
                  </Button>
                </div>
              )}
            </Card>
          )}

          {/* Test Results Sheet */}
          {(score !== null || submitSuccess) && !started && (
            <Card title="Test Evaluation Report">
              <div className="flex items-center gap-6 p-4 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="h-14 w-14 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">Assessment Submitted Successfully</h3>
                  {score && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">
                      Your MCQ score is <span className="text-indigo-600 dark:text-indigo-400 font-black text-sm">{score}</span>
                    </p>
                  )}
                  {submitSuccess && (
                    <p className="text-xs text-slate-400 mt-1 font-semibold">
                      Your written responses were submitted and graded using Gemini AI logic.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <Button onClick={handleStart} variant="primary" className="flex-1 bg-blue-600 py-3.5 text-xs font-bold rounded-xl justify-center shadow shadow-blue-500/20">
                  Take Another Test
                </Button>
                <Button onClick={() => { setScore(null); setSubmitSuccess(false); }} variant="outline" className="flex-1 border-slate-200 dark:border-slate-800 py-3.5 text-xs font-bold rounded-xl justify-center">
                  Back to Dashboard
                </Button>
              </div>
            </Card>
          )}

          {/* Statistics Grid Row */}
          <div className="grid sm:grid-cols-3 gap-6">
            
            {/* Tests Completed Card */}
            <div className="p-6 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800/80 rounded-3xl shadow-sm hover:scale-[1.01] transition duration-300 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Tests Completed</span>
                <span className="text-3xl font-black text-slate-850 dark:text-white block">{stats.testsCompleted}</span>
                <span className="text-[10px] font-extrabold text-emerald-500 flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" /> ↑ 20% vs last month
                </span>
              </div>
              <div className="h-11 w-11 bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-500 rounded-xl flex items-center justify-center">
                <CheckSquare className="w-5.5 h-5.5" />
              </div>
            </div>

            {/* Average Score Card */}
            <div className="p-6 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800/80 rounded-3xl shadow-sm hover:scale-[1.01] transition duration-300 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Avg. Score</span>
                <span className="text-3xl font-black text-slate-850 dark:text-white block">{stats.avgScore}%</span>
                <span className="text-[10px] font-extrabold text-purple-500 flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" /> ↑ 15% vs last month
                </span>
              </div>
              <div className="h-11 w-11 bg-purple-500/10 dark:bg-purple-500/5 text-purple-500 rounded-xl flex items-center justify-center">
                <Activity className="w-5.5 h-5.5" />
              </div>
            </div>

            {/* Accuracy Rate Card */}
            <div className="p-6 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800/80 rounded-3xl shadow-sm hover:scale-[1.01] transition duration-300 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Accuracy Rate</span>
                <span className="text-3xl font-black text-slate-850 dark:text-white block">{stats.accuracyRate}%</span>
                <span className="text-[10px] font-extrabold text-blue-500 flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" /> ↑ 10% vs last month
                </span>
              </div>
              <div className="h-11 w-11 bg-blue-500/10 dark:bg-blue-500/5 text-blue-500 rounded-xl flex items-center justify-center">
                <Target className="w-5.5 h-5.5" />
              </div>
            </div>

          </div>

          {/* Recent Test Performance Chart */}
          <Card title="Recent Test Performance">
            <div className="grid md:grid-cols-3 gap-8 items-center">
              
              {/* Chart Plot Area (2/3 cols) */}
              <div className="md:col-span-2 space-y-4">
                {/* SVG Chart legends */}
                <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-4 rounded bg-blue-500 inline-block"></span> Score (%)
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-4 rounded bg-purple-500 inline-block"></span> Accuracy (%)
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-4 rounded bg-emerald-500 inline-block"></span> Time (mins)
                  </div>
                </div>

                {/* SVG Responsive chart */}
                <div className="w-full bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-850/80 rounded-2xl p-4">
                  <svg className="w-full h-auto overflow-visible" viewBox={`0 0 ${chartWidth} ${chartHeight}`} fill="none">
                    {/* Horizontal dotted gridlines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                      const y = 20 + ratio * (chartHeight - 50);
                      const gridLabel = Math.round(100 - ratio * 100);
                      return (
                        <g key={ratio} className="opacity-40">
                          <line x1="40" y1={y} x2={chartWidth - 20} y2={y} stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" className="text-slate-200 dark:text-slate-800" />
                          <text x="10" y={y + 3.5} className="text-[9px] font-bold text-slate-400 text-right fill-current" textAnchor="end">{gridLabel}</text>
                        </g>
                      );
                    })}

                    {/* Date labels at bottom */}
                    {stats.chartData.map((item, idx) => {
                      const xInterval = (chartWidth - 60) / Math.max(1, stats.chartData.length - 1);
                      const x = 40 + idx * xInterval;
                      return (
                        <text key={idx} x={x} y={chartHeight - 8} className="text-[9px] font-bold text-slate-400 fill-current" textAnchor="middle">
                          {item.date}
                        </text>
                      );
                    })}

                    {/* Blue Score curve line */}
                    <path
                      d={`M ${getChartCoordinates(stats.chartData, 'score', chartHeight, chartWidth)}`}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    {/* Purple Accuracy curve line */}
                    <path
                      d={`M ${getChartCoordinates(stats.chartData, 'accuracy', chartHeight, chartWidth)}`}
                      fill="none"
                      stroke="#a855f7"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    {/* Green Time curve line */}
                    <path
                      d={`M ${getChartCoordinates(stats.chartData, 'time', chartHeight, chartWidth, 60)}`} // max 60 min scale
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    {/* Plot node circles */}
                    {stats.chartData.map((item, idx) => {
                      const xInterval = (chartWidth - 60) / Math.max(1, stats.chartData.length - 1);
                      const x = 40 + idx * xInterval;
                      const yScore = (chartHeight - 30) - (item.score / 100) * (chartHeight - 50);
                      const yAccuracy = (chartHeight - 30) - (item.accuracy / 100) * (chartHeight - 50);
                      const yTime = (chartHeight - 30) - (item.time / 60) * (chartHeight - 50);

                      return (
                        <g key={idx}>
                          {/* Score node */}
                          <circle cx={x} cy={yScore} r="4" fill="#3b82f6" stroke="#fff" strokeWidth="1" className="cursor-pointer hover:r-5 transition-all" />
                          {/* Accuracy node */}
                          <circle cx={x} cy={yAccuracy} r="4" fill="#a855f7" stroke="#fff" strokeWidth="1" className="cursor-pointer hover:r-5 transition-all" />
                          {/* Time node */}
                          <circle cx={x} cy={yTime} r="4" fill="#10b981" stroke="#fff" strokeWidth="1" className="cursor-pointer hover:r-5 transition-all" />
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* Performance Text Summary (1/3 col) */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Performance Summary</h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Best Score</span>
                    <span className="text-sm font-extrabold text-emerald-500">{stats.bestScore}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Avg. Time Taken</span>
                    <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{stats.avgTime} mins</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Tests Attempted</span>
                    <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{stats.testsCompleted}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Accuracy Rate</span>
                    <span className="text-sm font-extrabold text-blue-500">{stats.accuracyRate}%</span>
                  </div>
                </div>
              </div>

            </div>
          </Card>

        </div>

        {/* Right Column: Category Switcher, AI Optimizer, recommended topics */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          
          {/* Select Category Selector Card */}
          <Card title="Select Test Category">
            <div className="space-y-3">
              {[
                { name: 'Quantitative Reasoning', value: 'QUANTITATIVE' },
                { name: 'Logical Fallacies', value: 'LOGICAL' },
                { name: 'Verbal Articulation', value: 'VERBAL' }
              ].map((cat, idx) => {
                const isSelected = category === cat.value;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setCategory(cat.value);
                      setScore(null);
                      setSubmitSuccess(false);
                      setStarted(false);
                    }}
                    className={`w-full p-4 border rounded-2xl text-xs font-extrabold flex items-center justify-between transition-all ${
                      isSelected 
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-extrabold shadow shadow-indigo-500/10' 
                        : 'border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-900/40 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <div className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-indigo-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                      <span className={`text-[9px] uppercase tracking-wider font-extrabold ${isSelected ? 'text-indigo-500' : 'text-slate-400'}`}>Active</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* AI Resume Section Optimizer Card */}
          <Card title="AI Section Optimizer">
            <form onSubmit={handleSidebarOptimize} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Select Resume Section</label>
                <select
                  value={optSection}
                  onChange={e => setOptSection(e.target.value)}
                  className="mt-1.5 block w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 bg-transparent rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-slate-350 font-semibold"
                >
                  <option value="Work Experience">Work Experience</option>
                  <option value="Projects">Projects</option>
                  <option value="Profile Summary">Profile Summary</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider font-sans">Paste Raw Description</label>
                <textarea
                  rows="3"
                  required
                  value={optRawText}
                  onChange={e => setOptRawText(e.target.value)}
                  placeholder="e.g. I did coding in Python and made queries fast on SQL database for project..."
                  className="mt-1.5 block w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 bg-transparent rounded-2xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-400 dark:text-slate-200 leading-relaxed font-sans"
                  maxLength={1000}
                />
                <div className="flex justify-end text-[9px] text-slate-400 dark:text-slate-500 font-bold mt-1">
                  {optRawText.length}/1000
                </div>
              </div>

              <Button type="submit" variant="primary" loading={optLoading} className="w-full justify-center text-xs bg-indigo-600 hover:bg-indigo-700 font-extrabold uppercase py-3 rounded-xl tracking-wider shadow">
                Optimize with Gemini ✨
              </Button>
            </form>

            {optOutput && (
              <div className="mt-4 pt-4 border-t border-slate-150 dark:border-slate-850 space-y-3 animate-fade-in">
                <h5 className="font-extrabold text-[10px] text-emerald-500 uppercase tracking-wider">Optimized Suggestions:</h5>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-850 rounded-xl space-y-2">
                  {optOutput.optimized.map((pt, idx) => (
                    <p key={idx} className="text-[10px] text-slate-700 dark:text-slate-350 leading-relaxed font-semibold">
                      • {pt}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Recommended Topics Card */}
          <Card title="Recommended Topics">
            <div className="space-y-3">
              {[
                { title: 'Number System Basics', desc: 'Improve your basics' },
                { title: 'Percentages & Ratios', desc: 'High accuracy topics' },
                { title: 'Time & Work Problems', desc: 'Practice more questions' }
              ].map((topic, idx) => (
                <div 
                  key={idx} 
                  onClick={() => alert(`Opening practice drills for ${topic.title}!`)}
                  className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-100 dark:border-slate-800/60 rounded-2xl cursor-pointer transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{topic.title}</p>
                      <p className="text-[10px] text-slate-400 font-semibold">{topic.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              ))}
            </div>

            <button 
              onClick={() => alert('View All Topics feature coming soon!')}
              className="text-xs font-bold text-blue-500 hover:text-blue-600 mt-4 block text-center w-full"
            >
              View All Topics &rarr;
            </button>
          </Card>

        </div>

      </div>
    </div>
  );
};

export default Aptitude;

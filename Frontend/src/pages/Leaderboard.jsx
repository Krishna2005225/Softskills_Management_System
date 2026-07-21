/*
------------------------------------------------
File: Leaderboard.jsx
Purpose: Placement readiness rankings leaderboard with high-fidelity analytics dashboard.
Responsibilities: Lists top students sorted by readiness score, department filters, score distribution ring, performance SVG chart, and quick navigation.
Dependencies: react, axiosClient, Card, lucide-react, react-router-dom
------------------------------------------------
*/

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Card from '../components/Card';
import { 
  Award, 
  Trophy, 
  Medal, 
  Users, 
  TrendingUp, 
  Star, 
  Lightbulb, 
  ArrowRight,
  ChevronDown
} from 'lucide-react';

const Leaderboard = () => {
  const navigate = useNavigate();
  const [ranking, setRanking] = useState([]);
  const [currentUserStats, setCurrentUserStats] = useState(null);
  const [scoreDistribution, setScoreDistribution] = useState(null);
  const [performanceChart, setPerformanceChart] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedDept, setSelectedDept] = useState('All');
  const [showDeptMenu, setShowDeptMenu] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await axiosClient.get('/aptitude/leaderboard');
        if (res.data.success) {
          setRanking(res.data.leaderboard);
          setCurrentUserStats(res.data.currentUserStats);
          setScoreDistribution(res.data.scoreDistribution);
          setPerformanceChart(res.data.performanceChart);
        }
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const getRankIcon = (rank) => {
    if (rank === 1) return <div className="p-1 bg-amber-500/10 rounded-lg text-amber-500"><Trophy className="w-4 h-4 fill-current" /></div>;
    if (rank === 2) return <div className="p-1 bg-slate-400/10 rounded-lg text-slate-400"><Medal className="w-4 h-4 fill-current" /></div>;
    if (rank === 3) return <div className="p-1 bg-orange-500/10 rounded-lg text-orange-500"><Award className="w-4 h-4 fill-current" /></div>;
    return <span className="text-slate-400 font-semibold px-2">{rank}</span>;
  };

  const getAvatarDetails = (name) => {
    if (!name) return { initials: 'U', bg: 'bg-slate-500/10', text: 'text-slate-400' };
    const split = name.split(' ');
    const initials = split.map(n => n[0]).join('').substring(0, 2).toUpperCase();
    
    const charCodeSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const colors = [
      { bg: 'bg-orange-500/10', text: 'text-orange-500' },
      { bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
      { bg: 'bg-blue-500/10', text: 'text-blue-500' },
      { bg: 'bg-purple-500/10', text: 'text-purple-500' }
    ];
    const picked = colors[charCodeSum % colors.length];
    return { initials, bg: picked.bg, text: picked.text };
  };

  // Filter students based on selection
  const filteredRankings = ranking.filter(st => 
    selectedDept === 'All' || st.department === selectedDept
  );

  const departments = ['All', 'CSE', 'IT', 'ECE', 'EEE'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight font-sans text-slate-900 dark:text-white flex items-center gap-2">
          Placement Readiness Leaderboard 🏆
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Benchmark your placement readiness score against peers across all engineering departments.
        </p>
      </div>

      {/* Metrics Top Row */}
      {currentUserStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-sans">
          
          {/* Card 1: Your Rank */}
          <div className="p-5 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800/80 rounded-2xl flex items-center gap-4 hover:scale-[1.01] transition-all shadow-sm">
            <div className="p-3.5 bg-blue-500/10 text-blue-500 rounded-xl">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Your Rank</p>
              <h4 className="font-extrabold text-2xl text-slate-800 dark:text-slate-100 mt-2">
                {currentUserStats.rank} <span className="text-sm font-semibold text-slate-400">/ {currentUserStats.totalPeers}</span>
              </h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-semibold">
                {currentUserStats.rank === 1 ? "Congratulations! You're at the top." : "Keep pushing to the top!"}
              </p>
            </div>
          </div>

          {/* Card 2: Your Score */}
          <div className="p-5 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800/80 rounded-2xl flex items-center gap-4 hover:scale-[1.01] transition-all shadow-sm">
            <div className="p-3.5 bg-indigo-500/10 text-indigo-500 rounded-xl">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Your Score</p>
              <h4 className="font-extrabold text-2xl text-slate-800 dark:text-slate-100 mt-2">
                {currentUserStats.score}%
              </h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-semibold">
                Excellent performance!
              </p>
            </div>
          </div>

          {/* Card 3: Department Rank */}
          <div className="p-5 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800/80 rounded-2xl flex items-center gap-4 hover:scale-[1.01] transition-all shadow-sm">
            <div className="p-3.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Department Rank</p>
              <h4 className="font-extrabold text-2xl text-slate-800 dark:text-slate-100 mt-2">
                {currentUserStats.deptRank} <span className="text-sm font-semibold text-slate-400">/ {currentUserStats.deptTotal}</span>
              </h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-semibold truncate max-w-[150px]">
                {currentUserStats.departmentName}
              </p>
            </div>
          </div>

          {/* Card 4: Peers Participated */}
          <div className="p-5 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800/80 rounded-2xl flex items-center gap-4 hover:scale-[1.01] transition-all shadow-sm">
            <div className="p-3.5 bg-amber-500/10 text-amber-500 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Peers Participated</p>
              <h4 className="font-extrabold text-2xl text-slate-800 dark:text-slate-100 mt-2">
                {currentUserStats.totalPeers}
              </h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-semibold">
                Across all departments
              </p>
            </div>
          </div>

        </div>
      )}

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Rankings Table Card */}
        <div className="lg:col-span-2 space-y-6">
          <Card 
            title="Top Placement Readiness Rankings"
            headerAction={
              <div className="relative">
                <button 
                  onClick={() => setShowDeptMenu(!showDeptMenu)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all border border-slate-200/50 dark:border-slate-700/50"
                >
                  {selectedDept === 'All' ? 'All Departments' : `Dept: ${selectedDept}`} <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {showDeptMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-20 overflow-hidden">
                    {departments.map(dept => (
                      <button 
                        key={dept}
                        onClick={() => { setSelectedDept(dept); setShowDeptMenu(false); }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-semibold ${selectedDept === dept ? 'bg-blue-500/10 text-blue-500' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                      >
                        {dept === 'All' ? 'All Departments' : `${dept} Department`}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            }
          >
            {loading ? (
              <p className="text-xs text-slate-400 py-12 text-center">Loading rankings...</p>
            ) : filteredRankings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-855 pb-3 text-slate-400 text-xs">
                      <th className="py-3 font-bold uppercase tracking-wider pl-2">Rank</th>
                      <th className="py-3 font-bold uppercase tracking-wider">Student</th>
                      <th className="py-3 font-bold uppercase tracking-wider">Department</th>
                      <th className="py-3 font-bold uppercase tracking-wider text-center">Overall Score</th>
                      <th className="py-3 font-bold uppercase tracking-wider text-center">Trend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-900/50 font-sans">
                    {filteredRankings.map((st, idx) => {
                      const { initials, bg, text } = getAvatarDetails(st.name);
                      // Determine dynamic rank based on original array index or filter index
                      const absoluteRank = ranking.findIndex(item => item.user_id === st.user_id) + 1;
                      const isCurrentUser = currentUserStats && st.roll_no === st.roll_no && absoluteRank === currentUserStats.rank;
                      
                      // Mock trend percentage deterministically based on rank to keep alignment
                      const trendUp = absoluteRank % 3 !== 0;
                      const trendVal = (absoluteRank * 7) % 6 + 1;

                      return (
                        <tr 
                          key={st.user_id} 
                          className={`hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors ${
                            isCurrentUser ? 'bg-blue-500/[0.03] dark:bg-blue-500/[0.02]' : ''
                          }`}
                        >
                          <td className="py-3.5 pl-2">
                            {getRankIcon(absoluteRank)}
                          </td>
                          <td className="py-3.5">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full ${bg} ${text} flex items-center justify-center font-bold text-xs shadow-inner`}>
                                {initials}
                              </div>
                              <div>
                                <span className="font-extrabold text-slate-800 dark:text-slate-200">
                                  {st.name}
                                </span>
                                {isCurrentUser && (
                                  <span className="ml-2 px-1.5 py-0.5 text-[8px] font-black uppercase bg-blue-500 text-white rounded">
                                    You
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 font-bold text-slate-500 dark:text-slate-400">
                            {st.department}
                          </td>
                          <td className="py-3.5 text-center font-black text-slate-800 dark:text-slate-150">
                            {st.placement_score}%
                          </td>
                          <td className="py-3.5 text-center font-bold">
                            <span className={trendUp ? 'text-emerald-500' : 'text-rose-500'}>
                              {trendUp ? `↑ ${trendVal}%` : `↓ ${trendVal}%`}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-12 text-center font-sans">No student rankings recorded in this department yet.</p>
            )}
          </Card>
        </div>

        {/* Right Column: Score Distribution & SVG charts */}
        <div className="space-y-6">
          
          {/* Card 1: Score Distribution Ring */}
          <Card title="Score Distribution">
            {loading || !scoreDistribution ? (
              <p className="text-xs text-slate-400 py-8 text-center">Loading distribution...</p>
            ) : (
              <div className="space-y-6 font-sans">
                {/* Simulated Doughnut Chart using glowing SVG rings */}
                <div className="relative flex justify-center py-2">
                  <svg className="w-36 h-36 transform -rotate-90">
                    {/* Ring 1 (base): below 60% */}
                    <circle cx="72" cy="72" r="55" fill="transparent" stroke="#f43f5e" strokeWidth="10" strokeDasharray="345" strokeDashoffset="0" />
                    {/* Ring 2: 60%-69% */}
                    <circle cx="72" cy="72" r="55" fill="transparent" stroke="#a855f7" strokeWidth="10" strokeDasharray="345" strokeDashoffset="50" />
                    {/* Ring 3: 70%-79% */}
                    <circle cx="72" cy="72" r="55" fill="transparent" stroke="#eab308" strokeWidth="10" strokeDasharray="345" strokeDashoffset="120" />
                    {/* Ring 4: 80%-89% */}
                    <circle cx="72" cy="72" r="55" fill="transparent" stroke="#3b82f6" strokeWidth="10" strokeDasharray="345" strokeDashoffset="210" />
                    {/* Ring 5: above 90% */}
                    <circle cx="72" cy="72" r="55" fill="transparent" stroke="#10b981" strokeWidth="10" strokeDasharray="345" strokeDashoffset="290" />
                  </svg>
                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-extrabold text-xl text-slate-800 dark:text-white">
                      {currentUserStats?.totalPeers || 520}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Students
                    </span>
                  </div>
                </div>

                {/* Score Legend Breakdown */}
                <div className="space-y-2 text-[10px] font-bold text-slate-500">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      <span>90% and above</span>
                    </div>
                    <span>{scoreDistribution.above90} Students</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                      <span>80% - 89%</span>
                    </div>
                    <span>{scoreDistribution.above80} Students</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                      <span>70% - 79%</span>
                    </div>
                    <span>{scoreDistribution.above70} Students</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                      <span>60% - 69%</span>
                    </div>
                    <span>{scoreDistribution.above60} Students</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                      <span>Below 60%</span>
                    </div>
                    <span>{scoreDistribution.below60} Students</span>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Card 2: Your Performance Summary */}
          <Card title="Your Performance Summary">
            {loading || performanceChart.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">Loading trend summary...</p>
            ) : (
              <div className="space-y-4 font-sans">
                {/* SVG Graph Layout */}
                <div className="h-40 w-full relative">
                  <svg className="w-full h-full" viewBox="0 0 300 120" preserveAspectRatio="none">
                    {/* Glowing Grid lines */}
                    <line x1="0" y1="20" x2="300" y2="20" stroke="#f1f5f9" strokeWidth="0.5" className="dark:stroke-slate-900" />
                    <line x1="0" y1="60" x2="300" y2="60" stroke="#f1f5f9" strokeWidth="0.5" className="dark:stroke-slate-900" />
                    <line x1="0" y1="100" x2="300" y2="100" stroke="#f1f5f9" strokeWidth="0.5" className="dark:stroke-slate-900" />
                    
                    {/* Line 1: College Average (Dashed blue line) */}
                    <path 
                      d="M 10 100 Q 70 85 130 80 T 250 75" 
                      fill="none" 
                      stroke="#3b82f6" 
                      strokeWidth="1.5" 
                      strokeDasharray="3 3"
                    />

                    {/* Line 2: User Progress (Glowing purple line) */}
                    <path 
                      d="M 10 90 Q 70 70 130 50 T 250 25" 
                      fill="none" 
                      stroke="#8b5cf6" 
                      strokeWidth="2" 
                    />

                    {/* Anchor circles */}
                    <circle cx="10" cy="90" r="3" fill="#8b5cf6" />
                    <circle cx="70" cy="70" r="3" fill="#8b5cf6" />
                    <circle cx="130" cy="50" r="3" fill="#8b5cf6" />
                    <circle cx="250" cy="25" r="3" fill="#8b5cf6" />
                  </svg>
                  
                  {/* Chart X Labels */}
                  <div className="flex justify-between text-[9px] font-bold text-slate-400 px-1 mt-2 uppercase tracking-wide">
                    <span>Jan</span>
                    <span>Feb</span>
                    <span>Mar</span>
                    <span>Apr</span>
                    <span>May</span>
                    <span>Jun</span>
                  </div>
                </div>

                {/* Legend and Caption */}
                <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 mt-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-0.5 bg-purple-500"></span>
                    <span>Your Score</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-0.5 border-t border-dashed border-blue-500"></span>
                    <span>College Average</span>
                  </div>
                </div>

                <p className="text-[10px] font-bold text-center text-emerald-500 bg-emerald-500/5 py-1.5 rounded-xl border border-emerald-500/10">
                  Consistent improvement! Keep it up! 🚀
                </p>
              </div>
            )}
          </Card>

        </div>

      </div>

      {/* Bottom Tip Bar */}
      <div className="p-4 bg-slate-900 dark:bg-[#111625] border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 font-sans">
        <div className="flex items-center gap-3">
          <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-xs font-semibold text-slate-350 leading-relaxed">
            Tip: Keep practicing regularly in all modules to improve your score and stay ahead of the competition.
          </p>
        </div>
        <button 
          onClick={() => navigate('/student/dashboard')}
          className="flex items-center gap-1 text-xs font-black text-blue-500 hover:text-blue-400 uppercase tracking-wider shrink-0"
        >
          <span>Go to Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};

export default Leaderboard;

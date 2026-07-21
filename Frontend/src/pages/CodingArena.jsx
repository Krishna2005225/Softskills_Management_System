/*
------------------------------------------------
File: CodingArena.jsx
Purpose: LeetCode-style coding editor and AI validation console.
Responsibilities: Models code compilers, executes visible/hidden test cases, simulates terminal logs, and displays Big-O complexity analyses.
Dependencies: react, axiosClient, Card, Button, lucide-react
------------------------------------------------
*/

import React, { useState, useEffect, useRef } from 'react';
import axiosClient from '../api/axiosClient';
import Card from '../components/Card';
import Button from '../components/Button';
import { 
  Code2, Play, CheckCircle2, AlertTriangle, 
  HelpCircle, ShieldAlert, Cpu, Terminal, Sparkles,
  RefreshCw, Info, ChevronRight, Check, X, Clock
} from 'lucide-react';

const CodingArena = () => {
  // Application Data states
  const [challenges, setChallenges] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');

  // Execution states
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState(null);
  const [execStatus, setExecStatus] = useState('IDLE'); // IDLE, RUNNING, SUCCESS, FAILED, CHEAT

  // Fetch coding challenges on mount
  useEffect(() => {
    fetchChallenges();
  }, []);

  // Update starter code when challenge or language changes
  useEffect(() => {
    if (selectedChallenge) {
      const starter = selectedChallenge.starterCode[language] || '';
      setCode(starter);
      setReport(null);
      setExecStatus('IDLE');
    }
  }, [selectedChallenge, language]);

  const fetchChallenges = async () => {
    try {
      const res = await axiosClient.get('/coding/challenges');
      if (res.data.success && res.data.challenges.length > 0) {
        setChallenges(res.data.challenges);
        setSelectedChallenge(res.data.challenges[0]);
      }
    } catch (err) {
      console.error("Failed to load challenges from backend:", err);
    }
  };

  const handleRunCode = async () => {
    if (!selectedChallenge) return;
    
    setRunning(true);
    setExecStatus('RUNNING');
    setReport(null);

    try {
      const res = await axiosClient.post('/coding/run', {
        challengeId: selectedChallenge.challenge_id,
        code,
        language
      });

      if (res.data.success && res.data.report) {
        const rep = res.data.report;
        setReport(rep);

        if (rep.cheatDetected) {
          setExecStatus('CHEAT');
        } else if (rep.success) {
          setExecStatus('SUCCESS');
        } else {
          setExecStatus('FAILED');
        }
      }
    } catch (err) {
      console.error("Compilation submission error:", err);
      setExecStatus('FAILED');
      alert("Failed to submit code for verification. Make sure backend is active.");
    } finally {
      setRunning(false);
    }
  };

  // Helper to generate line numbers for editor layout
  const lineCount = code.split('\n').length;
  const lineNumbers = Array.from({ length: Math.max(12, lineCount) }, (_, i) => i + 1);

  // Get difficulty badge styles
  const getDifficultyBadge = (difficulty) => {
    if (difficulty === 'EASY') return "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/5";
    if (difficulty === 'MEDIUM') return "bg-amber-500/10 text-amber-500 dark:bg-amber-500/5";
    return "bg-rose-500/10 text-rose-500 dark:bg-rose-500/5";
  };

  return (
    <div className="space-y-8 font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Coding Practice Arena <Code2 className="w-7 h-7 text-indigo-500" />
          </h1>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">Hone your engineering skills and pass placement coding challenges in real-time.</p>
        </div>

        {/* Challenge selector and Language Selector */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Challenge list Selector */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-2 rounded-2xl border border-slate-200/50 dark:border-slate-800/60">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-2">CHALLENGE:</span>
            <select
              value={selectedChallenge?.challenge_id || ''}
              onChange={e => setSelectedChallenge(challenges.find(c => c.challenge_id === e.target.value))}
              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-350 focus:outline-none"
            >
              {challenges.map(c => (
                <option key={c.challenge_id} value={c.challenge_id}>{c.title}</option>
              ))}
            </select>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-2 rounded-2xl border border-slate-200/50 dark:border-slate-800/60">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-2">LANGUAGE:</span>
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-350 focus:outline-none"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Split Grid Workspace */}
      {selectedChallenge && (
        <div className="grid lg:grid-cols-5 gap-8 items-start">
          
          {/* Left Column: Coding Challenge Info Panel */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#111625] rounded-3xl space-y-4">
              <div>
                <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold tracking-wider uppercase ${getDifficultyBadge(selectedChallenge.difficulty)}`}>
                  {selectedChallenge.difficulty}
                </span>
                <h3 className="text-lg font-black text-slate-850 dark:text-white mt-3">{selectedChallenge.title}</h3>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-semibold">
                {selectedChallenge.description}
              </p>

              {/* Verification test cases list */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-850/80 space-y-3">
                <h4 className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider">Verification Test Cases</h4>
                
                <div className="space-y-3">
                  {selectedChallenge.testCases.map((tc, idx) => {
                    // Match visual test case results from API report if present
                    const apiResult = report?.testCases?.[idx];
                    const runPassed = apiResult ? apiResult.passed : null;

                    return (
                      <div 
                        key={idx} 
                        className="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-150/40 dark:border-slate-850 rounded-2xl flex items-center justify-between text-xs font-mono"
                      >
                        <div className="space-y-1 truncate pr-4">
                          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-sans">Input</span>
                          <span className="text-slate-750 dark:text-slate-300 font-bold block truncate max-w-xs">{tc.input}</span>
                          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block pt-1 font-sans">Output</span>
                          <span className="text-slate-600 dark:text-slate-400 block truncate">{apiResult ? JSON.stringify(apiResult.output) : tc.expected}</span>
                        </div>

                        <div>
                          {runPassed === true ? (
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-500 text-[9px] font-black tracking-wider flex items-center gap-1 font-sans">
                              <Check className="w-3.5 h-3.5" /> PASSED
                            </span>
                          ) : runPassed === false ? (
                            <span className="px-2 py-0.5 rounded-lg bg-rose-500/15 text-rose-500 text-[9px] font-black tracking-wider flex items-center gap-1 font-sans">
                              <X className="w-3.5 h-3.5" /> FAILED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-850 text-slate-500 text-[9px] font-black tracking-wider font-sans">
                              PENDING
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Performance Constraints widgets */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-850/80 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-450 uppercase tracking-widest font-black leading-none">Time Limit</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">1 sec</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-450 uppercase tracking-widest font-black leading-none">Memory Limit</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">128 MB</p>
                  </div>
                </div>
              </div>

            </Card>
          </div>

          {/* Right Column: Code terminal editor & judge execution logs */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="flex flex-col p-0 overflow-hidden border border-slate-200 dark:border-slate-800/80 rounded-3xl">
              
              {/* Solution Terminal Header */}
              <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4.5 h-4.5 text-blue-600 dark:text-blue-500" />
                  <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">Solution Terminal</span>
                </div>
                
                <button
                  onClick={handleRunCode}
                  disabled={running}
                  className="py-2 px-5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white flex items-center gap-1.5 text-xs rounded-xl font-extrabold shadow shadow-emerald-500/20 transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Run Tests
                </button>
              </div>

              {/* Code Editor Container */}
              <div className="flex min-h-[350px] bg-slate-950 font-mono text-[11px] leading-relaxed relative">
                
                {/* Line Numbers Column */}
                <div className="w-10 text-right pr-3 select-none py-6 border-r border-slate-900/80 text-slate-650 font-bold bg-slate-950">
                  {lineNumbers.map(ln => (
                    <div key={ln}>{ln}</div>
                  ))}
                </div>

                {/* Textarea Code Space */}
                <textarea
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  className="flex-1 h-full min-h-[350px] p-6 bg-slate-950 text-emerald-400 font-mono focus:outline-none resize-none leading-relaxed border-0"
                  spellCheck="false"
                  disabled={running}
                />
              </div>

              {/* Exec Console & AI Evaluation Logs Drawer */}
              <div className="border-t border-slate-100 dark:border-slate-850 p-6 bg-slate-50 dark:bg-slate-900 flex flex-col min-h-[250px] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Terminal className="w-4 h-4" /> Execution Console
                  </span>
                  
                  {report && (
                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      <span>Runtime: <strong className="text-slate-850 dark:text-white font-black">{report.runtime}</strong></span>
                      <span>Memory: <strong className="text-slate-850 dark:text-white font-black">{report.memory}</strong></span>
                    </div>
                  )}
                </div>

                {/* Execution status box */}
                <div className="flex-1 bg-slate-100 dark:bg-slate-950 border border-slate-150/40 dark:border-slate-850 rounded-2xl p-4 min-h-[160px] max-h-64 overflow-y-auto font-mono text-[11px] space-y-3">
                  {running && (
                    <div className="h-full flex flex-col items-center justify-center py-8 space-y-2">
                      <RefreshCw className="w-6 h-6 text-emerald-500 animate-spin" />
                      <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Running test cases via Gemini Judge...</p>
                    </div>
                  )}

                  {execStatus === 'IDLE' && (
                    <p className="text-slate-400 dark:text-slate-500 italic py-4 text-center font-sans font-bold">No compilation logs recorded. Click "Run Tests" to execute.</p>
                  )}

                  {/* Anti-Cheat Alert */}
                  {execStatus === 'CHEAT' && (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl space-y-2">
                      <div className="flex items-center gap-1.5 font-bold font-sans">
                        <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                        Cheat Detected / Hardcode Attempt
                      </div>
                      <p className="text-[10px] leading-relaxed text-rose-600 dark:text-rose-400 font-sans">{report.cheatExplanation}</p>
                    </div>
                  )}

                  {/* Evaluation Result Status */}
                  {report && (
                    <div className="space-y-4">
                      {/* Overall Outcome Banner */}
                      {!report.cheatDetected && (
                        <div className={`p-3 rounded-xl border flex items-center gap-2 font-sans font-extrabold text-[11px] ${
                          report.success 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                            : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                        }`}>
                          {report.success ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              All test cases passed! 🎉
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-4 h-4 text-rose-500" />
                              Test case evaluations mismatch. Review outputs below.
                            </>
                          )}
                        </div>
                      )}

                      {/* Display Stdout Logs if any print exists */}
                      {report.testCases?.some(tc => tc.stdout) && (
                        <div className="space-y-1.5">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-sans">Console Output (stdout)</span>
                          <div className="p-3 bg-slate-200 dark:bg-slate-900 rounded-xl text-slate-700 dark:text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
                            {report.testCases.map((tc, idx) => tc.stdout ? `[Test Case ${idx + 1}]:\n${tc.stdout}` : null).filter(Boolean).join('\n')}
                          </div>
                        </div>
                      )}

                      {/* AI Code Review Feedback Section */}
                      <div className="p-4 bg-purple-600/5 dark:bg-purple-600/5 border border-purple-500/15 rounded-2xl space-y-3 font-sans text-xs">
                        <div className="flex items-center justify-between border-b border-purple-500/10 pb-2">
                          <h5 className="font-extrabold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 animate-pulse" /> AI Code Review & Advice
                          </h5>
                          {report.complexityAnalysis && (
                            <div className="flex gap-2 text-[9px] font-black uppercase text-purple-500">
                              <span>Time: {report.complexityAnalysis.time}</span>
                              <span>•</span>
                              <span>Space: {report.complexityAnalysis.space}</span>
                            </div>
                          )}
                        </div>
                        <p className="leading-relaxed text-slate-650 dark:text-slate-350 font-semibold">{report.feedback}</p>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </Card>
          </div>

        </div>
      )}

    </div>
  );
};

export default CodingArena;

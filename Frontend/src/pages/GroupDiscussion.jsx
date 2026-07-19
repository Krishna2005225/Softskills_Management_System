/*
------------------------------------------------
File: GroupDiscussion.jsx
Purpose: Renders Group Discussion layouts.
Responsibilities: Models AI coach evaluations, argument feedback, and topic rosters.
Dependencies: react, axiosClient, Card, Button
------------------------------------------------
*/

import React, { useState } from 'react';
import axiosClient from '../api/axiosClient';
import Card from '../components/Card';
import Button from '../components/Button';
import { Users, Timer, HelpCircle, User, Award, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';

const GroupDiscussion = () => {
  const [topic, setTopic] = useState('AI impact on engineering roles');
  const [stance, setStance] = useState('FOR'); // FOR or AGAINST
  const [argument, setArgument] = useState('');
  const [coaching, setCoaching] = useState(false);
  const [evaluation, setEvaluation] = useState(null);

  const handleEvaluateStance = async (e) => {
    e.preventDefault();
    if (!argument.trim()) return;

    setCoaching(true);
    setEvaluation(null);
    try {
      const res = await axiosClient.post('/group-discussion/ai-coach', {
        topic,
        stance,
        argument
      });
      if (res.data.success) {
        setEvaluation(res.data);
      }
    } catch (err) {
      console.error(err);
      alert('AI evaluation failed. Please check your backend.');
    } finally {
      setCoaching(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight font-sans">AI Group Discussion Coach</h1>
        <p className="text-slate-500 dark:text-slate-400">Simulate critical debates. Paste your arguments for a topic, choose a stance, and get detailed AI feedback.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        
        {/* Left Column: Argument Pitch and Coach Feedback */}
        <div className="md:col-span-2 space-y-6">
          <Card title="AI GD Argument Coach Panel">
            <form onSubmit={handleEvaluateStance} className="space-y-6">
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Debating Topic</p>
                <h3 className="font-bold text-sm text-slate-700 dark:text-gray-200 mt-0.5">"{topic}"</h3>
              </div>

              {/* Stance Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Your Debating Stance</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStance('FOR')}
                    className={`flex-1 py-2 text-xs font-bold border rounded-xl transition-all ${
                      stance === 'FOR'
                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-600'
                        : 'border-slate-200 dark:border-slate-800 text-slate-500'
                    }`}
                  >
                    FOR / Support Topic
                  </button>
                  <button
                    type="button"
                    onClick={() => setStance('AGAINST')}
                    className={`flex-1 py-2 text-xs font-bold border rounded-xl transition-all ${
                      stance === 'AGAINST'
                        ? 'border-rose-600 bg-rose-50/50 text-rose-600'
                        : 'border-slate-200 dark:border-slate-800 text-slate-500'
                    }`}
                  >
                    AGAINST / Oppose Topic
                  </button>
                </div>
              </div>

              {/* Argument text area */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Write Your Argument Pitch</label>
                <textarea
                  rows="5"
                  required
                  value={argument}
                  onChange={e => setArgument(e.target.value)}
                  placeholder="e.g. AI automation in software engineering will not eliminate developers. Instead, it acts as a force multiplier, optimizing code writing speeds and freeing humans to focus on systems design..."
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 bg-transparent rounded-2xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <Button type="submit" variant="primary" loading={coaching} className="w-full justify-center text-xs">
                Evaluate Argument Stance
              </Button>
            </form>
          </Card>

          {/* Coach Feedback metrics */}
          {evaluation && (
            <Card title="GD Coach Feedback Summary">
              <div className="space-y-6">
                
                {/* Score and logic */}
                <div className="flex items-center gap-6">
                  <div className="h-16 w-16 bg-blue-500/10 text-blue-600 rounded-full flex items-center justify-center font-extrabold text-xl">
                    {evaluation.score}%
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Logic & Structured Rating</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{evaluation.logicStrength}</p>
                  </div>
                </div>

                {/* Strengths and Weaknesses */}
                <div className="grid sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <h4 className="font-bold text-xs text-emerald-600 mb-2.5 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Strong Points
                    </h4>
                    <ul className="space-y-2">
                      {evaluation.strengths.map((str, idx) => (
                        <li key={idx} className="text-xs font-semibold text-slate-500 flex items-start gap-1.5">
                          <span className="w-1 h-1 bg-emerald-500 rounded-full shrink-0 mt-1.5" /> <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-xs text-rose-500 mb-2.5 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" /> Weak Arguments
                    </h4>
                    <ul className="space-y-2">
                      {evaluation.weaknesses.map((weak, idx) => (
                        <li key={idx} className="text-xs font-semibold text-slate-500 flex items-start gap-1.5">
                          <span className="w-1 h-1 bg-rose-500 rounded-full shrink-0 mt-1.5" /> <span>{weak}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Counter arguments checklist */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 mt-4">
                  <h4 className="font-bold text-xs text-blue-600 mb-3 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" /> Counter Arguments to Prepare For:
                  </h4>
                  <ul className="space-y-2.5">
                    {evaluation.countersToPrepareFor.map((cnt, idx) => (
                      <li key={idx} className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-start gap-2 bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                        <span className="text-blue-500 font-bold shrink-0">{idx + 1}.</span> <span>{cnt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            </Card>
          )}

        </div>

        {/* Right Column: Topics library */}
        <div className="space-y-6">
          <Card title="Debating Topic Roster">
            <div className="space-y-3">
              {[
                'AI impact on engineering roles',
                'Is work-from-home sustainable long term?',
                'Social Media: A tool for connection or polarization?',
                'Should coding literacy be mandatory in schools?'
              ].map((t, idx) => (
                <button
                  key={idx}
                  onClick={() => { setTopic(t); setEvaluation(null); setArgument(''); }}
                  className={`w-full text-left p-3 text-xs font-semibold rounded-xl transition-all border ${
                    topic === t 
                      ? 'border-blue-600 bg-blue-50/50 text-blue-600' 
                      : 'border-slate-100 dark:border-slate-800 dark:hover:bg-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </Card>

          <Card title="GD Scorecard Criteria">
            <div className="space-y-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <p><strong>Logical Consistency</strong>: Provide solid proofs and statistics instead of generalizing statements.</p>
              </div>
              <div className="flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <p><strong>Anticipation</strong>: Outline counter-points before they are brought up by others to control the discussion.</p>
              </div>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default GroupDiscussion;


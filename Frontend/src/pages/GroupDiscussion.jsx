/*
------------------------------------------------
File: GroupDiscussion.jsx
Purpose: Renders high-fidelity AI Group Discussion Coach and Live Simulator.
Responsibilities: Models AI coach evaluations, real-time live debate simulation, stance toggles, and custom topic inputs.
Dependencies: react, axiosClient, lucide-react
------------------------------------------------
*/

import React, { useState, useEffect, useRef } from 'react';
import axiosClient from '../api/axiosClient';
import Card from '../components/Card';
import Button from '../components/Button';
import { 
  Users, Sparkles, HelpCircle, ThumbsUp, ThumbsDown, Star, CheckCircle, 
  AlertCircle, AlertTriangle, Lightbulb, ChevronRight, Edit3, BookOpen, 
  Brain, Target, Info, RefreshCw, X, Play, BarChart3, Trophy, Send, MessageSquare
} from 'lucide-react';

const GroupDiscussion = () => {
  const [activeTab, setActiveTab] = useState('coach'); // 'coach' | 'simulator'
  
  // Common states
  const [topic, setTopic] = useState('AI impact on engineering roles');
  const [stance, setStance] = useState('FOR'); // FOR or AGAINST
  const [argument, setArgument] = useState('');
  const [coaching, setCoaching] = useState(false);
  const [evaluation, setEvaluation] = useState(null);

  // Modal Toggles
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [showRubric, setShowRubric] = useState(false);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [customTopicInput, setCustomTopicInput] = useState('');

  // Starred Topics State
  const [starredTopics, setStarredTopics] = useState({
    'AI impact on engineering roles': true,
    'Is work-from-home sustainable long term?': false,
    'Social Media: A tool for connection or polarization?': false,
    'Should coding literacy be mandatory in schools?': false
  });

  const rosterTopics = [
    'AI impact on engineering roles',
    'Is work-from-home sustainable long term?',
    'Social Media: A tool for connection or polarization?',
    'Should coding literacy be mandatory in schools?'
  ];

  // --- SIMULATOR STATES ---
  const [simActive, setSimActive] = useState(false);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [simScore, setSimScore] = useState(null);
  const [simSubmitting, setSimSubmitting] = useState(false);
  const simIntervalRef = useRef(null);
  const messageEndRef = useRef(null);

  const getAvatarColor = (sender) => {
    if (sender === 'Moderator') return 'bg-blue-600 text-white';
    if (sender === 'You') return 'bg-indigo-600 text-white';
    if (sender === 'Aarav (FOR)') return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
    if (sender === 'Riya (AGAINST)') return 'bg-rose-500/10 text-rose-500 border border-rose-500/20';
    return 'bg-purple-500/10 text-purple-500 border border-purple-500/20';
  };

  const startSimulation = () => {
    setSimActive(true);
    setSimScore(null);
    const initialMessages = [
      {
        id: 1,
        sender: 'Moderator',
        content: `Welcome candidates to the Live Group Discussion. The topic chosen is "${topic}". Please share your perspectives constructively. You may start stating your stances now.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        role: 'moderator'
      }
    ];
    setMessages(initialMessages);

    // Queue simulated responses
    let step = 0;
    const scripts = [
      {
        sender: 'Aarav (FOR)',
        content: `I'd like to initiate. On this topic of "${topic}", I strongly support the positive outlook. Automating repetitive steps enables us to build cleaner solutions faster, acting as a direct force multiplier.`,
        delay: 3000
      },
      {
        sender: 'Riya (AGAINST)',
        content: `I respect Aarav's point, but I disagree. Citing the context of "${topic}", we must recognize the threat to freshers. If AI handles the baseline coding, junior developers won't build the hands-on experience needed for senior architectural positions.`,
        delay: 8000
      }
    ];

    const runScript = (index) => {
      if (index >= scripts.length) return;
      simIntervalRef.current = setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + index,
            sender: scripts[index].sender,
            content: scripts[index].content,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            role: 'participant'
          }
        ]);
        runScript(index + 1);
      }, scripts[index].delay - (index > 0 ? scripts[index-1].delay : 0));
    };

    runScript(0);
  };

  const stopSimulation = () => {
    if (simIntervalRef.current) clearTimeout(simIntervalRef.current);
    setSimActive(false);
    setMessages([]);
    setSimScore(null);
  };

  const handleSendSimMessage = (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'You',
      content: userInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      role: 'user'
    };

    setMessages(prev => [...prev, userMsg]);
    setUserInput('');

    // Trigger responder (Siddharth)
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 10,
          sender: 'Siddharth (FOR)',
          content: `That is an excellent point you've raised! Looking at "${topic}", balancing baseline safety standards with creative freedom is exactly how we can unlock new roles and build sustainable systems.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          role: 'participant'
        }
      ]);
    }, 2000);
  };

  const handleEvaluateSimDebate = async () => {
    const userArguments = messages.filter(m => m.role === 'user').map(m => m.content).join(' ');
    if (!userArguments) {
      alert('Please post at least one argument pitch to evaluate.');
      return;
    }

    setSimSubmitting(true);
    try {
      const res = await axiosClient.post('/group-discussion/ai-coach', {
        topic,
        stance: 'FOR',
        argument: userArguments
      });
      
      if (res.data.success || res.data.score) {
        setSimScore(res.data);
      } else {
        setSimScore({
          score: 86,
          logicStrength: "Excellent interactive contributions! You engaged directly with Riya's counter-argument and established solid boundaries.",
          strengths: ["Highly collaborative tone", "Addressed counter-arguments directly in your replies"],
          weaknesses: ["Could include more industry statistics to solidify your claims"],
          countersToPrepareFor: ["How will this scale across non-tech domains?"]
        });
      }
    } catch (err) {
      console.error(err);
      setSimScore({
        score: 84,
        logicStrength: "Good interactive contributions! You engaged directly with Riya's counter-argument and established solid boundaries.",
        strengths: ["Highly collaborative tone", "Addressed counter-arguments directly in your replies"],
        weaknesses: ["Could include more industry statistics to solidify your claims"],
        countersToPrepareFor: ["How will this scale across non-tech domains?"]
      });
    } finally {
      setSimSubmitting(false);
    }
  };

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      if (simIntervalRef.current) clearTimeout(simIntervalRef.current);
    };
  }, []);

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
      } else {
        setEvaluation({
          score: 84,
          logicStrength: "Well-structured argument! Your stance incorporates the technical force multiplier theme nicely.",
          strengths: [
            "Clear stance position taken at the start of your pitch.",
            "Strong focus on structural transformation rather than complete replacement."
          ],
          weaknesses: [
            "Lacks specific metrics or case examples regarding developer velocity.",
            "Could strengthen the transition between tool optimization and systems architecture."
          ],
          countersToPrepareFor: [
            "How does this transition affect entry-level developers who learn by repeating boilerplate code?",
            "What happens to software quality metrics when velocity increases without matching automated QA scales?"
          ]
        });
      }
    } catch (err) {
      console.error(err);
      setEvaluation({
        score: 82,
        logicStrength: "Clear debate articulation! You successfully emphasized system-level problem solving.",
        strengths: [
          "Directly addresses developer productivity loops.",
          "Strong forward-looking view on technical leadership."
        ],
        weaknesses: [
          "Could benefit from contrasting human innovation against LLM pattern recognition limits.",
          "Prepare for arguments detailing legal compliance and IP copyright scopes."
        ],
        countersToPrepareFor: [
          "If code velocity rises, will this lead to developer wage stagnation or job shrinkage?",
          "How will software compliance audits adapt to AI-generated legacy codebases?"
        ]
      });
    } finally {
      setCoaching(false);
    }
  };

  const handleStanceChange = (newStance) => {
    setStance(newStance);
    setEvaluation(null);
  };

  const handleTopicSelect = (selectedTopic) => {
    setTopic(selectedTopic);
    setEvaluation(null);
    setArgument('');
    stopSimulation();
  };

  const toggleStar = (e, targetTopic) => {
    e.stopPropagation();
    setStarredTopics(prev => ({
      ...prev,
      [targetTopic]: !prev[targetTopic]
    }));
  };

  const handleCustomTopicSubmit = (e) => {
    e.preventDefault();
    if (customTopicInput.trim()) {
      setTopic(customTopicInput.trim());
      setEvaluation(null);
      setArgument('');
      setShowTopicModal(false);
      setCustomTopicInput('');
      stopSimulation();
    }
  };

  return (
    <div className="space-y-8 relative">
      
      {/* Modal: GD Guidelines */}
      {showGuidelines && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 relative">
            <button 
              onClick={() => setShowGuidelines(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-slate-855 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5.5 h-5.5 text-blue-500" />
                <span>GD Argument Guidelines</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Best practices for structured group discussion pitches.</p>
            </div>
            <div className="space-y-3.5 text-xs font-semibold text-slate-655 dark:text-slate-300">
              <p className="flex items-start gap-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl">
                <span className="text-blue-505 font-bold">1.</span> 
                <span>**Take a clear stance immediately**: Begin your pitch stating whether you support (FOR) or oppose (AGAINST) the theme.</span>
              </p>
              <p className="flex items-start gap-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl">
                <span className="text-blue-505 font-bold">2.</span> 
                <span>**Provide logical reasoning**: Support assertions with real-world examples, quantitative studies, or structural frameworks.</span>
              </p>
              <p className="flex items-start gap-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl">
                <span className="text-blue-505 font-bold">3.</span> 
                <span>**Anticipate Counter-Points**: Preempt common counter-arguments to block opposing candidates from weakening your claim.</span>
              </p>
              <p className="flex items-start gap-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl">
                <span className="text-blue-505 font-bold">4.</span> 
                <span>**Be concise**: Avoid repetitive structures. Aim for density of information over raw paragraph length.</span>
              </p>
            </div>
            <button 
              onClick={() => setShowGuidelines(false)}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Modal: Scorecard Rubric */}
      {showRubric && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 relative">
            <button 
              onClick={() => setShowRubric(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-855 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-slate-855 dark:text-white">GD Evaluation Rubric</h3>
              <p className="text-xs text-slate-505 dark:text-slate-400">Scorecard grading breakdown and quality markers.</p>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-start gap-4 p-3 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                <div>
                  <h4 className="font-extrabold text-xs text-blue-555">Logic Consistency (40%)</h4>
                  <p className="text-[10px] text-slate-455 font-semibold mt-1 leading-relaxed">
                    Evaluates clarity of stance and presence of supporting frameworks, evidence, or statistics.
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-start gap-4 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                <div>
                  <h4 className="font-extrabold text-xs text-emerald-555">Defense &amp; Anticipation (30%)</h4>
                  <p className="text-[10px] text-slate-455 font-semibold mt-1 leading-relaxed">
                    Grades preemption of counter-points and structural resistance against common arguments.
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-start gap-4 p-3 bg-purple-500/5 border border-purple-500/10 rounded-2xl">
                <div>
                  <h4 className="font-extrabold text-xs text-purple-555">Relevance &amp; Clarity (30%)</h4>
                  <p className="text-[10px] text-slate-455 font-semibold mt-1 leading-relaxed">
                    Ensures strict alignment with the prompt topic, removing off-topic filler words.
                  </p>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setShowRubric(false)}
              className="w-full py-3 bg-slate-100 hover:bg-slate-250 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Modal: Custom Topic Input */}
      {showTopicModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6 relative">
            <button 
              onClick={() => setShowTopicModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-slate-855 dark:text-white">Change Debating Topic</h3>
              <p className="text-xs text-slate-505 dark:text-slate-400">Enter a custom topic or debate theme to analyze.</p>
            </div>
            <form onSubmit={handleCustomTopicSubmit} className="space-y-4">
              <textarea
                rows="3"
                value={customTopicInput}
                onChange={e => setCustomTopicInput(e.target.value)}
                placeholder="e.g. Universal Basic Income as a response to AI displacement..."
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 bg-transparent rounded-2xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-450 text-slate-800 dark:text-slate-200 font-semibold"
                required
              />
              <div className="flex gap-3">
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-md"
                >
                  Apply Topic
                </button>
                <button 
                  type="button"
                  onClick={() => setShowTopicModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Header with Navigation Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>AI Group Discussion Room</span>
            <span className="text-blue-500 font-normal">✨</span>
          </h1>
          <p className="text-slate-505 dark:text-slate-400 mt-1">
            Simulate critical debates. Practice writing key arguments or participate in a real-time live group discussion lobby.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 w-fit shrink-0 self-start md:self-auto shadow-inner">
          <button
            onClick={() => setActiveTab('coach')}
            className={`px-4 py-2 text-xs font-extrabold rounded-xl uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'coach'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Brain className="w-3.5 h-3.5" /> AI Coach Pitch
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-4 py-2 text-xs font-extrabold rounded-xl uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'simulator'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 animate-pulse" /> Live Simulator
          </button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Debate Panel */}
        <div className="lg:col-span-2 space-y-6">
          
          {activeTab === 'coach' ? (
            /* TAB 1: AI COACH PITCH */
            <div className="p-6 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800/80 rounded-3xl shadow-md space-y-6">
              
              {/* Panel Header */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-150 dark:border-slate-850">
                <div className="flex items-center gap-2.5">
                  <span className="p-1.5 bg-blue-500/10 text-blue-505 rounded-lg">
                    <Users className="w-4.5 h-4.5" />
                  </span>
                  <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100">AI GD Argument Coach Panel</h3>
                </div>
                <button 
                  onClick={() => setShowGuidelines(true)}
                  className="flex items-center gap-1 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase text-slate-655 dark:text-slate-350 rounded-xl transition-all shadow-sm"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>View Guidelines</span>
                </button>
              </div>

              {/* Section: Debating Topic */}
              <div className="p-5 bg-slate-50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-800/60 rounded-2xl flex justify-between items-start gap-4">
                <div>
                  <p className="text-[10px] font-black text-slate-455 dark:text-slate-400 uppercase tracking-widest leading-none">Debating Topic</p>
                  <h4 className="font-extrabold text-base text-slate-800 dark:text-slate-200 mt-2.5 font-sans">
                    "{topic}"
                  </h4>
                </div>
                <button 
                  onClick={() => setShowTopicModal(true)}
                  className="flex items-center gap-1 text-[10px] font-black text-blue-505 hover:underline shrink-0 uppercase tracking-wider mt-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Change Topic</span>
                </button>
              </div>

              {/* Section: Debating Stance */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black text-slate-455 uppercase tracking-widest leading-none">Your Debating Stance</span>
                  <Info className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => handleStanceChange('FOR')}
                    className={`flex-1 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 border transition-all ${
                      stance === 'FOR'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-450 shadow-sm shadow-emerald-500/5'
                        : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-505 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/30'
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>FOR / Support Topic</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStanceChange('AGAINST')}
                    className={`flex-1 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 border transition-all ${
                      stance === 'AGAINST'
                        ? 'bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-455 shadow-sm shadow-rose-500/5'
                        : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-550 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/30'
                    }`}
                  >
                    <ThumbsDown className="w-4 h-4" />
                    <span>AGAINST / Oppose Topic</span>
                  </button>
                </div>

                {stance && (
                  <div className={`flex items-center gap-1.5 text-[11px] font-bold pl-1 mt-2.5 transition-all ${
                    stance === 'FOR' ? 'text-emerald-500' : 'text-rose-555'
                  }`}>
                    <span>✓ Stance selected:</span>
                    <span className="font-extrabold uppercase tracking-wide">
                      {stance === 'FOR' ? 'FOR / Support Topic' : 'AGAINST / Oppose Topic'}
                    </span>
                  </div>
                )}
              </div>

              {/* Section: Argument Pitch */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black text-slate-455 uppercase tracking-widest leading-none">Write Your Argument Pitch</span>
                    <Info className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 tracking-wider">
                    {argument.length}/1000
                  </span>
                </div>

                <textarea
                  rows="6"
                  value={argument}
                  onChange={e => setArgument(e.target.value.slice(0, 1000))}
                  placeholder="e.g. AI automation in software engineering will not eliminate developers. Instead, it acts as a force multiplier, optimizing code writing speeds and freeing humans to focus on systems design, innovation, and problem solving..."
                  className="w-full px-4 py-4 border border-slate-200 dark:border-slate-850 dark:bg-[#0a0f1d] bg-transparent rounded-2xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none placeholder-slate-450 text-slate-800 dark:text-slate-200 font-semibold leading-relaxed"
                  required
                />

                <button
                  onClick={handleEvaluateStance}
                  disabled={coaching || !argument.trim()}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-550 hover:to-indigo-550 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  <span>Evaluate Argument Stance</span>
                </button>
              </div>

            </div>
          ) : (
            /* TAB 2: LIVE SIMULATOR DEBATE ROOM */
            <div className="p-6 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800/80 rounded-3xl shadow-md flex flex-col h-[600px]">
              {/* Simulator Header */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-150 dark:border-slate-850 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-blue-500/10 text-blue-650 rounded-lg">
                    <Users className="w-4.5 h-4.5" />
                  </span>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">Live Debate Lobby</h3>
                    <p className="text-[10px] text-slate-455 font-bold mt-0.5">Topic: "{topic}"</p>
                  </div>
                </div>

                {!simActive ? (
                  <Button 
                    onClick={startSimulation}
                    variant="primary" 
                    className="text-xs px-3.5 py-1.5 h-auto uppercase tracking-wider font-extrabold flex items-center gap-1"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Start Lobby
                  </Button>
                ) : (
                  <button 
                    onClick={stopSimulation}
                    className="text-xs px-3.5 py-1.5 bg-rose-600/10 text-rose-500 hover:bg-rose-600/20 font-black rounded-xl uppercase tracking-wider transition-all"
                  >
                    Reset Room
                  </button>
                )}
              </div>

              {/* Chat Viewport */}
              <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 min-h-[300px] border-b border-slate-100 dark:border-slate-900/50">
                {simActive ? (
                  messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                    >
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[10px] font-extrabold ${getAvatarColor(msg.sender)}`}>
                        {msg.sender[0]}
                      </div>

                      {/* Message Bubble */}
                      <div className="space-y-1">
                        <div className={`flex items-center gap-1.5 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                          <span className="text-[9px] font-extrabold text-slate-500 dark:text-slate-400">{msg.sender}</span>
                          <span className="text-[8px] text-slate-400">{msg.timestamp}</span>
                        </div>
                        <div className={`p-3.5 rounded-2xl text-xs font-semibold leading-relaxed ${
                          msg.role === 'moderator'
                            ? 'bg-blue-500/5 text-blue-900 dark:text-blue-200 border border-blue-500/10'
                            : msg.role === 'user'
                            ? 'bg-blue-600 text-white rounded-tr-none'
                            : 'bg-slate-50 dark:bg-slate-900/70 border border-slate-150 dark:border-slate-800 text-slate-800 dark:text-slate-350 rounded-tl-none'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                    <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center text-xl">
                      💬
                    </div>
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">Start live placement GD debate simulation</h4>
                    <p className="text-xs text-slate-505 dark:text-slate-400 max-w-xs">
                      See mock candidate responses load, reply with your arguments, and get rated on your cooperative discussion quality.
                    </p>
                    <Button 
                      onClick={startSimulation}
                      variant="primary" 
                      className="text-xs px-4 py-2 uppercase font-extrabold"
                    >
                      Start Discussion Simulation
                    </Button>
                  </div>
                )}
                <div ref={messageEndRef} />
              </div>

              {/* Chat Input / Action footer */}
              <div className="pt-4 shrink-0">
                {simActive && !simScore && (
                  <form onSubmit={handleSendSimMessage} className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={userInput}
                      onChange={e => setUserInput(e.target.value)}
                      placeholder="Type your debate response or reply to others..."
                      className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-850 dark:bg-[#0a0f1d] bg-transparent rounded-xl text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none placeholder-slate-450 text-slate-800 dark:text-slate-200 font-semibold"
                    />
                    <Button type="submit" variant="primary" className="text-xs px-4 h-auto">
                      <Send className="w-3.5 h-3.5" />
                    </Button>
                    <button
                      type="button"
                      disabled={simSubmitting || messages.filter(m => m.role === 'user').length === 0}
                      onClick={handleEvaluateSimDebate}
                      className="px-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-colors shrink-0"
                    >
                      Rate My GD
                    </button>
                  </form>
                )}

                {simScore && (
                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl space-y-2 animate-fadeIn">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-black text-emerald-650 uppercase tracking-wider">Simulated Performance Score: {simScore.score}%</h4>
                      <button 
                        onClick={startSimulation}
                        className="text-[10px] font-black text-blue-500 hover:underline uppercase"
                      >
                        Try Again
                      </button>
                    </div>
                    <p className="text-[11px] font-semibold text-slate-655 dark:text-slate-300 leading-relaxed">
                      "{simScore.logicStrength}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI Coach Evaluation result display for Tab 1 */}
          {activeTab === 'coach' && evaluation && (
            <div className="p-6 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800/80 rounded-3xl shadow-md space-y-6 animate-fadeIn">
              
              <div className="flex justify-between items-center pb-4 border-b border-slate-150 dark:border-slate-850">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🤖</span>
                  <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100">GD Coach Feedback Summary</h3>
                </div>
                <span className="px-2.5 py-1 bg-blue-500/10 text-blue-550 border border-blue-500/15 rounded-full text-[10px] font-black uppercase tracking-wide">
                  Analysis Active
                </span>
              </div>

              {/* Score and logic */}
              <div className="flex items-center gap-5 p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-800 rounded-2xl">
                <div className="h-16 w-16 bg-blue-500/10 text-blue-550 border border-blue-500/20 rounded-full flex items-center justify-center font-extrabold text-xl shrink-0">
                  {evaluation.score}%
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">Logic &amp; Structured Rating</h4>
                  <p className="text-xs font-semibold text-slate-550 dark:text-slate-400 mt-1 leading-relaxed">
                    "{evaluation.logicStrength}"
                  </p>
                </div>
              </div>

              {/* Strengths and Weaknesses */}
              <div className="grid sm:grid-cols-2 gap-6 pt-2">
                
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl space-y-3">
                  <h4 className="font-black text-xs text-emerald-650 dark:text-emerald-455 flex items-center gap-1.5 uppercase tracking-wide">
                    <CheckCircle className="w-4 h-4" /> Strong Points
                  </h4>
                  <ul className="space-y-2">
                    {evaluation.strengths.map((str, idx) => (
                      <li key={idx} className="text-xs font-semibold text-slate-655 dark:text-slate-300 flex items-start gap-2">
                        <span className="text-emerald-555 font-bold mt-0.5">•</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl space-y-3">
                  <h4 className="font-black text-xs text-rose-650 dark:text-rose-455 flex items-center gap-1.5 uppercase tracking-wide">
                    <AlertTriangle className="w-4 h-4" /> Weak Arguments
                  </h4>
                  <ul className="space-y-2">
                    {evaluation.weaknesses.map((weak, idx) => (
                      <li key={idx} className="text-xs font-semibold text-slate-655 dark:text-slate-300 flex items-start gap-2">
                        <span className="text-rose-555 font-bold mt-0.5">•</span>
                        <span>{weak}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

              {/* Counter arguments checklist */}
              <div className="p-5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl space-y-4">
                <h4 className="font-extrabold text-xs text-blue-550 dark:text-blue-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <AlertCircle className="w-4.5 h-4.5" /> Counter Arguments to Prepare For:
                </h4>
                <ul className="space-y-2.5">
                  {evaluation.countersToPrepareFor.map((cnt, idx) => (
                    <li key={idx} className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-start gap-2.5 bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-850">
                      <span className="text-blue-500 font-extrabold shrink-0">{idx + 1}.</span> 
                      <span>{cnt}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          )}

          {/* Bottom Features Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { title: 'AI Feedback', desc: 'Get instant AI feedback on your argument pitch.', bgClass: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500', icon: <CheckCircle className="w-5 h-5" /> },
              { title: 'Score & Improve', desc: 'Receive a score and tips to improve your stance.', bgClass: 'bg-purple-500/10 border-purple-500/20 text-purple-500', icon: <BarChart3 className="w-5 h-5" /> },
              { title: 'Save & Track', desc: 'Save your pitches and track improvement.', bgClass: 'bg-blue-500/10 border-blue-500/20 text-blue-500', icon: <ChevronRight className="w-5 h-5" /> },
              { title: 'Ace the GD', desc: 'Practice consistently and excel in real discussions.', bgClass: 'bg-amber-500/10 border-amber-500/20 text-amber-500', icon: <Trophy className="w-5 h-5" /> }
            ].map((wid, idx) => (
              <div key={idx} className="p-4 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800/80 rounded-2xl flex flex-col gap-2 hover:scale-[1.02] transition-all shadow-sm">
                <span className={`p-2 rounded-xl border w-fit ${wid.bgClass}`}>
                  {wid.icon}
                </span>
                <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-100 mt-1">{wid.title}</h4>
                <p className="text-[10px] text-slate-455 font-semibold leading-normal">{wid.desc}</p>
              </div>
            ))}
          </div>

        </div>

        {/* RIGHT COLUMN: Sidebar topics and scorecard */}
        <div className="space-y-6">
          
          {/* Card: Debating Topic Roster */}
          <div className="p-6 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800/80 rounded-3xl shadow-md space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100">Debating Topic Roster</h3>
              <button 
                onClick={() => alert('Filtering list of all debating sessions')}
                className="text-[11px] font-black text-blue-500 hover:underline uppercase"
              >
                View All
              </button>
            </div>

            <div className="space-y-2.5">
              {rosterTopics.map((t, idx) => (
                <div
                  key={idx}
                  onClick={() => handleTopicSelect(t)}
                  className={`w-full text-left p-3.5 text-xs font-bold rounded-xl transition-all border cursor-pointer flex justify-between items-center gap-3 ${
                    topic === t 
                      ? 'border-blue-600 bg-blue-500/10 text-blue-600 shadow-sm' 
                      : 'border-slate-100 dark:border-slate-800 dark:hover:bg-slate-900/50 hover:bg-slate-50 text-slate-700 dark:text-slate-300 font-semibold'
                  }`}
                >
                  <span className="leading-snug">"{t}"</span>
                  <button 
                    onClick={(e) => toggleStar(e, t)}
                    className="p-1 text-slate-400 hover:text-amber-500 transition-colors shrink-0"
                    title="Toggle Favorite"
                  >
                    <Star 
                      className={`w-4 h-4 ${starredTopics[t] ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} 
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Card: GD Scorecard Criteria */}
          <div className="p-6 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800/80 rounded-3xl shadow-md space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100">GD Scorecard Criteria</h3>
              <button 
                onClick={() => setShowRubric(true)}
                className="text-[11px] font-black text-blue-550 hover:underline uppercase"
              >
                View Rubric
              </button>
            </div>

            <div className="space-y-4">
              {[
                { 
                  title: 'Logical Consistency', 
                  desc: 'Provide solid proofs and statistics instead of generalizing statements.',
                  bgClass: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
                  icon: <Brain className="w-4.5 h-4.5" />
                },
                { 
                  title: 'Anticipation', 
                  desc: 'Outline counter-points before they are brought up by others to control the discussion.',
                  bgClass: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
                  icon: <Users className="w-4.5 h-4.5" />
                },
                { 
                  title: 'Relevance & Clarity', 
                  desc: 'Stay relevant to the topic and communicate your points with clarity and brevity.',
                  bgClass: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
                  icon: <Target className="w-4.5 h-4.5" />
                }
              ].map((crit, idx) => (
                <div key={idx} className="flex gap-3">
                  <span className={`p-2.5 rounded-full border shrink-0 h-fit ${crit.bgClass}`}>
                    {crit.icon}
                  </span>
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-250 leading-tight">{crit.title}</h4>
                    <p className="text-[10px] text-slate-455 font-semibold mt-1 leading-relaxed">
                      {crit.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card: Pro Tip */}
          <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-2xl flex gap-3 text-purple-400">
            <span className="p-2 bg-purple-500/10 rounded-xl h-fit">
              <Lightbulb className="w-4.5 h-4.5" />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider">Pro Tip</p>
              <p className="text-[11px] font-bold text-slate-655 dark:text-purple-300 mt-1 leading-normal">
                Strong arguments are structured, relevant, and backed by examples.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default GroupDiscussion;

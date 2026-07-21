/*
------------------------------------------------
File: CareerAdvisor.jsx
Purpose: Renders the AI Career Advisor chat interface.
Responsibilities: Manages chat prompting dialogue feeds, displays AI roadmaps.
Dependencies: react, axiosClient, Card, Button, Lucide icons
------------------------------------------------
*/

import React, { useState, useRef, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import Button from '../components/Button';
import { 
  Send, Sparkles, Bot, Loader2, Compass, UserCheck, 
  FileText, Award, ShieldCheck, Zap, ChevronRight, 
  Building2, MessageSquare, BookOpen, DollarSign, Target 
} from 'lucide-react';

const CareerAdvisor = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatLog, setChatLog] = useState([
    {
      role: 'advisor',
      text: "Hello! I'm your SkillForge AI Career Advisor. Ask me anything about resume improvements, mock interview techniques, daily learning roadmaps, or placement suggestions!"
    }
  ]);

  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatLog, loading]);

  const handleAsk = async (e, customPrompt = null) => {
    if (e) e.preventDefault();
    const query = customPrompt || prompt;
    if (!query.trim() || loading) return;

    setLoading(true);
    setPrompt('');
    
    // Add student message to log
    setChatLog(prev => [...prev, { role: 'student', text: query }]);

    try {
      const res = await axiosClient.post('/advisor/ask', { prompt: query });
      if (res.data.success) {
        setChatLog(prev => [...prev, { role: 'advisor', text: res.data.answer }]);
      }
    } catch (err) {
      console.error(err);
      setChatLog(prev => [...prev, { 
        role: 'advisor', 
        text: 'Sorry, I encountered an issue fetching career recommendations. Check your connection or API keys.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestedPrompts = [
    {
      title: 'Improve my resume',
      icon: <FileText className="w-3.5 h-3.5" />,
      colorClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 dark:hover:bg-emerald-500/15'
    },
    {
      title: 'Top companies for me',
      icon: <Building2 className="w-3.5 h-3.5" />,
      colorClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20 dark:hover:bg-blue-500/15'
    },
    {
      title: 'Interview tips',
      icon: <MessageSquare className="w-3.5 h-3.5" />,
      colorClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 hover:bg-purple-500/20 dark:hover:bg-purple-500/15'
    },
    {
      title: 'Learning roadmap',
      icon: <BookOpen className="w-3.5 h-3.5" />,
      colorClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20 dark:hover:bg-amber-500/15'
    },
    {
      title: 'Salary expectations',
      icon: <DollarSign className="w-3.5 h-3.5" />,
      colorClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 hover:bg-sky-500/20 dark:hover:bg-sky-500/15'
    }
  ];

  const quickInquiries = [
    { 
      title: 'What should I improve?', 
      desc: 'Check dynamic placement scorecard suggestions.', 
      icon: Target,
      colorClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/10 hover:border-purple-500'
    },
    { 
      title: 'Which company suits me?', 
      desc: 'Check eligibility match ratings.', 
      icon: Building2,
      colorClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/10 hover:border-blue-500'
    },
    { 
      title: 'Resume review & suggestions', 
      desc: 'ATS format optimizations and content feedback.', 
      icon: FileText,
      colorClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/10 hover:border-emerald-500'
    },
    { 
      title: 'HR & Technical interview tips', 
      desc: 'Mock interview grading feedback.', 
      icon: UserCheck,
      colorClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/10 hover:border-amber-500'
    }
  ];

  // Helper to format bot responses supporting simple bolding and lists
  const formatMessageText = (text) => {
    if (!text) return null;
    const paragraphs = text.split('\n\n');
    return paragraphs.map((para, pIdx) => {
      const lines = para.split('\n');
      const renderedLines = lines.map((line, lIdx) => {
        const parts = line.split('**');
        const formattedLine = parts.map((part, partIdx) => {
          if (partIdx % 2 !== 0) {
            return <strong key={partIdx} className="font-extrabold text-slate-900 dark:text-white">{part}</strong>;
          }
          return part;
        });

        const bulletMatch = line.trim().match(/^([0-9]+\.|\*|-)\s+(.*)/);
        if (bulletMatch) {
          const content = bulletMatch[2];
          const contentParts = content.split('**');
          const formattedContent = contentParts.map((part, partIdx) => {
            if (partIdx % 2 !== 0) {
              return <strong key={partIdx} className="font-extrabold text-slate-950 dark:text-white">{part}</strong>;
            }
            return part;
          });
          return (
            <li key={lIdx} className="ml-4 list-decimal pl-1 mb-1.5 text-slate-700 dark:text-slate-300">
              {formattedContent}
            </li>
          );
        }
        
        return (
          <p key={lIdx} className="mb-1 text-slate-700 dark:text-slate-300">
            {formattedLine}
          </p>
        );
      });

      const isList = lines.some(line => line.trim().match(/^([0-9]+\.|\*|-)\s+/));
      if (isList) {
        return <ul key={pIdx} className="space-y-1 my-2">{renderedLines}</ul>;
      }
      return <div key={pIdx} className="mb-3 last:mb-0">{renderedLines}</div>;
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight font-sans flex items-center gap-2 text-slate-950 dark:text-white">
          AI Career Advisor
          <Sparkles className="w-6.5 h-6.5 text-indigo-500 fill-indigo-500/20 animate-pulse" />
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm leading-relaxed">
          Receive personalized learning roadmaps, company eligibility suggestions, and resume improvements dynamically.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        
        {/* Chat Guidance Panel */}
        <div className="lg:col-span-2 flex flex-col h-[650px]">
          <div className="glass-card flex-1 flex flex-col overflow-hidden p-0 rounded-3xl border border-slate-200/50 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 shadow-xl">
            
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 rounded-lg">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Active Guidance Session</span>
              </div>
              
              <div className="flex items-center gap-1.5 bg-emerald-500/10 dark:bg-emerald-500/5 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Online</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
              {chatLog.map((chat, idx) => {
                if (idx === 0) {
                  // Redesign initial greeting bubble with mascot avatar
                  return (
                    <div key={idx} className="flex gap-4 items-start">
                      {/* Mascot Avatar */}
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 flex items-center justify-center shadow-md shrink-0 p-1">
                        <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="50" cy="50" r="44" fill="#3b82f6" fillOpacity="0.05" />
                          <circle cx="50" cy="50" r="35" fill="#1e293b" stroke="#3b82f6" strokeWidth="2.5" />
                          <rect x="33" y="42" width="34" height="14" rx="7" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
                          <circle cx="42" cy="49" r="4" fill="#60a5fa" className="animate-pulse" />
                          <circle cx="58" cy="49" r="4" fill="#60a5fa" className="animate-pulse" />
                          <line x1="50" y1="20" x2="50" y2="12" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
                          <circle cx="50" cy="10" r="4" fill="#60a5fa" />
                          <rect x="12" y="45" width="4" height="10" rx="2" fill="#3b82f6" />
                          <rect x="84" y="45" width="4" height="10" rx="2" fill="#3b82f6" />
                          <path d="M43 62 C46 65, 54 65, 57 62" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </div>

                      {/* Welcome speech bubble */}
                      <div className="flex-1 bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60 rounded-3xl rounded-tl-none p-5 shadow-sm">
                        <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                          Hello! I'm your <span className="text-indigo-500 dark:text-indigo-400">SkillForge AI Career Advisor</span>.
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed font-medium">
                          Ask me anything about resume improvements, mock interview techniques, daily learning roadmaps, or placement suggestions!
                        </p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div 
                    key={idx} 
                    className={`flex ${chat.role === 'student' ? 'justify-end' : 'justify-start gap-4 items-start'}`}
                  >
                    {chat.role === 'advisor' && (
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 flex items-center justify-center shadow-sm shrink-0 p-0.5">
                        <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="50" cy="50" r="35" fill="#1e293b" stroke="#3b82f6" strokeWidth="2.5" />
                          <rect x="33" y="42" width="34" height="14" rx="7" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
                          <circle cx="42" cy="49" r="4" fill="#60a5fa" />
                          <circle cx="58" cy="49" r="4" fill="#60a5fa" />
                          <line x1="50" y1="20" x2="50" y2="12" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
                          <circle cx="50" cy="10" r="4" fill="#60a5fa" />
                        </svg>
                      </div>
                    )}
                    
                    <div className={`rounded-3xl p-4.5 text-xs font-semibold leading-relaxed shadow-sm ${
                      chat.role === 'student'
                        ? 'bg-blue-600 text-white rounded-tr-none max-w-[80%]'
                        : 'flex-1 bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60 text-slate-800 dark:text-slate-200 rounded-tl-none'
                    }`}>
                      {chat.role === 'student' ? chat.text : formatMessageText(chat.text)}
                    </div>
                  </div>
                );
              })}

              {/* Suggested Prompts section under initial greeting */}
              {chatLog.length === 1 && (
                <div className="space-y-3 pl-18 pt-2">
                  <p className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400 dark:text-slate-500">Suggested prompts</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedPrompts.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAsk(null, item.title)}
                        className={`flex items-center gap-2 px-4 py-2.5 border rounded-full text-xs font-bold transition-all duration-200 ${item.colorClass}`}
                      >
                        {item.icon}
                        {item.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {loading && (
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 flex items-center justify-center shadow-sm shrink-0 p-0.5">
                    <svg className="w-full h-full animate-pulse" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="50" cy="50" r="35" fill="#1e293b" stroke="#3b82f6" strokeWidth="2.5" />
                      <rect x="33" y="42" width="34" height="14" rx="7" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
                      <line x1="50" y1="20" x2="50" y2="12" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60 px-5 py-4 rounded-3xl rounded-tl-none flex items-center gap-2 text-slate-400 text-xs font-bold">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Footer Input */}
            <form onSubmit={(e) => handleAsk(e)} className="p-4 border-t border-slate-200/60 dark:border-slate-800 bg-transparent flex flex-col gap-3">
              <div className="flex gap-3 items-center">
                <input
                  type="text"
                  required
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="Ask me about interview tips, eligibility, roadmap..."
                  className="flex-1 px-4 py-3.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900/60 bg-transparent rounded-2xl text-xs text-slate-850 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm font-semibold"
                />
                <button 
                  type="submit" 
                  disabled={loading || !prompt.trim()} 
                  className="p-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shrink-0 transition-all duration-200 active:scale-95 disabled:opacity-50 flex items-center justify-center shadow-md shadow-blue-600/25"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-bold px-1 select-none">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span>Your data is secure and confidential • AI responses may vary</span>
              </div>
            </form>

          </div>
        </div>

        {/* Quick Inquiries & AI Brand Section */}
        <div className="space-y-4">
          
          {/* Quick Inquiries Card */}
          <div className="glass-card p-6 bg-white/70 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl shadow-xl">
            
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-indigo-500 dark:text-indigo-400 fill-indigo-500/10" />
              <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100">Quick Inquiries</h3>
            </div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">
              Click a template prompt to ask AI:
            </p>
            
            {/* Template Buttons */}
            <div className="space-y-3">
              {quickInquiries.map((sug, idx) => {
                const Icon = sug.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleAsk(null, sug.title)}
                    className="w-full text-left p-3.5 border border-slate-100 dark:border-slate-850 hover:border-blue-600 dark:hover:border-blue-500 rounded-2xl flex items-center justify-between gap-3 transition-all hover:bg-slate-50/50 dark:hover:bg-slate-900/50 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl shrink-0 transition-transform group-hover:scale-105 ${sug.colorClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-200 leading-tight">
                          {sug.title}
                        </h4>
                        <p className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 mt-1 leading-tight">
                          {sug.desc}
                        </p>
                      </div>
                    </div>
                    
                    <ChevronRight className="w-4 h-4 text-slate-350 dark:text-slate-600 group-hover:text-blue-500 transition-colors shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Banner Brand Card */}
          <div className="glass-card p-5 bg-gradient-to-br from-indigo-950/5 via-slate-900/5 to-indigo-950/5 dark:from-indigo-950/30 dark:via-slate-900/20 dark:to-indigo-950/20 border border-indigo-500/20 dark:border-indigo-500/30 rounded-3xl relative overflow-hidden group hover:shadow-indigo-500/5 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-colors"></div>
            <div className="flex items-center gap-3.5 relative z-10">
              <div className="p-2.5 bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 rounded-2xl">
                <Sparkles className="w-5 h-5 fill-indigo-500/10 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold bg-gradient-to-r from-indigo-600 to-purple-650 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                  Career growth, powered by AI
                </h4>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                  Get personalized advice to accelerate your placement journey.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default CareerAdvisor;


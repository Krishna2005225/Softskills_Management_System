/*
------------------------------------------------
File: ResumeBuilder.jsx
Purpose: Visual resume editor and live ATS Analyzer workspace.
Responsibilities: Models responsive document editing canvases, manages live AI keyword scoring feedback, triggers PDF printers.
Dependencies: react, axiosClient, Card, Button, lucide-react
------------------------------------------------
*/

import React, { useState, useEffect, useRef } from 'react';
import axiosClient from '../api/axiosClient';
import Card from '../components/Card';
import Button from '../components/Button';
import { 
  FileText, Upload, CheckCircle2, AlertTriangle, Lightbulb, 
  Trash2, Plus, Edit, Sparkles, Download, RefreshCw, 
  Undo, Eye, Info, Check, X, ChevronRight, Play
} from 'lucide-react';

const blankTemplate = {
  personalInfo: {
    name: "Krishna Kumar",
    email: "krishna.k@example.com",
    phone: "+91 98765 43210",
    linkedin: "linkedin.com/in/krishna",
    github: "github.com/krishna"
  },
  summary: "Ambitious Software Engineering student with experience building full-stack web applications and implementing machine learning algorithms. Seeking a challenging role as a Software Developer.",
  workExperience: [
    {
      company: "Tech Solutions Inc.",
      position: "Software Engineering Intern",
      startDate: "May 2025",
      endDate: "July 2025",
      description: [
        "Developed modular dashboard components using React and Tailwind CSS, improving page load speed by 25%.",
        "Integrated Node.js backend services with PostgreSQL databases, resolving query bottleneck issues.",
        "Collaborated with senior developers on code reviews and Agile sprint cycles."
      ]
    }
  ],
  education: [
    {
      institution: "SkillForge Technical University",
      degree: "B.Tech in Computer Science and Engineering",
      startDate: "2022",
      endDate: "2026",
      gpa: "8.8"
    }
  ],
  projects: [
    {
      name: "Smart Skill Evaluation Portal",
      technologies: "React, Node.js, Express, PostgreSQL, Gemini AI",
      description: [
        "Designed and built an end-to-end placement training platform for college students.",
        "Optimized data querying pipelines reducing latency from 2s to 300ms.",
        "Integrated real-time audio and video capture features for mock interviews."
      ]
    }
  ],
  skills: ["React", "Node.js", "Express", "PostgreSQL", "JavaScript", "Python", "Git", "SQL", "REST APIs"]
};

const ResumeBuilder = () => {
  // Resume state
  const [resumeData, setResumeData] = useState(null);
  const [originalResumeData, setOriginalResumeData] = useState(null);

  // ATS scores states
  const [atsScore, setAtsScore] = useState(null);
  const [subScores, setSubScores] = useState({
    formatting: 0,
    keywords: 0,
    structure: 0,
    contentRelevance: 0
  });
  const [headline, setHeadline] = useState("");
  const [missingKeywords, setMissingKeywords] = useState([]);
  const [formattingIssues, setFormattingIssues] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [revaluating, setRevaluating] = useState(false);
  const [history, setHistory] = useState([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);
  
  // Section Optimizer state (for general card)
  const [optimizerSection, setOptimizerSection] = useState('Work Experience');
  const [optimizerRawText, setOptimizerRawText] = useState('');
  const [optimizerRewriting, setOptimizerRewriting] = useState(false);
  const [optimizerResult, setOptimizerResult] = useState(null);

  // Inline Bullet Optimizer state
  const [inlineOptimizing, setInlineOptimizing] = useState(null); // { type: 'experience'|'projects', entryIndex, bulletIndex, currentText }
  const [inlineRewritten, setInlineRewritten] = useState(null); // array of strings returned from Gemini
  const [inlineLoading, setInlineLoading] = useState(false);

  // Modals state
  const [showGuide, setShowGuide] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const fileInputRef = useRef(null);

  // Fetch History on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axiosClient.get('/resume/history');
      if (res.data.success) {
        setHistory(res.data.history);
      }
    } catch (err) {
      console.error("Failed to load resume history:", err);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('resume', file);

    setLoading(true);
    setOptimizerResult(null);

    try {
      const res = await axiosClient.post('/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        const resumeRecord = res.data.resume;
        const feedback = resumeRecord.ai_suggestions;
        
        loadReportData(feedback, resumeRecord.resume_id);
        fetchHistory();
      }
    } catch (err) {
      console.error('Failed to parse resume:', err);
      alert('Upload failed. Please ensure the file is valid and the server is running.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to load report into active workspace state
  const loadReportData = (feedback, id = null) => {
    // Guard: feedback might be a JSON string from DB
    let fb = feedback;
    if (typeof fb === 'string') {
      try { fb = JSON.parse(fb); } catch (e) { fb = {}; }
    }
    if (!fb || typeof fb !== 'object') fb = {};

    setAtsScore(fb.atsScore || 70);
    setSubScores(fb.subScores || {
      formatting: 75,
      keywords: 70,
      structure: 65,
      contentRelevance: 70
    });
    setHeadline(fb.headline || "ATS Assessment Completed");
    setMissingKeywords(fb.missingKeywords || []);
    setFormattingIssues(fb.formattingIssues || []);
    setAiSuggestions(fb.aiSuggestions || []);
    setSelectedHistoryId(id);

    // Only use parsedResume if it has the required structure (personalInfo, etc.)
    const parsed = fb.parsedResume;
    if (parsed && typeof parsed === 'object' && (parsed.personalInfo || parsed.skills || parsed.projects || parsed.workExperience || parsed.experience)) {
      // Normalize skills
      let rawSkills = [];
      if (parsed.skills) {
        if (Array.isArray(parsed.skills)) {
          rawSkills = parsed.skills;
        } else if (typeof parsed.skills === 'object') {
          // If it's an object of arrays (e.g. { languages: [...], tools: [...] })
          Object.values(parsed.skills).forEach(val => {
            if (Array.isArray(val)) {
              rawSkills = rawSkills.concat(val);
            } else if (typeof val === 'string') {
              rawSkills.push(val);
            }
          });
        } else if (typeof parsed.skills === 'string') {
          rawSkills = parsed.skills.split(',').map(s => s.trim());
        }
      }

      // Helper to parse duration into startDate & endDate
      const parseDuration = (durationStr, fallbackStart = '', fallbackEnd = '') => {
        if (!durationStr || typeof durationStr !== 'string') return { start: fallbackStart || '', end: fallbackEnd || '' };
        const parts = durationStr.split(/[–\-—]| to /i).map(s => s.trim());
        return {
          start: parts[0] || fallbackStart || '',
          end: parts[1] || fallbackEnd || ''
        };
      };

      const safeResume = {
        personalInfo: {
          name: parsed.personalInfo?.name || parsed.personalInfo?.fullName || '',
          email: parsed.personalInfo?.email || '',
          phone: parsed.personalInfo?.phone || '',
          linkedin: parsed.personalInfo?.linkedin || parsed.personalInfo?.links?.linkedin || '',
          github: parsed.personalInfo?.github || parsed.personalInfo?.links?.github || ''
        },
        summary: parsed.summary || parsed.professionalSummary || '',
        workExperience: Array.isArray(parsed.workExperience || parsed.experience) ? (parsed.workExperience || parsed.experience).map(exp => {
          const dates = parseDuration(exp.duration || '', exp.startDate, exp.endDate);
          return {
            company: exp.company || '',
            position: exp.position || exp.role || '',
            startDate: dates.start,
            endDate: dates.end,
            description: Array.isArray(exp.description) ? exp.description : [exp.description || '']
          };
        }) : [],
        education: Array.isArray(parsed.education) ? parsed.education.map(edu => {
          const dates = parseDuration(edu.duration || '', edu.startDate, edu.endDate);
          return {
            institution: edu.institution || '',
            degree: edu.degree || '',
            startDate: dates.start,
            endDate: dates.end,
            gpa: edu.gpa || ''
          };
        }) : [],
        projects: Array.isArray(parsed.projects) ? parsed.projects.map(proj => ({
          name: proj.name || proj.title || '',
          technologies: Array.isArray(proj.technologies) ? proj.technologies.join(', ') : (proj.technologies || ''),
          description: Array.isArray(proj.description) ? proj.description : [proj.description || '']
        })) : [],
        skills: rawSkills
      };
      setResumeData(safeResume);
      setOriginalResumeData(JSON.parse(JSON.stringify(safeResume)));
    } else {
      // Fallback to template
      setResumeData(JSON.parse(JSON.stringify(blankTemplate)));
      setOriginalResumeData(JSON.parse(JSON.stringify(blankTemplate)));
    }
  };

  const handleLiveReScore = async () => {
    if (!resumeData) return;
    setRevaluating(true);
    try {
      const res = await axiosClient.post('/resume/evaluate-json', {
        resumeJson: resumeData
      });
      if (res.data.success) {
        const feedback = res.data.aiSuggestions;
        setAtsScore(feedback.atsScore || 70);
        setSubScores(feedback.subScores || {
          formatting: 75,
          keywords: 70,
          structure: 65,
          contentRelevance: 70
        });
        setHeadline(feedback.headline || "ATS Assessment Updated");
        setMissingKeywords(feedback.missingKeywords || []);
        setFormattingIssues(feedback.formattingIssues || []);
        setAiSuggestions(feedback.aiSuggestions || []);
      }
    } catch (err) {
      console.error("Failed to re-score resume:", err);
      alert("Failed to evaluate edits. Check backend log.");
    } finally {
      setRevaluating(false);
    }
  };

  // Load from history
  const loadFromHistoryItem = (item) => {
    if (item.ai_suggestions) {
      loadReportData(item.ai_suggestions, item.resume_id);
    }
  };

  // Start with template
  const loadBlankTemplate = () => {
    setResumeData(JSON.parse(JSON.stringify(blankTemplate)));
    setOriginalResumeData(JSON.parse(JSON.stringify(blankTemplate)));
    setAtsScore(80);
    setSubScores({
      formatting: 85,
      keywords: 80,
      structure: 75,
      contentRelevance: 80
    });
    setHeadline("Mock Score loaded. Click 'Live Re-Score' to evaluate your edits!");
    setMissingKeywords(['Leadership', 'Agile', 'Microservices', 'CI/CD']);
    setFormattingIssues(['Include detailed date metrics for internships.']);
    setAiSuggestions(['Focus on quantifying results inside project bullet points.']);
  };

  // Reset editor
  const handleResetEditor = () => {
    if (originalResumeData) {
      setResumeData(JSON.parse(JSON.stringify(originalResumeData)));
    }
  };

  // Download PDF print trigger
  const handleDownloadPDF = () => {
    window.print();
  };

  // Inline Bullet Optimization
  const handleInlineOptimize = async (type, entryIndex, bulletIndex, currentText) => {
    setInlineOptimizing({ type, entryIndex, bulletIndex, currentText });
    setInlineRewritten(null);
    setInlineLoading(true);

    try {
      const res = await axiosClient.post('/resume/ai-rewrite', {
        sectionType: type === 'experience' ? 'Work Experience' : 'Projects',
        rawText: currentText
      });
      if (res.data.success && res.data.rewrittenPoints) {
        setInlineRewritten(res.data.rewrittenPoints);
      }
    } catch (err) {
      console.error(err);
      alert("AI optimization failed.");
    } finally {
      setInlineLoading(false);
    }
  };

  const applyInlineRewrite = (replacementText) => {
    if (!inlineOptimizing) return;
    const { type, entryIndex, bulletIndex } = inlineOptimizing;
    const updated = JSON.parse(JSON.stringify(resumeData));

    if (type === 'experience') {
      updated.workExperience[entryIndex].description[bulletIndex] = replacementText;
    } else if (type === 'projects') {
      updated.projects[entryIndex].description[bulletIndex] = replacementText;
    }

    setResumeData(updated);
    setInlineOptimizing(null);
    setInlineRewritten(null);
  };

  // General Card Section Optimizer
  const handleGeneralOptimize = async (e) => {
    e.preventDefault();
    if (!optimizerRawText.trim()) return;

    setOptimizerRewriting(true);
    setOptimizerResult(null);

    try {
      const res = await axiosClient.post('/resume/ai-rewrite', {
        sectionType: optimizerSection,
        rawText: optimizerRawText
      });
      if (res.data.success) {
        setOptimizerResult({
          original: optimizerRawText,
          optimized: res.data.rewrittenPoints
        });
      }
    } catch (err) {
      console.error(err);
      alert("Optimizer service failed.");
    } finally {
      setOptimizerRewriting(false);
    }
  };

  // Click Keyword to apply
  const applyKeywordToSkills = (kw) => {
    if (!resumeData) return;
    // Don't duplicate
    if (resumeData.skills.some(s => s.toLowerCase() === kw.toLowerCase())) return;
    const updated = {
      ...resumeData,
      skills: [...resumeData.skills, kw]
    };
    setResumeData(updated);
  };

  // Visual Editor changes
  const updatePersonalInfo = (field, val) => {
    setResumeData({
      ...resumeData,
      personalInfo: {
        ...resumeData.personalInfo,
        [field]: val
      }
    });
  };

  const updateSummary = (val) => {
    setResumeData({ ...resumeData, summary: val });
  };

  const updateExperience = (idx, field, val) => {
    const updated = JSON.parse(JSON.stringify(resumeData));
    updated.workExperience[idx][field] = val;
    setResumeData(updated);
  };

  const updateExperienceBullet = (expIdx, bulletIdx, val) => {
    const updated = JSON.parse(JSON.stringify(resumeData));
    updated.workExperience[expIdx].description[bulletIdx] = val;
    setResumeData(updated);
  };

  const addExperienceBullet = (expIdx) => {
    const updated = JSON.parse(JSON.stringify(resumeData));
    updated.workExperience[expIdx].description.push("Collaborated on core software components to improve efficiency.");
    setResumeData(updated);
  };

  const removeExperienceBullet = (expIdx, bulletIdx) => {
    const updated = JSON.parse(JSON.stringify(resumeData));
    updated.workExperience[expIdx].description.splice(bulletIdx, 1);
    setResumeData(updated);
  };

  const addExperience = () => {
    const updated = JSON.parse(JSON.stringify(resumeData));
    updated.workExperience.push({
      company: "Company Name",
      position: "Job Role",
      startDate: "Month Year",
      endDate: "Present",
      description: ["Contributed to application design and code quality."]
    });
    setResumeData(updated);
  };

  const removeExperience = (idx) => {
    const updated = JSON.parse(JSON.stringify(resumeData));
    updated.workExperience.splice(idx, 1);
    setResumeData(updated);
  };

  const updateProject = (idx, field, val) => {
    const updated = JSON.parse(JSON.stringify(resumeData));
    updated.projects[idx][field] = val;
    setResumeData(updated);
  };

  const updateProjectBullet = (projIdx, bulletIdx, val) => {
    const updated = JSON.parse(JSON.stringify(resumeData));
    updated.projects[projIdx].description[bulletIdx] = val;
    setResumeData(updated);
  };

  const addProjectBullet = (projIdx) => {
    const updated = JSON.parse(JSON.stringify(resumeData));
    updated.projects[projIdx].description.push("Built backend endpoints leveraging REST standards.");
    setResumeData(updated);
  };

  const removeProjectBullet = (projIdx, bulletIdx) => {
    const updated = JSON.parse(JSON.stringify(resumeData));
    updated.projects[projIdx].description.splice(bulletIdx, 1);
    setResumeData(updated);
  };

  const addProject = () => {
    const updated = JSON.parse(JSON.stringify(resumeData));
    updated.projects.push({
      name: "Project Name",
      technologies: "Languages, Libraries",
      description: ["Developed standard core logic modules."]
    });
    setResumeData(updated);
  };

  const removeProject = (idx) => {
    const updated = JSON.parse(JSON.stringify(resumeData));
    updated.projects.splice(idx, 1);
    setResumeData(updated);
  };

  const updateEducation = (idx, field, val) => {
    const updated = JSON.parse(JSON.stringify(resumeData));
    updated.education[idx][field] = val;
    setResumeData(updated);
  };

  const addEducation = () => {
    const updated = JSON.parse(JSON.stringify(resumeData));
    updated.education.push({
      institution: "Institution Name",
      degree: "Degree Specialization",
      startDate: "Year",
      endDate: "Year",
      gpa: "GPA"
    });
    setResumeData(updated);
  };

  const removeEducation = (idx) => {
    const updated = JSON.parse(JSON.stringify(resumeData));
    updated.education.splice(idx, 1);
    setResumeData(updated);
  };

  const addSkillTag = (e) => {
    if (e.key === 'Enter' && e.target.value.trim() !== '') {
      const val = e.target.value.trim();
      if (!resumeData.skills.some(s => s.toLowerCase() === val.toLowerCase())) {
        setResumeData({
          ...resumeData,
          skills: [...resumeData.skills, val]
        });
      }
      e.target.value = '';
    }
  };

  const removeSkillTag = (idx) => {
    const updated = {
      ...resumeData,
      skills: resumeData.skills.filter((_, i) => i !== idx)
    };
    setResumeData(updated);
  };

  return (
    <div className="space-y-8 print:p-0 print:m-0">
      
      {/* Dynamic Printing Style Block */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          aside, header, main > :not(#printable-resume-container), .print-hide {
            display: none !important;
          }
          #printable-resume-container {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
          }
          #resume-canvas {
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          input, textarea {
            border: none !important;
            padding: 0 !important;
            background: transparent !important;
            color: black !important;
            font-size: inherit !important;
            font-weight: inherit !important;
            line-height: inherit !important;
            width: 100% !important;
            resize: none !important;
          }
          .bullet-actions, .section-actions, .editor-header-bar {
            display: none !important;
          }
        }
      `}} />

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print-hide">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            ATS Resume Analyzer <Sparkles className="w-6 h-6 text-purple-500 animate-pulse" />
          </h1>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Evaluate resume compatibility against standard ATS templates and generate AI-driven keyword improvements.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={loadBlankTemplate} variant="outline" className="text-xs border-slate-300 dark:border-slate-800 flex items-center gap-1.5 py-2.5 font-bold">
            <Plus className="w-4 h-4 text-emerald-500" /> Start from Template
          </Button>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.docx"
            className="hidden"
          />
          <Button onClick={() => fileInputRef.current.click()} loading={loading} variant="primary" className="text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 flex items-center gap-1.5 py-2.5 font-bold shadow-lg shadow-indigo-500/25">
            <Upload className="w-4 h-4" /> Upload Document
          </Button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      {!resumeData ? (
        // Initial Empty State View
        <div className="grid md:grid-cols-3 gap-8 print-hide">
          <div className="md:col-span-2 space-y-6">
            <Card className="p-8 border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#111625] rounded-3xl min-h-[350px] flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 bg-blue-500/10 dark:bg-blue-500/5 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <FileText className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No Active Resume Loaded</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-8">
                Upload your resume in PDF or Word format, or load our pre-populated template to evaluate keywords, layout structure, and perform real-time CV editing.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-2xl transition shadow-md flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" /> Browse Resume File
                </button>
                <button
                  onClick={loadBlankTemplate}
                  className="px-6 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-2xl transition flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Build with AI Editor
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-4">Supported formats: PDF, DOCX (Max 5MB)</p>
            </Card>

            {/* AI Section Optimizer (Fallback State) */}
            <Card title="AI Section Optimizer">
              <form onSubmit={handleGeneralOptimize} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Select Resume Section</label>
                    <select
                      value={optimizerSection}
                      onChange={e => setOptimizerSection(e.target.value)}
                      className="mt-1.5 block w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 bg-transparent rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-slate-300 font-semibold"
                    >
                      <option value="Work Experience">Work Experience</option>
                      <option value="Projects">Projects</option>
                      <option value="Profile Summary">Profile Summary</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider font-sans">Paste Raw Description</label>
                  <textarea
                    rows="4"
                    required
                    value={optimizerRawText}
                    onChange={e => setOptimizerRawText(e.target.value)}
                    placeholder="e.g. Developed a web application using react and node js. Worked on api integration and database..."
                    className="mt-1.5 block w-full px-4 py-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 bg-transparent rounded-2xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-400 dark:text-slate-200 leading-relaxed font-sans"
                    maxLength={1500}
                  />
                  <div className="flex justify-end text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1">
                    {optimizerRawText.length}/1500
                  </div>
                </div>

                <Button type="submit" variant="primary" loading={optimizerRewriting} className="w-full justify-center text-xs bg-gradient-to-r from-violet-600 to-indigo-600 font-extrabold uppercase py-3 rounded-xl tracking-wider">
                  Optimize with Gemini ✨
                </Button>
              </form>

              {optimizerResult && (
                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-fade-in">
                  <h4 className="font-bold text-xs text-emerald-500 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Optimization Complete:
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl">
                      <span className="text-[9px] font-black text-rose-500 dark:text-rose-400 uppercase tracking-wider block mb-2">Original Context</span>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{optimizerResult.original}</p>
                    </div>
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                      <span className="text-[9px] font-black text-emerald-500 dark:text-emerald-400 uppercase tracking-wider block mb-2">AI ATS Suggestion</span>
                      <div className="space-y-2">
                        {optimizerResult.optimized.map((pt, idx) => (
                          <p key={idx} className="text-xs text-slate-800 dark:text-slate-200 font-semibold leading-relaxed">
                            • {pt}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Right Column: Tips & History */}
          <div className="space-y-6">
            {/* Recent History Card */}
            <Card title="Recent Analysis History">
              {history.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No reports generated yet.</p>
              ) : (
                <div className="space-y-3">
                  {history.slice(0, 5).map((item) => {
                    const meta = item.ai_suggestions || {};
                    const scoreVal = item.ats_score || 70;
                    const dateStr = meta.uploadDate ? new Date(meta.uploadDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent';
                    const isHigh = scoreVal >= 75;

                    return (
                      <div 
                        key={item.resume_id}
                        onClick={() => loadFromHistoryItem(item)}
                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-100 dark:border-slate-800/60 rounded-2xl cursor-pointer transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-500/10 rounded-xl">
                            <FileText className="w-4 h-4 text-blue-500" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                              {meta.originalName || `Resume-${item.resume_id.substring(0,6)}.pdf`}
                            </p>
                            <p className="text-[10px] text-slate-400">{scoreVal}% Match • {dateStr}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 text-[9px] font-black rounded-lg ${isHigh ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                          {isHigh ? 'Success' : 'Needs Improvement'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Keyword Suggestions Panel */}
            <Card title="Top Keyword Suggestions">
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">Highly searched skills for technical roles. Click keywords to apply them directly as skill tags.</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {['Leadership', 'Agile', 'Problem Solving', 'REST API', 'Microservices', 'AWS', 'Analytics', 'Documentation', 'CI/CD'].map((kw) => (
                  <button
                    key={kw}
                    onClick={() => alert(`Upload a resume or start building to apply ${kw}!`)}
                    className="px-2.5 py-1 bg-slate-150 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold rounded-lg transition uppercase tracking-wider"
                  >
                    {kw} +
                  </button>
                ))}
              </div>
            </Card>

            {/* Pro Tips Panel */}
            <Card title="Pro Tips">
              <div className="space-y-3">
                {[
                  "Use industry-specific keywords to improve match.",
                  "Keep formatting simple and ATS-friendly.",
                  "Quantify your achievements using numbers.",
                  "Avoid headers, footers & complex tables."
                ].map((tip, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setShowGuide(true)}
                className="text-xs font-bold text-blue-500 hover:text-blue-600 mt-4 flex items-center gap-1.5"
              >
                View ATS Guide &rarr;
              </button>
            </Card>
          </div>
        </div>
      ) : (
        // Split Page Editor and ATS Workspace view
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Visual Resume Builder Canvas */}
          <div id="printable-resume-container" className="lg:col-span-7 xl:col-span-8 space-y-6">
            
            {/* Editor Top Toolbar */}
            <div className="flex items-center justify-between p-4 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800/80 rounded-2xl print-hide">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Live Visual Editor Mode</span>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={handleResetEditor}
                  title="Undo all modifications since load"
                  className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition text-xs font-bold flex items-center gap-1.5"
                >
                  <Undo className="w-4 h-4" /> Reset
                </button>
                <button
                  onClick={handleLiveReScore}
                  disabled={revaluating}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold rounded-xl transition flex items-center gap-1.5 shadow shadow-purple-500/20"
                >
                  <RefreshCw className={`w-4 h-4 ${revaluating ? 'animate-spin' : ''}`} /> {revaluating ? 'Re-scoring...' : 'Live Re-Score ✨'}
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl transition flex items-center gap-1.5 shadow shadow-blue-500/20"
                >
                  <Download className="w-4 h-4" /> Export PDF
                </button>
              </div>
            </div>

            {/* Resume Sheet Document (Click-To-Edit UI Canvas) */}
            <div 
              id="resume-canvas"
              className="p-8 md:p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 shadow-xl rounded-3xl text-slate-800 dark:text-slate-100 space-y-8 relative overflow-hidden font-sans"
            >
              
              {/* Profile Header section */}
              <div className="border-b border-slate-150 dark:border-slate-800 pb-6 text-center space-y-3">
                <input
                  type="text"
                  value={resumeData.personalInfo.name}
                  onChange={(e) => updatePersonalInfo('name', e.target.value)}
                  placeholder="Full Name"
                  className="text-3xl font-black tracking-tight text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-200 dark:hover:border-slate-800 focus:border-blue-500 text-center w-full focus:outline-none font-sans"
                />

                <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  <input
                    type="email"
                    value={resumeData.personalInfo.email}
                    onChange={(e) => updatePersonalInfo('email', e.target.value)}
                    placeholder="Email Address"
                    className="bg-transparent border-b border-transparent hover:border-slate-200 dark:hover:border-slate-800 focus:border-blue-500 text-center w-36 focus:outline-none"
                  />
                  <span>•</span>
                  <input
                    type="text"
                    value={resumeData.personalInfo.phone}
                    onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                    placeholder="Phone Number"
                    className="bg-transparent border-b border-transparent hover:border-slate-200 dark:hover:border-slate-800 focus:border-blue-500 text-center w-28 focus:outline-none"
                  />
                  <span>•</span>
                  <input
                    type="text"
                    value={resumeData.personalInfo.linkedin}
                    onChange={(e) => updatePersonalInfo('linkedin', e.target.value)}
                    placeholder="LinkedIn Profile"
                    className="bg-transparent border-b border-transparent hover:border-slate-200 dark:hover:border-slate-800 focus:border-blue-500 text-center w-36 focus:outline-none"
                  />
                  <span>•</span>
                  <input
                    type="text"
                    value={resumeData.personalInfo.github}
                    onChange={(e) => updatePersonalInfo('github', e.target.value)}
                    placeholder="GitHub URL"
                    className="bg-transparent border-b border-transparent hover:border-slate-200 dark:hover:border-slate-800 focus:border-blue-500 text-center w-28 focus:outline-none"
                  />
                </div>
              </div>

              {/* Summary / Objective Section */}
              <div className="space-y-2.5">
                <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-widest border-b border-slate-100 dark:border-slate-800 pb-1">Professional Summary</h3>
                <textarea
                  rows="2"
                  value={resumeData.summary}
                  onChange={(e) => updateSummary(e.target.value)}
                  placeholder="Summarize your professional profile and goals..."
                  className="w-full text-xs text-slate-600 dark:text-slate-300 bg-transparent border-b border-transparent hover:border-slate-200 dark:hover:border-slate-800 focus:border-blue-500 focus:outline-none leading-relaxed font-sans"
                />
              </div>

              {/* Work Experience Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-1">
                  <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-widest">Work Experience</h3>
                  <button
                    onClick={addExperience}
                    className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold flex items-center gap-1 transition print-hide"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Job
                  </button>
                </div>

                <div className="space-y-6">
                  {resumeData.workExperience.map((exp, expIdx) => (
                    <div key={expIdx} className="space-y-2 group relative">
                      
                      {/* Delete Job action */}
                      <button
                        onClick={() => removeExperience(expIdx)}
                        className="absolute right-0 top-0 p-1.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition opacity-0 group-hover:opacity-100 print-hide"
                        title="Remove experience entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Header Inputs */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pr-8">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <input
                            type="text"
                            value={exp.company}
                            onChange={(e) => updateExperience(expIdx, 'company', e.target.value)}
                            placeholder="Company Name"
                            className="text-xs font-bold text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-200 dark:hover:border-slate-800 focus:border-blue-500 w-32 focus:outline-none"
                          />
                          <span className="text-slate-400 text-xs">-</span>
                          <input
                            type="text"
                            value={exp.position}
                            onChange={(e) => updateExperience(expIdx, 'position', e.target.value)}
                            placeholder="Job Title"
                            className="text-xs text-slate-700 dark:text-slate-300 font-semibold bg-transparent border-b border-transparent hover:border-slate-200 dark:hover:border-slate-800 focus:border-blue-500 w-44 focus:outline-none"
                          />
                        </div>
                        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                          <input
                            type="text"
                            value={exp.startDate}
                            onChange={(e) => updateExperience(expIdx, 'startDate', e.target.value)}
                            placeholder="Start Date"
                            className="bg-transparent border-b border-transparent hover:border-slate-200 dark:hover:border-slate-800 focus:border-blue-500 w-16 text-right focus:outline-none"
                          />
                          <span>to</span>
                          <input
                            type="text"
                            value={exp.endDate}
                            onChange={(e) => updateExperience(expIdx, 'endDate', e.target.value)}
                            placeholder="End Date"
                            className="bg-transparent border-b border-transparent hover:border-slate-200 dark:hover:border-slate-800 focus:border-blue-500 w-16 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Bullet points */}
                      <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600 dark:text-slate-350">
                        {exp.description.map((bullet, bIdx) => (
                          <li key={bIdx} className="group/bullet relative pr-20 pl-1 leading-relaxed">
                            <input
                              type="text"
                              value={bullet}
                              onChange={(e) => updateExperienceBullet(expIdx, bIdx, e.target.value)}
                              className="w-full bg-transparent border-b border-transparent hover:border-slate-200 dark:hover:border-slate-800 focus:border-blue-500 focus:outline-none leading-relaxed"
                            />
                            
                            {/* Actions on hover */}
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-0 group-hover/bullet:opacity-100 transition print-hide">
                              <button
                                onClick={() => handleInlineOptimize('experience', expIdx, bIdx, bullet)}
                                className="p-1 bg-purple-500/10 text-purple-600 hover:bg-purple-600 hover:text-white rounded-lg transition"
                                title="Optimize bullet with AI"
                              >
                                <Sparkles className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => removeExperienceBullet(expIdx, bIdx)}
                                className="p-1 bg-rose-500/10 text-rose-500 hover:bg-rose-50 hover:text-white rounded-lg transition"
                                title="Remove bullet"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>

                      {/* Add bullet point action */}
                      <div className="pt-1 print-hide">
                        <button
                          onClick={() => addExperienceBullet(expIdx)}
                          className="text-[10px] font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Add bullet point
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              </div>

              {/* Projects Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-1">
                  <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-widest">Projects</h3>
                  <button
                    onClick={addProject}
                    className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold flex items-center gap-1 transition print-hide"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Project
                  </button>
                </div>

                <div className="space-y-6">
                  {resumeData.projects.map((proj, projIdx) => (
                    <div key={projIdx} className="space-y-2 group relative">
                      
                      {/* Delete Project action */}
                      <button
                        onClick={() => removeProject(projIdx)}
                        className="absolute right-0 top-0 p-1.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition opacity-0 group-hover:opacity-100 print-hide"
                        title="Remove project entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Header inputs */}
                      <div className="flex justify-between items-center pr-8">
                        <input
                          type="text"
                          value={proj.name}
                          onChange={(e) => updateProject(projIdx, 'name', e.target.value)}
                          placeholder="Project Name"
                          className="text-xs font-bold text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-200 dark:hover:border-slate-800 focus:border-blue-500 w-44 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={proj.technologies}
                          onChange={(e) => updateProject(projIdx, 'technologies', e.target.value)}
                          placeholder="Technologies Used"
                          className="text-[11px] font-bold text-slate-400 bg-transparent border-b border-transparent hover:border-slate-200 dark:hover:border-slate-800 focus:border-blue-500 w-44 text-right focus:outline-none"
                        />
                      </div>

                      {/* Bullets */}
                      <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600 dark:text-slate-350">
                        {proj.description.map((bullet, bIdx) => (
                          <li key={bIdx} className="group/bullet relative pr-20 pl-1 leading-relaxed">
                            <input
                              type="text"
                              value={bullet}
                              onChange={(e) => updateProjectBullet(projIdx, bIdx, e.target.value)}
                              className="w-full bg-transparent border-b border-transparent hover:border-slate-200 dark:hover:border-slate-800 focus:border-blue-500 focus:outline-none leading-relaxed"
                            />
                            
                            {/* Actions on hover */}
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-0 group-hover/bullet:opacity-100 transition print-hide">
                              <button
                                onClick={() => handleInlineOptimize('projects', projIdx, bIdx, bullet)}
                                className="p-1 bg-purple-500/10 text-purple-600 hover:bg-purple-600 hover:text-white rounded-lg transition"
                                title="Optimize bullet with AI"
                              >
                                <Sparkles className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => removeProjectBullet(projIdx, bIdx)}
                                className="p-1 bg-rose-500/10 text-rose-500 hover:bg-rose-50 hover:text-white rounded-lg transition"
                                title="Remove bullet"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>

                      {/* Add bullet point action */}
                      <div className="pt-1 print-hide">
                        <button
                          onClick={() => addProjectBullet(projIdx)}
                          className="text-[10px] font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Add bullet point
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              </div>

              {/* Education Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-1">
                  <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-widest">Education</h3>
                  <button
                    onClick={addEducation}
                    className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-350 rounded-lg text-[10px] font-bold flex items-center gap-1 transition print-hide"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add School
                  </button>
                </div>

                <div className="space-y-4">
                  {resumeData.education.map((edu, eduIdx) => (
                    <div key={eduIdx} className="space-y-1 group relative">
                      
                      {/* Delete Education action */}
                      <button
                        onClick={() => removeEducation(eduIdx)}
                        className="absolute right-0 top-0 p-1.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition opacity-0 group-hover:opacity-100 print-hide"
                        title="Remove education entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* School details inputs */}
                      <div className="flex justify-between items-start pr-8">
                        <div>
                          <input
                            type="text"
                            value={edu.institution}
                            onChange={(e) => updateEducation(eduIdx, 'institution', e.target.value)}
                            placeholder="Institution / School"
                            className="text-xs font-bold text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-200 dark:hover:border-slate-800 focus:border-blue-500 w-64 focus:outline-none block"
                          />
                          <input
                            type="text"
                            value={edu.degree}
                            onChange={(e) => updateEducation(eduIdx, 'degree', e.target.value)}
                            placeholder="Degree & Major"
                            className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold bg-transparent border-b border-transparent hover:border-slate-200 dark:hover:border-slate-800 focus:border-blue-500 w-64 focus:outline-none block mt-0.5"
                          />
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 justify-end">
                            <input
                              type="text"
                              value={edu.startDate}
                              onChange={(e) => updateEducation(eduIdx, 'startDate', e.target.value)}
                              placeholder="Start"
                              className="bg-transparent border-b border-transparent hover:border-slate-200 dark:hover:border-slate-800 focus:border-blue-500 w-12 text-right focus:outline-none"
                            />
                            <span>-</span>
                            <input
                              type="text"
                              value={edu.endDate}
                              onChange={(e) => updateEducation(eduIdx, 'endDate', e.target.value)}
                              placeholder="End"
                              className="bg-transparent border-b border-transparent hover:border-slate-200 dark:hover:border-slate-800 focus:border-blue-500 w-12 focus:outline-none"
                            />
                          </div>
                          <div className="text-[11px] text-slate-500 font-bold mt-1 flex items-center justify-end gap-1">
                            <span>GPA/Score:</span>
                            <input
                              type="text"
                              value={edu.gpa}
                              onChange={(e) => updateEducation(eduIdx, 'gpa', e.target.value)}
                              placeholder="GPA"
                              className="bg-transparent border-b border-transparent hover:border-slate-200 dark:hover:border-slate-800 focus:border-blue-500 w-10 text-right focus:outline-none font-bold text-slate-700 dark:text-slate-300"
                            />
                          </div>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              </div>

              {/* Skills Tag Cloud Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-widest border-b border-slate-100 dark:border-slate-800 pb-1">Technical Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {resumeData.skills.map((skill, idx) => (
                    <span 
                      key={idx}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-350 text-[10px] font-bold rounded-lg uppercase tracking-wider flex items-center gap-1.5 border border-slate-200/20"
                    >
                      {skill}
                      <button 
                        onClick={() => removeSkillTag(idx)}
                        className="text-slate-400 hover:text-rose-500 focus:outline-none print-hide"
                      >
                        &times;
                      </button>
                    </span>
                  ))}

                  <input
                    type="text"
                    placeholder="+ Add Skill"
                    onKeyDown={addSkillTag}
                    className="px-2 py-0.5 text-[10px] bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 focus:border-blue-500 focus:outline-none w-20 text-slate-400 focus:text-slate-800 dark:focus:text-slate-200 print-hide"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: ATS Report & Helper Controls */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6 print-hide">
            
            {/* ATS Score Radial gauge & Overview */}
            <Card title="ATS Compatibility Score">
              <div className="flex flex-col items-center justify-center p-4">
                
                {/* Radial circular progress SVG */}
                <div className="relative h-32 w-32 flex items-center justify-center mb-6">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      strokeWidth="8"
                      stroke="currentColor"
                      fill="transparent"
                      className="text-slate-200 dark:text-slate-800"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      strokeWidth="8"
                      strokeDasharray={2 * Math.PI * 40}
                      strokeDashoffset={2 * Math.PI * 40 * (1 - atsScore / 100)}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      className="text-indigo-600 dark:text-indigo-500 transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white leading-none">{atsScore}%</span>
                  </div>
                </div>

                <div className="text-center mb-6 space-y-1.5">
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">{headline}</h4>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-normal max-w-xs">
                    Your resume was graded using structural parsing templates and action keyword densities.
                  </p>
                  <button 
                    onClick={() => setShowReport(true)}
                    className="text-xs font-bold text-blue-500 hover:text-blue-600 block w-full mt-2"
                  >
                    View Full Report &rarr;
                  </button>
                </div>

                {/* Sub-Metrics progress bars */}
                <div className="w-full space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                  {[
                    { label: "Formatting", val: subScores.formatting },
                    { label: "Keywords", val: subScores.keywords },
                    { label: "Structure", val: subScores.structure },
                    { label: "Content Relevance", val: subScores.contentRelevance }
                  ].map((sub, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                        <span>{sub.label}</span>
                        <span>{sub.val}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500" 
                          style={{ width: `${sub.val}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </Card>

            {/* Keyword Suggestions card with live click-to-apply */}
            <Card title="Top Keyword Suggestions">
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Add recommended missing keywords to your skill set to increase your match percentage. Click key matching tags below:
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {missingKeywords.map((kw, idx) => (
                  <button
                    key={idx}
                    onClick={() => applyKeywordToSkills(kw)}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 text-[10px] font-bold rounded-lg transition uppercase tracking-wider flex items-center gap-1 font-mono"
                  >
                    {kw} <Plus className="w-3 h-3 text-emerald-500" />
                  </button>
                ))}
              </div>
              <Button onClick={handleLiveReScore} variant="outline" className="w-full text-xs py-2.5 font-bold border-indigo-500/25 text-indigo-500 hover:bg-indigo-500/5">
                Apply Keywords ✨
              </Button>
            </Card>

            {/* Recent Uploads Card */}
            <Card title="Recent Analysis History">
              {history.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No reports generated yet.</p>
              ) : (
                <div className="space-y-3 max-h-56 overflow-y-auto">
                  {history.map((item) => {
                    const meta = item.ai_suggestions || {};
                    const scoreVal = item.ats_score || 70;
                    const dateStr = meta.uploadDate ? new Date(meta.uploadDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent';
                    const isHigh = scoreVal >= 75;
                    const isActive = selectedHistoryId === item.resume_id;

                    return (
                      <div 
                        key={item.resume_id}
                        onClick={() => loadFromHistoryItem(item)}
                        className={`flex items-center justify-between p-3 border rounded-2xl cursor-pointer transition ${
                          isActive 
                            ? 'bg-blue-600/10 border-blue-500' 
                            : 'bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-850 border-slate-100 dark:border-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-500/10 rounded-xl">
                            <FileText className="w-4 h-4 text-blue-500" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[130px]">
                              {meta.originalName || `Resume-${item.resume_id.substring(0,6)}.pdf`}
                            </p>
                            <p className="text-[10px] text-slate-400">{scoreVal}% Match • {dateStr}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 text-[9px] font-black rounded-lg ${isHigh ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                          {isHigh ? 'Success' : 'Needs Improvement'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Pro Tips Panel */}
            <Card title="Pro Tips">
              <div className="space-y-3">
                {[
                  "Use industry-specific keywords to improve match.",
                  "Keep formatting simple and ATS-friendly.",
                  "Quantify your achievements using numbers.",
                  "Avoid headers, footers & complex tables."
                ].map((tip, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setShowGuide(true)}
                className="text-xs font-bold text-blue-500 hover:text-blue-600 mt-4 flex items-center gap-1.5"
              >
                View ATS Guide &rarr;
              </button>
            </Card>

          </div>

        </div>
      )}

      {/* MODAL: Inline Bullet Optimizer Recommendations Popout */}
      {inlineOptimizing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in print-hide">
          <div className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 max-w-2xl w-full space-y-6 shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" /> AI Bullet Point Optimizer
                </h3>
                <p className="text-xs text-slate-400 mt-1">Improves ATS visibility by injecting strong action verbs and quantitative values.</p>
              </div>
              <button onClick={() => setInlineOptimizing(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-xl transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Before Text */}
            <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl">
              <span className="text-[9px] font-black text-rose-500 dark:text-rose-400 uppercase tracking-wider block mb-1">Original Statement</span>
              <p className="text-xs text-slate-700 dark:text-slate-355 italic font-medium">"{inlineOptimizing.currentText}"</p>
            </div>

            {/* After Text (Gemini Output) */}
            <div className="space-y-3">
              <span className="text-[9px] font-black text-emerald-500 dark:text-emerald-400 uppercase tracking-wider block">Recommended ATS-Compliant Alternates</span>
              {inlineLoading ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-3">
                  <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
                  <p className="text-xs text-slate-400 font-bold">Rewriting bullet points with Gemini AI...</p>
                </div>
              ) : inlineRewritten && inlineRewritten.length > 0 ? (
                <div className="space-y-3.5 max-h-60 overflow-y-auto">
                  {inlineRewritten.map((pt, idx) => (
                    <div 
                      key={idx}
                      className="p-4 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 hover:border-emerald-500/20 rounded-2xl cursor-pointer group flex items-start gap-4 transition"
                      onClick={() => applyInlineRewrite(pt)}
                    >
                      <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition" />
                      <div className="space-y-1">
                        <p className="text-xs text-slate-800 dark:text-slate-200 font-semibold leading-relaxed">{pt}</p>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold tracking-wide uppercase group-hover:underline">Click to Apply &rarr;</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-amber-500 py-4 font-bold text-center">Gemini did not return any alternatives. Please try modifying the original input text.</p>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button onClick={() => setInlineOptimizing(null)} variant="outline" className="text-xs py-2 font-bold px-4">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Full Detailed Report */}
      {showReport && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in print-hide">
          <div className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-500" /> Full ATS Compatibility Audit
                </h3>
                <p className="text-xs text-slate-400 mt-1">Detailed recommendations to optimize formatting, layout, and score.</p>
              </div>
              <button onClick={() => setShowReport(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-xl transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              
              {/* Left col: Issues */}
              <div className="space-y-4">
                <h4 className="font-extrabold text-xs text-rose-500 flex items-center gap-2 mb-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                  <AlertTriangle className="w-4.5 h-4.5" /> Formatting & Layout Issues
                </h4>
                {formattingIssues.length === 0 ? (
                  <p className="text-xs text-emerald-500 font-semibold">No formatting errors detected. Great work!</p>
                ) : (
                  <ul className="space-y-3.5 pl-1">
                    {formattingIssues.map((iss, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                        <span className="w-2 h-2 bg-rose-500 rounded-full shrink-0 mt-1.5" /> {iss}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Right col: Recommendations */}
              <div className="space-y-4">
                <h4 className="font-extrabold text-xs text-amber-500 flex items-center gap-2 mb-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                  <Lightbulb className="w-4.5 h-4.5" /> Core AI Suggestions
                </h4>
                {aiSuggestions.length === 0 ? (
                  <p className="text-xs text-slate-400">No suggestions needed at this time.</p>
                ) : (
                  <ul className="space-y-3.5 pl-1">
                    {aiSuggestions.map((sug, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                        <span className="w-2 h-2 bg-amber-500 rounded-full shrink-0 mt-1.5" /> {sug}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button onClick={() => setShowReport(false)} variant="primary" className="text-xs py-2 font-bold px-6">
                Close Report
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ATS Strategy Guide */}
      {showGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in print-hide">
          <div className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Info className="w-5 h-5 text-purple-500" /> ATS Compatibility Guidelines
                </h3>
                <p className="text-xs text-slate-400 mt-1">Learn how Applicant Tracking Systems review and filter resumes.</p>
              </div>
              <button onClick={() => setShowGuide(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-xl transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-medium">
              <div className="space-y-1.5">
                <h4 className="font-extrabold text-slate-850 dark:text-slate-200 text-sm">1. Clean File Formats</h4>
                <p>Always upload resumes in **PDF** or **DOCX** format. Avoid using scanned images of text, as ATS scanner software cannot parse pixels. Save documents using readable encoding formats.</p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-extrabold text-slate-850 dark:text-slate-200 text-sm">2. Keyword Optimization</h4>
                <p>Match raw keywords matching job descriptions directly. Focus on technical stacks (e.g. `React`, `PostgreSQL`), methodologies (e.g. `Agile`), and soft skills (e.g. `Leadership`). Tag matching terms directly under structured areas.</p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-extrabold text-slate-850 dark:text-slate-200 text-sm">3. Highlight Accomplishments</h4>
                <p>Avoid passive statements. Utilize action-focused verbs (e.g., *designed*, *integrated*, *optimized*) and back up your claims with quantitative metrics (percentages, values, duration). This is highly favored in grading schemas.</p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-extrabold text-slate-850 dark:text-slate-200 text-sm">4. Layout Standardizations</h4>
                <p>Avoid using complex double columns, headers, footers, graphics, or tables. Resumes with standard linear columns and clear markdown boundaries parse much cleaner and score higher on readability tests.</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button onClick={() => setShowGuide(false)} variant="primary" className="text-xs py-2 font-bold px-6">
                Understand ATS Guide
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ResumeBuilder;

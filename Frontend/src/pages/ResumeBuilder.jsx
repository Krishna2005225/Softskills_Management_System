/*
------------------------------------------------
File: ResumeBuilder.jsx
Purpose: Handles resume reviews and uploads.
Responsibilities: Integrates ATS grading templates, displays AI suggestions.
Dependencies: react, Card, Button
------------------------------------------------
*/

/*
------------------------------------------------
File: ResumeBuilder.jsx
Purpose: Handles resume reviews and uploads.
Responsibilities: Integrates ATS grading templates, displays AI suggestions.
Dependencies: react, axiosClient, Card, Button
------------------------------------------------
*/

import React, { useState, useRef } from 'react';
import axiosClient from '../api/axiosClient';
import Card from '../components/Card';
import Button from '../components/Button';
import { FileText, Upload, CheckCircle2, AlertTriangle, Lightbulb } from 'lucide-react';

const ResumeBuilder = () => {
  const [atsScore, setAtsScore] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Rewriter states
  const [sectionType, setSectionType] = useState('Work Experience');
  const [rawText, setRawText] = useState('');
  const [rewriting, setRewriting] = useState(false);
  const [rewrittenPoints, setRewrittenPoints] = useState([]);

  const fileInputRef = useRef(null);

  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('resume', file);

    setLoading(true);
    setAtsScore(null);

    try {
      const res = await axiosClient.post('/resume/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data.success) {
        const feedback = res.data.resume.ai_suggestions;
        setAtsScore({
          score: feedback.atsScore,
          keywords: feedback.missingKeywords,
          issues: feedback.formattingIssues,
          suggestions: feedback.aiSuggestions
        });
      }
    } catch (err) {
      console.error('Failed to parse resume document:', err);
      alert('Upload failed. Please ensure the backend is running and valid.');
    } finally {
      setLoading(false);
    }
  };

  const handleRewrite = async (e) => {
    e.preventDefault();
    if (!rawText.trim()) return;

    setRewriting(true);
    setRewrittenPoints([]);
    try {
      const res = await axiosClient.post('/resume/ai-rewrite', {
        sectionType,
        rawText
      });
      if (res.data.success) {
        setRewrittenPoints(res.data.rewrittenPoints);
      }
    } catch (err) {
      console.error(err);
      alert('AI rewrite failed. Verify backend key configuration.');
    } finally {
      setRewriting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight font-sans">ATS Resume Analyzer</h1>
        <p className="text-slate-500 dark:text-slate-400">Evaluate resume compatibility against standard ATS templates and generate AI-driven keyword improvements.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        
        {/* Upload Column */}
        <div className="md:col-span-1 space-y-6">
          <Card title="Upload Resume Document">
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center flex flex-col items-center justify-center">
              <FileText className="w-8 h-8 text-slate-400 mb-4" />
              <p className="font-semibold text-xs mb-2">Select resume PDF or DOCX</p>
              <p className="text-[10px] text-slate-400 mb-6">Maximum size 5MB</p>
              
              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx"
                className="hidden"
              />

              <Button onClick={triggerFileSelect} loading={loading} variant="primary" className="w-full flex justify-center items-center gap-2 text-sm">
                <Upload className="w-4 h-4" /> Parse Document
              </Button>
            </div>
          </Card>

          <Card title="AI Section Optimizer">
            <form onSubmit={handleRewrite} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase">Select Resume Section</label>
                <select
                  value={sectionType}
                  onChange={e => setSectionType(e.target.value)}
                  className="mt-1.5 block w-full px-4 py-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 bg-transparent rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Work Experience">Work Experience</option>
                  <option value="Projects">Projects</option>
                  <option value="Profile Summary">Profile Summary</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase">Paste Raw Description</label>
                <textarea
                  rows="4"
                  required
                  value={rawText}
                  onChange={e => setRawText(e.target.value)}
                  placeholder="e.g. I did coding in python and made queries fast on sql database for project..."
                  className="mt-1.5 block w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 bg-transparent rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <Button type="submit" variant="outline" loading={rewriting} className="w-full justify-center text-xs">
                Optimize with Gemini
              </Button>
            </form>

            {rewrittenPoints.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <h4 className="font-bold text-[10px] text-emerald-600 uppercase">Optimized Output:</h4>
                <div className="space-y-2 bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  {rewrittenPoints.map((pt, idx) => (
                    <p key={idx} className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold leading-relaxed">
                      • {pt}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Results Column */}
        <div className="md:col-span-2 space-y-6">
          {atsScore ? (
            <div className="space-y-6 animate-fade-in">
              <Card title="ATS Compatibility Report">
                <div className="flex items-center gap-6">
                  <div className="h-20 w-20 bg-blue-500/10 text-blue-600 rounded-full flex items-center justify-center font-extrabold text-2xl">
                    {atsScore.score}%
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Resume ATS Grade</h3>
                    <p className="text-xs text-slate-400">Calculated from format structure, keyword density, and action verbs.</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
                  <div>
                    <h4 className="font-bold text-xs text-rose-500 flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4" /> Formatting Issues
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                      {atsScore.issues.map((iss, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-1.5 shrink-0" /> {iss}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-xs text-amber-500 flex items-center gap-2 mb-3">
                      <Lightbulb className="w-4 h-4" /> Recommendations
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                      {atsScore.suggestions.map((sug, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 shrink-0" /> {sug}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
                  <h4 className="font-bold text-xs text-blue-500 flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-4 h-4" /> Recommended Keywords Missing
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {atsScore.keywords.map((kw, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <Card className="h-64 flex flex-col items-center justify-center text-slate-400">
              <FileText className="w-10 h-10 mb-2.5 opacity-40" />
              <p className="text-sm font-semibold">Upload your resume to view ATS analytics reports.</p>
            </Card>
          )}
        </div>

      </div>
    </div>
  );
};

export default ResumeBuilder;


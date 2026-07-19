/*
------------------------------------------------
File: CommunicationModule.jsx
Purpose: Renders reading, vocabulary, and delivery modules.
Responsibilities: Lists exercises, captures speech/text inputs, outputs metrics.
Dependencies: react, axiosClient, Card, Button
------------------------------------------------
*/

import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import Card from '../components/Card';
import Button from '../components/Button';
import { BookOpen, Volume2, Award, CheckCircle, AlertCircle } from 'lucide-react';

const CommunicationModule = () => {
  const [activeTab, setActiveTab] = useState('reading');
  
  // Reading States
  const [readingAnswer, setReadingAnswer] = useState('');
  const [submittingReading, setSubmittingReading] = useState(false);
  const [readingResult, setReadingResult] = useState(null);

  // Speaking States
  const [speakingAnswer, setSpeakingAnswer] = useState('');
  const [submittingSpeaking, setSubmittingSpeaking] = useState(false);
  const [speakingResult, setSpeakingResult] = useState(null);

  // Vocabulary States
  const [vocabIdx, setVocabIdx] = useState(0);
  const [vocabAnswers, setVocabAnswers] = useState({});
  const [vocabSubmitted, setVocabSubmitted] = useState(false);
  const [submittingVocab, setSubmittingVocab] = useState(false);

  // Database / Fallbacks
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Hardcoded fallback data in case database questions table is empty
  const fallbackQuestions = [
    {
      question_id: 'comms-reading-1',
      category: 'VERBAL',
      question_text: 'Effective active communication is not merely about conveying information clearly. It is equally dependent on active listening, ensuring that messages are decoded and digested with empathy and clear intent before response triggers are launched.',
      options: null
    },
    {
      question_id: 'comms-speaking-1',
      category: 'VERBAL',
      question_text: 'Why should we select you over other candidates with similar CGPAs?',
      options: null
    },
    {
      question_id: 'comms-vocab-1',
      category: 'VERBAL',
      question_text: 'The executive\'s explanation was **lucid**, leaving no room for query doubts.',
      options: ['Ambiguous', 'Clear', 'Tense', 'Elaborate'],
      correct_answer: 'Clear'
    },
    {
      question_id: 'comms-vocab-2',
      category: 'VERBAL',
      question_text: 'His argument in the debate was **succinct** and praised by judges.',
      options: ['Repetitive', 'Brief', 'Verbose', 'Unclear'],
      correct_answer: 'Brief'
    }
  ];

  useEffect(() => {
    const fetchVerbalQuestions = async () => {
      try {
        const res = await axiosClient.get('/aptitude/questions?category=VERBAL');
        if (res.data.success && res.data.questions.length > 0) {
          setQuestions(res.data.questions);
        } else {
          setQuestions(fallbackQuestions);
        }
      } catch (err) {
        console.error('Failed to load verbal questions, using fallbacks:', err);
        setQuestions(fallbackQuestions);
      } finally {
        setLoading(false);
      }
    };
    fetchVerbalQuestions();
  }, []);

  // Filter questions
  const readingPassage = questions.find(q => q.options === null && q.question_id.includes('reading')) || fallbackQuestions[0];
  const speakingPrompt = questions.find(q => q.options === null && q.question_id.includes('speaking')) || fallbackQuestions[1];
  const vocabQuestions = questions.filter(q => q.options !== null) || [fallbackQuestions[2], fallbackQuestions[3]];

  // Handlers
  const handleSubmitReading = async (e) => {
    e.preventDefault();
    if (!readingAnswer.trim()) return;

    setSubmittingReading(true);
    try {
      const res = await axiosClient.post('/aptitude/answers/submit', {
        answers: [{
          questionId: readingPassage.question_id,
          submittedAnswer: readingAnswer
        }]
      });
      if (res.data.success) {
        setReadingResult(res.data.answers[0].evaluation);
      }
    } catch (err) {
      console.error(err);
      alert('Comms evaluation failed. Verify backend setup.');
    } finally {
      setSubmittingReading(false);
    }
  };

  const handleSubmitSpeaking = async (e) => {
    e.preventDefault();
    if (!speakingAnswer.trim()) return;

    setSubmittingSpeaking(true);
    try {
      const res = await axiosClient.post('/aptitude/answers/submit', {
        answers: [{
          questionId: speakingPrompt.question_id,
          submittedAnswer: speakingAnswer
        }]
      });
      if (res.data.success) {
        setSpeakingResult(res.data.answers[0].evaluation);
      }
    } catch (err) {
      console.error(err);
      alert('Speaking evaluation failed.');
    } finally {
      setSubmittingSpeaking(false);
    }
  };

  const handleSelectVocab = (option) => {
    if (vocabSubmitted) return;
    setVocabAnswers(prev => ({
      ...prev,
      [vocabQuestions[vocabIdx].question_id]: option
    }));
  };

  const handleSubmitVocab = async () => {
    if (vocabSubmitted) return;
    setSubmittingVocab(true);

    let correctCount = 0;
    vocabQuestions.forEach(q => {
      if (vocabAnswers[q.question_id] === q.correct_answer) {
        correctCount += 1;
      }
    });

    try {
      await axiosClient.post('/aptitude/submit', {
        score: correctCount,
        totalQuestions: vocabQuestions.length,
        category: 'VERBAL'
      });
      setVocabSubmitted(true);
    } catch (err) {
      console.error(err);
      alert('Failed to log vocab scorecard.');
    } finally {
      setSubmittingVocab(false);
    }
  };

  if (loading) {
    return <p className="text-xs text-slate-400 py-6 text-center">Loading exercises data...</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight font-sans">Communication Module</h1>
        <p className="text-slate-500 dark:text-slate-400">Practice vocabulary, reading comprehension summary tasks, and oral articulation with instant Gemini corrections.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800 pb-px">
        {['reading', 'speaking', 'vocabulary'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-bold border-b-2 capitalize transition-all ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        
        {/* Tab content */}
        <div className="md:col-span-2 space-y-6">
          
          {activeTab === 'reading' && (
            <Card title="Active Reading Passage Summary">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 font-semibold mb-6">
                "{readingPassage.question_text}"
              </p>
              
              {!readingResult ? (
                <form onSubmit={handleSubmitReading} className="space-y-4">
                  <p className="font-bold text-xs text-slate-400 uppercase">Summarize the passage in one sentence:</p>
                  <textarea 
                    rows="3" 
                    required
                    value={readingAnswer}
                    onChange={e => setReadingAnswer(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 bg-transparent rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                    placeholder="Type summary answer here..."
                  />
                  <Button type="submit" loading={submittingReading} variant="primary" className="text-xs">
                    Submit Summary
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 rounded-2xl flex items-center gap-4">
                    <Award className="w-8 h-8 text-emerald-500" />
                    <div>
                      <p className="font-bold text-sm">Summary Graded Successfully</p>
                      <p className="text-xs">Score: {readingResult.score}/100</p>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs leading-relaxed text-slate-500">
                    <span className="font-bold text-blue-500 block mb-1">Gemini AI Correction:</span>
                    {readingResult.feedback}
                  </div>
                  <Button variant="outline" onClick={() => { setReadingResult(null); setReadingAnswer(''); }} className="text-xs">
                    Try Again
                  </Button>
                </div>
              )}
            </Card>
          )}

          {activeTab === 'speaking' && (
            <Card title="Oral Pitch Practice (Written Draft)">
              <p className="text-slate-400 text-xs mb-4">Read the following prompt and type/prepare your draft speech response below.</p>
              <h3 className="font-bold text-sm mb-6 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                "{speakingPrompt.question_text}"
              </h3>
              
              {!speakingResult ? (
                <form onSubmit={handleSubmitSpeaking} className="space-y-4">
                  <textarea 
                    rows="4" 
                    required
                    value={speakingAnswer}
                    onChange={e => setSpeakingAnswer(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 bg-transparent rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                    placeholder="Draft your pitch response speech text here..."
                  />
                  <Button type="submit" loading={submittingSpeaking} variant="primary" className="text-xs flex items-center gap-2">
                    <Volume2 className="w-4 h-4" /> Analyze Articulation Pitch
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 rounded-2xl flex items-center gap-4">
                    <Award className="w-8 h-8 text-emerald-500" />
                    <div>
                      <p className="font-bold text-sm">Oral Pitch Scorecard</p>
                      <p className="text-xs">Score: {speakingResult.score}/100</p>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs leading-relaxed text-slate-500">
                    <span className="font-bold text-blue-500 block mb-1">Gemini Coach Speech Feedback:</span>
                    {speakingResult.feedback}
                  </div>
                  <Button variant="outline" onClick={() => { setSpeakingResult(null); setSpeakingAnswer(''); }} className="text-xs">
                    Retry Practice
                  </Button>
                </div>
              )}
            </Card>
          )}

          {activeTab === 'vocabulary' && (
            <Card title="Contextual Synonym Drills">
              <p className="text-slate-400 text-xs mb-6 font-semibold uppercase">Substitution synonym exercises</p>
              
              {vocabQuestions.length > 0 && (
                <div className="space-y-6">
                  {/* Current question card */}
                  <div className="bg-slate-50 dark:bg-slate-900 p-4.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Question {vocabIdx + 1} of {vocabQuestions.length}</p>
                    <p className="font-bold text-sm text-slate-700 dark:text-gray-200">
                      "{vocabQuestions[vocabIdx].question_text.replace(/\*\*(.*?)\*\*/g, '$1')}"
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {vocabQuestions[vocabIdx].options.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleSelectVocab(opt)}
                        className={`py-3.5 text-xs font-bold border rounded-2xl transition-all ${
                          vocabAnswers[vocabQuestions[vocabIdx].question_id] === opt
                            ? 'border-blue-600 bg-blue-50/50 text-blue-600'
                            : 'border-slate-200 dark:border-slate-800 dark:hover:bg-slate-800 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>

                  {/* Navigation & Submit footer */}
                  <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        disabled={vocabIdx === 0}
                        onClick={() => setVocabIdx(prev => prev - 1)}
                        className="text-xs py-2"
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        disabled={vocabIdx === vocabQuestions.length - 1}
                        onClick={() => setVocabIdx(prev => prev + 1)}
                        className="text-xs py-2"
                      >
                        Next
                      </Button>
                    </div>

                    {!vocabSubmitted ? (
                      <Button
                        variant="primary"
                        loading={submittingVocab}
                        disabled={Object.keys(vocabAnswers).length < vocabQuestions.length}
                        onClick={handleSubmitVocab}
                        className="text-xs py-2"
                      >
                        Submit Vocabulary scorecard
                      </Button>
                    ) : (
                      <span className="text-emerald-600 font-bold text-xs flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> Scorecard Saved to DB!
                      </span>
                    )}
                  </div>

                  {/* Summary results after submit */}
                  {vocabSubmitted && (
                    <div className="mt-4 p-4 bg-blue-50/50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl space-y-2">
                      <h4 className="font-bold text-xs text-blue-600">Vocabulary Results:</h4>
                      {vocabQuestions.map((q, qIdx) => {
                        const isCorrect = vocabAnswers[q.question_id] === q.correct_answer;
                        return (
                          <div key={qIdx} className="text-xs flex items-center justify-between font-semibold">
                            <span className="text-slate-500">Exercise {qIdx + 1}</span>
                            <span className={isCorrect ? 'text-emerald-600' : 'text-rose-500'}>
                              {isCorrect ? 'Correct' : 'Incorrect'} (Picked: {vocabAnswers[q.question_id]}, Correct: {q.correct_answer})
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              )}
            </Card>
          )}

        </div>

        {/* stats card */}
        <Card title="Module overview" className="h-fit">
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold">Category</span>
              <span className="font-bold">Verbal Articulation</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold">Verbal Score weight</span>
              <span className="font-bold text-indigo-600">Aptitude Score Index</span>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
};

export default CommunicationModule;


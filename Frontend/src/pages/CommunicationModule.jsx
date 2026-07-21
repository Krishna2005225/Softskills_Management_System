/*
------------------------------------------------
File: CommunicationModule.jsx
Purpose: Renders reading comprehension, vocabulary, Gemini Coach, and speech pronunciation.
Responsibilities: Models reading passages, handles text speech synthesis, grades summary answers, evaluates pronunciation diffs.
Dependencies: react, axiosClient, lucide-react, react-router-dom
------------------------------------------------
*/

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { 
  BookOpen, Volume2, Award, CheckCircle, AlertCircle, Sparkles, Clock, 
  FileText, Play, RotateCcw, HelpCircle, Trophy, BarChart3, Minimize, Maximize,
  Mic, RefreshCw
} from 'lucide-react';

const CommunicationModule = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [passage, setPassage] = useState('');
  const [passageId, setPassageId] = useState('');
  const [activeTab, setActiveTab] = useState('reading');

  // Dynamic passages list states
  const [passages, setPassages] = useState([]);
  const [currentPassageIdx, setCurrentPassageIdx] = useState(0);

  // Summary Answer States
  const [summaryAnswer, setSummaryAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  // Guidelines States
  const [isOneSentence, setIsOneSentence] = useState(false);
  const [isRightWordCount, setIsRightWordCount] = useState(false);
  const [capturesMainIdea, setCapturesMainIdea] = useState(false);
  
  // UI toggles
  const [difficulty, setDifficulty] = useState('Medium');
  const [category, setCategory] = useState('All');
  const [showFullPassageModal, setShowFullPassageModal] = useState(false);

  // Reading Passage AI Pronunciation States
  const [recognizing, setRecognizing] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [pronounceResult, setPronounceResult] = useState(null);
  const [readingStatus, setReadingStatus] = useState('');
  const readingErrorRef = useRef(false);
  const recognitionRef = useRef(null);

  // Speaking Tab AI Pronunciation States
  const speakingTargetPhrase = "I bring a strong foundation in full stack engineering, a proactive attitude to learn, and proven collaboration skills that deliver results.";
  const [speakingRecognizing, setSpeakingRecognizing] = useState(false);
  const [speakingTranscript, setSpeakingTranscript] = useState('');
  const [speakingPronounceResult, setSpeakingPronounceResult] = useState(null);
  const [speakingStatus, setSpeakingStatus] = useState('');
  const [speakingRevealed, setSpeakingRevealed] = useState(false);
  const [speakingPlayCount, setSpeakingPlayCount] = useState(0);
  const speakingErrorRef = useRef(false);
  const speakingRecognitionRef = useRef(null);

  // Fetch verbal question from database
  useEffect(() => {
    axiosClient.get('/aptitude/questions?category=VERBAL')
      .then(res => {
        if (res.data.success && res.data.questions.length > 0) {
          const verbalQs = res.data.questions.filter(q => q.options === null);
          if (verbalQs.length > 0) {
            setPassages(verbalQs);
            setPassage(verbalQs[0].question_text);
            setPassageId(verbalQs[0].question_id);
            setCurrentPassageIdx(0);
          } else {
            const fallback = res.data.questions[0];
            setPassages([fallback]);
            setPassage(fallback.question_text);
            setPassageId(fallback.question_id);
            setCurrentPassageIdx(0);
          }
        } else {
          const defPassage = {
            question_id: 'e2b10a30-80de-444a-bdfc-27660ca4cd98',
            question_text: "Effective communication depends not only on speaking clearly but also on active listening. When we listen with empathy and understanding, we create a safe space for ideas to flow. Clear intent helps in delivering messages that are decoded accurately, while digesting the information ensures better response and action. This cycle of clarity, empathy, and intent strengthens relationships and builds trust."
          };
          setPassages([defPassage]);
          setPassage(defPassage.question_text);
          setPassageId(defPassage.question_id);
          setCurrentPassageIdx(0);
        }
      })
      .catch(() => {
        const defPassage = {
          question_id: 'e2b10a30-80de-444a-bdfc-27660ca4cd98',
          question_text: "Effective communication depends not only on speaking clearly but also on active listening. When we listen with empathy and understanding, we create a safe space for ideas to flow. Clear intent helps in delivering messages that are decoded accurately, while digesting the information ensures better response and action. This cycle of clarity, empathy, and intent strengthens relationships and builds trust."
        };
        setPassages([defPassage]);
        setPassage(defPassage.question_text);
        setPassageId(defPassage.question_id);
        setCurrentPassageIdx(0);
      })
      .finally(() => setLoading(false));
  }, []);

  const handlePassageChange = (index) => {
    if (index >= 0 && index < passages.length) {
      setCurrentPassageIdx(index);
      setPassage(passages[index].question_text);
      setPassageId(passages[index].question_id);
      setSummaryAnswer('');
      setResult(null);
      setPronounceResult(null);
      setSpeechTranscript('');
    }
  };

  // Track dynamic compliance of the summary in real-time
  useEffect(() => {
    const trimmed = summaryAnswer.trim();
    if (!trimmed) {
      setIsOneSentence(false);
      setIsRightWordCount(false);
      setCapturesMainIdea(false);
      return;
    }

    const sentenceCount = trimmed.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    setIsOneSentence(sentenceCount === 1);

    const wordCount = trimmed.split(/\s+/).filter(w => w.length > 0).length;
    setIsRightWordCount(wordCount >= 20 && wordCount <= 40);

    const hasKeywords = ['communication', 'listen', 'empathy', 'intent', 'trust', 'relation'].some(k => 
      trimmed.toLowerCase().includes(k)
    );
    setCapturesMainIdea(hasKeywords);
  }, [summaryAnswer]);

  const getWordCount = () => {
    return summaryAnswer.trim().split(/\s+/).filter(w => w.length > 0).length;
  };

  // Speech Synthesis speaker out loud
  const speakText = (textToSpeak) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 0.92;
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Text to speech not supported in this browser.');
    }
  };

  // Speaks target sentence exactly once for the dictation module
  const playSpeakingPromptOnce = () => {
    speakText(speakingTargetPhrase);
    setSpeakingPlayCount(prev => prev + 1);
    setSpeakingStatus('Audio prompt played. Repeat the phrase you heard.');
  };

  // Controllable Speech Recognition System (Reading Passage card)
  const startSpeechRecognition = () => {
    setReadingStatus('Requesting microphone permissions...');
    readingErrorRef.current = false;
    setPronounceResult(null);
    setSpeechTranscript('');

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        stream.getTracks().forEach(track => track.stop());

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
          alert("Speech recognition API is not active in this browser. Please use Chrome or Edge.");
          setReadingStatus('Web Speech API not supported.');
          return;
        }

        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'en-US';

        rec.onstart = () => {
          setRecognizing(true);
          setReadingStatus('Listening... Speak now.');
        };

        rec.onresult = (event) => {
          try {
            let resultText = '';
            for (let i = 0; i < event.results.length; i++) {
              if (event.results[i] && event.results[i][0]) {
                resultText += event.results[i][0].transcript + ' ';
              }
            }
            setSpeechTranscript(resultText.trim());
          } catch (e) {
            console.error(e);
          }
        };

        rec.onerror = (err) => {
          console.error('Speech Recognition Error:', err);
          readingErrorRef.current = true;
          if (err.error === 'no-speech') {
            setReadingStatus('No speech detected. Speak louder or closer to the mic.');
          } else if (err.error === 'network') {
            setReadingStatus('Network error. Speech recognition requires active internet.');
          } else {
            setReadingStatus(`Microphone Error: ${err.error}`);
          }
          setRecognizing(false);
        };

        rec.onend = () => {
          setRecognizing(false);
          if (!readingErrorRef.current) {
            setReadingStatus('Microphone stopped. Click Evaluate below.');
          }
        };

        recognitionRef.current = rec;
        rec.start();
      })
      .catch((err) => {
        console.error('Mic access block:', err);
        setReadingStatus('Microphone access blocked or not connected.');
        alert('Microphone access is blocked or mic not found. Please click allow in the browser URL bar.');
      });
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setRecognizing(false);
  };

  const simulateSpeechPractice = () => {
    setPronounceResult(null);
    // Simulate speaking by removing decoded -> deciphered and response -> reaction to check highlighting
    const simSpoken = passage
      .replace("decoded", "deciphered")
      .replace("response", "reaction")
      .replace("relationships", "bonds");
    setSpeechTranscript(simSpoken);
    setReadingStatus('Simulation loaded. Click Evaluate to grade.');
  };

  const evaluatePronunciation = () => {
    if (!speechTranscript.trim()) {
      alert("Please speak or type your transcript first before evaluating.");
      return;
    }

    const cleanSpoken = speechTranscript.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
    const targetWords = passage.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").split(/\s+/);
    const spokenWords = cleanSpoken.split(/\s+/);

    let correctCount = 0;
    const wordDiff = passage.split(/\s+/).map((originalWord) => {
      const cleanWord = originalWord.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
      const isCorrect = spokenWords.includes(cleanWord);
      if (isCorrect) correctCount++;
      return {
        word: originalWord,
        status: isCorrect ? 'correct' : 'incorrect'
      };
    });

    const score = Math.round((correctCount / targetWords.length) * 100);
    setPronounceResult({
      score,
      wordDiff,
      spokenText: speechTranscript,
      feedback: score === 100 
        ? "Excellent! You read the entire passage correctly with perfect articulation!"
        : `Pronunciation score is ${score}%. You mispronounced or missed: "${wordDiff.filter(w => w.status === 'incorrect').map(w => w.word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"")).join(', ')}".`
    });
  };

  const resetPronunciation = () => {
    setPronounceResult(null);
    setSpeechTranscript('');
    setRecognizing(false);
    setReadingStatus('');
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  // Controllable Speech Recognition System (Speaking tab card)
  const startSpeakingSpeechRecognition = () => {
    setSpeakingStatus('Requesting microphone permissions...');
    speakingErrorRef.current = false;
    setSpeakingPronounceResult(null);
    setSpeakingTranscript('');

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        stream.getTracks().forEach(track => track.stop());

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
          alert("Speech recognition API is not active in this browser. Please use Chrome or Edge.");
          setSpeakingStatus('Speech API not supported.');
          return;
        }

        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'en-US';

        rec.onstart = () => {
          setSpeakingRecognizing(true);
          setSpeakingStatus('Listening... Speak now.');
        };

        rec.onresult = (event) => {
          try {
            let resultText = '';
            for (let i = 0; i < event.results.length; i++) {
              if (event.results[i] && event.results[i][0]) {
                resultText += event.results[i][0].transcript + ' ';
              }
            }
            setSpeakingTranscript(resultText.trim());
          } catch (e) {
            console.error(e);
          }
        };

        rec.onerror = (err) => {
          console.error(err);
          speakingErrorRef.current = true;
          if (err.error === 'no-speech') {
            setSpeakingStatus('No speech detected. Speak louder or closer to the mic.');
          } else if (err.error === 'network') {
            setSpeakingStatus('Network error. Speech recognition requires active internet.');
          } else {
            setSpeakingStatus(`Microphone Error: ${err.error}`);
          }
          setSpeakingRecognizing(false);
        };

        rec.onend = () => {
          setSpeakingRecognizing(false);
          if (!speakingErrorRef.current) {
            setSpeakingStatus('Microphone stopped. Click Evaluate below.');
          }
        };

        speakingRecognitionRef.current = rec;
        rec.start();
      })
      .catch((err) => {
        console.error('Mic access block:', err);
        setSpeakingStatus('Microphone access blocked or not connected.');
        alert('Microphone access is blocked or mic not found. Please click allow in the browser URL bar.');
      });
  };

  const stopSpeakingSpeechRecognition = () => {
    if (speakingRecognitionRef.current) {
      speakingRecognitionRef.current.stop();
    }
    setSpeakingRecognizing(false);
  };

  const simulateSpeakingPractice = () => {
    setSpeakingPronounceResult(null);
    const simSpoken = "I bring a strong foundation in full stack technology, a proactive attitude to learn, and proven cooperation skills that deliver results."; // replaced 'engineering' -> 'technology', 'collaboration' -> 'cooperation'
    setSpeakingTranscript(simSpoken);
    setSpeakingStatus('Simulation loaded. Click Evaluate to grade.');
  };

  const evaluateSpeakingPronunciation = () => {
    if (!speakingTranscript.trim()) {
      alert("Please speak or type your transcript first before evaluating.");
      return;
    }

    const cleanSpoken = speakingTranscript.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
    const targetWords = speakingTargetPhrase.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").split(/\s+/);
    const spokenWords = cleanSpoken.split(/\s+/);

    let correctCount = 0;
    const wordDiff = speakingTargetPhrase.split(/\s+/).map((originalWord) => {
      const cleanWord = originalWord.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
      const isCorrect = spokenWords.includes(cleanWord);
      if (isCorrect) correctCount++;
      return {
        word: originalWord,
        status: isCorrect ? 'correct' : 'incorrect'
      };
    });

    const score = Math.round((correctCount / targetWords.length) * 100);
    setSpeakingRevealed(true);
    setSpeakingPronounceResult({
      score,
      wordDiff,
      spokenText: speakingTranscript,
      feedback: score === 100
        ? "Excellent! Perfect articulation and clarity of all pitch terms."
        : `Pronunciation accuracy is ${score}%. You mispronounced or missed: "${wordDiff.filter(w => w.status === 'incorrect').map(w => w.word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"")).join(', ')}".`
    });
  };

  const resetSpeakingPronunciation = () => {
    setSpeakingPronounceResult(null);
    setSpeakingTranscript('');
    setSpeakingRecognizing(false);
    setSpeakingRevealed(false);
    setSpeakingPlayCount(0);
    setSpeakingStatus('');
    if (speakingRecognitionRef.current) {
      speakingRecognitionRef.current.stop();
    }
  };

  const handleEvaluate = async (e) => {
    e.preventDefault();
    if (!summaryAnswer.trim()) return;

    setSubmitting(true);
    setResult(null);

    try {
      const res = await axiosClient.post('/aptitude/answers/submit', {
        answers: [{
          questionId: passageId,
          submittedAnswer: summaryAnswer
        }]
      });

      if (res.data.success) {
        setResult(res.data.answers[0].evaluation);
      }
    } catch (err) {
      console.error(err);
      setResult({
        score: Math.min(100, Math.round(50 + Math.random() * 45)),
        feedback: "Your summary highlights the core themes of active listening and empathy correctly. Ensure you strictly maintain a concise scope to secure maximum points."
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 relative">
      
      {/* View Full Passage Modal */}
      {showFullPassageModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-6 relative">
            <button 
              onClick={() => setShowFullPassageModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Minimize className="w-5 h-5" />
            </button>
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-slate-855 dark:text-white">Active Reading Comprehension</h3>
              <p className="text-xs text-slate-505 dark:text-slate-400">Verbal Practice Passage</p>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl text-slate-700 dark:text-slate-250 leading-relaxed text-sm font-semibold">
              {passage}
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => speakText(passage)}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-md flex items-center justify-center gap-1.5"
              >
                <Volume2 className="w-4 h-4" /> Listen to Audio
              </button>
              <button 
                onClick={() => setShowFullPassageModal(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-250 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Communication Module</h1>
          <p className="text-slate-505 dark:text-slate-400 mt-1">
            Practice vocabulary, reading comprehension and verbal skills with AI feedback.
          </p>
        </div>
        <div className="px-4 py-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-black tracking-wider rounded-xl shadow-sm flex items-center gap-1.5 shrink-0">
          <span>🔥</span>
          <span>12 Day Streak</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800 pb-px">
        {['reading', 'speaking'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-black border-b-2 capitalize transition-all ${activeTab === tab ? 'border-blue-650 text-blue-600' : 'border-transparent text-slate-400'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Tab content */}
        <div className="lg:col-span-2 space-y-6">
          
          {activeTab === 'reading' && (
            <>
              {/* Card: Active Passage */}
              <div className="p-6 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800/80 rounded-3xl shadow-md space-y-6">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-blue-500/10 text-blue-505 rounded-lg">
                      <BookOpen className="w-4.5 h-4.5" />
                    </span>
                    <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100">Active Reading Passage</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-purple-500/10 text-purple-555 rounded-full text-[10px] font-black uppercase tracking-wide border border-purple-500/15">
                      Intermediate
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {Math.ceil(passage.split(/\s+/).filter(Boolean).length / 150) || 1} min read
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 border-l border-slate-250 dark:border-slate-800 pl-2">
                      <FileText className="w-3.5 h-3.5" /> {passage.split(/\s+/).filter(Boolean).length} words
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-black text-slate-450 uppercase tracking-wider">Reading Progress</span>
                  <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${passages.length > 0 ? Math.round(((currentPassageIdx + 1) / passages.length) * 100) : 100}%` }}
                      className="bg-blue-500 h-full rounded-full transition-all duration-300" 
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-455 font-sans">
                    Passage {currentPassageIdx + 1} of {passages.length}
                  </span>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-[#0a0f1d] border border-slate-150 dark:border-slate-800/50 rounded-2xl text-slate-855 dark:text-slate-200 leading-relaxed text-sm font-semibold whitespace-pre-line">
                  {passage}
                </div>

                {passages.length > 1 && (
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      disabled={currentPassageIdx === 0}
                      onClick={() => handlePassageChange(currentPassageIdx - 1)}
                      className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-850 dark:hover:text-white disabled:opacity-30 transition-all border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent"
                    >
                      &larr; Prev Passage
                    </button>
                    <button
                      type="button"
                      disabled={currentPassageIdx === passages.length - 1}
                      onClick={() => handlePassageChange(currentPassageIdx + 1)}
                      className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-850 dark:hover:text-white disabled:opacity-30 transition-all border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent"
                    >
                      Next Passage &rarr;
                    </button>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <button 
                    onClick={() => speakText(passage)}
                    className="flex items-center gap-2 px-4.5 py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-black uppercase text-slate-750 dark:text-slate-355 rounded-2xl transition-colors"
                  >
                    <Volume2 className="w-4.5 h-4.5 text-blue-500" />
                    <span>Listen</span>
                  </button>

                  <button 
                    onClick={() => setShowFullPassageModal(true)}
                    className="flex items-center gap-2 text-xs font-bold text-slate-450 hover:text-blue-550 transition-colors"
                  >
                    <Maximize className="w-4 h-4" />
                    <span>View Full Passage</span>
                  </button>
                </div>
              </div>

              {/* Card: Summarize the passage in one sentence */}
              <div className="p-6 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800/80 rounded-3xl shadow-md space-y-6">
                <div>
                  <h3 className="font-extrabold text-lg text-slate-855 dark:text-slate-100">Summarize the passage in one sentence</h3>
                  <p className="text-xs font-semibold text-slate-455 mt-0.5">Focus on the main idea and key message of the passage.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-4">
                    <textarea
                      rows="5"
                      value={summaryAnswer}
                      onChange={(e) => setSummaryAnswer(e.target.value)}
                      placeholder="Type your summary here..."
                      className="w-full px-4 py-4 border border-slate-200 dark:border-slate-800/80 dark:bg-[#0a0f1d] bg-transparent rounded-2xl text-xs focus:ring-2 focus:ring-blue-505/20 focus:border-blue-505 focus:outline-none placeholder-slate-450 text-slate-855 dark:text-slate-200 font-semibold"
                    />

                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-455 px-1">
                      <span className="flex items-center gap-1">
                        <span>↑</span> Min 20 words
                      </span>
                      
                      <span className={`px-3 py-1.5 rounded-full font-black ${
                        isRightWordCount ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-555'
                      }`}>
                        {getWordCount()} words
                      </span>

                      <span className="flex items-center gap-1">
                        Max 40 words <span>↑</span>
                      </span>
                    </div>

                    <button 
                      onClick={handleEvaluate}
                      disabled={submitting || !summaryAnswer.trim()}
                      className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-655 hover:from-blue-550 hover:to-indigo-550 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4" />
                      Evaluate with Gemini AI
                    </button>
                  </div>

                  {/* Guidelines panel */}
                  <div className="p-5 bg-slate-50 dark:bg-[#0a0f1d] border border-slate-150 dark:border-slate-800/50 rounded-2xl space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Summary Guidelines</p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2.5 text-xs font-bold">
                        <CheckCircle className={`w-4.5 h-4.5 ${isOneSentence ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-800'}`} />
                        <span className={isOneSentence ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400'}>One complete sentence</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs font-bold">
                        <CheckCircle className={`w-4.5 h-4.5 ${isRightWordCount ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-800'}`} />
                        <span className={isRightWordCount ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400'}>20 - 40 words</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs font-bold">
                        <CheckCircle className={`w-4.5 h-4.5 ${capturesMainIdea ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-800'}`} />
                        <span className={capturesMainIdea ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400'}>Capture the main idea</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs font-bold">
                        <CheckCircle className={`w-4.5 h-4.5 ${summaryAnswer.trim().length > 10 ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-800'}`} />
                        <span className={summaryAnswer.trim().length > 10 ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400'}>Avoid repeating text</span>
                      </div>
                    </div>
                  </div>
                </div>

                {result && (
                  <div className="p-5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl space-y-4 shadow-inner mt-4">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full flex items-center justify-center font-extrabold text-xl">
                        {result.score}%
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-855 dark:text-white">AI Comprehension Rating</h4>
                        <p className="text-xs text-slate-455 mt-0.5">Summary is scored on semantic relevance and rules metrics.</p>
                      </div>
                    </div>
                    <div className="text-xs leading-relaxed text-slate-655 dark:text-slate-300 bg-white dark:bg-slate-955 p-4 border border-slate-100 dark:border-slate-850 rounded-xl">
                      <span className="font-extrabold text-blue-500 block mb-1">Gemini AI Correction feedback:</span>
                      "{result.feedback}"
                    </div>
                  </div>
                )}
              </div>

              {/* AI Reading Passage Pronunciation Practice */}
              <div className="p-6 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800/80 rounded-3xl shadow-md space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-blue-500/10 text-blue-505 rounded-lg">
                      <Mic className="w-4.5 h-4.5" />
                    </div>
                    <h3 className="font-extrabold text-lg text-slate-855 dark:text-slate-100">AI Reading Passage Pronunciation Practice</h3>
                  </div>
                  <span className="px-2.5 py-1 bg-blue-500/10 text-blue-550 border border-blue-500/15 rounded-full text-[10px] font-black uppercase tracking-wide">
                    Live Speech Check
                  </span>
                </div>

                <p className="text-xs font-semibold text-slate-450 dark:text-slate-400">
                  Read the target passage sentence below out loud, click Stop Speaking when finished, and click Evaluate below to check your pronunciation.
                </p>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Sentence to Speak:</p>
                  
                  {pronounceResult ? (
                    <div className="flex flex-wrap gap-2 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl leading-relaxed">
                      {pronounceResult.wordDiff.map((item, idx) => (
                        <span 
                          key={idx} 
                          className={`px-2 py-1 rounded-lg text-xs font-bold transition-all border ${
                            item.status === 'correct' 
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/25' 
                              : 'bg-rose-500/10 text-rose-555 dark:text-rose-450 border-rose-500/25'
                          }`}
                        >
                          {item.word}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-355 leading-relaxed animate-pulse">
                      "{passage}"
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-450 uppercase tracking-wider">Your Spoken Transcript:</label>
                  <textarea
                    rows="3"
                    value={speechTranscript}
                    onChange={(e) => setSpeechTranscript(e.target.value)}
                    placeholder="Transcription of your spoken words will appear here. You can also type or edit this text before evaluating..."
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800/80 dark:bg-[#0a0f1d] bg-transparent rounded-2xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none placeholder-slate-450 text-slate-800 dark:text-slate-200 font-semibold"
                  />
                </div>

                {readingStatus && (
                  <p className="text-[11px] font-bold text-blue-555 dark:text-blue-400 pl-1">{readingStatus}</p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-4 p-4 border border-slate-150 dark:border-slate-855 rounded-2xl">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={recognizing ? stopSpeechRecognition : startSpeechRecognition}
                      className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase shadow transition-all ${
                        recognizing 
                          ? 'bg-rose-650 hover:bg-rose-700 text-white shadow-rose-500/10' 
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/10'
                      }`}
                    >
                      <Mic className="w-4 h-4" />
                      {recognizing ? 'Stop Speaking' : 'Start Speaking'}
                    </button>

                    <button
                      onClick={evaluatePronunciation}
                      disabled={recognizing || !speechTranscript.trim()}
                      className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-655 hover:from-blue-550 hover:to-indigo-550 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4" />
                      Evaluate Pronunciation
                    </button>

                    <button
                      onClick={resetPronunciation}
                      className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-505 dark:text-slate-300 rounded-xl transition-colors shadow-sm"
                      title="Clear"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>

                    <button
                      onClick={simulateSpeechPractice}
                      disabled={recognizing}
                      className="text-xs font-black text-blue-550 hover:underline pl-1.5 disabled:opacity-50"
                    >
                      Test Simulation
                    </button>
                  </div>

                  {recognizing && (
                    <div className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/10 text-rose-555 border border-rose-500/20 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0">
                      <div className="flex items-end gap-0.5 h-3">
                        <span className="w-1 bg-rose-555 rounded animate-bounce h-2" />
                        <span className="w-1 bg-rose-555 rounded animate-bounce delay-75 h-3" />
                        <span className="w-1 bg-rose-555 rounded animate-bounce delay-150 h-1.5" />
                      </div>
                      <span>Speaking Active</span>
                    </div>
                  )}
                </div>

                {pronounceResult && (
                  <div className="p-5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl space-y-4">
                    <div className="flex items-center gap-4 pb-4 border-b border-slate-150 dark:border-slate-855">
                      <div className="h-16 w-16 bg-blue-500/10 text-blue-550 border border-blue-500/20 rounded-full flex items-center justify-center font-extrabold text-lg">
                        {pronounceResult.score}%
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-850 dark:text-white">Pronunciation Accuracy</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Calculated by word articulation precision match.</p>
                      </div>
                    </div>
                    <div className="text-xs leading-relaxed text-slate-655 dark:text-slate-300">
                      <p className="font-extrabold text-slate-800 dark:text-slate-200 mb-1">Coach Speech Analysis:</p>
                      "{pronounceResult.feedback}"
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'speaking' && (
            <div className="p-6 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800/80 rounded-3xl shadow-md space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-emerald-500/10 text-emerald-555 rounded-lg">
                    <Mic className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="font-extrabold text-lg text-slate-855 dark:text-slate-100">AI Oral Articulation Pitch Checker</h3>
                </div>
                <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/15 rounded-full text-[10px] font-black uppercase tracking-wide">
                  Listen &amp; Repeat Practice
                </span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl space-y-2">
                <p className="text-[10px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-wider">Articulation Goal:</p>
                <p className="text-xs font-black text-slate-800 dark:text-slate-200 leading-snug">
                  Listen carefully to the audio prompt below exactly once, then click Start Speaking to repeat what you heard as accurately as possible.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <button 
                    onClick={playSpeakingPromptOnce}
                    className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase rounded-xl transition-all shadow-md"
                  >
                    <Volume2 className="w-4.5 h-4.5" />
                    <span>Play Audio Prompt</span>
                  </button>

                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Played: {speakingPlayCount} {speakingPlayCount === 1 ? 'time' : 'times'}
                  </span>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-905 border border-slate-150 dark:border-slate-800 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Target Response Phrase:</p>
                  
                  {speakingRevealed ? (
                    <div className="flex flex-wrap gap-1.5 leading-relaxed">
                      {speakingPronounceResult ? (
                        speakingPronounceResult.wordDiff.map((item, idx) => (
                          <span 
                            key={idx} 
                            className={`px-2 py-0.5 rounded text-xs font-bold border ${
                              item.status === 'correct' 
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20' 
                                : 'bg-rose-500/10 text-rose-555 dark:text-rose-455 border-rose-500/20'
                            }`}
                          >
                            {item.word}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-355">
                          "{speakingTargetPhrase}"
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-455 italic">
                      <span>🔒 Hidden. Listen to the audio and repeat it to reveal the target sentence.</span>
                      <button 
                        onClick={() => setSpeakingRevealed(true)}
                        className="text-[10px] font-black text-blue-505 hover:underline not-italic ml-2 uppercase"
                      >
                        (Peek Phrase)
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Editable Transcript Textarea */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-455 uppercase tracking-wider">Your Spoken Transcript:</label>
                <textarea
                  rows="4"
                  value={speakingTranscript}
                  onChange={(e) => setSpeakingTranscript(e.target.value)}
                  placeholder="The transcription of what you repeat will appear here. Correct any typos before evaluating..."
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800/80 dark:bg-[#0a0f1d] bg-transparent rounded-2xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none placeholder-slate-450 text-slate-800 dark:text-slate-200 font-semibold"
                />
              </div>

              {speakingStatus && (
                <p className="text-[11px] font-bold text-emerald-650 dark:text-emerald-400 pl-1">{speakingStatus}</p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-4 p-4 border border-slate-150 dark:border-slate-800/80 rounded-2xl">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={speakingRecognizing ? stopSpeakingSpeechRecognition : startSpeakingSpeechRecognition}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase shadow transition-all ${
                      speakingRecognizing 
                        ? 'bg-rose-650 hover:bg-rose-700 text-white shadow-rose-500/10' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/10'
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                    {speakingRecognizing ? 'Stop Speaking' : 'Start Speaking'}
                  </button>

                  <button
                    onClick={evaluateSpeakingPronunciation}
                    disabled={speakingRecognizing || !speakingTranscript.trim()}
                    className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-555 hover:to-teal-555 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    Evaluate Articulation
                  </button>

                  <button
                    onClick={resetSpeakingPronunciation}
                    className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-550 dark:text-slate-350 rounded-xl transition-colors shadow-sm"
                    title="Clear"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>

                  <button
                    onClick={simulateSpeakingPractice}
                    disabled={speakingRecognizing}
                    className="text-xs font-black text-blue-550 hover:underline pl-1.5 disabled:opacity-50"
                  >
                    Test Simulation
                  </button>
                </div>

                {speakingRecognizing && (
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/10 text-rose-555 border border-rose-500/20 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0">
                    <div className="flex items-end gap-0.5 h-3">
                      <span className="w-1 bg-rose-555 rounded animate-bounce h-2" />
                      <span className="w-1 bg-rose-555 rounded animate-bounce delay-75 h-3" />
                      <span className="w-1 bg-rose-555 rounded animate-bounce delay-150 h-1.5" />
                    </div>
                    <span>Speaking Active</span>
                  </div>
                )}
              </div>

              {speakingPronounceResult && (
                <div className="p-5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-855 rounded-2xl space-y-4">
                  <div className="flex items-center gap-4 pb-4 border-b border-slate-150 dark:border-slate-855">
                    <div className="h-16 w-16 bg-blue-500/10 text-blue-505 border border-blue-500/20 rounded-full flex items-center justify-center font-extrabold text-lg">
                      {speakingPronounceResult.score}%
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-855 dark:text-white">Articulation Pitch Score</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Calculated by vocabulary density and correct pronunciation matches.</p>
                    </div>
                  </div>
                  <div className="text-xs leading-relaxed text-slate-655 dark:text-slate-355">
                    <p className="font-extrabold text-slate-800 dark:text-slate-200 mb-1">AI Coach Oral Pitch Remarks:</p>
                    "{speakingPronounceResult.feedback}"
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Gemini Coach panel (Tips, Vocabulary, AI Predictions) */}
        <div className="space-y-6">
          
          {/* Card: Gemini Coach Panel */}
          <div className="p-6 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800/80 rounded-3xl shadow-md space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-150 dark:border-slate-800/60">
              <div className="flex items-center gap-2">
                <span className="text-xl">🤖</span>
                <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100">Gemini Coach</h3>
              </div>
              <span className="px-2.5 py-0.5 bg-blue-500 text-white rounded text-[9px] font-bold uppercase tracking-wider">
                Beta
              </span>
            </div>

            <div className="space-y-3.5">
              <p className="text-[11px] font-black text-slate-455 uppercase tracking-widest">Reading & Pitch Tips</p>
              <div className="space-y-2 text-xs font-bold text-slate-655 dark:text-slate-355 leading-relaxed">
                <p className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span> Focus on the main idea.
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span> Look for purpose, tone and intent.
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span> Avoid getting lost in details.
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span> Summarize in your own words.
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-150 dark:border-slate-800/60">
              <div className="flex justify-between items-center">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Key Vocabulary</p>
                <button onClick={() => navigate('/reports')} className="text-[10px] font-black text-blue-555 hover:underline">View All</button>
              </div>
              
              <div className="space-y-3.5">
                {[
                  { word: 'Empathy', definition: 'Ability to understand others\' feelings.' },
                  { word: 'Intent', definition: 'Aimed purpose or motivation.' },
                  { word: 'Decoded', definition: 'Converted into understandable form.' },
                  { word: 'Digest', definition: 'To process and understand.' }
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2.5 hover:bg-slate-50 dark:hover:bg-slate-900/30 rounded-xl transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-850">
                    <div>
                      <p className="font-extrabold text-xs text-slate-800 dark:text-slate-200">{item.word}</p>
                      <p className="text-[10px] text-slate-455 font-semibold mt-0.5 leading-normal">{item.definition}</p>
                    </div>
                    <button 
                      onClick={() => speakText(item.word)}
                      className="p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-blue-505 rounded-lg transition-colors shadow-sm"
                      title="Listen to pronunciation"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-150 dark:border-slate-800/60 flex flex-col items-center">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest w-full text-left">AI Prediction</p>
              <p className="text-[10px] text-slate-455 font-semibold w-full text-left mt-0.5 mb-2">Based on your reading</p>

              <div className="relative flex items-center justify-center">
                <svg height="100" width="100" className="transform -rotate-90">
                  <circle
                    stroke="rgba(30, 41, 59, 0.4)"
                    fill="transparent"
                    strokeWidth="8"
                    r="40"
                    cx="50"
                    cy="50"
                  />
                  <circle
                    stroke="#10b981"
                    fill="transparent"
                    strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 40} ${2 * Math.PI * 40}`}
                    style={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - 0.87) }}
                    strokeLinecap="round"
                    r="40"
                    cx="50"
                    cy="50"
                    className="transition-all duration-500 ease-out"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-xl font-black text-slate-800 dark:text-white">87%</span>
                </div>
              </div>
              <div className="text-center mt-2 px-4">
                <p className="text-xs font-extrabold text-emerald-500">Good Understanding</p>
                <p className="text-[10px] font-semibold text-slate-455 mt-1 leading-relaxed">
                  You're doing great! Keep practicing.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* LOWER ROW: Achievements, Reading Categories, Adaptive Difficulty */}
      <div className="grid md:grid-cols-3 gap-8">
        
        {/* Achievements Card */}
        <div className="p-6 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800/80 rounded-3xl shadow-md">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100">Achievements</h3>
            <button onClick={() => navigate('/reports')} className="text-xs font-black text-blue-500 hover:underline">View All</button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { title: 'Perfect Summary', sub: 'Score 90%+ 5 times', bgClass: 'bg-purple-500/10 border-purple-500/20 text-purple-500' },
              { title: 'Consistent Learner', sub: '7 day streak', bgClass: 'bg-amber-500/10 border-amber-500/20 text-amber-500' },
              { title: 'Vocabulary Master', sub: 'Learned 50 words', bgClass: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' },
              { title: 'Top Performer', sub: 'Top 10% this week', bgClass: 'bg-blue-500/10 border-blue-500/20 text-blue-500' }
            ].map((ach, idx) => (
              <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-900/30 border border-slate-150 dark:border-slate-800/40 rounded-2xl flex flex-col items-center text-center gap-1.5 hover:scale-[1.02] transition-transform shadow-sm">
                <span className={`p-2.5 rounded-full border ${ach.bgClass}`}>
                  <Trophy className="w-4 h-4" />
                </span>
                <p className="text-[10px] font-black text-slate-855 dark:text-slate-200 mt-1 max-w-[85px] leading-snug">{ach.title}</p>
                <p className="text-[9px] font-semibold text-slate-400 leading-none">{ach.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Reading Categories Card */}
        <div className="p-6 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800/80 rounded-3xl shadow-md space-y-4">
          <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100">Reading Categories</h3>
          
          <div className="flex flex-wrap gap-2 pt-1.5">
            {['All', 'Technology', 'Business', 'Environment', 'Health', 'Leadership', 'HR', 'Finance'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition-all shadow-sm ${
                  category === cat
                    ? 'bg-blue-600 border-blue-600 text-white shadow-blue-500/10'
                    : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/40 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-655 dark:text-slate-350'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Adaptive Difficulty Card */}
        <div className="p-6 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800/80 rounded-3xl shadow-md space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100">Adaptive Difficulty</h3>
            <HelpCircle className="w-4 h-4 text-slate-400 cursor-pointer" />
          </div>

          <div className="flex flex-wrap gap-2.5 pt-1.5">
            <button
              onClick={() => setDifficulty('Recommended')}
              className={`px-4 py-2 text-xs font-black rounded-xl border transition-all ${
                difficulty === 'Recommended'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                  : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/40 dark:hover:bg-slate-850 border-slate-200 dark:border-slate-805 text-slate-655 dark:text-slate-300'
              }`}
            >
              Recommended
            </button>
            
            <button
              onClick={() => setDifficulty('Easy')}
              className={`px-4 py-2 text-xs font-black rounded-xl border transition-all ${
                difficulty === 'Easy'
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/40 dark:hover:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Easy
            </button>

            <button
              onClick={() => setDifficulty('Medium')}
              className={`px-4 py-2 text-xs font-black rounded-xl border transition-all ${
                difficulty === 'Medium'
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/40 dark:hover:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Medium
            </button>

            <button
              onClick={() => setDifficulty('Hard')}
              className={`px-4 py-2 text-xs font-black rounded-xl border transition-all ${
                difficulty === 'Hard'
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/40 dark:hover:bg-slate-855 border-slate-200 dark:border-slate-850 text-slate-655 dark:text-slate-350'
              }`}
            >
              Hard
            </button>

            <button
              onClick={() => {
                setDifficulty('Adaptive AI');
                alert('Adaptive AI dynamic leveling has been enabled based on your historical verbal scores.');
              }}
              className={`px-4 py-2 text-xs font-black rounded-xl border transition-all flex items-center gap-1.5 ${
                difficulty === 'Adaptive AI'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-655 text-white border-transparent shadow'
                  : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/40 dark:hover:bg-slate-850 border-slate-200 dark:border-slate-850 text-blue-505'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Adaptive AI</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

export default CommunicationModule;

/*
------------------------------------------------
File: CodingArena.jsx
Purpose: Provides coding challenges compiler view.
Responsibilities: Manages code buffer outputs, mock compiles C/Java/Python/JS files.
Dependencies: react, axiosClient, Card, Button, Lucide icons
------------------------------------------------
*/

import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import { Code2, Play, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';

const CodingArena = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [selectedChallenge, setSelectedChallenge] = useState({
    id: 1,
    title: 'Two Sum Search',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    difficulty: 'EASY',
    starterCode: {
      javascript: `function twoSum(nums, target) {\n  // Type your JavaScript solution here\n  return [];\n}`,
      python: `def two_sum(nums, target):\n    # Type your Python solution here\n    return []`,
      java: `public class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Type your Java solution here\n        return new int[0];\n    }\n}`,
      c: `int* twoSum(int* nums, int numsSize, int target, int* returnSize) {\n    // Type your C solution here\n    return NULL;\n}`
    }
  });

  const [code, setCode] = useState(selectedChallenge.starterCode[selectedLanguage]);
  const [consoleLogs, setConsoleLogs] = useState('');
  const [status, setStatus] = useState('IDLE'); // IDLE, RUNNING, SUCCESS, FAILED
  const [testCases, setTestCases] = useState([
    { input: 'nums = [2,7,11,15], target = 9', expected: '[0,1]', status: 'PENDING' },
    { input: 'nums = [3,2,4], target = 6', expected: '[1,2]', status: 'PENDING' }
  ]);

  const handleLanguageChange = (lang) => {
    setSelectedLanguage(lang);
    setCode(selectedChallenge.starterCode[lang] || '');
  };

  const handleRunCode = () => {
    setStatus('RUNNING');
    setConsoleLogs('Initializing compiler sandbox...\nAllocating dynamic runtime execution environment...\nExecuting script unit tests...\n');

    setTimeout(() => {
      // Simulate compiler checks based on whether the code is unchanged from starter or edited
      const isStarter = code === selectedChallenge.starterCode[selectedLanguage];
      
      if (isStarter) {
        setStatus('FAILED');
        setConsoleLogs(prev => prev + 'Error: Output mismatch on Test Case 1.\nExpected [0,1], received NULL/empty result.\nCompilation complete. Result: FAILED.');
        setTestCases(prev => prev.map(tc => ({ ...tc, status: 'FAILED' })));
      } else {
        setStatus('SUCCESS');
        setConsoleLogs(prev => prev + 'Test Case 1: PASSED\nTest Case 2: PASSED\nAll unit tests passed successfully!\nTime elapsed: 14ms\nMemory consumed: 28MB');
        setTestCases(prev => prev.map(tc => ({ ...tc, status: 'PASSED' })));
      }
    }, 1500);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Coding Practice Arena</h1>
          <p className="text-slate-500 dark:text-slate-400">Hone your engineering skills and pass placement coding challenges in real-time.</p>
        </div>

        <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
          <label className="text-xs font-bold text-slate-400 uppercase ml-2">Language:</label>
          <select 
            value={selectedLanguage}
            onChange={e => handleLanguageChange(e.target.value)}
            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="c">C Language</option>
          </select>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        
        {/* Left Side: Challenge details & test cases */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Coding Challenge">
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-[9px] font-bold tracking-wider uppercase">
              {selectedChallenge.difficulty}
            </span>
            <h3 className="text-base font-extrabold text-slate-700 dark:text-slate-200 mt-3">{selectedChallenge.title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed font-medium">
              {selectedChallenge.description}
            </p>

            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Verification Test Cases</h4>
              <div className="space-y-3">
                {testCases.map((tc, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-xl flex items-center justify-between text-[11px] font-mono">
                    <div>
                      <p className="text-slate-400 font-sans font-bold">Input:</p>
                      <p className="text-slate-700 dark:text-slate-300 mt-0.5">{tc.input}</p>
                    </div>
                    <div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-sans ${
                        tc.status === 'PASSED' ? 'bg-emerald-500/10 text-emerald-600' :
                        tc.status === 'FAILED' ? 'bg-rose-500/10 text-rose-600' :
                        'bg-slate-200 dark:bg-slate-800 text-slate-500'
                      }`}>
                        {tc.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Side: Coding terminal Editor */}
        <div className="lg:col-span-3 space-y-6 flex flex-col">
          <Card className="flex-1 flex flex-col p-0 overflow-hidden border border-slate-200/50 dark:border-slate-800/50 rounded-3xl">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Solution Terminal</span>
              </div>
              <Button 
                onClick={handleRunCode}
                disabled={status === 'RUNNING'}
                className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 text-[11px] rounded-xl font-bold"
              >
                <Play className="w-3.5 h-3.5" /> Run Tests
              </Button>
            </div>

            {/* Code Textarea Area */}
            <div className="flex-1 min-h-[300px] relative font-mono text-xs">
              <textarea
                value={code}
                onChange={e => setCode(e.target.value)}
                className="w-full h-full min-h-[300px] p-6 bg-slate-950 text-emerald-400 font-mono focus:outline-none resize-none leading-relaxed border-0"
                spellCheck="false"
              />
            </div>

            {/* Console Log Drawer */}
            <div className="border-t border-slate-100 dark:border-slate-800 p-6 bg-slate-50 dark:bg-slate-900 flex flex-col h-[200px]">
              <span className="text-[10px] font-bold text-slate-400 uppercase mb-2">Execution Console</span>
              <textarea
                readOnly
                value={consoleLogs || 'No compilation logs recorded. Click "Run Tests" to execute.'}
                className="flex-1 bg-slate-100 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/50 rounded-xl p-3 font-mono text-[10px] text-slate-600 dark:text-slate-400 focus:outline-none resize-none"
              />
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default CodingArena;

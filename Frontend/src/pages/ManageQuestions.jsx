/*
------------------------------------------------
File: ManageQuestions.jsx
Purpose: Faculty admin screen for importing questions.
Responsibilities: Manages bulk questions copy-pasting, CSV/JSON format switching, import history logs, and download templates.
Dependencies: react, axiosClient, lucide-react
------------------------------------------------
*/

import React, { useState } from 'react';
import axiosClient from '../api/axiosClient';
import {
  Upload, FileSpreadsheet, CheckCircle, HelpCircle, X,
  AlertCircle, Download, FileText, Info, Check, AlertTriangle
} from 'lucide-react';

const ManageQuestions = () => {
  const [listType, setListType] = useState('csv');
  const [csvText, setCsvText] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Recent Import History Mock data matching screenshot exactly
  const [importHistory, setImportHistory] = useState([
    { file: 'questions_batch_2025_05_20.csv', date: '20 May 2025', count: 'Imported 250 questions', status: 'success' },
    { file: 'aptitude_questions.csv', date: '18 May 2025', count: 'Imported 180 questions', status: 'success' },
    { file: 'logical_set_v2.csv', date: '16 May 2025', count: 'Imported 120 questions', status: 'success' },
    { file: 'comm_skills_set.csv', date: '15 May 2025', count: 'Failed to import', status: 'failed' },
  ]);

  const handleImport = async (e) => {
    e.preventDefault();
    if (!csvText.trim()) return;

    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await axiosClient.post('/faculty/questions/import', {
        csvText,
        listType
      });

      if (res.data.success) {
        setStatusMessage({ text: res.data.message, isError: false });
        setCsvText('');
        // Add to history
        setImportHistory(prev => [
          { file: `import_${new Date().toLocaleDateString().replace(/\//g, '_')}.csv`, date: 'Today', count: res.data.message, status: 'success' },
          ...prev
        ]);
      } else {
        setStatusMessage({ text: res.data.message || 'Import failed. Check format.', isError: true });
      }
    } catch (err) {
      setStatusMessage({
        text: err.response?.data?.message || 'Failed to import questions. Verify format.',
        isError: true
      });
    } finally {
      setLoading(false);
    }
  };

  const getPlaceholder = () => {
    if (listType === 'csv') {
      return `CATEGORY,Question Text,Option1,Option2,Option3,Option4,CorrectOption\nQUANTITATIVE,What is 15% of 200?,20,25,30,35,3\nLOGICAL,If A > B and B > C then A > C?,True,False,,,1\nCOMMUNICATION,Which of these is a good leadership quality?,Teamwork,Communication,Selfishness,Confidence,2`;
    }
    return `[\n  {\n    "category": "QUANTITATIVE",\n    "question_text": "What is 15% of 200?",\n    "options": ["20", "25", "30", "35"],\n    "correct_answer": "30"\n  }\n]`;
  };

  const downloadSampleCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,CATEGORY,Question Text,Option1,Option2,Option3,Option4,CorrectOption\nQUANTITATIVE,What is 15% of 200?,20,25,30,35,3";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sample_questions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto', display: 'grid', gap: 24 }}>
      
      {/* Title */}
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--color-text)', margin: '0 0 6px' }}>Manage Question Bank</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: 0 }}>Bulk import test questions and answers via structured CSV strings.</p>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, alignItems: 'start' }}>
        
        {/* Left: Input panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 18, padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)', marginTop: 0, marginBottom: 20 }}>Bulk Question Import Panel</h3>
            
            <form onSubmit={handleImport} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Tabs */}
              <div style={{ display: 'flex', gap: 6, background: 'var(--color-bg)', padding: 3, borderRadius: 8, border: '1px solid var(--color-border)', width: 'fit-content' }}>
                <button
                  type="button"
                  onClick={() => setListType('csv')}
                  style={{
                    padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
                    fontWeight: 700, fontSize: 12,
                    background: listType === 'csv' ? 'var(--color-surface)' : 'transparent',
                    color: listType === 'csv' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    transition: 'all 0.2s'
                  }}
                >
                  CSV Format
                </button>
                <button
                  type="button"
                  onClick={() => setListType('json')}
                  style={{
                    padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
                    fontWeight: 700, fontSize: 12,
                    background: listType === 'json' ? 'var(--color-surface)' : 'transparent',
                    color: listType === 'json' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    transition: 'all 0.2s'
                  }}
                >
                  JSON Format
                </button>
              </div>

              {/* Textarea */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>Copy-Paste Question Data</label>
                  <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 600 }}>Columns: 7 Required</span>
                </div>
                <textarea
                  value={csvText}
                  onChange={e => setCsvText(e.target.value)}
                  placeholder={getPlaceholder()}
                  rows={10}
                  style={{
                    width: '100%', padding: '12px', border: '1px solid var(--color-border)',
                    borderRadius: 12, background: 'var(--color-bg)', color: 'var(--color-text)',
                    fontSize: 12, fontFamily: 'monospace', outline: 'none', resize: 'vertical',
                    boxSizing: 'border-box', lineHeight: 1.5
                  }}
                />
              </div>

              {/* Trigger */}
              <button
                type="submit"
                disabled={loading || !csvText.trim()}
                style={{
                  background: 'var(--color-primary)', color: '#fff',
                  border: 'none', borderRadius: 10, padding: '12px',
                  fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                Import into Database
              </button>

              {statusMessage && (
                <div style={{
                  padding: 12, borderRadius: 10, fontSize: 13, display: 'flex', gap: 8, alignItems: 'center',
                  background: statusMessage.isError ? '#ef444415' : '#22c55e15',
                  border: `1px solid ${statusMessage.isError ? '#ef444433' : '#22c55e33'}`,
                  color: statusMessage.isError ? '#ef4444' : '#22c55e'
                }}>
                  {statusMessage.isError ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                  {statusMessage.text}
                </div>
              )}
            </form>
          </div>

          {/* Bottom Tips */}
          <div style={{ background: '#e0f2fe55', border: '1px solid #bae6fd', borderRadius: 14, padding: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
            <div style={{ fontSize: 12, color: '#0369a1' }}>
              <strong style={{ display: 'block', marginBottom: 4 }}>Tips for a successful import:</strong>
              <ul style={{ margin: 0, paddingLeft: 16, display: 'grid', gap: 4 }}>
                <li>Ensure your CSV follows the exact column order.</li>
                <li>Use categories consistently (QUANTITATIVE, LOGICAL, VERBAL) for better organization.</li>
                <li>Keep question text short and clear.</li>
                <li>Review sample file before importing to prevent syntax errors.</li>
              </ul>
              <button
                onClick={downloadSampleCSV}
                style={{ marginTop: 10, background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 700, cursor: 'pointer', padding: 0, textDecoration: 'underline', fontSize: 12 }}
              >
                Download Sample CSV
              </button>
            </div>
          </div>

        </div>

        {/* Right: Guidelines & History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Format Guidelines */}
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 18, padding: 20 }}>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text)', marginTop: 0, marginBottom: 12 }}>Format Guidelines</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 12, color: 'var(--color-text-muted)' }}>
              <div>
                <strong style={{ color: 'var(--color-text)', display: 'block', marginBottom: 2 }}>Columns Required (7)</strong>
                <span>CATEGORY, Question Text, Option1, Option2, Option3, Option4, CorrectOption</span>
              </div>
              <div>
                <strong style={{ color: 'var(--color-text)', display: 'block', marginBottom: 2 }}>Options</strong>
                <span>Provide exactly 4 options for each question.</span>
              </div>
              <div>
                <strong style={{ color: 'var(--color-text)', display: 'block', marginBottom: 2 }}>Correct Option</strong>
                <span>Enter the correct option number (1, 2, 3, or 4).</span>
              </div>
              <div>
                <strong style={{ color: 'var(--color-text)', display: 'block', marginBottom: 2 }}>Subjective Questions</strong>
                <span>For subjective questions, leave options empty in CSV and use CATEGORY like 'COMMUNICATION'.</span>
              </div>
              <div>
                <strong style={{ color: 'var(--color-text)', display: 'block', marginBottom: 2 }}>No Special Characters</strong>
                <span>Avoid commas inside text. Use simple punctuation.</span>
              </div>
            </div>
          </div>

          {/* Recent Import History */}
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 18, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>Recent Import History</h4>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', cursor: 'pointer' }}>View All</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {importHistory.map((hist, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: i < importHistory.length - 1 ? '1px solid var(--color-border)' : 'none', paddingBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--color-text)' }}>{hist.file}</div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>{hist.date} · {hist.count}</div>
                  </div>
                  <span style={{
                    padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                    background: hist.status === 'success' ? '#22c55e15' : '#ef444415',
                    color: hist.status === 'success' ? '#22c55e' : '#ef4444'
                  }}>
                    {hist.status === 'success' ? 'Success' : 'Failed'}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default ManageQuestions;

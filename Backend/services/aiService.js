const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Initialize Gemini client helper
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('placeholder') || apiKey === '') {
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
};

module.exports = {
  /*
  Analyzes mock interview transcripts and parameters using Gemini AI.
  Params: question (text), responseText (text), toneMetrics (object).
  Returns: AI evaluation comments and suggested adjustments.
  */
  evaluateInterviewResponse: async (question, responseText, toneMetrics = {}) => {
    const genAI = getGeminiClient();
    
    if (genAI) {
      try {
        console.log('Sending interview response to Gemini AI...');
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        const prompt = `
          Evaluate the student's answer for the following placement interview question.
          
          Question: "${question}"
          Student Answer Pitch: "${responseText}"
          
          Provide a constructive assessment in JSON format. Do not return any other text, markdown, or commentary. Use this exact JSON structure:
          {
            "score": 85, 
            "grammarScore": 90, 
            "pronunciationScore": 88, 
            "strengths": ["strength 1", "strength 2"],
            "suggestions": ["suggestion 1", "suggestion 2"]
          }
        `;
        
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        return {
          success: true,
          ...parsed
        };
      } catch (err) {
        console.error('Gemini API call failed, falling back to rule engine:', err);
      }
    }

    // Fallback Mock AI evaluation engine below:
    const cleanText = (responseText || '').trim();
    const wordCount = cleanText.split(/\s+/).filter(w => w.length > 0).length;

    let score = 75;
    let grammarScore = 80;
    let pronunciationScore = 85;
    let suggestions = [];
    let strengths = [];

    if (wordCount < 10) {
      score = 45;
      grammarScore = 60;
      pronunciationScore = 70;
      strengths = ['Began the prompt cleanly.'];
      suggestions = [
        'Your response is extremely short. Aim to speak for at least 1-2 minutes to detail your thoughts.',
        'Describe specific instances, projects, or situations using the STAR methodology (Situation, Task, Action, Result).'
      ];
    } else if (wordCount >= 10 && wordCount < 50) {
      score = 70;
      grammarScore = 75;
      pronunciationScore = 80;
      strengths = ['Clear core explanation.', 'Good direct response address.'];
      suggestions = [
        'Elaborate more on the actions YOU personally took in this scenario.',
        'Incorporate stronger action verbs (e.g., "orchestrated", "resolved", "spearheaded").'
      ];
    } else {
      score = 90;
      grammarScore = 88;
      pronunciationScore = 92;
      strengths = [
        'Detailed and comprehensive description.',
        'Excellent application of structured answers (STAR method).',
        'Assertive and professional vocabulary.'
      ];
      suggestions = [
        'Keep up the structure! Try slightly adjusting your pace to stay composed.',
        'Maintain eye contact if recording video responses to increase visual confidence.'
      ];
    }

    return {
      success: true,
      score,
      grammarScore,
      pronunciationScore,
      suggestions,
      strengths
    };
  },

  /*
  Evaluates resume files against ATS schemas and keywords using Gemini AI.
  Params: resumeRawText (text).
  Returns: ATS alignment ratings and keyword optimization proposals.
  */
  analyzeResumeATS: async (resumeRawText) => {
    const genAI = getGeminiClient();

    if (genAI) {
      try {
        console.log('Sending resume to Gemini AI for ATS analysis...');
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `
          Analyze the following resume details for ATS formatting, recommended industry keywords, and layout structure optimization.
          
          Resume Details: "${resumeRawText}"
          
          Provide a detailed report in JSON format. Do not return any other text, markdown, or commentary. Use this exact JSON structure:
          {
            "atsScore": 75, 
            "missingKeywords": ["keyword 1", "keyword 2"],
            "formattingIssues": ["issue 1", "issue 2"],
            "aiSuggestions": ["suggestion 1", "suggestion 2"]
          }
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        return {
          success: true,
          ...parsed
        };
      } catch (err) {
        console.error('Gemini API call failed, falling back to rule engine:', err);
      }
    }

    // Fallback Mock ATS analyzer below:
    return {
      success: true,
      atsScore: 78,
      missingKeywords: ['CI/CD', 'Docker', 'PostgreSQL Optimization', 'REST API Design'],
      formattingIssues: [
        'Include a dedicated Skills grid at the top.',
        'Replace long paragraphs with bullet points describing actions.'
      ],
      aiSuggestions: [
        'Add quantitative metrics to your projects (e.g. "Improved query performance by 40%").',
        'Incorporate cloud architecture components matching modern recruitment databases.'
      ]
    };
  },

  /*
  AI Resume Section Rewriter
  Params: sectionType (string), rawText (string).
  Returns: Optimized, professional bullet-points.
  */
  rewriteResumeSection: async (sectionType, rawText) => {
    const genAI = getGeminiClient();
    
    if (genAI) {
      try {
        console.log('Sending resume section to Gemini for professional rewrite...');
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        const prompt = `
          Act as an expert technical resume writer. Optimize and rewrite the following resume section: "${sectionType}"
          
          Raw Description: "${rawText}"
          
          Provide a structured professional rewrite optimized for ATS. Return your response as a simple JSON object containing a list of strings:
          {
            "rewrittenPoints": ["bullet point 1", "bullet point 2"]
          }
        `;
        
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        return {
          success: true,
          ...parsed
        };
      } catch (err) {
        console.error('Gemini rewrite failed, using fallback:', err);
      }
    }

    return {
      success: true,
      rewrittenPoints: [
        'Redesigned core components leveraging clean modular architectural standards.',
        'Improved load efficiency by 30% through caching and DB query tuning.',
        'Orchestrated multi-disciplinary deliverables matching standard placement constraints.'
      ]
    };
  },

  /*
  AI Group Discussion Coach & Simulator
  Params: topic (string), stance (string), argument (string).
  Returns: Argument logic score, strengths, weak points, and counter-arguments.
  */
  evaluateGDArgument: async (topic, stance, argument) => {
    const genAI = getGeminiClient();
    
    if (genAI) {
      try {
        console.log('Sending GD argument to Gemini AI for evaluations...');
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        const prompt = `
          Evaluate this student's argument in a Group Discussion (GD).
          
          Topic: "${topic}"
          Stance: "${stance}"
          Student's Stated Argument: "${argument}"
          
          Provide a structured analysis in JSON format. Do not return any other text or markdown comments. Use this exact JSON structure:
          {
            "score": 82, 
            "logicStrength": "string description",
            "strengths": ["list of strengths"],
            "weaknesses": ["list of weak points"],
            "countersToPrepareFor": ["counter argument 1", "counter argument 2", "counter argument 3"]
          }
        `;
        
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        return {
          success: true,
          ...parsed
        };
      } catch (err) {
        console.error('Gemini GD coaching evaluation failed, using fallback:', err);
      }
    }

    return {
      success: true,
      score: 75,
      logicStrength: 'Moderate logical reasoning, clear stance taken.',
      strengths: ['Directly addresses the prompt topic.', 'Confidently claims position.'],
      weaknesses: ['Lacks analytical data or quantitative proof.', 'Structure could be improved by citing real-world examples.'],
      countersToPrepareFor: [
        'How would you address security, data integrity, and compliance aspects?',
        'Does this stance hold true for small-to-medium enterprise scales?',
        'What are the direct financial implications and cost tradeoffs of this action?'
      ]
    };
  },

  /*
  AI Automated Subjective Written Answer Evaluator
  Params: questionText (string), studentAnswer (string).
  Returns: score (number), feedback (string).
  */
  evaluateSubjectiveAnswer: async (questionText, studentAnswer) => {
    const genAI = getGeminiClient();
    
    if (genAI) {
      try {
        console.log('Automating written subjective answer grading via Gemini...');
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        const prompt = `
          Act as a university examiner. Grade this student's written response for a verbal articulation/communication test.
          
          Question: "${questionText}"
          Student Answer: "${studentAnswer}"
          
          Grade it and output a simple JSON object containing a score (0 to 100) and short feedback text:
          {
            "score": 85,
            "feedback": "constructive feedback text here"
          }
        `;
        
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        return {
          success: true,
          ...parsed
        };
      } catch (err) {
        console.error('Gemini subjective grading failed, using fallback:', err);
      }
    }

    // Heuristics fallback
    const wordCount = (studentAnswer || '').trim().split(/\s+/).length;
    const fallbackScore = Math.min(100, Math.max(40, wordCount * 2));
    return {
      success: true,
      score: fallbackScore,
      feedback: 'Offline evaluation: Answer registered. Grading was based on length. Add more detail for higher grades.'
    };
  }
};

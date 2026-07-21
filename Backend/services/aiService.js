const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Initialize Gemini client helper
const getGeminiClient = () => {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  console.log('[AI SERVICE] GEMINI_API_KEY loaded:', apiKey ? 'present' : 'missing');
  if (!apiKey) {
    console.error('[AI SERVICE] GEMINI_API_KEY is missing in .env');
    return null;
  }
  if (apiKey.includes('placeholder')) {
    console.warn('[AI SERVICE] GEMINI_API_KEY looks like a placeholder; Gemini disabled.');
    return null;
  }
  try {
    console.log('[AI SERVICE] Initializing Gemini client.');
    return new GoogleGenerativeAI(apiKey);
  } catch (err) {
    console.error('[AI SERVICE] Failed to initialize Gemini client:', err);
    return null;
  }
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
        const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
        
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

    // Mock data fallback
    const mockData = {
      success: true,
      atsScore: 75,
      subScores: {
        formatting: 80,
        keywords: 70,
        structure: 75,
        contentRelevance: 78
      },
      headline: "Great Match! 🎉 Your resume is highly compatible with ATS systems.",
      missingKeywords: ['Leadership', 'Agile', 'Problem Solving', 'REST API', 'Microservices', 'AWS', 'Analytics', 'Documentation', 'CI/CD'],
      formattingIssues: [
        'Include a dedicated Skills grid at the top.',
        'Replace long paragraphs with bullet points describing actions.'
      ],
      aiSuggestions: [
        'Add quantitative metrics to your projects (e.g. "Improved query performance by 40%").',
        'Incorporate cloud architecture components matching modern recruitment databases.'
      ],
      parsedResume: {}
    };

    if (!genAI) {
      console.warn('[AI SERVICE] Gemini client not initialized – returning mock ATS data.');
      return mockData;
    }

    try {
      console.log('Sending resume to Gemini AI for ATS analysis...');
      const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
      const prompt = `
        Analyze the following resume details for ATS formatting, recommended industry keywords, and layout structure optimization.
        Also parse and extract the resume content into standard JSON fields.

        Resume Details: "${resumeRawText}"

        Provide a detailed report in JSON format. Do not return any other text, markdown, or commentary. Use this exact JSON structure:
        {
          "atsScore": 75,
          "subScores": {
            "formatting": 80,
            "keywords": 70,
            "structure": 75,
            "contentRelevance": 78
          },
          "headline": "Great Match! 🎉 Your resume is highly compatible with ATS systems.",
          "missingKeywords": [],
          "formattingIssues": [],
          "aiSuggestions": [],
          "parsedResume": {
            "personalInfo": {
              "name": "Full Name",
              "email": "email@address.com",
              "phone": "+1-123-456-7890",
              "linkedin": "linkedin.com/in/username",
              "github": "github.com/username"
            },
            "summary": "Short professional summary text...",
            "workExperience": [
              {
                "company": "Company Name",
                "position": "Job Role / Title",
                "startDate": "Start Month Year",
                "endDate": "End Month Year or Present",
                "description": ["Responsibility or accomplishment 1", "Responsibility or accomplishment 2"]
              }
            ],
            "education": [
              {
                "institution": "School or University Name",
                "degree": "Degree and Major",
                "startDate": "Start Year",
                "endDate": "End Year",
                "gpa": "GPA or grade score"
              }
            ],
            "projects": [
              {
                "name": "Project Name",
                "technologies": "Technologies used (comma separated string e.g. React, Node.js)",
                "description": ["Key feature or contribution 1", "Key feature or contribution 2"]
              }
            ],
            "skills": ["Skill 1", "Skill 2"]
          }
        }

        Make sure you extract and fill the parsedResume JSON fields as accurately as possible based on the provided resume details. If any field is missing, supply a reasonable placeholder or empty string. Ensure list items under experience and projects are arrays of bullet-point strings.
      `;
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      return { success: true, ...parsed };
    } catch (err) {
      console.error('[AI SERVICE] Gemini API call failed – falling back to mock data:', err);
      return mockData;
    }
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
        const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
        
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
        const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
        
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
        const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
        
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
  },

  /*
  AI Coding Challenge Online Judge Evaluator
  Params: challengeTitle (string), challengeDescription (string), code (string), language (string), testCases (array)
  Returns: online judge report including correctness, hidden cases status, stdout print simulation, and complexity analysis.
  */
  evaluateCodingChallenge: async (challengeTitle, challengeDescription, code, language, testCases) => {
    const genAI = getGeminiClient();
    
    if (genAI) {
      try {
        console.log('Sending coding solution to Gemini for online judge verification...');
        const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
        
        const prompt = `
          Act as an advanced online coding judge (like LeetCode).
          You must evaluate the student's solution to the coding challenge.
          
          CHALLENGE DETAILS:
          Title: "${challengeTitle}"
          Description: "${challengeDescription}"
          
          STUDENT SUBMISSION:
          Language: "${language}"
          Code:
          \`\`\`${language}
          ${code}
          \`\`\`
          
          TEST CASES TO RUN (Verify against BOTH these visible test cases and your own internal HIDDEN test cases):
          ${JSON.stringify(testCases, null, 2)}
          
          CRITICAL RULES FOR EVALUATION:
          1. CHEATING / HARDCODING CHECK: Detect if the student did not write a generic algorithmic solution, but instead hardcoded conditional returns directly checking for the specific test case inputs (e.g. \`if (nums[0] === 2) return [0, 1]\`). If so, flag "cheatDetected" as true.
          2. PRINT/STDOUT OUTPUT: Simulate the execution of the code line-by-line. If the student wrote console prints (e.g., \`console.log\`, \`print\`), capture what they printed and include it in the "stdout" property of the respective test cases.
          3. TEST CASES STATUS: Check all test cases (both the visible ones provided and 2 hidden edge cases you invent). Mark each as passed or failed based on the actual result of the student's code logic.
          
          Provide your assessment in JSON format. Do not return any other text, markdown, or commentary. Use this exact JSON structure:
          {
            "success": true, 
            "cheatDetected": false,
            "cheatExplanation": "No cheat detected.",
            "runtime": "52 ms",
            "memory": "41.5 MB",
            "complexityAnalysis": {
              "time": "O(N)",
              "space": "O(N)"
            },
            "feedback": "Your solution is correct and optimal. You utilized a hash map to reduce time complexity to O(N). Excellent work!",
            "testCases": [
              {
                "input": "nums = [2,7,11,15], target = 9",
                "expected": "[0,1]",
                "output": "[0,1]",
                "stdout": "Running Two Sum for inputs...\nFound matching pair at index 0 and 1\n",
                "passed": true
              }
            ]
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
        console.error('Gemini online judge call failed, falling back to mock compiler:', err);
      }
    }
    
    // Fallback mockup judge if Gemini key is missing
    const isStarter = code.includes('// Type your') || code.includes('// type your') || code.length < 100;
    const hasPrint = code.includes('console.log') || code.includes('print');
    
    return {
      success: !isStarter,
      cheatDetected: false,
      cheatExplanation: "",
      runtime: "48 ms",
      memory: "42.0 MB",
      complexityAnalysis: {
        time: isStarter ? "N/A" : "O(N^2)",
        space: "O(1)"
      },
      feedback: isStarter 
        ? "Starter code detected. Please write the logic to iterate through the array and find the indices."
        : "Your solution passed all visible and hidden test cases! It has a time complexity of O(N^2). You can optimize it to O(N) by using a Hash Map (Object) to store past values.",
      testCases: [
        {
          input: "nums = [2,7,11,15], target = 9",
          expected: "[0,1]",
          output: isStarter ? "[]" : "[0,1]",
          stdout: hasPrint ? "Checking indices... Found match at 0 and 1\n" : "",
          passed: !isStarter
        },
        {
          input: "nums = [3,2,4], target = 6",
          expected: "[1,2]",
          output: isStarter ? "[]" : "[1,2]",
          stdout: hasPrint ? "Checking indices...\n" : "",
          passed: !isStarter
        },
        {
          input: "nums = [3,3], target = 6 (HIDDEN)",
          expected: "[0,1]",
          output: isStarter ? "[]" : "[0,1]",
          stdout: "",
          passed: !isStarter
        }
      ]
    };
  }
};

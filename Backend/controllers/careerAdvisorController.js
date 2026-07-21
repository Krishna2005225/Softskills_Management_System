/*
------------------------------------------------
File: careerAdvisorController.js
Purpose: Handles AI Career Advisor prompt queries.
Responsibilities: Queries Gemini AI for career guidance and returns study roadmap templates.
Dependencies: aiService, Student
------------------------------------------------
*/

const Student = require('../models/Student');
const aiService = require('../services/aiService');

module.exports = {
  /*
  POST /api/advisor/ask
  Answers student career path/placement inquiries using Gemini.
  */
  askAdvisor: async (req, res, next) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ success: false, message: 'Prompt text is required.' });
      }

      // Fetch student data for context
      const stats = await Student.getDashboardStats(req.user.user_id);
      const reports = await Student.getDetailedProgressReport(req.user.user_id);
      
      const context = `
        Student Name: ${stats.profile?.name || 'Student'}
        Department: ${stats.profile?.department || 'N/A'}
        CGPA: ${stats.profile?.cgpa || '0.00'}
        Placement Readiness Index: ${stats.placementScore || 0}%
        Aptitude Rating: ${reports.aptitude.average || 0}%
        Resume Rating: ${reports.resume.average || 0}%
        Mock Interview Rating: ${reports.interview.average || 0}%
      `;

      // Query Gemini
      const db = require('../config/db');
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      
      let answer = '';
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey && !apiKey.includes('placeholder') && apiKey !== '') {
        try {
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
          const genPrompt = `
            You are an expert college placement director and career coach. 
            Below is the academic profile of the student asking the question:
            ${context}
            
            Student Question: "${prompt}"
            
            Provide an encouraging, highly structured, and actionable guidance response. 
            Include bullet-points with concrete resources, tools, or roadmap steps.
          `;
          const result = await model.generateContent(genPrompt);
          answer = result.response.text();
        } catch (err) {
          console.error('Gemini advisor lookup failed, fallback to rules engine:', err);
        }
      }

      if (!answer) {
        // Heuristics offline engine based on keywords
        const query = prompt.toLowerCase();
        const cgpa = stats.profile?.cgpa || '0.00';
        const placementScore = stats.placementScore || 0;
        const name = stats.profile?.name || 'Student';
        const dept = stats.profile?.department || 'N/A';
        
        const avgResume = reports.resume.average || 0;
        const avgInterview = reports.interview.average || 0;
        const avgAptitude = reports.aptitude.average || 0;

        if (query.includes('resume') || query.includes('cv')) {
          answer = `Based on your profile, your Resume ATS score stands at **${avgResume}%**. Here are your priority items:
          
1. **Incorporate Action Verbs**: Start bullets with verbs like *orchestrated*, *optimized*, or *spearheaded*.
2. **Quantify Metrics**: Add metrics matching your projects (e.g. "Improved database query response times by 35%").
3. **Include Missing Keywords**: Ensure keywords like *CI/CD*, *PostgreSQL*, and *RESTful APIs* are included.`;
        } else if (query.includes('interview') || query.includes('hr')) {
          answer = `Your Mock Interview rating is **${avgInterview}%**. Focus on these techniques:
          
1. **Use the STAR Method**: Structure answers by describing the *Situation*, *Task*, *Action*, and *Result*.
2. **Eye Contact**: Maintain visual confidence if using webcam responses.
3. **Clarity over Speed**: Speak composed and steady at ~130 words per minute.`;
        } else if (query.includes('company') || query.includes('suit') || query.includes('eligibility')) {
          const numCgpa = parseFloat(cgpa);
          let tierAdvice = '';
          if (numCgpa >= 8.0) {
            tierAdvice = `*   **Product Giants (Tier-1)**: Eligible for Google, Microsoft, Amazon, and Adobe. Match Rating: **High** (90%). Focus on LeetCode medium/hard DSA.
*   **FinTech / Core**: Eligible for Goldman Sachs, Morgan Stanley, JPMorgan. Match Rating: **High** (85%). Focus on SQL, OOPs, and Operating Systems.`;
          } else if (numCgpa >= 7.0) {
            tierAdvice = `*   **Mid-Tier Product / Tech Giants**: Eligible for TCS Digital, Cognizant, Infosys. Match Rating: **High** (85%).
*   **Tier-1 Product Giants**: Eligible off-campus. Focus on building solid React/Node.js full-stack projects to stand out.`;
          } else {
            tierAdvice = `*   **Services / Tech Support**: Eligible for Wipro, Tech Mahindra, Infosys. Match Rating: **High** (85%). Focus on raising your CGPA above 7.0 and perfecting core aptitude skills.`;
          }

          answer = `Based on your CGPA of **${cgpa}** and Placement Readiness Index of **${placementScore}%**, here is your company suitability report:

${tierAdvice}

**Actionable Steps:**
1. Maintain your CGPA above the cutoff thresholds.
2. Complete your remaining Mock Interviews to boost your Placement Readiness index from ${placementScore}%.`;
        } else if (query.includes('salary') || query.includes('package') || query.includes('expectation')) {
          const numCgpa = parseFloat(cgpa);
          const baseSalary = numCgpa >= 8.0 ? '8 - 12 LPA' : '4 - 6 LPA';
          const maxSalary = numCgpa >= 8.0 ? '18 - 25 LPA' : '8 - 12 LPA';
          answer = `Based on your profile, here are your entry-level salary expectations:
          
*   **Average Base Package**: **${baseSalary}** for standard roles.
*   **Dream Package (Tier-1)**: **${maxSalary}** for advanced software engineering or specialized dev roles.

**Recommendation**: To reach the dream package bracket, focus on improving your **Aptitude Rating** (currently at **${avgAptitude}%**) and **Resume Score** (currently at **${avgResume}%**).`;
        } else if (query.includes('roadmap') || query.includes('learn') || query.includes('study')) {
          answer = `Here is a custom daily learning roadmap for **${name}** (Department: **${dept}**):
          
1. 🌅 **Morning (Aptitude)**: Practice 2 timed logical puzzles in the Aptitude Arena to boost your Aptitude Rating (currently **${avgAptitude}%**).
2. ☀️ **Afternoon (Resume & Projects)**: Review your resume format and project descriptions to increase your Resume Rating (currently **${avgResume}%**).
3. 🌆 **Evening (Interviews)**: Record a 1-minute HR video pitch on 'Tell me about yourself' to practice communication skills (currently **${avgInterview}%**).`;
        } else if (query.includes('improve') || query.includes('score')) {
          const scores = [
            { name: 'Aptitude Test', val: avgAptitude },
            { name: 'Resume Alignment', val: avgResume },
            { name: 'Mock Interview', val: avgInterview }
          ];
          scores.sort((a, b) => a.val - b.val);
          const lowest = scores[0];
          answer = `Your lowest readiness score is in **${lowest.name}** (**${lowest.val}%**). Here is your priority improvement plan:
          
*   **Priority 1**: Boost your ${lowest.name} score by completing practice exercises.
*   **Priority 2**: Update your resume to incorporate industry keywords.
*   **Priority 3**: Perform an additional mock interview to get detailed trainer grading feedback.`;
        } else {
          answer = `Welcome ${name}! Based on your academic details (CGPA: **${cgpa}**, Department: **${dept}**), here are your general career preparation guidelines:
          
*   Your **Placement Readiness Index** stands at **${placementScore}%**.
*   Your **Communication & Subjective Average** is **${reports.writtenAnswers.average || 88}%**.
*   Try asking me specific inquiries like **"Which company suits me?"**, **"Salary expectations"**, or **"Resume suggestions"** to get detailed breakdowns!`;
        }
      }

      return res.status(200).json({
        success: true,
        answer
      });
    } catch (error) {
      return next(error);
    }
  }
};


import React, { useState } from "react";
import "./resumefix.css";

const recommendedSectionOrder = [
  "Summary",
  "Experience",
  "Education",
  "Skills",
  "Contact",
];

// Enhanced spell checker with more comprehensive typo detection
const spellCheck = (text) => {
  const commonTypos = {
    "teh": "the",
    "recieve": "receive",
    "adress": "address",
    "langauge": "language",
    "occured": "occurred",
    "seperate": "separate",
    "definately": "definitely",
    "accomodate": "accommodate",
    "existance": "existence",
    "maintainance": "maintenance",
    "supercede": "supersede",
    "weirdo": "weird",
    "calender": "calendar",
    "embarass": "embarrass",
    "neccessary": "necessary",
    "accomodate": "accommodate",
    "acknowledgement": "acknowledgment",
    "alot": "a lot",
    "begining": "beginning",
    "believe": "believe",
    "consious": "conscious",
    "definate": "definite",
    "excede": "exceed",
    "fourty": "forty",
    "goverment": "government",
    "happend": "happened",
    "independant": "independent",
    "juge": "judge",
    "knowlege": "knowledge",
    "lenght": "length",
    "millenium": "millennium",
    "neccessarily": "necessarily",
    "occassion": "occasion",
    "persistant": "persistent",
    "quarantaine": "quarantine",
    "restaraunt": "restaurant",
    "seperate": "separate",
    "supercede": "supersede",
    "tendancy": "tendency",
    "untill": "until",
    "wierd": "weird",
    "yeild": "yield"
  };

  const foundTypos = [];
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  
  words.forEach((word, index) => {
    if (commonTypos[word]) {
      foundTypos.push({
        typo: word,
        suggestion: commonTypos[word],
        position: index
      });
    }
  });

  return foundTypos;
};

// Helper functions
const parseResume = (text) => {
  const lines = text.split("\n").map((line) => line.trim());
  const sections = [];
  let currentSection = { title: "", content: [] };

  lines.forEach((line) => {
    if (recommendedSectionOrder.some((sec) => sec.toLowerCase() === line.toLowerCase().replace(/[^a-zA-Z]/g, ''))) {
      if (currentSection.title) sections.push(currentSection);
      currentSection = { title: line, content: [] };
    } else if (line) {
      currentSection.content.push(line);
    }
  });

  if (currentSection.title) sections.push(currentSection);
  return sections;
};

const parseDateRanges = (text) => {
  const lines = text.split("\n");
  const ranges = [];

  lines.forEach((line, lineIndex) => {
    const match = line.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\s*-\s*(?:(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})|(Present|Current))/i);
    if (match) {
      try {
        const startStr = `${match[1]} 1, ${line.match(/\b\d{4}\b/)?.[0]}`;
        const startDate = new Date(startStr);

        let endDate = null;
        if (match[4] && /present|current/i.test(match[4])) {
          endDate = new Date(); // Current date
        } else if (match[2] && match[3]) {
          const endStr = `${match[2]} 1, ${match[3]}`;
          endDate = new Date(endStr);
        }
        
        ranges.push({ 
          start: startDate, 
          end: endDate,
          line: lineIndex + 1,
          text: line.trim()
        });
      } catch (e) {
        console.log("Date parsing error:", e);
      }
    }
  });

  return ranges;
};

const checkDateRanges = (ranges) => {
  const issues = [];

  ranges.forEach(({ start, end }, i) => {
    if (!end) {
      issues.push(`❌ Missing end date for experience. Consider adding "Present" or an end month/year.`);
    }
  });

  for (let i = 0; i < ranges.length - 1; i++) {
    const currentEnd = ranges[i].end;
    const nextStart = ranges[i + 1].start;
    if (currentEnd && nextStart && nextStart < currentEnd) {
      issues.push(`❌ Date range conflict: "${ranges[i+1].text}" starts before previous experience ends.`);
    }
  }

  return issues;
};

// Enhanced content quality checker
const checkContentQuality = (text, sections) => {
  const suggestions = [];
  const lines = text.split('\n');
  
  // Length check
  const wordCount = text.trim().split(/\s+/).length;
  if (wordCount < 100) {
    suggestions.push("⚠️ Resume seems too short. Aim for 300-600 words for a comprehensive resume.");
  } else if (wordCount > 1000) {
    suggestions.push("⚠️ Resume seems too long. Keep it under 1000 words for better readability.");
  }

  // Weak action verbs check
  const weakVerbs = ['was', 'were', 'am', 'is', 'are', 'did', 'do', 'does', 'have', 'has', 'had'];
  const bulletLines = lines.filter(line => line.trim().startsWith('•') || line.trim().startsWith('- '));
  
  if (bulletLines.length > 0) {
    const strongBulletPoints = bulletLines.filter(line => 
      !weakVerbs.some(verb => 
        line.toLowerCase().includes(' ' + verb + ' ') || 
        line.toLowerCase().startsWith(verb + ' ')
      )
    );
    
    if (strongBulletPoints.length < bulletLines.length * 0.6) {
      suggestions.push("⚠️ Many bullet points use weak verbs. Use strong action verbs like 'managed', 'developed', 'implemented', 'achieved'.");
    }
  }

  // First person pronouns check
  if (/\b(I|me|my|mine|myself)\b/i.test(text)) {
    suggestions.push("⚠️ Avoid using first person pronouns (I, me, my). Use third person or action-focused language.");
  }

  // Overused words check
  const overusedWords = ['very', 'really', 'quite', 'basically', 'actually', 'literally', 'just', 'so', 'pretty'];
  const overusedCount = overusedWords.reduce((count, word) => {
    const matches = text.match(new RegExp('\\b' + word + '\\b', 'gi'));
    return count + (matches ? matches.length : 0);
  }, 0);
  
  if (overusedCount > 5) {
    suggestions.push("⚠️ Contains overused filler words. Remove words like 'very', 'really', 'basically' for more professional tone.");
  }

  return suggestions;
};

// Contact information validator
const validateContactInfo = (text) => {
  const suggestions = [];
  
  // Email validation
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  if (!emailRegex.test(text)) {
    suggestions.push("⚠️ No valid email address found. Include a professional email address.");
  }

  // Phone validation (basic)
  const phoneRegex = /(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
  if (!phoneRegex.test(text)) {
    suggestions.push("⚠️ No phone number found. Consider including one for contact purposes.");
  }

  // LinkedIn/GitHub/Portfolio check
  const hasProfessionalLinks = /linkedin|github|portfolio|website/i.test(text);
  if (!hasProfessionalLinks) {
    suggestions.push("💡 Consider adding LinkedIn, GitHub, or portfolio links for better professional presence.");
  }

  return suggestions;
};

const evaluateResume = (text) => {
  const suggestions = [];

  // Empty resume check
  if (text.trim().length === 0) {
    suggestions.push("📝 Start by pasting your resume text above for analysis.");
    return suggestions;
  }

  // Better bullet points check
  const lines = text.split('\n');
  const dotBullets = lines.filter(line => line.trim().startsWith('•')).length;
  const dashBullets = lines.filter(line => line.trim().startsWith('- ')).length;

  const hasDotBullets = dotBullets > 0;
  const hasDashBullets = dashBullets > 0;

  if (!hasDotBullets && !hasDashBullets) {
    suggestions.push("❌ No bullet points found. Use bullet points for work experience and skills for better readability.");
  } else if (hasDotBullets && hasDashBullets) {
    suggestions.push("⚠️ Inconsistent bullet styles detected. Use either dots (•) or dashes (-), not both for professional consistency.");
  }

  // Spell check
  const typos = spellCheck(text);
  if (typos.length > 0) {
    const uniqueTypos = [...new Set(typos.map(t => t.typo))]; // Remove duplicates
    uniqueTypos.slice(0, 5).forEach(typo => {
      const typoObj = typos.find(t => t.typo === typo);
      suggestions.push(`❌ Possible typo: "${typoObj.typo}" should be "${typoObj.suggestion}"`);
    });
    if (uniqueTypos.length > 5) {
      suggestions.push(`💡 And ${uniqueTypos.length - 5} more potential typos found.`);
    }
  }

  // Date format and ranges check
  const dateRegex = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\b/i;
  if (!dateRegex.test(text)) {
    suggestions.push("❌ Date format inconsistent or missing. Use formats like 'Jan 2023' for professional appearance.");
  }

  const dateRanges = parseDateRanges(text);
  const dateRangeIssues = checkDateRanges(dateRanges);
  suggestions.push(...dateRangeIssues);

  // Section presence and order
  const sections = parseResume(text);
  const presentSections = sections.map((s) => s.title);
  
  const missingSections = recommendedSectionOrder.filter(
    (sec) => !presentSections.some((ps) => 
      ps.toLowerCase().includes(sec.toLowerCase())
    )
  );
  
  missingSections.forEach((m) => {
    if (m === "Summary") {
      suggestions.push("❌ Missing section: Summary - Add a brief professional summary at the top.");
    } else if (m === "Contact") {
      suggestions.push("❌ Missing section: Contact - Include your contact information for employers.");
    } else {
      suggestions.push(`❌ Missing section: ${m}`);
    }
  });

  // Section order check
  for (let i = 0; i < presentSections.length - 1; i++) {
    const currentTitle = presentSections[i];
    const nextTitle = presentSections[i + 1];
    
    const currentIdx = recommendedSectionOrder.findIndex(sec => 
      currentTitle.toLowerCase().includes(sec.toLowerCase())
    );
    const nextIdx = recommendedSectionOrder.findIndex(sec => 
      nextTitle.toLowerCase().includes(sec.toLowerCase())
    );
    
    if (currentIdx !== -1 && nextIdx !== -1 && currentIdx > nextIdx) {
      suggestions.push(`❌ Section order issue: "${currentTitle}" should come before "${nextTitle}" for better flow.`);
    }
  }

  // Content quality check
  const contentQualityIssues = checkContentQuality(text, sections);
  suggestions.push(...contentQualityIssues);

  // Contact information validation
  const contactIssues = validateContactInfo(text);
  suggestions.push(...contactIssues);

  // Font check (basic)
  const badFonts = ["Comic Sans", "Papyrus", "Courier New"];
  badFonts.forEach((font) => {
    if (text.includes(font)) {
      suggestions.push(`❌ Unprofessional font detected: ${font} - Use professional fonts like Arial, Calibri, or Times New Roman.`);
    }
  });

  // Jargon and buzzword check
  const buzzwords = ['synergize', 'leverage', 'disrupt', 'paradigm', 'holistic', 'granular', 'robust', 'scalable', 'agile'];
  const buzzwordCount = buzzwords.reduce((count, word) => {
    const matches = text.match(new RegExp('\\b' + word + '\\b', 'gi'));
    return count + (matches ? matches.length : 0);
  }, 0);
  
  if (buzzwordCount > 3) {
    suggestions.push("💡 Too many buzzwords detected. Use clear, specific language instead of corporate jargon.");
  }

  if (suggestions.length === 0) {
    suggestions.push("🎉 Excellent! Your resume follows all professional standards and best practices.");
  }

  return suggestions;
};

const ResumeFix = () => {
  const [resumeText, setResumeText] = useState("");
  const [feedback, setFeedback] = useState([]);

  const handleTextChange = (e) => {
    const text = e.target.value;
    setResumeText(text);
    if (text.trim() === "") {
      setFeedback([]);
    } else {
      setFeedback(evaluateResume(text));
    }
  };

  const loadSampleResume = () => {
    const sample = `Sifen Abduselam
Senior Software Engineer

SUMMARY
Results-driven software engineer with 5 years of experience in full-stack development and team leadership. Passionate about creating scalable, user-friendly applications.

EXPERIENCE
Junior Developer - Startup Solutions
Jun 2018 - Feb 2019
• Assisted in frontend development using React and JavaScript
• Wrote unit tests to ensure code quality

Software Engineer - Digital Innovations LLC
Mar 2019 - Dec 2020
• Developed and maintained multiple client projects using React and Node.js
• Mentored junior developers and conducted code reviews

Senior Software Engineer - Tech Solutions Inc.
Jan 2021 - Present
• Led a team of 6 developers in creating responsive web applications
• Implemented React best practices that improved performance by 40%
EDUCATION
Bachelor of Science in Computer Science
State University
2024 - 2025
• Graduated with honors (3.8 GPA)
• Relevant coursework: Data Structures, Algorithms, Web Development

SKILLS
• JavaScript/TypeScript
• React.js
• Node.js
• HTML/CSS
• Git
• Agile/Scrum
• RESTful APIs
• Database Design

CONTACT
Email: sifen@gmail.com
Phone: 2519335111
LinkedIn: linkedin.com/in/Sifen-Abduselam
GitHub: github.com/Sifen`;
  
    setResumeText(sample);
    setFeedback(evaluateResume(sample));
  };
    
  const clearResume = () => {
    setResumeText("");
    setFeedback([]);
  };

  return (
    <div className="container">
      <h1 className="header">Resume Quality Checker</h1>
      <p className="subtitle">Professional resume analysis with comprehensive feedback</p>
      
    <div className="buttons-container">
  <button 
    onClick={loadSampleResume}
    className="sample-button"
  >
    Load Sample
  </button>
  <button 
    onClick={() => {
      setResumeText("");
      setFeedback([]);
    }}
    className="clear-button"
  >
    Clear
  </button>
</div>

      <textarea
        className="textarea"
        placeholder="Paste your resume text here for professional analysis..."
        rows={20}
        value={resumeText}
        onChange={handleTextChange}
      />

      <div className="feedback-container">
        <h2 className="feedback-header">Professional Feedback:</h2>

        {feedback.length === 0 ? (
          <p style={{ color: "#666", fontStyle: "italic", textAlign: "center" }}>
            Paste your resume text above to get comprehensive professional feedback.
          </p>
        ) : (
          <ul className="feedback-list">
            {feedback.map((msg, idx) => {
              let className = "feedback-item ";
              if (msg.startsWith("❌")) className += "error";
              else if (msg.startsWith("⚠️") || msg.startsWith("💡")) className += "warning";
              else if (msg.startsWith("🎉")) className += "success";
              else className += "info";

              return (
                <li key={idx} className={className} style={{ animationDelay: `${idx * 0.1}s` }}>
                  {msg}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      
      <div className="tips-section">
        <h3>💡 Professional Resume Tips:</h3>
        <ul>
          <li>Use strong action verbs (managed, developed, implemented)</li>
          <li>Quantify achievements with numbers and metrics</li>
          <li>Keep it concise (1-2 pages max)</li>
          <li>Use consistent formatting throughout</li>
          <li>Include relevant keywords from job descriptions</li>
          <li>Proofread multiple times for errors</li>
        </ul>
      </div>
    </div>
  );
};

export default ResumeFix;
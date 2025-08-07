import React, { useState } from 'react';
import './ResumeFix.css';

const ResumeFix: React.FC = () => {
  const [resumeText, setResumeText] = useState<string>('');
  const [feedback, setFeedback] = useState<string[]>([]);

  const analyzeResume = () => {
    const issues: string[] = [];

    // Bullet point check
    if (!resumeText.includes('•') && !resumeText.includes('- ')) {
      issues.push('❌ No bullet points found. Use bullet points for better readability.');
    } else {
      issues.push('✅ Bullet point usage looks good.');
    }

    // Date format check
    const datePattern = /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[ \t]*\d{4}\b/g;
    const foundDates = resumeText.match(datePattern);
    if (foundDates && foundDates.length > 0) {
      issues.push('✅ Date formats look consistent.');
    } else {
      issues.push('❌ Date format inconsistent or missing. Use formats like "Jan 2023".');
    }

    // Font check (dummy logic — real fonts checked in CSS/UI)
    const badFonts = ['Comic Sans', 'Papyrus'];
    badFonts.forEach(font => {
      if (resumeText.includes(font)) {
        issues.push(`❌ Avoid using ${font}. Choose professional fonts like Arial, Calibri, or Times New Roman.`);
      }
    });
    if (!issues.find(issue => issue.includes('Avoid using'))) {
      issues.push('✅ Fonts look professional.');
    }

    setFeedback(issues);
  };

  return (
    <div className="resume-fix-container">
      <h1>ResumeFix</h1>
      <textarea
        placeholder="Paste your resume here..."
        value={resumeText}
        onChange={(e) => setResumeText(e.target.value)}
      />
      <button onClick={analyzeResume}>Analyze</button>
      <div className="feedback">
        {feedback.map((item, index) => (
          <p key={index}>{item}</p>
        ))}
      </div>
    </div>
  );
};

export default ResumeFix;

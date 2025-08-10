import React, { useState } from "react";
import "./resumefix.css";

const recommendedSectionOrder = [
  "Summary",
  "Experience",
  "Education",
  "Skills",
  "Contact",
];

// Helper functions
const parseResume = (text) => {
  const lines = text.split("\n").map((line) => line.trim());
  const sections = [];
  let currentSection = { title: "", content: [] };

  lines.forEach((line) => {
    if (recommendedSectionOrder.some((sec) => sec.toLowerCase() === line.toLowerCase())) {
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
    // More precise regex that looks for date ranges on their own lines
    const match = line.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\s*-\s*(?:(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})|(Present|Current))/i);
    if (match) {
      try {
        const startStr = `${match[1]} 1, ${match[0].match(/\b\d{4}\b/)?.[0]}`;
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
          line: lineIndex + 1
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
      issues.push(`❌ Missing end date for date range #${i + 1}. Consider adding "Present" or an end month/year.`);
    }
  });

  for (let i = 0; i < ranges.length - 1; i++) {
    const currentEnd = ranges[i].end;
    const nextStart = ranges[i + 1].start;
    if (currentEnd && nextStart && nextStart < currentEnd) {
      issues.push(`❌ Date range #${i + 2} starts before previous range ends.`);
    }
  }

  return issues;
};

const evaluateResume = (text) => {
  const suggestions = [];

  // Better bullet points check
  const lines = text.split('\n');
  const dotBullets = lines.filter(line => line.trim().startsWith('•')).length;
  const dashBullets = lines.filter(line => line.trim().startsWith('- ')).length;

  const hasDotBullets = dotBullets > 0;
  const hasDashBullets = dashBullets > 0;

  if (!hasDotBullets && !hasDashBullets) {
    suggestions.push("❌ No bullet points found. Use bullet points for clarity.");
  } else if (hasDotBullets && hasDashBullets) {
    suggestions.push("⚠️ Inconsistent bullet styles detected. Use either dots (•) or dashes (-), not both.");
  }

  // Date format and ranges check
  const dateRegex = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\b/i;
  if (!dateRegex.test(text)) {
    suggestions.push("❌ Date format inconsistent or missing. Use formats like 'Jan 2023'.");
  }

  const dateRanges = parseDateRanges(text);
  const dateRangeIssues = checkDateRanges(dateRanges);
  suggestions.push(...dateRangeIssues);

  // Section presence and order
  const sections = parseResume(text);
  const presentSections = sections.map((s) => s.title);
  const missingSections = recommendedSectionOrder.filter(
    (sec) => !presentSections.some((ps) => ps.toLowerCase() === sec.toLowerCase())
  );
  missingSections.forEach((m) => suggestions.push(`❌ Missing section: ${m}`));

  for (let i = 0; i < presentSections.length - 1; i++) {
    const currentIdx = recommendedSectionOrder.indexOf(presentSections[i]);
    const nextIdx = recommendedSectionOrder.indexOf(presentSections[i + 1]);
    if (currentIdx > nextIdx && currentIdx !== -1 && nextIdx !== -1) {
      suggestions.push(`❌ Section "${presentSections[i]}" should come before "${presentSections[i + 1]}".`);
    }
  }

  // Font check (basic)
  const badFonts = ["Comic Sans", "Papyrus", "Courier New"];
  badFonts.forEach((font) => {
    if (text.includes(font)) {
      suggestions.push(`❌ Unprofessional font detected: ${font}`);
    }
  });

  if (suggestions.length === 0) {
    suggestions.push("✅ Your resume looks professional.");
  }

  return suggestions;
};

// Simple fake spell checker - returns list of "misspelled" words
export function spellCheck(text) {
  // Example: Just check for some common typos, really basic
  const commonTypos = ["teh", "recieve", "adress", "langauge"];
  const foundTypos = [];

  commonTypos.forEach((word) => {
    if (text.toLowerCase().includes(word)) {
      foundTypos.push(word);
    }
  });

  return foundTypos;
}

const ResumeFix = () => {
  const [resumeText, setResumeText] = useState("");
  const [feedback, setFeedback] = useState([]);

  const handleTextChange = (e) => {
    const text = e.target.value;
    setResumeText(text);
    if (text.trim() === "") {
      setFeedback([]); // Clear feedback if empty
    } else {
      setFeedback(evaluateResume(text));
    }
  };

  return (
    <div className="container">
      <h1 className="header">Resume Quality Checker</h1>

      <textarea
        className="textarea"
        placeholder="Paste your resume text here..."
        rows={15}
        value={resumeText}
        onChange={handleTextChange}
      />

      <div className="feedback-container">
        <h2 className="feedback-header">Feedback:</h2>

        {feedback.length === 0 ? (
          <p style={{ color: "#aaa", fontStyle: "italic" }}>
            Type or paste your resume text above to get detailed feedback.
          </p>
        ) : (
          <ul className="feedback-list">
            {feedback.map((msg, idx) => {
              let className = "feedback-item ";
              if (msg.startsWith("❌")) className += "error";
              else if (msg.startsWith("⚠️")) className += "warning";
              else className += "success";

              return (
                <li key={idx} className={className} style={{ animationDelay: `${idx * 0.15}s` }}>
                  {msg}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ResumeFix;
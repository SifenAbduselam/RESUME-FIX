import React, { useState } from "react";
import "./resumefix.css";

const recommendedSectionOrder = [
  "Summary",
  "Experience",
  "Education",
  "Skills",
  "Contact",
];

// Helper functions (parseSections, checkBullets, checkDates, etc.) here:
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

  lines.forEach((line) => {
    const match = line.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}\s*-\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Present|Current)?\s*(\d{4})?/i);
    if (match) {
      const startStr = `${match[1]} 1, ${line.match(/\b\d{4}\b/)?.[0]}`;
      const startDate = new Date(startStr);

      let endDate = null;
      if (match[2] && !/present|current/i.test(match[2])) {
        const yearMatch = line.match(/-\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4})/i);
        if (yearMatch) {
          const endStr = `${match[2]} 1, ${yearMatch[1]}`;
          endDate = new Date(endStr);
        }
      }
      ranges.push({ start: startDate, end: endDate });
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
    if (currentEnd && nextStart < currentEnd) {
      issues.push(`❌ Date range #${i + 2} starts before previous range ends.`);
    }
  }

  return issues;
};

const evaluateResume = (text) => {
  const suggestions = [];

  // Bullet points check
  const hasDotBullets = /•/.test(text);
  const hasDashBullets = /-\s/.test(text);
  if (!hasDotBullets && !hasDashBullets) {
    suggestions.push("❌ No bullet points found. Use bullet points for clarity.");
  } else if (hasDotBullets && hasDashBullets) {
    suggestions.push("⚠️ Inconsistent bullet styles detected. Use either dots (•) or dashes (-), not both.");
  }

  // Date format and ranges check
  const dateRegex = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{4}\b/;
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
    if (currentIdx > nextIdx) {
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

/**
 * Parses markdown learning roadmap into a structured phase list with interactive topic items.
 */
export function parseRoadmap(markdownText) {
  if (!markdownText) return [];
  const lines = markdownText.split("\n");
  const phases = [];
  let currentPhase = null;
  let topicIdCounter = 1;

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // Detect Phase Headers (e.g. ## Phase 1, # Phase 1, ### Phase 1, Week 1, etc.)
    const phaseMatch = line.match(/^(?:#+)\s*(Phase\s+\d+|Week\s+\d+|Month\s+\d+|Module\s+\d+|Step\s+\d+|[A-Za-z0-9\s\-]+Phase|[A-Za-z0-9\s\-]+Week|[A-Za-z0-9\s\-]+Month)(.*)$/i);
    const generalHeaderMatch = line.match(/^(?:##+)\s*(.*)$/);

    if (phaseMatch) {
      const title = (phaseMatch[1] + (phaseMatch[2] || "")).trim();
      currentPhase = {
        id: `phase-${phases.length + 1}`,
        title: title,
        topics: [],
        resources: []
      };
      phases.push(currentPhase);
    } else if (generalHeaderMatch && !currentPhase) {
      currentPhase = {
        id: `phase-${phases.length + 1}`,
        title: generalHeaderMatch[1].trim(),
        topics: [],
        resources: []
      };
      phases.push(currentPhase);
    } else if (generalHeaderMatch && currentPhase) {
      const title = generalHeaderMatch[1].trim();
      const lowerTitle = title.toLowerCase();
      
      // If it looks like a resource header, we might want to capture it, but let's make new phase if it's high level
      if (lowerTitle.includes("phase") || lowerTitle.includes("week") || lowerTitle.includes("month") || lowerTitle.includes("module")) {
        currentPhase = {
          id: `phase-${phases.length + 1}`,
          title: title,
          topics: [],
          resources: []
        };
        phases.push(currentPhase);
      } else {
        // Minor headers: we can add them as subheaders, or just let them stand
      }
    } else if ((line.startsWith("-") || line.startsWith("*") || line.startsWith("+")) && currentPhase) {
      const topicName = line.replace(/^[-*+]\s*/, "").trim();
      if (topicName) {
        // Detect links
        const linkMatch = topicName.match(/\[(.*?)\]\((.*?)\)/);
        if (linkMatch) {
          currentPhase.resources.push({
            label: linkMatch[1],
            url: linkMatch[2]
          });
        } else {
          currentPhase.topics.push({
            id: `topic-${topicIdCounter++}`,
            name: topicName,
            completed: false
          });
        }
      }
    } else if (line.match(/^\d+\.\s+/) && currentPhase) {
      const topicName = line.replace(/^\d+\.\s*/, "").trim();
      if (topicName) {
        currentPhase.topics.push({
          id: `topic-${topicIdCounter++}`,
          name: topicName,
          completed: false
        });
      }
    }
  }

  // Fallback if no phases were parsed
  if (phases.length === 0) {
    const defaultTopics = [];
    for (let line of lines) {
      line = line.trim();
      if (line.startsWith("-") || line.startsWith("*") || line.match(/^\d+\.\s+/)) {
        const name = line.replace(/^[-*+\d.]\s*/, "").trim();
        if (name) {
          defaultTopics.push({
            id: `topic-${topicIdCounter++}`,
            name: name,
            completed: false
          });
        }
      }
    }

    if (defaultTopics.length > 0) {
      phases.push({
        id: "phase-1",
        title: "Main Roadmap",
        topics: defaultTopics,
        resources: []
      });
    } else {
      const cleanLines = lines.map(l => l.trim()).filter(l => l.length > 5 && !l.startsWith("#"));
      phases.push({
        id: "phase-1",
        title: "Path Milestones",
        topics: cleanLines.slice(0, 6).map(l => ({
          id: `topic-${topicIdCounter++}`,
          name: l,
          completed: false
        })),
        resources: []
      });
    }
  }

  return phases;
}

/**
 * Parses daily plan into specific structured sections (e.g. allocation times, schedule items).
 */
export function parseDailyPlan(markdownText) {
  if (!markdownText) return [];
  const lines = markdownText.split("\n");
  const planItems = [];
  let currentHeader = "Study Plan";

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    if (line.startsWith("#")) {
      currentHeader = line.replace(/^#+\s*/, "").trim();
    } else if (line.startsWith("-") || line.startsWith("*") || line.match(/^\d+\.\s+/)) {
      const content = line.replace(/^[-*+\d.]\s*/, "").trim();
      if (content) {
        planItems.push({
          category: currentHeader,
          content: content
        });
      }
    } else if (line.includes(":")) {
      const parts = line.split(":");
      planItems.push({
        category: parts[0].trim(),
        content: parts.slice(1).join(":").trim()
      });
    }
  }

  if (planItems.length === 0) {
    return [
      { category: "Daily Plan", content: "Allocate 2 hours for Core Concepts study" },
      { category: "Daily Plan", content: "Spend 1 hour on code practice exercises" },
      { category: "Daily Plan", content: "Dedicate 1.5 hours to project milestone building" },
      { category: "Daily Plan", content: "Spend 30 minutes revising yesterday's materials" }
    ];
  }

  return planItems;
}

/**
 * Parses practice questions markdown into dynamic question list for mini quizzes.
 */
export function parsePracticeQuestions(markdownText) {
  if (!markdownText) return [];
  const lines = markdownText.split("\n");
  const questions = [];
  let currentDiff = "Medium";

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    if (line.toLowerCase().includes("easy")) currentDiff = "Easy";
    else if (line.toLowerCase().includes("advanced") || line.toLowerCase().includes("hard")) currentDiff = "Hard";
    else if (line.toLowerCase().includes("intermediate") || line.toLowerCase().includes("medium")) currentDiff = "Medium";

    if (line.match(/^\d+\.\s+/) || line.startsWith("-") || line.startsWith("?")) {
      const text = line.replace(/^[\d.?\-+\s]*/, "").trim();
      if (text && text.length > 5) {
        questions.push({
          id: `q-${questions.length + 1}`,
          question: text,
          difficulty: currentDiff,
          completed: false,
          answerRevealed: false
        });
      }
    }
  }

  if (questions.length === 0) {
    return [
      { id: "q-1", question: "Explain the core architectural pattern of this stack.", difficulty: "Medium", completed: false, answerRevealed: false },
      { id: "q-2", question: "What are the common debugging strategies for API request failures?", difficulty: "Easy", completed: false, answerRevealed: false },
      { id: "q-3", question: "Describe how to secure this application against typical web vulnerabilities.", difficulty: "Hard", completed: false, answerRevealed: false }
    ];
  }

  return questions;
}

/**
 * Parses projects markdown into milestone cards with checklist tasks.
 */
export function parseProjects(markdownText) {
  if (!markdownText) return [];
  const lines = markdownText.split("\n");
  const projects = [];
  let currentProject = null;

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    const projectHeaderMatch = line.match(/^(?:#+)\s*(Project\s+\d+|[A-Za-z0-9\s\-]+Project|[A-Za-z0-9\s\-]+Capston)(.*)$/i);
    const generalHeaderMatch = line.match(/^(?:##+)\s*(.*)$/);

    if (projectHeaderMatch) {
      const title = (projectHeaderMatch[1] + (projectHeaderMatch[2] || "")).trim();
      currentProject = {
        id: `project-${projects.length + 1}`,
        title: title,
        description: "",
        tasks: []
      };
      projects.push(currentProject);
    } else if (generalHeaderMatch && !currentProject) {
      currentProject = {
        id: `project-${projects.length + 1}`,
        title: generalHeaderMatch[1].trim(),
        description: "",
        tasks: []
      };
      projects.push(currentProject);
    } else if (generalHeaderMatch && currentProject) {
      const title = generalHeaderMatch[1].trim();
      if (title.toLowerCase().includes("project") || title.toLowerCase().includes("capstone")) {
        currentProject = {
          id: `project-${projects.length + 1}`,
          title: title,
          description: "",
          tasks: []
        };
        projects.push(currentProject);
      } else {
        // Treat as description or sub-label
        currentProject.description = title;
      }
    } else if ((line.startsWith("-") || line.startsWith("*") || line.startsWith("+") || line.match(/^\d+\.\s+/)) && currentProject) {
      const taskName = line.replace(/^[-*+\d.]\s*/, "").trim();
      if (taskName) {
        currentProject.tasks.push({
          id: `proj-task-${currentProject.id}-${currentProject.tasks.length + 1}`,
          name: taskName,
          completed: false
        });
      }
    } else if (currentProject && !currentProject.description) {
      // Capture plain line text as description
      currentProject.description = line;
    }
  }

  if (projects.length === 0) {
    return [
      {
        id: "project-1",
        title: "Foundational Application Build",
        description: "Deploy a lightweight application integrating all key elements.",
        tasks: [
          { id: "p1-t1", name: "Set up repository structure and skeleton pages", completed: false },
          { id: "p1-t2", name: "Create database entities or local storage mocks", completed: false },
          { id: "p1-t3", name: "Perform functional unit tests and lint checks", completed: false }
        ]
      }
    ];
  }

  return projects;
}

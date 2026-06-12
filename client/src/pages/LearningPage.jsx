import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "react-router-dom";
import {
  Moon, Sun, Download, ChevronDown, ChevronUp, Plus, X,
  Sparkles, BookOpen, Clock, Award, TrendingUp, ArrowLeft,
  CheckCircle2, Circle, Target, Layers, Star, Zap, Loader2,
  Volume2, VolumeX, Timer, RotateCcw, FileText, Search, Youtube, Chrome, Trash2,
  Play, Pause
} from "lucide-react";
import { generateLearningPath } from "../api/learningApi.js";
import confetti from "canvas-confetti";

// ─── Constants ─────────────────────────────────────────────────────────────
const CAREER_SUGGESTIONS = [
  "MERN Stack Developer",
  "Data Scientist",
  "Salesforce Consultant",
  "Cloud Solutions Architect",
  "Mobile Flutter Developer",
];

const SKILL_LEVELS = [
  {
    id: "Beginner",
    label: "Beginner",
    desc: "No prior experience. Start from absolute core basics.",
  },
  {
    id: "Intermediate",
    label: "Intermediate",
    desc: "Know the core syntax. Want to build real apps.",
  },
  {
    id: "Advanced",
    label: "Advanced",
    desc: "Proficient. Want to master system architecture & scale.",
  },
];

const DURATIONS = [
  { id: "1 Month", label: "1 Month", sub: "Intense crash course" },
  { id: "3 Months", label: "3 Months", sub: "Standard boot camp pace" },
  { id: "6 Months", label: "6 Months", sub: "Deep dive specialization" },
  { id: "12 Months", label: "12 Months", sub: "Full end-to-end mastery" },
];

const RESULT_TABS = [
  { id: "roadmap", label: "Study Roadmap", icon: BookOpen },
  { id: "projects", label: "Practice Projects", icon: Layers },
  { id: "certifications", label: "Certifications Path", icon: Award },
  { id: "resources", label: "Learning Resources", icon: Star },
];

// ─── Parsing helpers ────────────────────────────────────────────────────────
function parseRoadmapPhases(text) {
  if (!text) return [];
  
  let lines = [];
  if (typeof text === "string") {
    lines = text.split("\n");
  } else if (Array.isArray(text)) {
    lines = text.map((item) => {
      if (typeof item === "object" && item !== null) return JSON.stringify(item);
      return String(item || "");
    });
  } else if (typeof text === "object" && text !== null) {
    try {
      lines = Object.values(text).map((item) => {
        if (typeof item === "object" && item !== null) return JSON.stringify(item);
        return String(item || "");
      });
    } catch {
      lines = [];
    }
  } else {
    try {
      lines = String(text).split("\n");
    } catch {
      lines = [];
    }
  }

  const phases = [];
  let current = null;
  let weekCounter = 0;

  for (let raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    // Phase / section headers
    const phaseMatch = line.match(/^#{1,3}\s+(.+)$/);
    if (phaseMatch) {
      const title = phaseMatch[1].trim();
      // Detect if it looks like a sub-week inside a phase
      const weekMatch = title.match(/week\s*(\d+)/i);
      if (weekMatch && current) {
        weekCounter++;
        const week = {
          id: `week-${weekCounter}`,
          label: `WEEK ${weekMatch[1]}`,
          title: title.replace(/week\s*\d+[\s:–-]*/i, "").trim() || title,
          topics: [],
          expanded: false,
        };
        current.weeks.push(week);
      } else {
        current = {
          id: `phase-${phases.length + 1}`,
          number: phases.length + 1,
          title,
          weekRange: "",
          weeks: [],
        };
        phases.push(current);
      }
      continue;
    }

    // Bullet topics → add to last week if exists, else phase
    if ((line.startsWith("-") || line.startsWith("*") || line.match(/^\d+\./)) && current) {
      const topic = line.replace(/^[-*\d.]\s*/, "").trim();
      if (topic) {
        const lastWeek = current.weeks[current.weeks.length - 1];
        if (lastWeek) {
          lastWeek.topics.push(topic);
        } else {
          if (!current.mainTopics) current.mainTopics = [];
          current.mainTopics.push(topic);
        }
      }
    }
  }

  // Assign week ranges
  phases.forEach((p) => {
    if (p.weeks.length > 0) {
      const wNums = p.weeks
        .map((w) => w.label.match(/\d+/)?.[0])
        .filter(Boolean)
        .map(Number);
      if (wNums.length)
        p.weekRange = `Weeks ${Math.min(...wNums)}–${Math.max(...wNums)}`;
    }
  });

  return phases;
}

function parseListSection(text) {
  if (!text) return [];
  
  if (Array.isArray(text)) {
    return text
      .map((l) => {
        if (typeof l === "object" && l !== null) return JSON.stringify(l);
        return String(l || "").replace(/^[-*#\d.]\s*/, "").trim();
      })
      .filter((l) => l.length > 4);
  }
  
  if (typeof text === "object" && text !== null) {
    try {
      return Object.values(text)
        .map((val) => {
          if (typeof val === "object" && val !== null) return JSON.stringify(val);
          return String(val || "").replace(/^[-*#\d.]\s*/, "").trim();
        })
        .filter((l) => l.length > 4);
    } catch {
      return [];
    }
  }

  let stringText = "";
  if (typeof text !== "string") {
    try {
      stringText = String(text);
    } catch {
      return [];
    }
  } else {
    stringText = text;
  }

  return stringText
    .split("\n")
    .map((l) => l.replace(/^[-*#\d.]\s*/, "").trim())
    .filter((l) => l.length > 4);
}

// ─── Sub-components ─────────────────────────────────────────────────────────
function SkeletonLoader() {
  return (
    <div className="flex min-h-[560px] flex-col items-center justify-center p-8 text-center bg-white dark:bg-zinc-900 rounded-lg">
      <div className="relative flex h-18 w-18 items-center justify-center rounded-full border-4 border-teal-500/10 border-t-teal-500 animate-spin">
        <div className="absolute inset-2 rounded-full bg-teal-500/5 flex items-center justify-center">
          <Sparkles size={24} className="text-teal-600 dark:text-teal-400 animate-pulse" />
        </div>
      </div>
      <h2 className="text-xl font-bold mt-6 text-zinc-900 dark:text-zinc-550">Assembling Your Syllabus</h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">Gemini is analyzing your career objectives...</p>
      
      <div className="w-full max-w-md mt-8 space-y-4">
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse w-1/3 mx-auto" />
        <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse w-full" />
        <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse w-5/6 mx-auto" />
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="h-12 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
          <div className="h-12 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
          <div className="h-12 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function LearningPage() {
  const location = useLocation();
  const autoGeneratedRef = useRef(false);

  // Theme
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  // Form state
  const [targetRole, setTargetRole] = useState("");
  const [skillLevel, setSkillLevel] = useState("Beginner");
  const [duration, setDuration] = useState("3 Months");
  const [techInput, setTechInput] = useState("");
  const [technologies, setTechnologies] = useState(["JavaScript", "React", "Node.js"]);

  // App state
  const [view, setView] = useState("form"); // 'form' | 'loading' | 'result'
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState("roadmap");
  const [expandedWeeks, setExpandedWeeks] = useState({});
  const [completedTopics, setCompletedTopics] = useState({});

  // Search & Persistent Notes & Topic Tags
  const [searchTerm, setSearchTerm] = useState("");
  const [notes, setNotes] = useState({});
  const [difficultyTags, setDifficultyTags] = useState({});

  // Pomodoro Focus Timer State
  const [timerMode, setTimerMode] = useState("focus"); // 'focus' | 'short' | 'long'
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Web Audio Synth Chimes
  const playTimerChime = (type) => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;
      if (type === "tick") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.005, now);
        gain.gain.exponentialRampToValueAtTime(0.00001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === "complete") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(523.25, now); // C5
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(659.25, now + 0.12); // E5
        gain2.gain.setValueAtTime(0.08, now + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.52);

        const osc3 = ctx.createOscillator();
        const gain3 = ctx.createGain();
        osc3.connect(gain3);
        gain3.connect(ctx.destination);
        osc3.type = "triangle";
        osc3.frequency.setValueAtTime(783.99, now + 0.24); // G5
        gain3.gain.setValueAtTime(0.08, now + 0.24);
        gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.64);

        osc.start(now); osc.stop(now + 0.4);
        osc2.start(now + 0.12); osc2.stop(now + 0.52);
        osc3.start(now + 0.24); osc3.stop(now + 0.64);
      }
    } catch {
      // Fallback
    }
  };

  // Pomodoro countdown effect
  useEffect(() => {
    let interval = null;
    if (timerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            playTimerChime("complete");
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.7 }
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timeLeft, soundEnabled]);

  const handleTimerModeChange = (mode) => {
    setTimerMode(mode);
    setTimerRunning(false);
    if (mode === "focus") setTimeLeft(25 * 60);
    else if (mode === "short") setTimeLeft(5 * 60);
    else if (mode === "long") setTimeLeft(15 * 60);
  };

  // Persistent Progress, Notes & Difficulties synchronized to localStorage per role
  useEffect(() => {
    if (result && result.targetRole) {
      const key = `learning_progress_${result.targetRole}`;
      try {
        const saved = localStorage.getItem(key);
        setCompletedTopics(saved ? JSON.parse(saved) : {});
      } catch {
        setCompletedTopics({});
      }

      const notesKey = `learning_notes_${result.targetRole}`;
      try {
        const savedNotes = localStorage.getItem(notesKey);
        setNotes(savedNotes ? JSON.parse(savedNotes) : {});
      } catch {
        setNotes({});
      }

      const diffKey = `learning_difficulty_${result.targetRole}`;
      try {
        const savedDiff = localStorage.getItem(diffKey);
        setDifficultyTags(savedDiff ? JSON.parse(savedDiff) : {});
      } catch {
        setDifficultyTags({});
      }
    }
  }, [result]);

  useEffect(() => {
    if (result && result.targetRole) {
      const key = `learning_progress_${result.targetRole}`;
      localStorage.setItem(key, JSON.stringify(completedTopics));
    }
  }, [completedTopics, result]);

  useEffect(() => {
    if (result && result.targetRole) {
      const notesKey = `learning_notes_${result.targetRole}`;
      localStorage.setItem(notesKey, JSON.stringify(notes));
    }
  }, [notes, result]);

  useEffect(() => {
    if (result && result.targetRole) {
      const diffKey = `learning_difficulty_${result.targetRole}`;
      localStorage.setItem(diffKey, JSON.stringify(difficultyTags));
    }
  }, [difficultyTags, result]);

  useEffect(() => {
    if (location.state?.topic && !autoGeneratedRef.current) {
      autoGeneratedRef.current = true;
      const targetTopic = location.state.topic;
      setTargetRole(targetTopic);
      if (location.state?.autoGenerate) {
        const runAutoGenerate = async () => {
          setError("");
          setView("loading");

          try {
            const response = await generateLearningPath({
              skillLevel,
              targetRole: targetTopic.trim(),
              duration,
              currentSkills: technologies.join(", "),
              preferences: technologies.join(", "),
            });

            setResult({ ...response, targetRole: targetTopic.trim(), skillLevel, duration, technologies });
            setExpandedWeeks({});
            setCompletedTopics({});
            setActiveTab("roadmap");
            setView("result");
          } catch (err) {
            setError(err.message || "Failed to generate learning path.");
            setView("form");
          }
        };
        runAutoGenerate();
      }
    }
  }, [location.state]);

  const techInputRef = useRef(null);

  // Tech tag management
  const addTech = () => {
    const val = techInput.trim();
    if (val && !technologies.includes(val)) {
      setTechnologies((prev) => [...prev, val]);
    }
    setTechInput("");
    techInputRef.current?.focus();
  };

  const removeTech = (t) => setTechnologies((prev) => prev.filter((x) => x !== t));

  const handleTechKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); addTech(); }
    if (e.key === "Backspace" && !techInput && technologies.length) {
      setTechnologies((prev) => prev.slice(0, -1));
    }
  };

  // Generation
  async function handleGenerate(e) {
    e.preventDefault();
    if (!targetRole.trim()) return;
    setError("");
    setView("loading");

    try {
      const response = await generateLearningPath({
        skillLevel,
        targetRole: targetRole.trim(),
        duration,
        currentSkills: technologies.join(", "),
        preferences: technologies.join(", "),
      });

      setResult({ ...response, targetRole: targetRole.trim(), skillLevel, duration, technologies });
      setExpandedWeeks({});
      setCompletedTopics({});
      setActiveTab("roadmap");
      setView("result");
    } catch (err) {
      setError(err.message || "Failed to generate learning path.");
      setView("form");
    }
  }

  // Toggle week expand
  const toggleWeek = (weekId) => {
    setExpandedWeeks((prev) => ({ ...prev, [weekId]: !prev[weekId] }));
  };

  // Expand / collapse all weeks
  const expandAllWeeks = () => {
    const expanded = {};
    phases.forEach((p) => {
      p.weeks.forEach((w) => {
        expanded[w.id] = true;
      });
    });
    setExpandedWeeks(expanded);
  };

  const collapseAllWeeks = () => {
    setExpandedWeeks({});
  };

  // Compute parsed data from result
  const phases = result ? parseRoadmapPhases(result.roadmap || "") : [];
  const projectItems = result ? parseListSection(result.projects || "") : [];
  const certItems = result ? parseListSection(result.practice || "") : [];
  const resourceItems = result ? parseListSection(result.dailyPlan || "") : [];

  const filteredPhases = useMemo(() => {
    if (!result) return [];
    return phases.map((phase) => {
      // Filter main topics
      const matchedMainTopics = (phase.mainTopics || []).map((t, i) => {
        const key = `${phase.id}-main-${i}`;
        const diff = difficultyTags[key] || "Easy";
        const matchesSearch = searchTerm
          ? t.toLowerCase().includes(searchTerm.toLowerCase()) || diff.toLowerCase().includes(searchTerm.toLowerCase())
          : true;
        return { t, i, key, matchesSearch };
      }).filter(item => item.matchesSearch);

      // Filter weeks
      const matchedWeeks = phase.weeks.map((week) => {
        const matchedTopics = (week.topics || []).map((t, i) => {
          const key = `${phase.id}-${week.id}-${i}`;
          const diff = difficultyTags[key] || "Easy";
          const matchesSearch = searchTerm
            ? t.toLowerCase().includes(searchTerm.toLowerCase()) || diff.toLowerCase().includes(searchTerm.toLowerCase())
            : true;
          return { t, i, key, matchesSearch };
        }).filter(item => item.matchesSearch);

        return { ...week, matchedTopics };
      }).filter(week => week.matchedTopics.length > 0 || (searchTerm ? false : true));

      return { ...phase, matchedMainTopics, matchedWeeks };
    }).filter(phase => phase.matchedMainTopics.length > 0 || phase.matchedWeeks.length > 0);
  }, [phases, searchTerm, difficultyTags, result]);

  // Toggle completed topic with gamified milestone celebrations
  const toggleTopic = (topicKey, phaseId, weekId) => {
    const isNowChecked = !completedTopics[topicKey];

    setCompletedTopics((prev) => {
      const next = { ...prev, [topicKey]: isNowChecked };

      if (isNowChecked && result) {
        // 1. Check if this completes the whole week
        if (phaseId && weekId) {
          const phase = phases.find((p) => p.id === phaseId);
          if (phase) {
            const week = phase.weeks.find((w) => w.id === weekId);
            if (week && week.topics.length > 0) {
              const allWeekCompleted = week.topics.every((t, i) => {
                const k = `${phase.id}-${week.id}-${i}`;
                return k === topicKey ? true : !!next[k];
              });

              if (allWeekCompleted) {
                confetti({
                  particleCount: 50,
                  angle: 60,
                  spread: 55,
                  origin: { x: 0, y: 0.8 }
                });
                confetti({
                  particleCount: 50,
                  angle: 120,
                  spread: 55,
                  origin: { x: 1, y: 0.8 }
                });
                playTimerChime("complete");
              }
            }
          }
        }

        // 2. Check if this completes the entire roadmap
        const allKeys = [];
        phases.forEach((p) => {
          if (p.mainTopics) {
            p.mainTopics.forEach((_, i) => allKeys.push(`${p.id}-main-${i}`));
          }
          p.weeks.forEach((w) => {
            if (w.topics) {
              w.topics.forEach((_, i) => allKeys.push(`${p.id}-${w.id}-${i}`));
            }
          });
        });

        if (allKeys.length > 0 && allKeys.every((k) => (k === topicKey ? true : !!next[k]))) {
          const duration = 2 * 1000;
          const end = Date.now() + duration;
          (function frame() {
            confetti({ particleCount: 6, angle: 60, spread: 55, origin: { x: 0, y: 0.8 } });
            confetti({ particleCount: 6, angle: 120, spread: 55, origin: { x: 1, y: 0.8 } });
            if (Date.now() < end) requestAnimationFrame(frame);
          })();
          playTimerChime("complete");
        }
      }

      return next;
    });
  };

  // Compute progress stats from result dynamically
  const totalWeeks = phases.reduce((acc, p) => acc + p.weeks.length, 0);
  const studyPace =
    duration === "1 Month"
      ? "10–15 hours"
      : duration === "3 Months"
      ? "25–35 hours"
      : duration === "6 Months"
      ? "15–20 hours"
      : "8–12 hours";

  // Calculate dynamic checklist progress percent
  const totalTopics = phases.reduce((acc, p) => {
    let count = p.mainTopics ? p.mainTopics.length : 0;
    p.weeks.forEach((w) => {
      count += w.topics ? w.topics.length : 0;
    });
    return acc + count;
  }, 0);

  const completedCount = Object.values(completedTopics).filter(Boolean).length;
  const progressPercent = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0;

  // ── Download PDF ──
  const handleDownloadPDF = () => window.print();

  return (
    <main className="min-h-screen bg-stone-50 text-ink transition duration-200 dark:bg-zinc-950 dark:text-zinc-100 pb-12">
      {/* Sleek Top Banner Navbar */}
      <section className="border-b border-zinc-200/80 bg-white/70 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/70 sticky top-0 z-40 print:hidden">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
                <Sparkles size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight sm:text-2xl flex items-center gap-2">
                  AI Learning Path Generator
                  <span className="text-xs bg-teal-500/10 text-teal-600 dark:text-teal-400 px-2 py-0.5 rounded-full font-medium">Pro</span>
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Generate personalized, AI-driven learning roadmaps tailored to your career goals, skill level, and schedule.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                className="icon-button h-10 w-10 hover:border-teal-500/50"
                type="button"
                title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                onClick={() => setIsDark((value) => !value)}
              >
                {isDark ? <Sun size={17} className="text-amber-500" /> : <Moon size={17} />}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Two-Column Layout Grid */}
      <section className="mx-auto grid max-w-[1400px] gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[380px_minmax(0,1fr)] lg:px-8 print:block print:w-full print:p-0">
        
        {/* Left Side Inputs Form */}
        <aside className="grid content-start gap-4 print:hidden">
          <div className="side-panel">
            <h2 className="panel-title text-teal-700 dark:text-teal-300">Syllabus Blueprint</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5 leading-relaxed">
              Define your parameters to draft a personalized Gemini-powered roadmap.
            </p>

            <form onSubmit={handleGenerate} className="grid gap-5">
              {/* Target Career Goal */}
              <div className="grid gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-550 dark:text-zinc-400 flex items-center gap-1.5">
                  <Target size={14} className="text-teal-655 dark:text-teal-400" />
                  Target Career Goal
                </label>
                <input
                  type="text"
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-teal-500/30 focus:border-teal-500 focus:ring-4 dark:border-zinc-700 dark:bg-zinc-950 transition duration-200"
                  placeholder="e.g. Full Stack Developer, Data Scientist..."
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  required
                />
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {CAREER_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="rounded-full border border-zinc-300 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60 px-2.5 py-1 text-[11px] text-zinc-650 dark:text-zinc-400 hover:border-teal-500 hover:text-teal-650 dark:hover:text-white transition duration-200 hover:scale-105"
                      onClick={() => setTargetRole(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Current Skill Level */}
              <div className="grid gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-555 dark:text-zinc-400 flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-teal-655 dark:text-teal-400" />
                  Current Skill Level
                </label>
                <div className="grid gap-2">
                  {SKILL_LEVELS.map((sl) => (
                    <button
                      key={sl.id}
                      type="button"
                      className={`rounded-lg border p-3 text-left transition duration-200 hover:scale-[1.01] ${
                        skillLevel === sl.id
                          ? "border-teal-500 bg-teal-50/50 text-teal-950 dark:border-teal-500/70 dark:bg-teal-955/20 dark:text-teal-100 font-medium"
                          : "border-zinc-200 bg-white text-zinc-700 hover:border-teal-500/50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                      }`}
                      onClick={() => setSkillLevel(sl.id)}
                    >
                      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-1">
                        <span>{sl.label}</span>
                        <div className={`h-4 w-4 rounded-full border flex items-center justify-center transition duration-200 ${
                          skillLevel === sl.id ? "border-teal-500 bg-teal-500 text-white" : "border-zinc-300 dark:border-zinc-700"
                        }`}>
                          {skillLevel === sl.id && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                      <p className="text-[11px] opacity-80 leading-relaxed font-normal">{sl.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Study Duration */}
              <div className="grid gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-555 dark:text-zinc-400 flex items-center gap-1.5">
                  <Clock size={14} className="text-teal-655 dark:text-teal-400" />
                  Study Duration
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {DURATIONS.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      className={`rounded-lg border p-2 text-center flex flex-col items-center justify-center transition duration-200 hover:scale-[1.02] ${
                        duration === d.id
                          ? "border-teal-500 bg-teal-50/50 text-teal-950 dark:border-teal-500/70 dark:bg-teal-955/20 dark:text-teal-100 font-medium"
                          : "border-zinc-200 bg-white text-zinc-700 hover:border-teal-500/50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                      }`}
                      onClick={() => setDuration(d.id)}
                    >
                      <span className="text-xs font-bold">{d.label}</span>
                      <span className="text-[10px] opacity-75 mt-0.5 leading-tight font-normal">{d.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Technologies / Interests */}
              <div className="grid gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-555 dark:text-zinc-400 flex items-center gap-1.5">
                  <Zap size={14} className="text-teal-655 dark:text-teal-400" />
                  Technologies / Interests
                </label>
                <div className="flex gap-2">
                  <input
                    ref={techInputRef}
                    type="text"
                    className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-teal-500/30 focus:border-teal-500 focus:ring-4 dark:border-zinc-700 dark:bg-zinc-950 transition duration-200"
                    placeholder="Add tech (e.g. Docker, PyTorch)"
                    value={techInput}
                    onChange={(e) => setTechInput(e.target.value)}
                    onKeyDown={handleTechKeyDown}
                  />
                  <button
                    type="button"
                    className="primary-button h-9.5 min-h-0 bg-teal-600 hover:bg-teal-700 text-white dark:bg-mint dark:text-zinc-950 dark:hover:bg-teal-300 border-0 flex items-center justify-center p-2 rounded-lg transition duration-250 hover:scale-105"
                    onClick={addTech}
                  >
                    <Plus size={18} />
                  </button>
                </div>
                {technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1 animate-fade-in">
                    {technologies.map((t) => (
                      <span key={t} className="inline-flex items-center gap-1 rounded-full bg-teal-50 dark:bg-teal-500/10 px-2.5 py-0.5 text-xs font-medium text-teal-700 dark:text-teal-300 border border-teal-200/50 dark:border-teal-500/20 hover:scale-105 transition duration-150">
                        {t}
                        <button
                          type="button"
                          className="text-teal-700/70 hover:text-teal-900 dark:text-teal-300/70 dark:hover:text-white transition"
                          onClick={() => removeTech(t)}
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={view === "loading"}
                className="primary-button mt-2 w-full bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-500 hover:to-emerald-400 text-white border-0 shadow-lg shadow-teal-500/15 transition hover:shadow-teal-500/25 active:scale-98"
              >
                <Sparkles size={18} />
                Generate Learning Path
              </button>
            </form>
          </div>

          {/* Focus Session Pomodoro Timer Card */}
          <div className="side-panel animate-fade-in print:hidden">
            <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 pb-3 mb-4">
              <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-150 flex items-center gap-2">
                <Timer size={17} className="text-teal-600 dark:text-teal-400" />
                Focus Study Timer
              </h2>
              <button
                type="button"
                title={soundEnabled ? "Mute Study Chime" : "Unmute Study Chime"}
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="text-zinc-400 hover:text-teal-555 dark:text-zinc-650 dark:hover:text-teal-400 transition"
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
            </div>

            <div className="flex flex-col items-center">
              {/* Predefined Session Modes */}
              <div className="segmented w-full flex justify-between gap-1 mb-4">
                {[
                  { id: "focus", label: "Focus", time: "25" },
                  { id: "short", label: "Break", time: "5" },
                  { id: "long", label: "Rest", time: "15" }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTimerModeChange(item.id)}
                    className={`mode-button flex-1 text-[11px] py-1.5 h-auto text-center justify-center font-bold tracking-tight rounded-md transition duration-150 ${
                      timerMode === item.id
                        ? "bg-white text-ink shadow-sm dark:bg-zinc-800 dark:text-white"
                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Visual Countdown Progress Circle */}
              <div className="relative h-28 w-28 flex items-center justify-center mb-4">
                {/* SVG Progress Circle Background and Path */}
                <svg className="absolute inset-0 h-full w-full transform -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="48"
                    className="stroke-zinc-100 dark:stroke-zinc-800"
                    strokeWidth="5"
                    fill="transparent"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="48"
                    className="stroke-teal-550 dark:stroke-teal-500 transition-all duration-300"
                    strokeWidth="5"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 48}
                    strokeDashoffset={
                      2 * Math.PI * 48 * (1 - timeLeft / (timerMode === "focus" ? 25 * 60 : timerMode === "short" ? 5 * 60 : 15 * 60))
                    }
                  />
                </svg>
                <div className="relative text-center">
                  <span className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-wider">
                    {Math.floor(timeLeft / 60)}:
                    {String(timeLeft % 60).padStart(2, "0")}
                  </span>
                  <span className="block text-[8px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">
                    {timerMode === "focus" ? "Studying" : "Resting"}
                  </span>
                </div>
              </div>

              {/* Timer Controls Row */}
              <div className="flex gap-2 w-full">
                <button
                  type="button"
                  onClick={() => setTimerRunning(!timerRunning)}
                  className={`flex-1 min-h-10 rounded-lg text-xs font-bold transition duration-200 hover:scale-[1.02] flex items-center justify-center gap-1.5 ${
                    timerRunning
                      ? "bg-zinc-800 text-white hover:bg-zinc-900 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                      : "bg-teal-600 text-white hover:bg-teal-700 dark:bg-mint dark:text-zinc-950 dark:hover:bg-teal-300"
                  }`}
                >
                  {timerRunning ? <Pause size={14} /> : <Play size={14} />}
                  <span>{timerRunning ? "Pause" : "Start"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTimerModeChange(timerMode)}
                  className="secondary-button min-h-10 px-3 flex items-center justify-center hover:scale-[1.02] transition"
                  title="Reset Timer"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Side Results Display */}
        <section className="grid content-start gap-4 print:block print:w-full print:p-0">
          {error && <div className="notice-error print:hidden">{error}</div>}

          {/* Results Toolbar */}
          {result && view === "result" && (
            <div className="toolbar print:hidden animate-fade-in">
              <div className="segmented overflow-x-auto custom-scrollbar" role="tablist" aria-label="Syllabus output view">
                {RESULT_TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      className={activeTab === tab.id ? "mode-button mode-button-active" : "mode-button"}
                      type="button"
                      role="tab"
                      aria-selected={activeTab === tab.id}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <Icon size={16} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <button
                  className="secondary-button min-h-10 px-3 hover:scale-105 transition"
                  type="button"
                  title="Download explanation as PDF"
                  onClick={handleDownloadPDF}
                >
                  <Download size={16} />
                  PDF
                </button>
              </div>
            </div>
          )}

          {/* Main workspace container */}
          <div className="workspace min-h-[620px] overflow-auto p-6 print:border-0 print:shadow-none print:p-0 print:m-0">
            {view === "loading" && <SkeletonLoader />}

            {view === "result" && result && (
              <div className="grid gap-6 animate-fade-in">
                {/* Summary Card */}
                <section className="grid gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-950/80 md:grid-cols-[1fr_auto]">
                  <div>
                    <span className="inline-flex rounded-full bg-teal-50 dark:bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-700 dark:text-teal-300 border border-teal-200/50 dark:border-teal-500/20 mb-2">
                      AI Learning Roadmap
                    </span>
                    <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-2xl">
                      {result.targetRole}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-650 dark:text-zinc-400">
                      {result.progressTracking || `Embark on an immersive ${result.duration} journey to master the essentials of your chosen path. This roadmap is designed for ${result.skillLevel.toLowerCase()}s, guiding you through foundations, robust development, and practical projects.`}
                    </p>
                  </div>
                </section>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="rounded-lg border border-zinc-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-900 flex items-center gap-3 hover:shadow-sm transition duration-200">
                    <div className="h-9 w-9 rounded-lg bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 flex-shrink-0">
                      <TrendingUp size={16} />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-zinc-450 dark:text-zinc-550 tracking-wider">LEVEL</div>
                      <div className="text-xs font-bold text-zinc-850 dark:text-zinc-200 mt-0.5">{result.skillLevel}</div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-zinc-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-900 flex items-center gap-3 hover:shadow-sm transition duration-200">
                    <div className="h-9 w-9 rounded-lg bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 flex-shrink-0">
                      <Clock size={16} />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-zinc-450 dark:text-zinc-550 tracking-wider">DURATION</div>
                      <div className="text-xs font-bold text-zinc-850 dark:text-zinc-200 mt-0.5">{result.duration}</div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-zinc-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-900 flex items-center gap-3 hover:shadow-sm transition duration-200">
                    <div className="h-9 w-9 rounded-lg bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 flex-shrink-0">
                      <BookOpen size={16} />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-zinc-450 dark:text-zinc-550 tracking-wider">STUDY PACE</div>
                      <div className="text-xs font-bold text-zinc-850 dark:text-zinc-200 mt-0.5">{studyPace}</div>
                    </div>
                  </div>

                  {/* dynamic progress calculator */}
                  <div className="rounded-lg border border-zinc-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-center hover:shadow-sm transition duration-200">
                    <div className="text-[10px] uppercase font-bold text-zinc-450 dark:text-zinc-550 tracking-wider">PROGRESS</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-bold text-zinc-850 dark:text-zinc-200">{progressPercent}%</span>
                      <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500 rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tab content view */}
                <div className="mt-2">
                  {/* Study Roadmap */}
                  {activeTab === "roadmap" && (
                    <div className="grid gap-5">
                      {filteredPhases.length === 0 ? (
                        <div className="text-center py-12 text-zinc-400 dark:text-zinc-555 text-sm">
                          {searchTerm ? "No roadmaps or difficulty tags match your search." : "No roadmap data found. Please regenerate."}
                        </div>
                      ) : (
                        <>
                          {/* Search Input and Roadmap Controls Panel */}
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden -mb-1">
                            <div className="relative flex items-center gap-2.5 w-full sm:max-w-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 focus-within:border-teal-500 dark:focus-within:border-teal-500/50 transition">
                              <Search size={14} className="text-zinc-400 dark:text-zinc-500" />
                              <input
                                type="text"
                                placeholder="Filter topics, level..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full text-xs bg-transparent border-0 outline-none text-zinc-850 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:ring-0 p-0"
                              />
                              {searchTerm && (
                                <button
                                  type="button"
                                  onClick={() => setSearchTerm("")}
                                  className="text-[10px] font-extrabold text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200"
                                >
                                  CLEAR
                                </button>
                              )}
                            </div>
                            
                            <div className="flex justify-end items-center gap-2 text-xs flex-shrink-0">
                              <button
                                type="button"
                                onClick={expandAllWeeks}
                                className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 hover:underline transition animate-fade-in"
                              >
                                Expand All Weeks
                              </button>
                              <span className="text-zinc-300 dark:text-zinc-700 font-light">|</span>
                              <button
                                type="button"
                                onClick={collapseAllWeeks}
                                className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 hover:underline transition animate-fade-in"
                              >
                                Collapse All Weeks
                              </button>
                            </div>
                          </div>

                          {filteredPhases.map((phase) => (
                            <div key={phase.id} className="grid gap-3 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-zinc-50/40 dark:bg-zinc-950/10">
                              <div className="flex items-center gap-3 border-b border-zinc-200/60 dark:border-zinc-800/60 pb-3">
                                <div className="h-7 w-7 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold shadow-sm animate-fade-in">
                                  {phase.number}
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{phase.title}</h4>
                                  {phase.weekRange && <p className="text-[10px] text-zinc-400 dark:text-zinc-550 font-semibold tracking-wider uppercase mt-0.5">{phase.weekRange}</p>}
                                </div>
                              </div>

                              {/* Phase main topics checklist */}
                              {phase.matchedMainTopics && phase.matchedMainTopics.length > 0 && (
                                <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-lg p-3.5 shadow-sm">
                                  <div className="grid gap-2">
                                    {phase.matchedMainTopics.map(({ t, i, key }) => (
                                      <div key={i} className="flex items-center justify-between gap-3 py-1.5 border-b border-zinc-100 dark:border-zinc-855/30 last:border-b-0 group">
                                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                          <button
                                            type="button"
                                            onClick={() => toggleTopic(key, phase.id, undefined)}
                                            className="mt-0.5 flex-shrink-0 text-zinc-300 dark:text-zinc-655 hover:text-teal-500 transition duration-150 focus:outline-none"
                                          >
                                            {completedTopics[key] ? (
                                              <CheckCircle2 size={15} className="text-teal-600 dark:text-teal-400" />
                                            ) : (
                                              <Circle size={15} className="text-zinc-300 dark:text-zinc-655" />
                                            )}
                                          </button>
                                          <span
                                            onClick={() => toggleTopic(key, phase.id, undefined)}
                                            className={`text-xs leading-relaxed cursor-pointer transition duration-150 flex-1 ${
                                              completedTopics[key]
                                                ? "line-through text-zinc-400 dark:text-zinc-550"
                                                : "text-zinc-650 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
                                            }`}
                                          >
                                            {t}
                                          </span>
                                        </div>
                                        
                                        {/* Action Controls & Badges */}
                                        <div className="flex items-center gap-2 flex-shrink-0 opacity-40 lg:opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-155 ml-2">
                                          {/* Difficulty Badge */}
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const current = difficultyTags[key] || "Easy";
                                              const nextMap = { Easy: "Medium", Medium: "Hard", Hard: "Easy" };
                                              const nextVal = nextMap[current];
                                              setDifficultyTags(prev => ({ ...prev, [key]: nextVal }));
                                            }}
                                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider transition hover:scale-105 select-none ${
                                              (difficultyTags[key] || "Easy") === "Easy"
                                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300"
                                                : (difficultyTags[key] || "Easy") === "Medium"
                                                ? "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300"
                                                : "bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-350"
                                            }`}
                                          >
                                            {(difficultyTags[key] || "Easy")}
                                          </button>

                                          {/* YouTube Helper */}
                                          <a
                                            href={`https://www.youtube.com/results?search_query=Learn+${encodeURIComponent(t)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1 rounded text-zinc-450 hover:text-red-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                                            title={`Search YouTube for "${t}"`}
                                          >
                                            <Youtube size={13} />
                                          </a>

                                          {/* Docs Helper */}
                                          <a
                                            href={`https://www.google.com/search?q=${encodeURIComponent(t)}+documentation`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1 rounded text-zinc-450 hover:text-teal-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                                            title={`Search Documentation for "${t}"`}
                                          >
                                            <Chrome size={13} />
                                          </a>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Week Breakdown */}
                              <div className="grid gap-2 pl-1 sm:pl-3">
                                {phase.matchedWeeks.map((week) => (
                                  <div key={week.id} className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-lg overflow-hidden shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 transition">
                                    <button
                                      type="button"
                                      className="w-full flex items-center justify-between p-3.5 text-left transition hover:bg-zinc-50/50 dark:hover:bg-zinc-850/10"
                                      onClick={() => toggleWeek(week.id)}
                                    >
                                      <div>
                                        <span className="text-[9px] font-extrabold text-teal-600 dark:text-teal-400 tracking-wider block uppercase mb-0.5">{week.label}</span>
                                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{week.title}</span>
                                      </div>
                                      <span className="flex items-center gap-1 text-[11px] font-semibold text-teal-600 dark:text-teal-400 transition hover:text-teal-700">
                                        {expandedWeeks[week.id] ? (
                                          <>Hide <ChevronUp size={13} /></>
                                        ) : (
                                          <>Show <ChevronDown size={13} /></>
                                        )}
                                      </span>
                                    </button>

                                    {expandedWeeks[week.id] && (
                                      <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-950/5 animate-fade-in">
                                        {week.matchedTopics.length > 0 && (
                                          <div className="grid gap-2">
                                            {week.matchedTopics.map(({ t, i, key }) => (
                                              <div key={i} className="flex items-center justify-between gap-3 py-1.5 border-b border-zinc-100 dark:border-zinc-850/30 last:border-b-0 group">
                                                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                                  <button
                                                    type="button"
                                                    onClick={() => toggleTopic(key, phase.id, week.id)}
                                                    className="mt-0.5 flex-shrink-0 text-zinc-300 dark:text-zinc-655 hover:text-teal-500 transition duration-150 focus:outline-none"
                                                  >
                                                    {completedTopics[key] ? (
                                                      <CheckCircle2 size={15} className="text-teal-600 dark:text-teal-400" />
                                                    ) : (
                                                      <Circle size={15} className="text-zinc-300 dark:text-zinc-655" />
                                                    )}
                                                  </button>
                                                  <span
                                                    onClick={() => toggleTopic(key, phase.id, week.id)}
                                                    className={`text-xs leading-relaxed cursor-pointer transition duration-150 flex-1 ${
                                                      completedTopics[key]
                                                        ? "line-through text-zinc-400 dark:text-zinc-550"
                                                        : "text-zinc-655 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
                                                    }`}
                                                  >
                                                    {t}
                                                  </span>
                                                </div>
                                                
                                                {/* Action Controls & Badges */}
                                                <div className="flex items-center gap-2 flex-shrink-0 opacity-40 lg:opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-155 ml-2">
                                                  {/* Difficulty Badge */}
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      const current = difficultyTags[key] || "Easy";
                                                      const nextMap = { Easy: "Medium", Medium: "Hard", Hard: "Easy" };
                                                      const nextVal = nextMap[current];
                                                      setDifficultyTags(prev => ({ ...prev, [key]: nextVal }));
                                                    }}
                                                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider transition hover:scale-105 select-none ${
                                                      (difficultyTags[key] || "Easy") === "Easy"
                                                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300"
                                                        : (difficultyTags[key] || "Easy") === "Medium"
                                                        ? "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300"
                                                        : "bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-350"
                                                    }`}
                                                  >
                                                    {(difficultyTags[key] || "Easy")}
                                                  </button>

                                                  {/* YouTube Helper */}
                                                  <a
                                                    href={`https://www.youtube.com/results?search_query=Learn+${encodeURIComponent(t)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1 rounded text-zinc-450 hover:text-red-650 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                                                    title={`Search YouTube for "${t}"`}
                                                  >
                                                    <Youtube size={13} />
                                                  </a>

                                                  {/* Docs Helper */}
                                                  <a
                                                    href={`https://www.google.com/search?q=${encodeURIComponent(t)}+documentation`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1 rounded text-zinc-450 hover:text-teal-650 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                                                    title={`Search Documentation for "${t}"`}
                                                  >
                                                    <Chrome size={13} />
                                                  </a>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}

                                        {/* Collapsible Scratchpad / Notes Section */}
                                        <div className="mt-4 pt-3.5 border-t border-zinc-150 dark:border-zinc-800/80">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-bold text-zinc-450 dark:text-zinc-555 uppercase tracking-wider flex items-center gap-1.5 select-none">
                                              <FileText size={12} className="text-teal-600 dark:text-teal-400" />
                                              Week Notes & Scratchpad
                                            </span>
                                          </div>
                                          <textarea
                                            value={notes[week.id] || ""}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              setNotes(prev => ({ ...prev, [week.id]: val }));
                                            }}
                                            placeholder="Capture key concepts, references, or your study schedule for this week..."
                                            className="w-full min-h-24 p-2.5 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 rounded-lg outline-none focus:border-teal-500 dark:focus:border-teal-500/50 transition duration-150 placeholder-zinc-450 dark:placeholder-zinc-550 resize-y font-sans leading-relaxed"
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}

                  {/* Practice Projects */}
                  {activeTab === "projects" && (
                    <div className="grid gap-3">
                      {projectItems.length === 0 ? (
                        <div className="text-center py-12 text-zinc-400 dark:text-zinc-555 text-sm">No project data available.</div>
                      ) : (
                        projectItems.map((item, i) => (
                          <div key={i} className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm transition duration-200 hover:border-teal-500/30 hover:shadow-sm">
                            <div className="h-6 w-6 rounded-full bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 font-extrabold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                              {i + 1}
                            </div>
                            <p className="text-xs leading-relaxed text-zinc-655 dark:text-zinc-300">{item}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Certifications Path */}
                  {activeTab === "certifications" && (
                    <div className="grid gap-3">
                      {certItems.length === 0 ? (
                        <div className="text-center py-12 text-zinc-400 dark:text-zinc-555 text-sm">No certification data available.</div>
                      ) : (
                        certItems.map((item, i) => (
                          <div key={i} className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm transition duration-200 hover:border-teal-500/30 hover:shadow-sm">
                            <Award size={16} className="text-teal-600 dark:text-teal-400 mt-1 flex-shrink-0" />
                            <p className="text-xs leading-relaxed text-zinc-655 dark:text-zinc-300">{item}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Learning Resources */}
                  {activeTab === "resources" && (
                    <div className="grid gap-3">
                      {resourceItems.length === 0 ? (
                        <div className="text-center py-12 text-zinc-400 dark:text-zinc-555 text-sm">No resource data available.</div>
                      ) : (
                        resourceItems.map((item, i) => (
                          <div key={i} className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm transition duration-200 hover:border-teal-500/30 hover:shadow-sm">
                            <BookOpen size={16} className="text-teal-600 dark:text-teal-400 mt-1 flex-shrink-0" />
                            <p className="text-xs leading-relaxed text-zinc-655 dark:text-zinc-300">{item}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Empty State */}
            {view === "form" && !result && (
              <div className="flex min-h-[560px] flex-col items-center justify-center p-8 text-center bg-white dark:bg-zinc-900 rounded-lg">
                <div className="max-w-md flex flex-col items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 shadow-sm shadow-teal-500/10">
                    <BookOpen size={30} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">No Syllabus Built Yet</h3>
                    <p className="mt-2 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      Fill out the Syllabus Blueprint panel on the left, then click <strong>Generate Learning Path</strong>. Gemini will assemble a custom step-by-step roadmap, project targets, recommended credentials, and curated web links.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

import { useEffect, useState, useRef } from "react";
import {
  BookOpen,
  Bug,
  Clock,
  FileText,
  GitFork,
  Mic,
  Search,
  Sparkles,
  ArrowRight,
  RotateCcw,
  MousePointer,
  Keyboard,
  Activity,
  Cpu,
  Shield,
  Layers,
  Mail,
  Send,
  CheckCircle,
  Users,
  Target,
  Award,
  Globe,
  Compass,
  Github,
  Twitter,
  Linkedin,
  Sun,
  Moon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";
import ToolCard from "../components/ToolCard";
import HomeChatbotWidget from "../components/HomeChatbotWidget";

const tools = [
  {
    title: "AI Whiteboard + Diagram Generator",
    description: "Generate Mermaid diagrams from prompts, preview them live, export files, and sketch on a whiteboard.",
    route: "/diagram",
    icon: GitFork,
    category: "Creation"
  },
  {
    title: "AI Auto Documentation Generator",
    description: "Create project docs, API notes, setup guides, and clean technical summaries from your codebase.",
    route: "/docs",
    icon: FileText,
    category: "Creation"
  },
  {
    title: "AI Explanation Generator",
    description: "Generate structured explanations, voice scripts, slide points, scenes, and visual suggestions.",
    route: "/summarizer",
    icon: Mic,
    category: "Creation"
  },
  {
    title: "AI Learning Path Generator",
    description: "Build personalized learning roadmaps with milestones, resources, and practice projects.",
    route: "/learning",
    icon: BookOpen,
    category: "Learning"
  },
  {
    title: "AI Mistake Analyzer",
    description: "Review answers, code, or notes to identify mistakes and suggest focused improvements.",
    route: "/mistake-analyzer",
    icon: Bug,
    category: "Analytics"
  }
];

const typewriterWords = [
  "Build diagrams live.",
  "Learn roadmaps fast.",
  "Summarize workspace docs.",
  "Analyze mistakes.",
  "Automate productivity."
];

// High-tech synthesized chirps
const playTechSound = (frequency = 600, type = "sine", duration = 0.08, volume = 0.015) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // Avoid policy blocks silently
  }
};

// Container staggered loading variants
const gridContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05
    }
  }
};

export default function Home() {
  const { user, logout, addToast, theme, toggleTheme } = useAuth();

  const [activeTab, setActiveTab] = useState("Home");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [recentTools, setRecentTools] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Spotlight
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Search Focus
  const [searchFocused, setSearchFocused] = useState(false);
  const searchInputRef = useRef(null);

  // Typewriter
  const [wordIndex, setWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Contact Form State
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Spotlight mouse track
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        playTechSound(950, "triangle", 0.08, 0.02);
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Typewriter loop
  useEffect(() => {
    const currentWord = typewriterWords[wordIndex];
    let timer;

    if (isDeleting) {
      timer = setTimeout(() => {
        setCurrentText(currentWord.substring(0, currentText.length - 1));
      }, 30);
    } else {
      timer = setTimeout(() => {
        setCurrentText(currentWord.substring(0, currentText.length + 1));
      }, 60);
    }

    if (!isDeleting && currentText === currentWord) {
      timer = setTimeout(() => setIsDeleting(true), 1600);
    } else if (isDeleting && currentText === "") {
      setIsDeleting(false);
      setWordIndex((prev) => (prev + 1) % typewriterWords.length);
    }

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, wordIndex]);

  // Load localStorage history
  const loadRecentTools = () => {
    try {
      const recent = JSON.parse(localStorage.getItem("recent_tools") || "[]");
      const filtered = recent
        .map((name) => tools.find((t) => t.title === name))
        .filter(Boolean);
      setRecentTools(filtered);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadRecentTools();
    const handleRecentUpdate = () => loadRecentTools();
    window.addEventListener("recent_tools_updated", handleRecentUpdate);
    return () => window.removeEventListener("recent_tools_updated", handleRecentUpdate);
  }, []);

  const categories = ["All", "Creation", "Learning", "Analytics"];

  // Filter tools
  const filteredTools = tools.filter((tool) => {
    const matchesSearch =
      tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || tool.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const clearFilters = () => {
    playTechSound(320, "sine", 0.08, 0.015);
    setSearchQuery("");
    setSelectedCategory("All");
  };

  const handleTabClick = (cat) => {
    playTechSound(620, "triangle", 0.05, 0.015);
    setSelectedCategory(cat);
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactSubject || !contactMessage) {
      addToast("Please fill in all fields.", "error");
      playTechSound(320, "sawtooth", 0.2, 0.03);
      return;
    }

    setIsSubmitting(true);
    playTechSound(880, "sine", 0.15, 0.02);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      addToast("Message transmitted successfully!", "success");
      playTechSound(1050, "sine", 0.25, 0.02);

      setContactName("");
      setContactEmail("");
      setContactSubject("");
      setContactMessage("");

      // Auto clear success state after 5 seconds
      setTimeout(() => setIsSubmitted(false), 5000);
    }, 1500);
  };

  return (
    <motion.main
      ref={containerRef}
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative min-h-screen overflow-x-hidden bg-gradient-to-b from-[#f0f4ff] via-[#e6efff] to-[#f0f4ff] dark:from-[#030712] dark:via-[#091124] dark:to-[#030712] px-4 py-6 text-indigo-950 dark:text-white transition-colors duration-500 sm:px-6 md:py-8"
    >
      {/* Soft radial spotlight follows pointer */}
      <div
        className="absolute -z-10 h-96 w-96 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none transition-all duration-300 ease-out"
        style={{
          left: `${mousePos.x - 192}px`,
          top: `${mousePos.y - 192}px`
        }}
      />

      {/* Cosmic background glows */}
      <div className="absolute left-1/2 top-1/4 -translate-x-1/2 -translate-y-1/2 -z-10 w-[80%] h-64 bg-gradient-to-r from-indigo-500/10 via-cyan-500/5 to-indigo-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: "12s" }} />

      {/* Cyber grid pattern background */}
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,#33415510_1px,transparent_1px),linear-gradient(to_bottom,#33415510_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Modern Responsive Navbar */}
      <nav className="mx-auto max-w-6xl w-full flex items-center justify-between border border-indigo-100 dark:border-slate-800/80 bg-white/60 dark:bg-slate-950/60 px-6 py-4 rounded-3xl backdrop-blur-xl shadow-lg z-50 mb-10">
        {/* Logo and Brand */}
        <Link
          to="/"
          onClick={() => {
            playTechSound(600, "sine", 0.08, 0.01);
            setActiveTab("Home");
          }}
          className="flex items-center gap-2.5 group"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 text-slate-950 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
            <Sparkles size={18} className="text-white animate-pulse" />
          </div>
          <span className="text-lg font-black tracking-tight bg-gradient-to-r from-indigo-950 via-indigo-900 to-indigo-950 dark:from-white dark:via-slate-200 dark:to-white bg-clip-text text-transparent group-hover:opacity-90 transition-all duration-300">
            CogniFlow <span className="text-indigo-600 dark:text-indigo-400">AI</span>
          </span>
        </Link>

        {/* Center Tabs Navigation */}
        <div className="hidden md:flex items-center gap-1.5 rounded-2xl bg-indigo-50/80 dark:bg-slate-900/60 p-1 border border-indigo-100 dark:border-slate-800/50">
          {[
            { id: "Home", label: "Home" },
            { id: "About", label: "About Us" },
            { id: "Contact", label: "Contact Us" }
          ].map((tab) => {
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  playTechSound(650, "triangle", 0.05, 0.015);
                  setActiveTab(tab.id);
                }}
                className={`relative px-4 py-2 text-xs font-black uppercase tracking-wider transition-all duration-300 rounded-xl cursor-pointer ${isTabActive
                    ? "text-white bg-indigo-600 shadow-md shadow-indigo-500/20"
                    : "text-indigo-900/65 dark:text-slate-400 hover:text-indigo-950 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-800/40"
                  }`}
                type="button"
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Right Auth / Dropdown Area */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 rounded-xl border border-indigo-100 dark:border-slate-800 bg-white/40 dark:bg-slate-950/40 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide backdrop-blur-md text-indigo-900/70 dark:text-slate-400">
            <Keyboard size={12} className="text-indigo-600 dark:text-indigo-400" />
            <span>Press</span>
            <kbd className="rounded bg-indigo-100 dark:bg-slate-800 px-1 py-0.5 font-sans font-black select-none text-indigo-950 dark:text-white">⌘K</kbd>
            <span>to search</span>
          </div>

          {/* Elegant Sun/Moon Theme Toggle Switch */}
          <button
            onClick={() => {
              playTechSound(theme === "dark" ? 800 : 900, "sine", 0.05, 0.015);
              toggleTheme();
            }}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-100 dark:border-slate-800 bg-white/40 dark:bg-slate-950/40 text-indigo-900 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white transition-all cursor-pointer shadow-sm"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            type="button"
          >
            {theme === "dark" ? (
              <Sun size={16} className="animate-spin-slow text-amber-400" />
            ) : (
              <Moon size={16} className="text-indigo-600" />
            )}
          </button>

          {user ? (
            <div className="relative">
              <button
                onClick={() => {
                  playTechSound(650, "sine", 0.08, 0.015);
                  setDropdownOpen(!dropdownOpen);
                }}
                className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 text-slate-950 font-black text-xs cursor-pointer shadow-md select-none border border-indigo-400/20"
                title="Open profile menu"
              >
                {user.profileImage ? (
                  <img src={user.profileImage} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                )}
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2.5 w-56 rounded-2xl border border-indigo-100 dark:border-slate-800 bg-white dark:bg-slate-950/95 p-4 shadow-2xl backdrop-blur-md z-50 text-left space-y-2.5 text-indigo-950 dark:text-white"
                  >
                    <div className="px-1 text-[9px] font-black uppercase tracking-wider text-indigo-900/50 dark:text-slate-500">Node Profile</div>
                    <div className="px-1">
                      <div className="text-xs font-black truncate text-indigo-950 dark:text-white">{user.name}</div>
                      <div className="text-[10px] text-indigo-900/60 dark:text-slate-400 truncate mt-0.5">{user.email}</div>
                    </div>
                    <div className="border-t border-indigo-100 dark:border-slate-800/80 my-1"></div>
                    <button
                      onClick={() => {
                        playTechSound(350, "triangle", 0.1, 0.02);
                        logout();
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left px-2 py-2 text-xs font-bold text-rose-500 dark:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
                    >
                      Terminate Session (Logout)
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                onClick={() => playTechSound(700, "triangle", 0.08, 0.02)}
                className="inline-flex h-9 items-center justify-center rounded-xl px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-indigo-900/70 hover:text-indigo-950 dark:text-slate-300 dark:hover:text-white transition cursor-pointer"
              >
                Login
              </Link>
              <Link
                to="/signup"
                onClick={() => playTechSound(750, "triangle", 0.08, 0.02)}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-600 dark:bg-indigo-500/10 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-white hover:bg-indigo-700 dark:hover:bg-indigo-500/20 transition cursor-pointer shadow-sm shadow-indigo-500/10"
              >
                Signup
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Navigation Tabs (visible only on small screens) */}
      <div className="flex md:hidden items-center justify-center gap-1 mx-auto max-w-sm rounded-2xl bg-white/60 dark:bg-slate-950/60 p-1 border border-indigo-100 dark:border-slate-800/50 mb-8 backdrop-blur-md">
        {[
          { id: "Home", label: "Home" },
          { id: "About", label: "About" },
          { id: "Contact", label: "Contact" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              playTechSound(650, "triangle", 0.05, 0.015);
              setActiveTab(tab.id);
            }}
            className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider transition-all duration-300 rounded-xl cursor-pointer ${activeTab === tab.id
                ? "text-white bg-indigo-600 shadow-md"
                : "text-indigo-900/60 dark:text-slate-400 hover:text-indigo-950 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-800/40"
              }`}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dynamic Content Switching */}
      <AnimatePresence mode="wait">
        {activeTab === "Home" && (
          <motion.section
            key="home-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.45 }}
            className="mx-auto max-w-6xl space-y-12"
          >
            {/* Hero Area */}
            <div className="mx-auto max-w-3xl text-center space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/5 px-4.5 py-1.5 text-[11px] font-extrabold uppercase tracking-widest text-indigo-300 shadow-[0_0_15px_-3px_rgba(99,102,241,0.2)]">
                <Sparkles size={11} className="animate-spin-slow text-indigo-400" />
                <span>AI Workspace Interface v3.0</span>
              </div>

              <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl leading-none">
                Your AI Productivity <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">Workspace</span>
              </h1>

              {/* Tagline Typer */}
              <div className="h-8 flex items-center justify-center">
                <span className="text-lg sm:text-xl font-bold tracking-tight text-indigo-700 dark:text-indigo-300 font-mono">
                  {currentText}
                  <span className="animate-ping ml-0.5">|</span>
                </span>
              </div>

              <p className="mx-auto max-w-xl text-sm leading-relaxed text-indigo-900/80 dark:text-slate-300 sm:text-[15px] sm:leading-7">
                Deploy dynamic diagrams, compile clear documentations, map custom roadmaps, and solve code issues in an optimized Operating Workspace.
              </p>

              {/* Action Row */}
              <div className="flex flex-wrap items-center justify-center gap-3.5 pt-3">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    playTechSound(720, "triangle", 0.1, 0.02);
                    document.getElementById("primary-modules")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 hover:shadow-indigo-500/30 cursor-pointer transition-all duration-350"
                  type="button"
                >
                  Initialize Workspace
                  <ArrowRight size={16} />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    playTechSound(560, "sine", 0.08, 0.02);
                    window.location.href = "/diagram";
                  }}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-indigo-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 px-6 py-2.5 text-sm font-bold text-indigo-900 dark:text-slate-200 transition hover:bg-indigo-50 dark:hover:bg-slate-900 cursor-pointer"
                  type="button"
                >
                  Open Whiteboard
                </motion.button>
              </div>
            </div>



            {/* Operating Control Hub */}
            <div id="primary-modules" className="space-y-6 pt-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-indigo-100 dark:border-slate-800/80 pb-6">
                {/* Category tabs */}
                <div className="flex flex-wrap gap-2 order-2 md:order-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => handleTabClick(cat)}
                      className={`rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${selectedCategory === cat
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20 scale-[1.03]"
                          : "bg-white/80 dark:bg-slate-950/40 border border-indigo-100 dark:border-slate-800 text-indigo-900/75 dark:text-slate-400 hover:border-indigo-500/50 hover:text-indigo-950 dark:hover:text-white"
                        }`}
                      type="button"
                    >
                      {cat === "All" ? "All Features" : `${cat} Module`}
                    </button>
                  ))}
                </div>

                {/* Glowing glass search input */}
                <motion.div
                  animate={{
                    boxShadow: searchFocused
                      ? "0 0 20px -3px rgba(99, 102, 241, 0.25)"
                      : "0 0 0px 0px rgba(0,0,0,0)"
                  }}
                  className="relative w-full md:max-w-xs order-1 md:order-2 rounded-2xl"
                >
                  <Search size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${searchFocused ? "text-indigo-500 dark:text-indigo-400" : "text-indigo-900/40 dark:text-slate-500"
                    }`} />
                  <motion.input
                    ref={searchInputRef}
                    type="text"
                    placeholder="⌘K to focus search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => {
                      setSearchFocused(true);
                      playTechSound(680, "sine", 0.05, 0.01);
                    }}
                    onBlur={() => setSearchFocused(false)}
                    animate={{ width: searchFocused ? 280 : 220 }}
                    transition={{ type: "spring", stiffness: 150, damping: 18 }}
                    className="w-full rounded-2xl border border-indigo-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/60 py-2.5 pl-10 pr-4 text-xs sm:text-sm outline-none backdrop-blur-md font-bold tracking-tight text-indigo-950 dark:text-white focus:border-indigo-500/50 focus:bg-white"
                  />
                </motion.div>
              </div>

              {/* Suggestion Chips / Onboarding Banner */}
              <div className="flex items-center gap-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10 p-4 text-xs font-bold text-indigo-900 dark:text-indigo-300 shadow-sm">
                <span className="flex h-2.5 w-2.5 rounded-full bg-indigo-600 dark:bg-indigo-500 animate-ping" />
                <span className="flex items-center gap-1.5">
                  <MousePointer size={13} className="text-indigo-650 dark:text-indigo-400" />
                  <span>Onboarding Tip: Initialize the <b>AI Whiteboard</b> to sketch architectures from code instantly.</span>
                </span>
              </div>

              {/* localStorage History nodes */}
              {recentTools.length > 0 && (
                <div className="space-y-3 animate-in fade-in duration-500">
                  <h3 className="text-xs font-black uppercase tracking-widest text-indigo-900/60 dark:text-slate-500 flex items-center gap-1.5">
                    <Clock size={12} className="text-indigo-500 dark:text-indigo-400" />
                    <span>Recent Workspace History</span>
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {recentTools.map((tool) => {
                      const Icon = tool.icon;
                      return (
                        <button
                          key={tool.title}
                          onClick={() => {
                            playTechSound(980, "sine", 0.08, 0.02);
                            setTimeout(() => {
                              window.location.href = tool.route;
                            }, 120);
                          }}
                          className="group flex items-center justify-between rounded-2xl border border-indigo-100 dark:border-slate-800 bg-white/80 dark:bg-slate-950/40 px-4 py-3 text-left transition hover:-translate-y-0.5 hover:border-indigo-500/40 shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-650 dark:text-indigo-400">
                              <Icon size={16} />
                            </span>
                            <span className="text-xs font-black tracking-tight text-indigo-950 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-white">
                              {tool.title}
                            </span>
                          </div>
                          <ArrowRight size={12} className="text-indigo-900/40 dark:text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-indigo-400" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modular staggered cards grid */}
            <div className="space-y-6">
              <h2 className="text-xl font-black uppercase tracking-wider text-indigo-950 dark:text-slate-300">Workspace Modules</h2>
              <AnimatePresence mode="popLayout">
                {filteredTools.length > 0 ? (
                  <motion.div
                    layout
                    variants={gridContainerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                  >
                    {filteredTools.map((tool) => (
                      <ToolCard
                        key={tool.title}
                        title={tool.title}
                        description={tool.description}
                        route={tool.route}
                        icon={tool.icon}
                      />
                    ))}
                  </motion.div>
                ) : (
                  /* Blank empty filters state */
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="flex flex-col items-center justify-center text-center py-16 border border-dashed border-indigo-200 dark:border-slate-800 rounded-3xl bg-white/50 dark:bg-slate-950/20 backdrop-blur-sm"
                  >
                    <RotateCcw size={48} className="text-indigo-400/60 dark:text-slate-650 animate-spin-slow mb-4" />
                    <h3 className="text-lg font-bold text-indigo-950 dark:text-slate-200">No matching capabilities found</h3>
                    <p className="text-xs text-indigo-900/60 dark:text-slate-400 mt-1.5 max-w-sm">
                      Your filters did not match any of the AI tools. Try adjusting your query or resetting filters.
                    </p>
                    <button
                      onClick={clearFilters}
                      className="mt-6 rounded-xl bg-indigo-600/10 border border-indigo-500/20 px-4.5 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-600 hover:text-white transition duration-300 cursor-pointer"
                      type="button"
                    >
                      Reset Filters
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* AI Capabilities / Services Section */}
            <div className="border-t border-indigo-100 dark:border-slate-800/80 pt-12 space-y-8">
              <div className="text-center space-y-3">
                <h2 className="text-2xl font-black uppercase tracking-wider text-indigo-950 dark:text-slate-200">Advanced AI Capabilities</h2>
                <p className="text-xs text-indigo-900/60 dark:text-slate-400 max-w-md mx-auto">Discover the state-of-the-art tools driving next-generation workflow efficiency.</p>
              </div>

              {/* <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    title: "Live Mermaid Rendering",
                    desc: "Type or speak natural language prompts and see complex flowcharts, sequences, and state diagrams rendered in real-time.",
                    icon: GitFork
                  },
                  {
                    title: "Automated Tech Docs",
                    desc: "Analyze workspace folder structures or code snippets and compile comprehensive API guides and setup files in seconds.",
                    icon: FileText
                  },
                  {
                    title: "Excalidraw Canvas",
                    desc: "Freely sketch visual layouts, overlay shapes, draw connection lines, and export beautifully compiled PDF vector notes.",
                    icon: Layers
                  },
                  {
                    title: "Dynamic Milestones",
                    desc: "Generate structured learning pathways equipped with verified resources, practice challenges, and progressive checklists.",
                    icon: BookOpen
                  }
                ].map((serv, index) => {
                  const SIcon = serv.icon;
                  return (
                    <div key={index} className="p-6 rounded-3xl border border-indigo-100 dark:border-slate-800/60 bg-white/80 dark:bg-slate-950/30 space-y-3 shadow-md hover:border-indigo-400/30 dark:hover:border-slate-700/80 transition-all duration-300">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-650 dark:text-indigo-400">
                        <SIcon size={20} />
                      </div>
                      <h3 className="text-sm font-black text-indigo-950 dark:text-slate-200">{serv.title}</h3>
                      <p className="text-xs text-indigo-900/75 dark:text-slate-450 leading-relaxed">{serv.desc}</p>
                    </div>
                  );
                })}
              </div> */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    title: "Live Mermaid Rendering",
                    desc: "Type or speak natural language prompts and see complex flowcharts, sequences, and state diagrams rendered in real-time.",
                    icon: GitFork
                  },
                  {
                    title: "Automated Tech Docs",
                    desc: "Analyze workspace folder structures or code snippets and compile comprehensive API guides and setup files in seconds.",
                    icon: FileText
                  },
                  {
                    title: "Excalidraw Canvas",
                    desc: "Freely sketch visual layouts, overlay shapes, draw connection lines, and export beautifully compiled PDF vector notes.",
                    icon: Layers
                  },
                  {
                    title: "Dynamic Milestones",
                    desc: "Generate structured learning pathways equipped with verified resources, practice challenges, and progressive checklists.",
                    icon: BookOpen
                  }
                ].map((serv, index) => {
                  const SIcon = serv.icon;

                  return (
                    <div
                      key={index}
                      className="p-6 rounded-3xl border border-slate-700 bg-slate-900/80 backdrop-blur-sm space-y-3 shadow-md hover:border-indigo-500/50 transition-all duration-300"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
                        <SIcon size={20} />
                      </div>

                      <h3 className="text-sm font-black text-white">
                        {serv.title}
                      </h3>

                      <p className="text-xs text-slate-200 leading-relaxed">
                        {serv.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Why Choose Us - Clean Card Layout */}
            <div className="border-t border-indigo-100 dark:border-slate-800/80 pt-12 space-y-8">
              <div className="text-center space-y-3">
                <h2 className="text-2xl font-black tracking-tight text-indigo-950 dark:text-white">Why Choose CogniFlow AI?</h2>
                <p className="text-sm text-indigo-900/80 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
                  We bridge the gap between abstract visual thinking and structured technological execution. By empowering your workspace with a persistent AI companion, you bypass mundane documentation and blueprint planning phases to build what matters.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { icon: CheckCircle, text: "Zero setup local workspace server integration", desc: "Plug in and go — no complex configuration required." },
                  { icon: CheckCircle, text: "Dual credentials & Google OAuth 2.0 gates", desc: "Sign in with email/password or instantly via Google." },
                  { icon: CheckCircle, text: "Ultra-low latency real-time Gemini processing", desc: "Powered by Google Gemini for blazing-fast AI responses." },
                  { icon: CheckCircle, text: "Integrated workspace mistake tracing systems", desc: "Catch and resolve code issues before they compound." }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-5 rounded-3xl border border-indigo-100 dark:border-slate-800 bg-white/80 dark:bg-slate-950/40 shadow-sm hover:-translate-y-0.5 transition duration-300">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                      <CheckCircle size={18} className="text-emerald-500" />
                    </span>
                    <div>
                      <p className="text-xs font-black text-indigo-950 dark:text-slate-200">{item.text}</p>
                      <p className="text-[11px] text-indigo-900/60 dark:text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Statistics Grid - 4 Columns */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { value: "99.8%", label: "System Uptime Monitor", desc: "Redundant cluster hosting" },
                  { value: "28ms", label: "Query Execution Speed", desc: "Ultra-low local response latency" },
                  { value: "10k+", label: "Engineered Pathways", desc: "Milestones compiled dynamically" },
                  { value: "100%", label: "Secure Gateway Protocols", desc: "Encrypted node authentication" }
                ].map((stat, idx) => (
                  <div key={idx} className="p-5 rounded-3xl border border-indigo-100 dark:border-slate-800 bg-white/80 dark:bg-slate-950/40 text-center shadow-md hover:-translate-y-1 transition duration-300">
                    <div className="text-2xl font-black text-indigo-650 dark:text-indigo-400 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 dark:from-indigo-400 dark:to-cyan-400 bg-clip-text text-transparent">{stat.value}</div>
                    <div className="text-[11px] font-black uppercase text-indigo-950 dark:text-slate-200 tracking-wider mt-1">{stat.label}</div>
                    <div className="text-[10px] text-indigo-900/60 dark:text-slate-450 mt-0.5">{stat.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        )}

        {/* Dynamic About Us View */}
        {activeTab === "About" && (
          <motion.section
            key="about-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.45 }}
            className="mx-auto max-w-3xl space-y-10 py-6"
          >
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
                <Users size={12} />
                <span>About Our Platform</span>
              </div>
              <h1 className="text-3xl font-black text-indigo-950 dark:text-white">Our Mission & Tech Architecture</h1>
              <p className="text-sm text-indigo-900/70 dark:text-slate-400 leading-relaxed">
                CogniFlow AI was engineered to bridge abstract developer imagination and highly structured workspace execution. By integrating intuitive whiteboard drafting with advanced LLM engines, we streamline workflow documentation, error debugging, and active roadmap learning.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="p-6 rounded-3xl border border-indigo-100 dark:border-slate-800 bg-white/80 dark:bg-slate-950/40 space-y-3 shadow-md">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-650 dark:text-indigo-400">
                  <Target size={20} />
                </div>
                <h3 className="text-base font-black text-indigo-950 dark:text-white">Our Core Mission</h3>
                <p className="text-xs text-indigo-900/75 dark:text-slate-400 leading-relaxed">
                  To provide designers, engineers, and educators with an immediate, high-fidelity workbench that compiles logic flows, designs pathways, and structures knowledge instantly.
                </p>
              </div>

              <div className="p-6 rounded-3xl border border-indigo-100 dark:border-slate-800 bg-white/80 dark:bg-slate-950/40 space-y-3 shadow-md">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-650 dark:text-cyan-400">
                  <Compass size={20} />
                </div>
                <h3 className="text-base font-black text-indigo-950 dark:text-white">Our Visual Vision</h3>
                <p className="text-xs text-indigo-900/75 dark:text-slate-400 leading-relaxed">
                  We envision a unified graphical terminal environment where standard diagrams, documentations, and study paths exist as active, modifiable modules.
                </p>
              </div>
            </div>

            {/* Technical Stack Architecture Grid */}
            <div className="p-6 rounded-3xl border border-indigo-100 dark:border-slate-800 bg-white/80 dark:bg-slate-950/30 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-indigo-900/60 dark:text-slate-400 flex items-center gap-2">
                <Cpu size={14} className="text-indigo-500 dark:text-indigo-400" />
                <span>Technologies Powering CogniFlow AI</span>
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { title: "React 18 & Framer Motion", desc: "Stunning, fluid animations, micro-interactions, responsive states." },
                  { title: "Node.js & Express API Gateway", desc: "Reliable, high-throughput REST controllers and workspace middleware." },
                  { title: "MongoDB Atlas Cloud Engine", desc: "Flexible, resilient schema architectures storing persistent profile notes." },
                  { title: "Google OAuth 2.0 Protocol", desc: "Zero-friction single sign-on authenticating profiles safely." }
                ].map((tech, idx) => (
                  <div key={idx} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-655 dark:text-indigo-400 text-xs font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="text-xs font-black text-indigo-950 dark:text-slate-200">{tech.title}</div>
                      <div className="text-[11px] text-indigo-900/70 dark:text-slate-400 mt-0.5 leading-relaxed">{tech.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Team Introduction Card */}
            <div className="p-6 rounded-3xl border border-indigo-100 dark:border-slate-800 bg-white/80 dark:bg-slate-950/40 flex flex-col sm:flex-row items-center gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 text-slate-950">
                <Award size={28} className="text-white" />
              </div>
              <div className="space-y-1 text-center sm:text-left">
                <h4 className="text-sm font-black text-indigo-950 dark:text-white">Technical Architecture Team</h4>
                <p className="text-xs text-indigo-900/75 dark:text-slate-400 leading-relaxed">
                  A team of MERN-stack engineers and visual layout specialists dedicated to structuring developer environments for peak cognitive performance.
                </p>
              </div>
            </div>
          </motion.section>
        )}

        {/* Dynamic Contact Us View */}
        {activeTab === "Contact" && (
          <motion.section
            key="contact-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.45 }}
            className="mx-auto max-w-3xl space-y-10 py-6"
          >
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
                <Mail size={12} />
                <span>Get In Touch</span>
              </div>
              <h1 className="text-3xl font-black text-indigo-950 dark:text-white">Transmit Feedback to Our Gateway</h1>
              <p className="text-sm text-indigo-900/70 dark:text-slate-400 leading-relaxed">
                Have questions about our AI whiteboard generation parameters, custom learning path filters, or documentation frameworks? Fill out our secure contact gateway.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-5">
              {/* Form panel */}
              <div className="md:col-span-3 p-6 rounded-3xl border border-indigo-100 dark:border-slate-800 bg-white/80 dark:bg-slate-950/40 shadow-xl space-y-4">
                <h3 className="text-sm font-black text-indigo-950 dark:text-slate-200 uppercase tracking-wider">Contact Gateway Form</h3>

                {isSubmitted ? (
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center justify-center text-center py-10 space-y-3 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4"
                  >
                    <CheckCircle size={40} className="text-emerald-400 animate-bounce" />
                    <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-300">Transmission Complete</h4>
                    <p className="text-xs text-indigo-900/60 dark:text-slate-400 leading-relaxed max-w-xs">
                      Thank you! Your feedback has been encrypted and sent. Our support node will review it shortly.
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-indigo-900/60 dark:text-slate-400">Your Name</label>
                        <input
                          type="text"
                          placeholder="Alice Smith"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          required
                          className="w-full rounded-xl border border-indigo-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 py-2.5 px-3.5 text-xs outline-none transition duration-300 focus:border-indigo-500/50 text-indigo-950 dark:text-white font-bold"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-indigo-900/60 dark:text-slate-400">Your Email</label>
                        <input
                          type="email"
                          placeholder="alice@domain.com"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          required
                          className="w-full rounded-xl border border-indigo-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 py-2.5 px-3.5 text-xs outline-none transition duration-300 focus:border-indigo-500/50 text-indigo-950 dark:text-white font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-indigo-900/60 dark:text-slate-400">Subject</label>
                      <input
                        type="text"
                        placeholder="Feature integration feedback"
                        value={contactSubject}
                        onChange={(e) => setContactSubject(e.target.value)}
                        required
                        className="w-full rounded-xl border border-indigo-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 py-2.5 px-3.5 text-xs outline-none transition duration-300 focus:border-indigo-500/50 text-indigo-950 dark:text-white font-bold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-indigo-900/60 dark:text-slate-400">Your Message</label>
                      <textarea
                        rows={4}
                        placeholder="Describe your suggestion or technical error..."
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        required
                        className="w-full rounded-xl border border-indigo-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 py-2.5 px-3.5 text-xs outline-none transition duration-300 focus:border-indigo-500/50 text-indigo-950 dark:text-white font-bold resize-none"
                      />
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-indigo-500 disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <RotateCcw size={14} className="animate-spin text-white" />
                      ) : (
                        <>
                          <Send size={14} />
                          <span>Transmit Message</span>
                        </>
                      )}
                    </motion.button>
                  </form>
                )}
              </div>

              {/* Support details sidebar */}
              <div className="md:col-span-2 space-y-4">
                <div className="p-5 rounded-3xl border border-indigo-100 dark:border-slate-800 bg-white/80 dark:bg-slate-950/30 space-y-3">
                  <h4 className="text-xs font-black text-indigo-950 dark:text-slate-200 uppercase tracking-widest">Support Node Contact</h4>
                  <div className="space-y-2">
                    <p className="text-[11px] text-indigo-900/70 dark:text-slate-400 leading-normal">
                      For detailed partnership parameters or server security inquiries, connect with us at:
                    </p>
                    <a
                      href="mailto:support@cogniflow.ai"
                      onClick={() => playTechSound(1000, "sine", 0.1, 0.01)}
                      className="inline-flex items-center gap-1.5 text-xs font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
                    >
                      <Mail size={13} />
                      <span>support@cogniflow.ai</span>
                    </a>
                  </div>
                </div>

                <div className="p-5 rounded-3xl border border-indigo-100 dark:border-slate-800 bg-white/80 dark:bg-slate-950/30 space-y-3">
                  <h4 className="text-xs font-black text-indigo-950 dark:text-slate-200 uppercase tracking-widest">Global Access Hubs</h4>
                  <div className="flex gap-2">
                    {[
                      { icon: Github, label: "GitHub", href: "https://github.com" },
                      { icon: Twitter, label: "Twitter", href: "https://twitter.com" },
                      { icon: Linkedin, label: "LinkedIn", href: "https://linkedin.com" }
                    ].map((social, i) => {
                      const SocIcon = social.icon;
                      return (
                        <a
                          key={i}
                          href={social.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => playTechSound(850, "sine", 0.05, 0.015)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-slate-800 text-indigo-900/70 dark:text-slate-400 hover:text-indigo-950 dark:hover:text-white hover:border-indigo-500/50 transition-all shadow-md"
                          title={social.label}
                        >
                          <SocIcon size={16} />
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Floating Animated Assistant Core Orb */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 180 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          playTechSound(1240, "sine", 0.3, 0.02);
          const trigger = document.querySelector("button[title*='Open AI Doubt Solver']");
          if (trigger) {
            trigger.click();
          }
        }}
        onMouseEnter={() => playTechSound(670, "sine", 0.08, 0.01)}
        className="fixed bottom-6 left-6 z-40 hidden md:flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 via-cyan-500 to-emerald-500 shadow-lg shadow-indigo-500/30 cursor-pointer"
        title="Interact with AI Core"
      >
        <div className="h-10 w-10 rounded-full bg-slate-950 flex items-center justify-center">
          <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 blur-[2px] animate-pulse" />
        </div>
      </motion.button>

      {/* Premium responsive Footer */}
      <footer className="mx-auto max-w-6xl w-full border-t border-indigo-100 dark:border-slate-800/80 mt-16 pt-8 pb-10 flex flex-col md:flex-row items-center justify-between gap-6 text-indigo-900/50 dark:text-slate-500 z-10 relative">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center shrink-0">
            <Sparkles size={12} className="text-white animate-pulse" />
          </div>
          <span className="text-xs font-black text-indigo-900/80 dark:text-slate-400 tracking-tight">
            © {new Date().getFullYear()} CogniFlow AI Workspace Node.
          </span>
        </div>

        {/* Footer Tabs Links */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold">
          {[
            { id: "Home", label: "Home Hub" },
            { id: "About", label: "About Architecture" },
            { id: "Contact", label: "Contact Nodes" }
          ].map((lnk) => (
            <button
              key={lnk.id}
              onClick={() => {
                playTechSound(650, "triangle", 0.05, 0.015);
                setActiveTab(lnk.id);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`hover:text-indigo-600 dark:hover:text-white transition cursor-pointer ${activeTab === lnk.id ? "text-indigo-650 dark:text-indigo-400 font-extrabold" : "text-indigo-900/50 dark:text-slate-500"
                }`}
              type="button"
            >
              {lnk.label}
            </button>
          ))}
        </div>

        {/* Social Status node */}
        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-indigo-900/60 dark:text-slate-400 border border-indigo-100 dark:border-slate-850 bg-white/80 dark:bg-slate-950/20 px-3 py-1 rounded-full">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Status: Hyperdrive Ready</span>
        </div>
      </footer>
      <HomeChatbotWidget />
    </motion.main>
  );
}

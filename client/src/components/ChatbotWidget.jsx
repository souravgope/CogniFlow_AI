import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  BookOpen,
  Bot,
  Brain,
  Bug,
  Compass,
  Download,
  FileImage,
  FileText,
  GitFork,
  HelpCircle,
  Image as ImageIcon,
  Loader2,
  MessageSquare,
  Mic,
  Send,
  Sparkles,
  User,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  X
} from "lucide-react";
import { askAssistant } from "../api/assistantApi";

function formatResponseText(text) {
  if (!text) return "";

  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Bold text: **text** -> <strong>text</strong>
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong class='text-teal-750 dark:text-teal-300 font-semibold'>$1</strong>");

  // Inline code: `code` -> <code>code</code>
  html = html.replace(/`(.*?)`/g, "<code class='px-1 py-0.5 rounded bg-zinc-150 dark:bg-zinc-800 text-pink-600 dark:text-pink-400 font-mono text-xs'>$1</code>");

  // Format headers: ### text -> <h4 class='text-xs font-bold text-teal-800 dark:text-teal-400 mt-3 mb-1 uppercase tracking-wide'>text</h4>
  html = html.replace(/^###\s+(.*?)$/gm, "<h4 class='text-xs font-bold text-teal-800 dark:text-teal-400 mt-3 mb-1 uppercase tracking-wide'>$1</h4>");

  // Format lists
  const lines = html.split("\n");
  let inList = false;
  let listType = "";
  const processedLines = lines.map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const content = trimmed.substring(2);
      let listLine = "";
      if (!inList || listType !== "ul") {
        if (inList) listLine += `</${listType}>`;
        inList = true;
        listType = "ul";
        listLine += "<ul class='list-disc pl-4 my-1 space-y-1 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300'>";
      }
      listLine += `<li class='leading-relaxed'>${content}</li>`;
      return listLine;
    } else if (/^\d+\.\s+/.test(trimmed)) {
      const content = trimmed.replace(/^\d+\.\s+/, "");
      let listLine = "";
      if (!inList || listType !== "ol") {
        if (inList) listLine += `</${listType}>`;
        inList = true;
        listType = "ol";
        listLine += "<ol class='list-decimal pl-4 my-1 space-y-1 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300'>";
      }
      listLine += `<li class='leading-relaxed'>${content}</li>`;
      return listLine;
    } else {
      let extra = "";
      if (inList) {
        inList = false;
        extra = `</${listType}>`;
        listType = "";
      }
      return extra + (trimmed ? `<p class='my-1.5 leading-relaxed text-xs sm:text-sm text-zinc-700 dark:text-zinc-300'>${trimmed}</p>` : "");
    }
  });

  let finalHtml = processedLines.filter(Boolean).join("\n");
  if (inList) {
    finalHtml += `</${listType}>`;
  }

  return finalHtml;
}

export default function ChatbotWidget() {
  const navigate = useNavigate();
  const location = useLocation();
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isAutoRead, setIsAutoRead] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState(null);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [messages, setMessages] = useState([
    {
      id: "welcome",
      sender: "assistant",
      text: "Hello! I am your advanced AI Doubt Solver. Ask me any doubt, speak hands-free, or ask me to **generate a diagram**!\n\nUse the **header toggles** to control auto-voice mode, and use suggestion chips below to navigate seamlessly.",
      timestamp: new Date(),
      suggestions: [
        "Explain Recursion",
        "View React state path",
        "Generate a flow chart diagram"
      ],
      next_step_topic: "Recursion",
      action_hint: "Try asking 'What is recursion?' or click a suggestion below.",
      type: "guidance"
    }
  ]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isLoading, isOpen]);

  // Voice output (TTS) Handler
  const speak = (text, msgId) => {
    if (!window.speechSynthesis) return;

    // Toggle off if clicking the currently speaking message
    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();

    // Strip markdown formatting for cleaner reading
    const cleanText = text
      .replace(/<[^>]*>/g, "")
      .replace(/\*\*|`|###|-|\*/g, "")
      .replace(/Practice on whiteboard|Explain this topic|View learning path/gi, "")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith("en") && v.name.includes("Google")) ||
      voices.find(v => v.lang.startsWith("en")) ||
      voices[0];

    if (voice) utterance.voice = voice;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setSpeakingMsgId(msgId);
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    window.speechSynthesis.speak(utterance);
  };

  // Voice Input (STT) Handler
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please try Chrome or Edge.");
      return;
    }

    window.speechSynthesis?.cancel();
    setSpeakingMsgId(null);

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setIsListening(false);
      handleVoiceSubmit(transcript);
    };

    recognition.onerror = (e) => {
      console.error(e);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  // Automatically read new AI messages if AutoRead is active
  useEffect(() => {
    if (messages.length > 0 && isAutoRead) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender === "assistant" && lastMsg.id !== "welcome") {
        speak(lastMsg.text, lastMsg.id);
      }
    }
  }, [messages, isAutoRead]);

  // Unified submission handler
  const processQuery = async (queryText) => {
    const isVisualRequest = /generate|create|draw|visualize|diagram|image|tree|flowchart/i.test(queryText);

    // Match topic from queryText
    let detectedTopic = "General Concepts";
    const clean = queryText.toLowerCase();
    if (clean.includes("recursion")) detectedTopic = "Recursion";
    else if (clean.includes("react")) detectedTopic = "React Hooks";
    else if (clean.includes("state")) detectedTopic = "React State Management";
    else if (clean.includes("database") || clean.includes("sql")) detectedTopic = "Database Schema";
    else if (clean.includes("css") || clean.includes("flexbox")) detectedTopic = "CSS Grid Layout";
    else {
      const words = queryText.split(/\s+/).slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      detectedTopic = words || "Custom Visual Flow";
    }

    setIsLoading(true);
    setError("");

    try {
      const chatHistory = messages.map((m) => ({
        sender: m.sender,
        text: m.text
      }));

      const data = await askAssistant({
        query: queryText,
        isOnline: isOnline,
        chatHistory: chatHistory
      });

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        text: data.response || "No response received.",
        timestamp: new Date(),
        mode: data.mode || (isOnline ? "Online" : "Offline"),
        suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
        next_step_topic: data.next_step_topic || detectedTopic,
        action_hint: data.action_hint || "",
        type: data.type || "general",
        isVisual: isVisualRequest,
        visualTopic: detectedTopic
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to fetch response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = (e) => {
    if (e) e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: query.trim(),
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentQuery = query.trim();
    setQuery("");
    processQuery(currentQuery);
  };

  const handleVoiceSubmit = (transcriptText) => {
    if (!transcriptText.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: transcriptText.trim(),
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    processQuery(transcriptText);
  };

  const handleSuggestionClick = (suggestion, nextStepTopic) => {
    const text = suggestion.toLowerCase();
    let topic = nextStepTopic || "";
    if (!topic) {
      topic = suggestion
        .replace(/^(explain|view|practice|read|learn|study|generate)\s+/i, "")
        .replace(/\s+(on whiteboard|learning path|roadmap|path|basics|diagram)$/i, "")
        .trim();
    }

    setIsOpen(false);
    window.speechSynthesis?.cancel();

    if (text.includes("whiteboard") || text.includes("practice") || text.includes("diagram")) {
      navigate("/diagram", { state: { topic: topic, autoGenerate: true } });
    } else if (text.includes("learning path") || text.includes("roadmap") || text.includes("path")) {
      navigate("/learning", { state: { topic: topic, autoGenerate: true } });
    } else if (text.includes("explain") || text.includes("explanation") || text.includes("summarizer") || text.includes("read")) {
      navigate("/summarizer", { state: { topic: topic, autoGenerate: true } });
    } else {
      setIsOpen(true);
      setQuery(suggestion);
    }
  };

  const getSuggestionIcon = (suggestion) => {
    const text = suggestion.toLowerCase();
    if (text.includes("whiteboard") || text.includes("practice") || text.includes("diagram")) {
      return GitFork;
    }
    if (text.includes("learning path") || text.includes("roadmap") || text.includes("path")) {
      return BookOpen;
    }
    if (text.includes("explain") || text.includes("explanation") || text.includes("read")) {
      return Mic;
    }
    return Sparkles;
  };

  // Dynamic Image / SVG Flow Generator
  const renderVisualImage = (topic) => {
    const lowerTopic = topic.toLowerCase();

    const downloadSvgLocal = (e, svgId, fileName) => {
      e.stopPropagation();
      const svgEl = document.getElementById(svgId);
      if (!svgEl) return;
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const svgUrl = URL.createObjectURL(svgBlob);
      const downloadLink = document.createElement("a");
      downloadLink.href = svgUrl;
      downloadLink.download = `${fileName.toLowerCase().replace(/\s+/g, "-")}.svg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };

    if (lowerTopic.includes("recursion")) {
      return (
        <div className="mt-3 overflow-hidden rounded-xl border border-teal-500/20 bg-slate-950 p-2 text-center">
          <div className="flex items-center justify-between px-2 pb-1.5 text-[10px] font-bold text-teal-400">
            <span className="flex items-center gap-1"><ImageIcon size={10} /> AI Recursion Call Graph</span>
            <button onClick={(e) => downloadSvgLocal(e, "recursion-svg", topic)} className="hover:text-white" title="Download SVG"><Download size={11} /></button>
          </div>
          <svg id="recursion-svg" viewBox="0 0 320 180" className="w-full h-36">
            <path d="M 160,25 L 85,75 M 160,25 L 235,75 M 85,75 L 45,130 M 85,75 L 125,130" stroke="rgba(45,212,191,0.4)" strokeWidth="1.5" />

            <circle cx="160" cy="25" r="13" fill="#0f172a" stroke="#2dd4bf" strokeWidth="1.5" />
            <text x="160" y="28" fill="#2dd4bf" fontSize="9" fontWeight="bold" textAnchor="middle">f(3)</text>

            <circle cx="85" cy="75" r="13" fill="#0f172a" stroke="#3b82f6" strokeWidth="1.5" />
            <text x="85" y="78" fill="#3b82f6" fontSize="9" fontWeight="bold" textAnchor="middle">f(2)</text>

            <circle cx="235" cy="75" r="13" fill="#0f172a" stroke="#6366f1" strokeWidth="1.5" />
            <text x="235" y="78" fill="#6366f1" fontSize="9" fontWeight="bold" textAnchor="middle">f(1)</text>

            <circle cx="45" cy="130" r="11" fill="#10b981" />
            <text x="45" y="133" fill="#0f172a" fontSize="8" fontWeight="bold" textAnchor="middle">f(1)</text>

            <circle cx="125" cy="130" r="11" fill="#10b981" />
            <text x="125" y="133" fill="#0f172a" fontSize="8" fontWeight="bold" textAnchor="middle">f(0)</text>
          </svg>
          <button onClick={() => handleSuggestionClick("Practice Recursion on whiteboard", topic)} className="mt-1.5 w-full rounded bg-teal-500/15 py-1 text-[10px] font-bold text-teal-300 hover:bg-teal-500/25">
            Modify & Draw on Canvas
          </button>
        </div>
      );
    }

    if (lowerTopic.includes("state") || lowerTopic.includes("react") || lowerTopic.includes("hook")) {
      return (
        <div className="mt-3 overflow-hidden rounded-xl border border-teal-500/20 bg-slate-950 p-2 text-center">
          <div className="flex items-center justify-between px-2 pb-1.5 text-[10px] font-bold text-teal-400">
            <span className="flex items-center gap-1"><ImageIcon size={10} /> AI React Hook Loop</span>
            <button onClick={(e) => downloadSvgLocal(e, "react-svg", topic)} className="hover:text-white" title="Download SVG"><Download size={11} /></button>
          </div>
          <svg id="react-svg" viewBox="0 0 320 180" className="w-full h-36">
            <rect x="15" y="65" width="70" height="35" rx="5" fill="#1e293b" stroke="#3b82f6" strokeWidth="1" />
            <text x="50" y="86" fill="#3b82f6" fontSize="8" textAnchor="middle" fontWeight="bold">UI Action</text>

            <path d="M 85,82 L 125,82" stroke="#2dd4bf" strokeWidth="1.5" />

            <rect x="125" y="65" width="80" height="35" rx="5" fill="#1e293b" stroke="#2dd4bf" strokeWidth="1" />
            <text x="165" y="86" fill="#2dd4bf" fontSize="8" textAnchor="middle" fontWeight="bold">setState()</text>

            <path d="M 205,82 L 245,82" stroke="#f43f5e" strokeWidth="1.5" />

            <rect x="245" y="65" width="60" height="35" rx="5" fill="#0f172a" stroke="#f43f5e" strokeWidth="1" />
            <text x="275" y="86" fill="#f43f5e" fontSize="8" textAnchor="middle" fontWeight="bold">Render</text>

            <path d="M 275,100 Q 165,150 50,100" fill="none" stroke="rgba(20,184,166,0.3)" strokeWidth="1.5" strokeDasharray="3,3" />
          </svg>
          <button onClick={() => handleSuggestionClick("Practice React hooks on whiteboard", topic)} className="mt-1.5 w-full rounded bg-teal-500/15 py-1 text-[10px] font-bold text-teal-300 hover:bg-teal-500/25">
            Modify & Draw on Canvas
          </button>
        </div>
      );
    }

    if (lowerTopic.includes("db") || lowerTopic.includes("database") || lowerTopic.includes("sql") || lowerTopic.includes("schema")) {
      return (
        <div className="mt-3 overflow-hidden rounded-xl border border-teal-500/20 bg-slate-950 p-2 text-center">
          <div className="flex items-center justify-between px-2 pb-1.5 text-[10px] font-bold text-teal-400">
            <span className="flex items-center gap-1"><ImageIcon size={10} /> AI Database Schema</span>
            <button onClick={(e) => downloadSvgLocal(e, "db-svg", topic)} className="hover:text-white" title="Download SVG"><Download size={11} /></button>
          </div>
          <svg id="db-svg" viewBox="0 0 320 180" className="w-full h-36">
            <rect x="20" y="30" width="100" height="100" rx="5" fill="#1e293b" stroke="#3b82f6" strokeWidth="1.5" />
            <rect x="20" y="30" width="100" height="20" fill="#3b82f6" />
            <text x="70" y="44" fill="#0f172a" fontSize="8" fontWeight="bold" textAnchor="middle">Users (PK)</text>
            <text x="30" y="65" fill="#94a3b8" fontSize="7">id (int)</text>
            <text x="30" y="80" fill="#94a3b8" fontSize="7">name (varchar)</text>
            <text x="30" y="95" fill="#94a3b8" fontSize="7">email (varchar)</text>

            <path d="M 120,65 Q 160,85 200,85" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3,3" />

            <rect x="200" y="50" width="100" height="80" rx="5" fill="#1e293b" stroke="#10b981" strokeWidth="1.5" />
            <rect x="200" y="50" width="100" height="20" fill="#10b981" />
            <text x="250" y="64" fill="#0f172a" fontSize="8" fontWeight="bold" textAnchor="middle">Orders</text>
            <text x="210" y="85" fill="#94a3b8" fontSize="7">order_id (PK)</text>
            <text x="210" y="100" fill="#94a3b8" fontSize="7">user_id (FK)</text>
          </svg>
          <button onClick={() => handleSuggestionClick("Practice Database layout on whiteboard", topic)} className="mt-1.5 w-full rounded bg-teal-500/15 py-1 text-[10px] font-bold text-teal-300 hover:bg-teal-500/25">
            Modify & Draw on Canvas
          </button>
        </div>
      );
    }

    // Default Futuristic Generative Mind Map
    return (
      <div className="mt-3 overflow-hidden rounded-xl border border-teal-500/20 bg-slate-950 p-2 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="flex items-center justify-between px-2 pb-1.5 text-[10px] font-bold text-teal-400">
          <span className="flex items-center gap-1 animate-pulse"><Sparkles size={10} /> AI Generative Blueprint</span>
          <button onClick={(e) => downloadSvgLocal(e, "gen-svg", topic)} className="hover:text-white" title="Download SVG"><Download size={11} /></button>
        </div>
        <svg id="gen-svg" viewBox="0 0 320 180" className="w-full h-36">
          <defs>
            <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
          <path d="M 40,90 L 120,50 M 40,90 L 120,130 M 120,50 L 200,50 M 120,130 L 200,130 M 200,50 L 280,90 M 200,130 L 280,90" stroke="rgba(20,184,166,0.25)" strokeWidth="1.5" />
          <circle cx="40" cy="90" r="10" fill="url(#glowGrad)" />
          <circle cx="120" cy="50" r="7" fill="#3b82f6" />
          <circle cx="120" cy="130" r="7" fill="#14b8a6" />
          <circle cx="200" cy="50" r="7" fill="#10b981" />
          <circle cx="200" cy="130" r="7" fill="#6366f1" />
          <circle cx="280" cy="90" r="10" fill="url(#glowGrad)" />

          <text x="160" y="94" fill="#5eead4" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">{topic}</text>
          <text x="160" y="165" fill="#64748b" fontSize="7" textAnchor="middle" fontFamily="monospace">Constellation Mindmap Architecture</text>
        </svg>
        <button onClick={() => handleSuggestionClick(`Draw diagram for ${topic}`, topic)} className="mt-1.5 w-full rounded bg-teal-500/15 py-1 text-[10px] font-bold text-teal-300 hover:bg-teal-500/25">
          Open on AI Whiteboard Canvas
        </button>
      </div>
    );
  };

  // Do not render the chatbot widget on the home page
  if (location.pathname === "/") {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Voice Bouncing Indicator Banner */}
      {isListening && (
        <div className="mb-2 flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-xl animate-bounce">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-100 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
          </span>
          <span>Listening... Speak your query clearly</span>
        </div>
      )}

      {/* Dynamic Status Indicator (Closed Chatbot Button) */}
      {!isOpen && !isListening && (
        <div className="mb-2 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 shadow-md border border-zinc-200/60 dark:bg-zinc-900/95 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-wider transition-all duration-300">
          {/* <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isOnline ? "bg-teal-400" : "bg-amber-400"
            }`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${
              isOnline ? "bg-teal-500" : "bg-amber-500"
            }`} />
          </span>
          <span className={isOnline ? "text-teal-700 dark:text-teal-400" : "text-amber-700 dark:text-amber-400"}>
            {isOnline ? "Assistant Online" : "Assistant Offline"}
          </span> */}
        </div>
      )}

      {/* Slide-Up Chat Panel */}
      {isOpen && (
        <div className="mb-4 flex w-[350px] sm:w-[380px] h-[520px] flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/95 shadow-2xl backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/95 transition-all duration-300 animate-in slide-in-from-bottom-6">
          {/* Chat Header */}
          <header className="flex items-center justify-between border-b border-zinc-200/80 bg-gradient-to-r from-zinc-50 to-white px-4 py-3 dark:border-zinc-800/80 dark:from-zinc-900 dark:to-zinc-950">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-100 border border-teal-200 dark:border-teal-850">
                  <Bot size={16} className={isOnline && !isLoading ? "animate-pulse" : ""} />
                </span>
                <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-zinc-950 ${isOnline ? "bg-teal-500" : "bg-amber-500"
                  }`} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-ink dark:text-zinc-100 flex items-center gap-1">
                  AI Doubt Solver
                </h2>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  {isOnline ? "Powered by Gemini AI" : "Local static DB active"}
                </p>
              </div>
            </div>

            {/* Offline/Online switches, TTS Controls & Minimize */}
            <div className="flex items-center gap-2.5">
              {/* TTS Global AutoRead Toggle */}
              <button
                onClick={() => {
                  setIsAutoRead(!isAutoRead);
                  if (isAutoRead) {
                    window.speechSynthesis?.cancel();
                    setSpeakingMsgId(null);
                  }
                }}
                className={`rounded-lg p-1.5 transition ${isAutoRead
                  ? "bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400 border border-teal-500/20"
                  : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-900 dark:hover:text-white"
                  }`}
                title={isAutoRead ? "Auto-Read Aloud: Active" : "Auto-Read Aloud: Muted"}
              >
                {isAutoRead ? <Volume2 size={16} className="animate-bounce" /> : <VolumeX size={16} />}
              </button>

              {/* Online/Offline Toggle */}
              <button
                onClick={() => setIsOnline(!isOnline)}
                className={`flex h-6 w-11 items-center rounded-full p-0.5 transition duration-300 ${isOnline ? "bg-teal-500" : "bg-zinc-300 dark:bg-zinc-700"
                  }`}
                title="Toggle Mode (Online / Offline)"
              >
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full bg-white text-zinc-700 shadow transition-all duration-300 ${isOnline ? "translate-x-5" : "translate-x-0"
                    }`}
                >
                  {isOnline ? (
                    <Wifi size={10} className="text-teal-600" />
                  ) : (
                    <WifiOff size={10} className="text-zinc-400" />
                  )}
                </div>
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  window.speechSynthesis?.cancel();
                  setSpeakingMsgId(null);
                }}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-900 dark:hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
          </header>

          {/* Messages Container */}
          <section className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => {
              const isUser = msg.sender === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-900 border border-teal-100 dark:bg-teal-950 dark:text-teal-100 dark:border-teal-900 shadow-sm">
                      <Bot size={14} />
                    </div>
                  )}

                  <div className="flex flex-col max-w-[82%] gap-1.5">
                    {/* Message Bubble Container */}
                    <div
                      className={`relative rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed shadow-sm group/bubble ${isUser
                        ? "bg-gradient-to-br from-teal-600 to-emerald-600 text-white rounded-tr-none"
                        : "bg-zinc-100/80 text-ink dark:bg-zinc-900/90 dark:text-zinc-100 rounded-tl-none border border-zinc-200/40 dark:border-zinc-800/40"
                        }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      ) : (
                        <>
                          <div
                            className="prose dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200 pr-4"
                            dangerouslySetInnerHTML={{ __html: formatResponseText(msg.text) }}
                          />

                          {/* action_hint guide tip box */}
                          {msg.action_hint && (
                            <div className="mt-3 flex items-start gap-1.5 rounded-xl bg-teal-500/10 border border-teal-500/20 p-2 text-[10px] sm:text-[11px] font-medium text-teal-850 dark:bg-teal-950/40 dark:text-teal-350 dark:border-teal-900/40 shadow-sm animate-pulse">
                              <span className="relative flex h-2 w-2 mt-1 shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
                              </span>
                              <div>
                                <strong className="text-teal-700 dark:text-teal-400">Guide Tip: </strong>
                                {msg.action_hint}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* TTS speaker trigger button inside bubble */}
                      {!isUser && (
                        <button
                          onClick={() => speak(msg.text, msg.id)}
                          className={`absolute top-2.5 right-2 rounded p-0.5 opacity-0 group-hover/bubble:opacity-100 transition-opacity hover:bg-zinc-200 dark:hover:bg-zinc-800 ${speakingMsgId === msg.id ? "opacity-100 text-teal-500" : "text-zinc-400"
                            }`}
                          title="Read message aloud"
                        >
                          <Volume2 size={12} className={speakingMsgId === msg.id ? "animate-pulse" : ""} />
                        </button>
                      )}

                      {/* Generative Visual Drawing Embedded inside Bubble */}
                      {!isUser && msg.isVisual && msg.visualTopic && (
                        renderVisualImage(msg.visualTopic)
                      )}

                      {/* Mode and Type tags */}
                      {!isUser && (msg.mode || msg.type) && (
                        <div className="mt-1.5 flex justify-end gap-1.5">
                          {msg.type && (
                            <span className="inline-flex items-center rounded bg-zinc-200/50 text-zinc-650 dark:bg-zinc-800/80 dark:text-zinc-400 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider">
                              {msg.type}
                            </span>
                          )}
                          {msg.mode && (
                            <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider ${msg.mode === "Online"
                              ? "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                              }`}>
                              {msg.mode}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Interactive Action chips */}
                    {!isUser && (msg.suggestions?.length > 0 || msg.next_step_topic) && (
                      <div className="grid gap-1.5 border-t border-zinc-200/30 pt-1.5 dark:border-zinc-800/30">
                        {msg.next_step_topic && (
                          <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                            <Compass size={11} className="text-teal-500" />
                            Next concept: <span className="text-teal-700 dark:text-teal-400 font-bold">{msg.next_step_topic}</span>
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {msg.suggestions.map((suggestion) => {
                            const Icon = getSuggestionIcon(suggestion);
                            return (
                              <button
                                key={suggestion}
                                onClick={() => handleSuggestionClick(suggestion, msg.next_step_topic)}
                                className="inline-flex items-center gap-1 rounded bg-white px-2 py-1 text-[10px] font-bold text-zinc-700 shadow-sm border border-zinc-200 transition hover:-translate-y-0.5 hover:border-teal-500 hover:text-teal-700 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-teal-400 dark:hover:text-teal-300"
                              >
                                <Icon size={10} className="text-teal-600 dark:text-teal-400" />
                                {suggestion}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* AI Typing Indicator */}
            {isLoading && (
              <div className="flex gap-2.5 justify-start">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-900 border border-teal-100 dark:bg-teal-950 dark:text-teal-100 dark:border-teal-900 shadow-sm">
                  <Bot size={14} className="animate-spin text-teal-600" />
                </div>
                <div className="rounded-2xl px-3.5 py-2.5 bg-zinc-150 dark:bg-zinc-900/60 shadow-sm flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider animate-pulse">
                    AI typing...
                  </span>
                </div>
              </div>
            )}

            {/* Error notifications */}
            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50/50 p-3 text-[11px] text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
                <div className="flex gap-1.5">
                  <Bug size={14} className="text-rose-600" />
                  <div>
                    <p className="font-semibold">Oops! Something went wrong.</p>
                    <p className="text-[10px] opacity-80">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </section>

          {/* Input Panel */}
          <footer className="border-t border-zinc-200/80 bg-zinc-50/60 p-3 dark:border-zinc-800/80 dark:bg-zinc-950/60">
            <form onSubmit={handleSend} className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    isListening
                      ? "Listening to your voice..."
                      : isOnline
                        ? "Ask doubt or draw diagram..."
                        : "Offline query..."
                  }
                  disabled={isLoading || isListening}
                  className="w-full rounded-xl border border-zinc-300 bg-white py-2 pl-3 pr-10 text-xs sm:text-sm outline-none ring-teal-500/10 transition-all focus:border-teal-500 focus:ring-4 dark:border-zinc-850 dark:bg-zinc-900 dark:focus:border-teal-400"
                />

                {/* Voice-to-Voice Mic trigger inside input */}
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`absolute right-1.5 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-lg transition-all ${isListening
                    ? "bg-rose-500 text-white animate-pulse"
                    : "text-zinc-400 hover:bg-zinc-100 hover:text-teal-600 dark:hover:bg-zinc-800"
                    }`}
                  title={isListening ? "Listening... click to stop" : "Start Voice Talk"}
                >
                  <Mic size={14} />
                </button>
              </div>

              {/* Submit Arrow */}
              <button
                type="submit"
                disabled={!query.trim() || isLoading || isListening}
                className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow transition-all hover:bg-teal-700 hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-40 dark:bg-teal-500 dark:text-zinc-950 dark:hover:bg-teal-400"
              >
                <Send size={13} />
              </button>
            </form>
            <p className="mt-1 text-[9px] text-zinc-400 dark:text-zinc-500 text-center">
              Voice Feature active. Press microphone to speak, or Enter to send.
            </p>
          </footer>
        </div>
      )}

      {/* Floating Trigger Launcher Button */}
      {/* <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (isOpen) {
            window.speechSynthesis?.cancel();
            setSpeakingMsgId(null);
          }
        }}
        className={`group flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 ${isOpen
          ? "bg-zinc-800 dark:bg-zinc-900 rotate-90"
          : isOnline
            ? "bg-gradient-to-br from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 shadow-teal-500/20"
            : "bg-gradient-to-br from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 shadow-amber-500/20"
          }`}
        title={isOpen ? "Close AI Doubt Solver" : "Open AI Doubt Solver"}
      >
        {isOpen ? (
          <X size={24} />
        ) : isOnline ? (
          <div className="relative">
            <MessageSquare size={24} className="group-hover:-translate-y-0.5 transition-transform" />
            <Brain size={12} className="absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
          </div>
        ) : (
          <div className="relative">
            <MessageSquare size={24} className="group-hover:-translate-y-0.5 transition-transform" />
            <WifiOff size={11} className="absolute -top-1 -right-1 text-amber-200" />
          </div>
        )}
      </button> */}
    </div>
  );
}

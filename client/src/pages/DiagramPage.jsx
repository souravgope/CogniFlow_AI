import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Award,
  Bot,
  Braces,
  Check,
  ChevronDown,
  ChevronUp,
  Code,
  Copy,
  Download,
  Edit3,
  Eye,
  FileImage,
  FileText,
  GitFork,
  HelpCircle,
  Info,
  Map,
  Moon,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Save,
  Send,
  Share2,
  Sparkles,
  Square,
  Sun,
  Volume2,
  VolumeX
} from "lucide-react";
import { generateDiagram, syncDiagramMetadata } from "../api/diagramApi";
import { askAssistant } from "../api/assistantApi";
import CodeEditor from "../components/CodeEditor";
import DiagramPreview from "../components/DiagramPreview";
import ModeButton from "../components/ModeButton";
import SavedDiagrams from "../components/SavedDiagrams";
import { downloadPng, downloadPdf, downloadSvg } from "../utils/exportDiagram";
import { decodeState, encodeState } from "../utils/share";
import { loadSavedDiagrams, saveDiagram } from "../utils/storage";

const Whiteboard = lazy(() => import("../components/Whiteboard"));

const starterCode = `graph TD
  User["User Prompt"] --> AI["Diagram Generator AI"]
  AI --> Mermaid["Mermaid Code"]
  Mermaid --> Preview["Visual Diagram"]
  Preview --> Export["PNG SVG PDF"]`;

// Rich starter payload for the interactive workspace
const starterInteractiveData = {
  nodes: [
    {
      id: "User",
      label: "User Prompt",
      explanation: "The user entry point where natural language descriptions are captured.",
      details: "This is the trigger stage. The application captures a prompt defining the required architecture, flowchart, sequence flow, or database tables. The input is cleaned and passed to the diagram generator.",
      techStack: "React Form Control, Tailwind CSS",
      codeSnippet: "export default function PromptInput({ onSubmit }) {\n  const [prompt, setPrompt] = useState('');\n  return (\n    <form onSubmit={(e) => { e.preventDefault(); onSubmit(prompt); }}>\n      <textarea value={prompt} onChange={e => setPrompt(e.target.value)} />\n      <button type='submit'>Generate</button>\n    </form>\n  );\n}",
      subComponents: ["Input Field", "Sanitizer", "Validation Hook"]
    },
    {
      id: "AI",
      label: "Diagram Generator AI",
      explanation: "A custom LLM client that translates system descriptions into Mermaid structures.",
      details: "The LLM client accepts system prompts, wraps them in contextual guidelines, and executes structured output generation using Gemini 2.5 Flash, generating valid Mermaid.js diagrams along with node metadata.",
      techStack: "Node.js, Express, Gemini API",
      codeSnippet: "const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${API_KEY}`, {\n  method: 'POST',\n  body: JSON.stringify({\n    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },\n    contents: [{ role: 'user', parts: [{ text: prompt }] }],\n    generationConfig: { responseMimeType: 'application/json' }\n  })\n});",
      subComponents: ["LLM Orchestrator", "JSON Schema Validator", "System Prompt Engine"]
    },
    {
      id: "Mermaid",
      label: "Mermaid Code",
      explanation: "Standard parseable text-based charting syntax representing the system topology.",
      details: "A declarative language designed to represent system architectures, database schemas, flowcharts, and temporal sequences in clear, easily readable text, avoiding bloated XML layouts.",
      techStack: "Mermaid.js Grammar Spec",
      codeSnippet: "graph TD\n  User[\"User Prompt\"] --> AI[\"Diagram Generator AI\"]\n  AI --> Mermaid[\"Mermaid Code\"]\n  Mermaid --> Preview[\"Visual Diagram\"]\n  Preview --> Export[\"PNG SVG PDF\"]",
      subComponents: ["Lexical Tokens", "Graph Topology Definition"]
    },
    {
      id: "Preview",
      label: "Visual Diagram",
      explanation: "Interactive, zoomable, and clickable SVG preview rendered inside the dashboard.",
      details: "Renders the compiled vector SVGs dynamically in React, binding click and hover event listeners to individual graphical nodes so users can click to inspect code snippets and doc sheets.",
      techStack: "React, SVG DOM, Web Browser APIs",
      codeSnippet: "useEffect(() => {\n  async function render() {\n    const { svg } = await mermaid.render('id', code);\n    container.innerHTML = svg;\n    attachEventHooks();\n  }\n  render();\n}, [code]);",
      subComponents: ["SVG Renderer", "Event Binder Hook", "Spotlight Animation System"]
    },
    {
      id: "Export",
      label: "PNG SVG PDF",
      explanation: "Vector and raster exporter compiling drawings into standard asset files.",
      details: "Compiles active vector SVGs into high-definition downloads. Converts vector paths into raster data using the HTML5 Canvas API for PNG files, and uses jsPDF to compile landscapes.",
      techStack: "HTML5 Canvas API, jsPDF, Web File API",
      codeSnippet: "export async function downloadPdf(code) {\n  const svg = await renderSvg(code);\n  const pdf = new jsPDF('landscape', 'px', [1200, 800]);\n  pdf.addImage(canvasDataUrl, 'PNG', 0, 0);\n  pdf.save('diagram.pdf');\n}",
      subComponents: ["Canvas Rasterizer", "Vector Compiler", "PDF Page Packer"]
    }
  ],
  documentation: {
    summary: "Welcome to the interactive AI Diagram Generator Dashboard! Describe any system to generate highly detailed interactive drawings.",
    notes: "### Interactive Features\n1. **Highlight Spotlight**: Click any node on the diagram canvas to focus on it, dimming all other components.\n2. **Component Specs**: Look at the right panel for rich explanations, custom simulated code snippets, and specific technical guidelines.\n3. **Auto-Study Guide**: Switch to the Study Docs tab to find technical summaries and a generated list of 10 Viva/Interview preparation questions with toggleable answers.\n4. **Dynamic AI Assistant**: Talk to the contextual assistant pre-loaded with your diagram structure.",
    vivaQuestions: [
      {
        question: "What is the primary benefit of Mermaid.js in codebases?",
        answer: "Mermaid lets you track diagrams as code inside Markdown files, making architecture documentation versionable, editable via Git, and easy to maintain."
      },
      {
        question: "How does this platform enable interactive clicks on static Mermaid elements?",
        answer: "By rendering Mermaid strings into inline SVGs, then traversing the DOM to find node groups (<g class='node'>) and mapping their classes/text to our rich metadata model."
      }
    ]
  },
  learningRoadmap: {
    title: "Mastering System Design & Interactive Visualizations",
    milestones: [
      {
        title: "Learn Mermaid.js Syntax",
        description: "Master flowcharts, ER diagrams, and sequence message passing.",
        resources: ["Mermaid.js Official Docs", "GitHub Markdown Diagram Tutorial"],
        project: "Write a complete sequence diagram describing a user checkout checkout flow."
      },
      {
        title: "Build Interactive Vector Graphics in React",
        description: "Learn how to query SVGs, attach event handlers, and style vectors dynamically.",
        resources: ["MDN SVG Guide", "React SVG Component Strategies"],
        project: "Create an interactive dashboard with clickable map elements."
      }
    ]
  }
};

const examples = [
  "Explain Salesforce architecture",
  "Draw system design of Uber",
  "Create ER diagram for student management system",
  "Draw message sequence diagram for standard JWT login"
];

export default function DiagramPage() {
  const [prompt, setPrompt] = useState(examples[0]);
  const [code, setCode] = useState(starterCode);
  const [diagramType, setDiagramType] = useState("architecture");
  const [view, setView] = useState("visual");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [saved, setSaved] = useState(() => loadSavedDiagrams());

  // Advanced Interactive States
  const [nodes, setNodes] = useState(starterInteractiveData.nodes);
  const [documentation, setDocumentation] = useState(starterInteractiveData.documentation);
  const [learningRoadmap, setLearningRoadmap] = useState(starterInteractiveData.learningRoadmap);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  // Right Sidebar & Left Sidebar Active Tabs
  const [rightTab, setRightTab] = useState("specs");
  const [leftTab, setLeftTab] = useState("code");

  // AI Assistant Chat States
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { sender: "ai", text: "Hi! I am your Diagram Assistant. Ask me anything about this architecture or click a component to dive deeper!" }
  ]);
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Text to Speech States
  const [speakingState, setSpeakingState] = useState("idle"); // idle, playing, paused
  const synthRef = useRef(window.speechSynthesis);
  const speechUtteranceRef = useRef(null);

  // Copy helper feedback
  const [copiedNodeId, setCopiedNodeId] = useState(null);
  const [expandedVivaIndex, setExpandedVivaIndex] = useState(null);

  const location = useLocation();
  const autoGeneratedRef = useRef(false);

  useEffect(() => {
    if (location.state?.topic && !autoGeneratedRef.current) {
      autoGeneratedRef.current = true;
      const targetTopic = location.state.topic;
      const diagramPrompt = `Draw system flowchart or visual architecture for ${targetTopic}`;
      setPrompt(diagramPrompt);
      if (location.state?.autoGenerate) {
        runInteractiveGeneration(diagramPrompt);
      }
    }
  }, [location.state]);

  useEffect(() => {
    const shared = new URLSearchParams(window.location.search).get("diagram");
    if (!shared) {
      return;
    }

    const decoded = decodeState(shared);
    if (decoded?.code) {
      setCode(decoded.code);
      setPrompt(decoded.prompt || "");
      setDiagramType(decoded.diagramType || "architecture");
      setStatus("Shared diagram loaded.");
      // Synchronize metadata for the shared diagram
      syncMetadataWithCode(decoded.code, decoded.diagramType || "architecture");
    }
  }, [location.search]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

 const canExport = useMemo(
  () => (code || "").trim().length > 0,
  [code]
);

  // Synchronize dynamic details when a node is clicked/selected
  const handleNodeSelect = (node) => {
    if (selectedNodeId === node.id) {
      setSelectedNodeId(null);
      setSelectedNode(null);
      stopSpeaking();
    } else {
      setSelectedNodeId(node.id);
      setSelectedNode(node);
      setRightTab("specs");
      stopSpeaking();
    }
  };

  // Perform full rich interactive generation
  async function runInteractiveGeneration(targetPrompt) {
    setIsGenerating(true);
    setError("");
    setStatus("Analyzing prompt & generating interactive layout...");
    setSelectedNodeId(null);
    setSelectedNode(null);
    stopSpeaking();

    try {
      const result = await generateDiagram(targetPrompt, true);

      setCode(result?.code || "");
      setDiagramType(result.diagramType);

      if (result.nodes) setNodes(result.nodes);
      if (result.documentation) setDocumentation(result.documentation);
      if (result.learningRoadmap) setLearningRoadmap(result.learningRoadmap);

      setView("visual");
      setStatus(result.warning || "Advanced interactive diagram generated successfully.");

      // Inject AI notification into assistant page
      setChatHistory([
        { sender: "ai", text: `I have compiled the diagram for "${targetPrompt}". You can click any system element to inspect its details, view simulated code, or ask me specific questions!` }
      ]);
    } catch (err) {
      setError(err.message || "Unable to generate diagram.");
      setStatus("");
    } finally {
      setIsGenerating(false);
    }
  }

  // Handle Generate Action
  const handleGenerate = () => {
    if (prompt?.trim()) {
      runInteractiveGeneration(prompt);
    }
  };

  // Synchronize explanations when user edits Mermaid code (Requirement 3)
  async function syncMetadataWithCode(customCode, type) {
    setIsSyncing(true);
    setStatus("Analyzing edited structure to update documentation...");
    try {
      const result = await syncDiagramMetadata(customCode, type);
      if (result.nodes) setNodes(result.nodes);
      if (result.documentation) setDocumentation(result.documentation);
      if (result.learningRoadmap) setLearningRoadmap(result.learningRoadmap);
      setStatus("Explanations and code components updated successfully.");
    } catch (err) {
      console.warn("Explanations sync failed:", err);
      setStatus("Layout updated. AI Sync failed, displaying base components.");
    } finally {
      setIsSyncing(false);
    }
  }

  // Handle Save
  function handleSave() {
    const next = saveDiagram({
      prompt,
      code,
      diagramType
    });
    setSaved(next);
    setStatus("Diagram saved locally.");
  }

  // Handle Share
  async function handleShare() {
    const encoded = encodeState({ prompt, code, diagramType });
    const url = `${window.location.origin}${window.location.pathname}?diagram=${encoded}`;
    await navigator.clipboard.writeText(url);
    setStatus("Share link copied.");
  }

  // Load Diagram
  function loadDiagram(item) {
    setPrompt(item.prompt);
    setCode(item?.code || "");
    setDiagramType(item.diagramType);
    setView("visual");
    setStatus("Saved diagram loaded. Synchronizing interactive assets...");
    syncMetadataWithCode(item.code, item.diagramType);
  }

  // Exporters
  async function handleExport(exporter, label) {
    setError("");
    setStatus(`Preparing ${label} export...`);

    try {
      await exporter(code);
      setStatus(`${label} export ready.`);
    } catch (err) {
      setStatus("");
      setError(err.message || `Unable to export ${label}.`);
    }
  }

  // Two-way visual node label editor (Requirement 3)
  const handleVisualLabelChange = (nodeId, newLabel) => {
    // 1. Escaping special regex chars
    const escapedId = nodeId.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    // Match node labels declared with bracket notation like Client["Label"] or Client[Label]
    const regex = new RegExp(`(\\b${escapedId}\\b\\s*(?:\\[|\\(|\\{|=|"|\\b)\\s*"?)([^"\\n\\r]*?)("?\\s*(?:\\]|\\)|\\})?\\b)`, 'g');

    const newCode = code.replace(regex, (match, p1, p2, p3) => {
      return `${p1.trim()}"${newLabel}"${p3.trim()}`;
    });

    setCode(newCode);
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, label: newLabel } : n));
    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode(prev => ({ ...prev, label: newLabel }));
    }
  };

  // Trigger metadata syncing from editor
  const handleTriggerSync = () => {
    syncMetadataWithCode(code, diagramType);
  };

  // Context-aware AI chat handler (Requirement 4)
  const handleSendChatMessage = async () => {
    if (!chatMessage?.trim()) return;

    const userText = chatMessage;
    setChatMessage("");
    setChatHistory(prev => [...prev, { sender: "user", text: userText }]);
    setIsAssistantLoading(true);

    try {
      // Injects system diagram metadata context into prompt seamlessly
      const contextualPrompt = `
[CONTEXT ACTIVE DIAGRAM]
Mermaid Code:
${code}
Diagram Type: ${diagramType}
Active Inspected Node: ${selectedNode ? `${selectedNode.label} (ID: ${selectedNode.id}) - Description: ${selectedNode.explanation}` : 'None'}
System Nodes Registered: ${nodes.map(n => `${n.label} (${n.id})`).join(", ")}

[USER QUERY]
${userText}
`;

      const result = await askAssistant({
        query: contextualPrompt,
        chatHistory: chatHistory.slice(-5) // Pass recent conversations for memory
      });

      setChatHistory(prev => [...prev, { sender: "ai", text: result.response }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { sender: "ai", text: "I ran into a small issue parsing that question in relation to the diagram. Please try again!" }]);
    } finally {
      setIsAssistantLoading(false);
    }
  };

  // Local browser Text to Speech voice engine (Requirement 7)
  const speakText = (textToSpeak) => {
    if (!synthRef.current) return;

    if (speakingState === "playing") {
      synthRef.current.cancel();
    }

    // Clean pause blocks from video script or notes
    // const cleanedText = textToSpeak.replace(/\[pause\]/gi, "").trim();
    const cleanedText = (textToSpeak || "")
       .replace(/\[pause\]/gi, "")
       .trim();

    const utterance = new SpeechSynthesisUtterance(cleanedText);

    // Choose a high-quality local English voice if available
    const voices = synthRef.current.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith("en") && v.name.includes("Google")) || voices.find(v => v.lang.startsWith("en"));
    if (englishVoice) utterance.voice = englishVoice;

    utterance.rate = 1.0;
    utterance.pitch = 1.05;

    utterance.onstart = () => setSpeakingState("playing");
    utterance.onend = () => setSpeakingState("idle");
    utterance.onerror = () => setSpeakingState("idle");

    speechUtteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  const toggleSpeechPause = () => {
    if (!synthRef.current) return;

    if (speakingState === "playing") {
      synthRef.current.pause();
      setSpeakingState("paused");
    } else if (speakingState === "paused") {
      synthRef.current.resume();
      setSpeakingState("playing");
    }
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setSpeakingState("idle");
    }
  };

  useEffect(() => {
    return () => {
      if (synthRef.current) synthRef.current.cancel();
    };
  }, []);

  // Copy Code Snippet helper
  const copyCodeSnippet = async (snippetText, id) => {
    await navigator.clipboard.writeText(snippetText);
    setCopiedNodeId(id);
    setTimeout(() => setCopiedNodeId(null), 2000);
  };

  return (
    <main className="min-h-screen bg-stone-50 text-ink transition duration-200 dark:bg-zinc-950 dark:text-zinc-100 pb-12">
      {/* Sleek Top Banner Navbar */}
      <section className="border-b border-zinc-200/80 bg-white/70 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/70 sticky top-0 z-40">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
                <GitFork size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight sm:text-2xl flex items-center gap-2">
                  AI Interactive Workspace

                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Generate architectures, ER models, flowcharts, & sequence diagrams with real-time clickable components.
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

          {/* Prompt Entry & Type Selections */}
          <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
            <div className="flex flex-col gap-2">
              <textarea
                id="prompt"
                className="min-h-16 resize-none rounded-xl border border-zinc-300 bg-white p-3 text-sm outline-none ring-teal-500/30 transition focus:border-teal-500 focus:ring-4 dark:border-zinc-800 dark:bg-zinc-900 custom-scrollbar"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Describe the system architecture or flow in plain text..."
              />
            </div>
            <div className="flex flex-row gap-2 lg:flex-col justify-end">
              <button
                className="primary-button bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-500 hover:to-emerald-400 text-white border-0 shadow-lg shadow-teal-500/15"
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || !prompt?.trim()}
              >
                <Sparkles size={16} className={isGenerating ? "animate-spin" : ""} />
                {isGenerating ? "Generating Workspace..." : "Generate Interactive Layout"}
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  setPrompt("");
                  setCode("");
                  setNodes([]);
                  setSelectedNode(null);
                  setSelectedNodeId(null);
                }}
              >
                <Plus size={16} />
                Clear
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-xs font-semibold text-zinc-400 uppercase mr-1">Try Topics:</span>
            {examples.map((example) => (
              <button
                className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-600 hover:border-teal-500 hover:text-teal-600 transition dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-teal-400"
                key={example}
                type="button"
                onClick={() => setPrompt(example)}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Multi-Panel Workspace Dashboard */}
      <section className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 grid gap-6 lg:grid-cols-[330px_1fr_380px]">

        {/* Left Workspace Panel (Code / Visual Editor / History) */}
        <div className="rounded-xl border border-zinc-200/80 bg-white/40 p-4 shadow-sm backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/40 flex flex-col h-[650px] overflow-hidden">
          <div className="flex border-b border-zinc-200/60 pb-2 mb-3 dark:border-zinc-800/60 justify-between items-center">
            <div className="flex gap-1.5">
              <button
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${leftTab === "code" ? "bg-teal-500/10 text-teal-600 dark:text-teal-400" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
                onClick={() => setLeftTab("code")}
              >
                <Braces size={12} className="inline mr-1" /> Code
              </button>
              <button
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${leftTab === "visual" ? "bg-teal-500/10 text-teal-600 dark:text-teal-400" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
                onClick={() => setLeftTab("visual")}
              >
                <Edit3 size={12} className="inline mr-1" /> Two-Way Edit
              </button>
            </div>

            <button
              className={`px-2 py-1 text-[10px] uppercase font-bold rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 transition`}
              onClick={() => setLeftTab("saved")}
            >
              Saved ({saved.length})
            </button>
          </div>

          {/* Left Tab Contents */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
            {leftTab === "code" && (
              <div className="space-y-3 h-full flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase">Mermaid Canvas Syntax</span>
                  <button
                    className="text-[10px] text-teal-600 hover:text-teal-500 dark:text-teal-400 dark:hover:text-teal-300 flex items-center gap-1 font-semibold"
                    onClick={handleTriggerSync}
                    disabled={isSyncing}
                  >
                    <RefreshCw size={10} className={isSyncing ? "animate-spin" : ""} />
                    {isSyncing ? "Syncing..." : "Sync AI Explanations"}
                  </button>
                </div>
                <div className="flex-1 min-h-[420px] rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden text-xs">
                  <CodeEditor code={code} onChange={setCode} />
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed italic">
                  💡 Type standard Mermaid nodes. Changing the code updates the chart, and clicking "Sync AI Explanations" updates interactive specs!
                </p>
              </div>
            )}

            {leftTab === "visual" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-100 pb-2 dark:border-zinc-800">
                  <Info size={14} className="text-teal-500" />
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    <strong>Two-way visual editing</strong>: Edit the node labels below. The system automatically rewrites the Mermaid syntax and refreshes the canvas instantly!
                  </p>
                </div>
                <div className="space-y-3">
                  {nodes.length === 0 ? (
                    <div className="text-center py-8 text-zinc-400 text-xs">No active nodes in system to edit. Generate a diagram!</div>
                  ) : (
                    nodes.map((node) => (
                      <div key={node.id} className="p-3 rounded-lg border border-zinc-200/80 bg-zinc-50/50 dark:border-zinc-800/80 dark:bg-zinc-900/50 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 px-1 py-0.5 rounded font-bold">
                            ID: {node.id}
                          </span>
                          <span className="text-[10px] text-zinc-400 italic">Decl. Found</span>
                        </div>
                        <input
                          type="text"
                          className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded px-2.5 py-1 text-xs outline-none focus:border-teal-500"
                          value={node.label}
                          onChange={(e) => handleVisualLabelChange(node.id, e.target.value)}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {leftTab === "saved" && (
              <div className="space-y-2 h-full overflow-y-auto">
                <SavedDiagrams diagrams={saved} onLoad={loadDiagram} />
              </div>
            )}
          </div>
        </div>

        {/* Center Panel (Interactive Canvas & Toolbar) */}
        <div className="grid gap-4 self-start">
          <div className="toolbar rounded-xl border border-zinc-200/80 bg-white/70 px-4 py-3 shadow-sm backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/70">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-zinc-400 mr-1">Active View:</span>
              <div className="segmented" role="tablist" aria-label="Diagram view">
                <ModeButton active={view === "visual"} icon={Eye} label="Canvas" onClick={() => setView("visual")} />
                <ModeButton active={view === "code"} icon={Braces} label="Syntax View" onClick={() => setView("code")} />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-lg bg-teal-100 px-2.5 py-1 text-xs font-semibold text-teal-800 dark:bg-teal-500/20 dark:text-teal-300 border border-teal-200/30">
                Type: {diagramType.toUpperCase()}
              </span>
              <button className="icon-button hover:border-teal-500/50" type="button" title="Save diagram" onClick={handleSave}>
                <Save size={16} />
              </button>
              <button className="icon-button hover:border-teal-500/50" type="button" title="Copy share link" onClick={handleShare}>
                <Share2 size={16} />
              </button>
              <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
              <button
                className="icon-button hover:border-teal-500/50"
                type="button"
                title="Download SVG"
                disabled={!canExport}
                onClick={() => handleExport(downloadSvg, "SVG")}
              >
                <FileText size={16} />
              </button>
              <button
                className="icon-button hover:border-teal-500/50"
                type="button"
                title="Download PNG"
                disabled={!canExport}
                onClick={() => handleExport(downloadPng, "PNG")}
              >
                <FileImage size={16} />
              </button>
              <button
                className="icon-button hover:border-teal-500/50"
                type="button"
                title="Download PDF"
                disabled={!canExport}
                onClick={() => handleExport(downloadPdf, "PDF")}
              >
                <Download size={16} />
              </button>
            </div>
          </div>

          {error ? <div className="notice-error animate-fade-in">{error}</div> : null}
          {status ? <div className="notice animate-fade-in">{status}</div> : null}

          {/* Interactive SVG Renderer Area */}
          <div className="workspace rounded-xl overflow-hidden border border-zinc-200 bg-white/50 backdrop-blur shadow-sm dark:border-zinc-800 dark:bg-zinc-950/50 min-h-[580px]">
            {view === "visual" ? (
              <DiagramPreview
                code={code}
                isDark={isDark}
                nodes={nodes}
                onNodeSelect={handleNodeSelect}
                selectedNodeId={selectedNodeId}
              />
            ) : (
              <div className="p-4 h-[580px] bg-zinc-950 font-mono text-xs">
                <CodeEditor code={code} onChange={setCode} />
              </div>
            )}
          </div>
        </div>

        {/* Right Workspace Panel (Specs / Code Snippet / Docs / Chat) */}
        <div className="rounded-xl border border-zinc-200/80 bg-white/40 p-4 shadow-sm backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/40 flex flex-col h-[650px] overflow-hidden">

          {/* Tab Navigation header */}
          <div className="grid grid-cols-4 gap-1 border-b border-zinc-200/60 pb-2 mb-3 dark:border-zinc-800/60">
            <button
              className={`py-1.5 text-[11px] font-bold rounded-lg transition-all ${rightTab === "specs" ? "bg-teal-500/10 text-teal-600 dark:text-teal-400" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
              onClick={() => setRightTab("specs")}
            >
              Specs
            </button>
            <button
              className={`py-1.5 text-[11px] font-bold rounded-lg transition-all ${rightTab === "docs" ? "bg-teal-500/10 text-teal-600 dark:text-teal-400" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
              onClick={() => setRightTab("docs")}
            >
              Study Guide
            </button>
            <button
              className={`py-1.5 text-[11px] font-bold rounded-lg transition-all ${rightTab === "roadmap" ? "bg-teal-500/10 text-teal-600 dark:text-teal-400" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
              onClick={() => setRightTab("roadmap")}
            >
              Roadmap
            </button>
            <button
              className={`py-1.5 text-[11px] font-bold rounded-lg transition-all ${rightTab === "chat" ? "bg-teal-500/10 text-teal-600 dark:text-teal-400" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
              onClick={() => setRightTab("chat")}
            >
              Chatbot
            </button>
          </div>

          {/* Right Panel Tab Contents */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">

            {/* Specs Tab (Selected Node Specs & Code Snippets) */}
            {rightTab === "specs" && (
              <div className="space-y-4 animate-fade-in">
                {!selectedNode ? (
                  <div className="text-center py-16 px-4 space-y-3">
                    <div className="mx-auto w-12 h-12 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                      <HelpCircle size={24} className="animate-pulse" />
                    </div>
                    <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-200">Inspect Component</h3>
                    <p className="text-xs text-zinc-400 max-w-[240px] mx-auto leading-relaxed">
                      Hover nodes for quick info, or click a diagram component to view custom mock code, technical specifications, and voice explanations.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                          {selectedNode.techStack.split(",")[0]}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {speakingState === "playing" ? (
                            <div className="flex gap-1">
                              <button
                                className="h-6 w-6 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 flex items-center justify-center text-xs"
                                onClick={toggleSpeechPause}
                                title="Pause Voice"
                              >
                                <Pause size={10} />
                              </button>
                              <button
                                className="h-6 w-6 rounded bg-teal-500/20 text-teal-600 flex items-center justify-center text-xs hover:bg-teal-500/30"
                                onClick={stopSpeaking}
                                title="Stop Voice"
                              >
                                <Square size={10} />
                              </button>
                            </div>
                          ) : (
                            <button
                              className="h-6 px-2 rounded-lg bg-teal-500 text-white font-bold text-[10px] flex items-center gap-1 shadow hover:bg-teal-400 transition"
                              onClick={() => speakText(`${selectedNode.label}. ${selectedNode.details}`)}
                            >
                              <Volume2 size={10} /> Listen
                            </button>
                          )}
                        </div>
                      </div>
                      <h2 className="text-base font-extrabold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
                        {selectedNode.label}
                      </h2>
                    </div>

                    {/* Brief explanation */}
                    <div className="p-3 bg-teal-500/5 rounded-xl border border-teal-500/10 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
                      <strong>Role</strong>: {selectedNode.explanation}
                    </div>

                    {/* Technical deep dive - expand/collapse section */}
                    <div className="space-y-1">
                      <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Technical Deep Dive</h4>
                      <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                        {selectedNode.details}
                      </p>
                    </div>

                    {/* Tech stack */}
                    <div className="space-y-1">
                      <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Technologies Used</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedNode.techStack.split(",").map(tech => (
                          <span key={tech} className="px-2 py-0.5 rounded text-[10px] bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 font-medium">
                            {tech.trim()}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Subcomponents list */}
                    {selectedNode.subComponents && selectedNode.subComponents.length > 0 && (
                      <div className="space-y-1">
                        <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Logical Modules</h4>
                        <ul className="grid grid-cols-2 gap-1.5">
                          {selectedNode.subComponents.map((sub, idx) => (
                            <li key={idx} className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-950 p-1.5 rounded-lg border border-zinc-200/50 dark:border-zinc-800/50">
                              <span className="w-1 h-1 rounded-full bg-teal-500"></span>
                              {sub}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Simulated Code Snippet (Requirement 5) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Component API / Mock Code</h4>
                        <button
                          className="text-[10px] text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                          onClick={() => copyCodeSnippet(selectedNode.codeSnippet, selectedNode.id)}
                        >
                          {copiedNodeId === selectedNode.id ? (
                            <>
                              <Check size={10} className="text-emerald-500" /> Copied!
                            </>
                          ) : (
                            <>
                              <Copy size={10} /> Copy Snippet
                            </>
                          )}
                        </button>
                      </div>
                      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 p-3 max-h-[180px] overflow-auto custom-scrollbar text-[10px] font-mono text-zinc-300 leading-relaxed text-left">
                        <pre>{selectedNode.codeSnippet}</pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Study Docs Tab (Auto Documentation + Viva Questions) */}
            {rightTab === "docs" && (
              <div className="space-y-5 animate-fade-in">
                <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2">
                  <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-1.5">
                    <FileText size={15} className="text-teal-500" /> Auto Documentation
                  </h3>
                  <p className="text-[10px] text-zinc-400">Notes & Viva exam preparation sets generated in real-time.</p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Architectural Summary</h4>
                  <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-lg border border-zinc-200/50 dark:border-zinc-800/50">
                    {documentation.summary}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Study Notes</h4>
                  <div className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 markdown-docs-preview max-h-[160px] overflow-y-auto custom-scrollbar bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-lg border border-zinc-200/50 dark:border-zinc-800/50 whitespace-pre-line text-left">
                    {documentation.notes}
                  </div>
                </div>

                {/* Viva/Interview Prep Questions (Requirement 5) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                      <Award size={12} className="text-emerald-500" /> Viva / Interview Q&A
                    </h4>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded font-mono">Exam Mode</span>
                  </div>

                  {documentation.vivaQuestions.length === 0 ? (
                    <div className="text-center py-6 text-zinc-400 text-xs">No active exam questions found. Generate a diagram!</div>
                  ) : (
                    <div className="space-y-2">
                      {documentation.vivaQuestions.map((q, idx) => (
                        <div key={idx} className="rounded-lg border border-zinc-200/60 bg-white dark:border-zinc-800/60 dark:bg-zinc-900 overflow-hidden text-left">
                          <button
                            className="w-full px-3 py-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800"
                            onClick={() => setExpandedVivaIndex(expandedVivaIndex === idx ? null : idx)}
                          >
                            <span className="flex gap-1.5">
                              <span className="text-teal-500 font-bold font-mono">Q{idx + 1}:</span> {q.question}
                            </span>
                            {expandedVivaIndex === idx ? <ChevronUp size={14} className="flex-shrink-0" /> : <ChevronDown size={14} className="flex-shrink-0" />}
                          </button>
                          {expandedVivaIndex === idx && (
                            <div className="px-3 py-2 bg-emerald-500/[0.02] text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800">
                              <strong className="text-emerald-500 font-bold block mb-0.5">Answer:</strong>
                              {q.answer}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timeline Roadmap Tab */}
            {rightTab === "roadmap" && (
              <div className="space-y-5 animate-fade-in">
                <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2">
                  <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-1.5">
                    <Map size={15} className="text-teal-500" /> Technology Roadmap
                  </h3>
                  <p className="text-[10px] text-zinc-400">Step-by-step master plan for technologies inside the drawing.</p>
                </div>

                <h4 className="text-xs font-extrabold text-teal-600 dark:text-teal-400 border-l-2 border-teal-500 pl-2">
                  {learningRoadmap.title}
                </h4>

                <div className="space-y-4 relative border-l border-zinc-200 dark:border-zinc-800 ml-2.5 pl-4 text-left">
                  {learningRoadmap.milestones.length === 0 ? (
                    <div className="text-center py-8 text-zinc-400 text-xs">No active roadmaps found. Generate a diagram!</div>
                  ) : (
                    learningRoadmap.milestones.map((m, idx) => (
                      <div key={idx} className="relative space-y-1.5 pb-2">
                        {/* Dot indicator */}
                        <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-teal-500 border border-white dark:border-zinc-950 flex items-center justify-center"></span>

                        <h5 className="text-xs font-bold text-zinc-800 dark:text-zinc-100 leading-tight">
                          {m.title}
                        </h5>
                        <p className="text-[11px] text-zinc-500 leading-relaxed">
                          {m.description}
                        </p>

                        {m.resources && m.resources.length > 0 && (
                          <div className="text-[10px] text-zinc-400">
                            <strong>Recommended Resources:</strong> {m.resources.join(" • ")}
                          </div>
                        )}

                        {m.project && (
                          <div className="text-[10px] bg-teal-500/5 text-teal-600 dark:text-teal-400 px-2 py-1 rounded border border-teal-500/10 inline-block font-medium">
                            📁 <strong>Practice Project:</strong> {m.project}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Context-aware AI Chatbot Tab */}
            {rightTab === "chat" && (
              <div className="flex flex-col h-full animate-fade-in justify-between">
                <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2 mb-2">
                  <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-1.5">
                    <Bot size={15} className="text-teal-500" /> Active Context Assistant
                  </h3>
                  <p className="text-[10px] text-zinc-400">AI chat pre-loaded with the current diagram nodes & context.</p>
                </div>

                {/* Conversation area */}
                <div className="flex-1 min-h-[340px] max-h-[360px] overflow-y-auto custom-scrollbar border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/50 p-3 space-y-2.5 text-xs text-left">
                  {chatHistory.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex flex-col max-w-[85%] rounded-xl p-2.5 text-xs leading-relaxed ${msg.sender === "user"
                          ? "ml-auto bg-teal-600 text-white shadow-sm"
                          : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
                        }`}
                    >
                      <span className="text-[9px] font-bold opacity-60 uppercase mb-0.5 font-mono">
                        {msg.sender === "user" ? "You" : "Diagram Assistant"}
                      </span>
                      <p className="whitespace-pre-line">{msg.text}</p>
                    </div>
                  ))}
                  {isAssistantLoading && (
                    <div className="flex items-center gap-1.5 text-zinc-400 italic">
                      <RefreshCw size={12} className="animate-spin text-teal-500" /> Coding assistant analyzing context...
                    </div>
                  )}
                </div>

                {/* Input action */}
                <div className="mt-2 flex gap-1.5">
                  <input
                    type="text"
                    className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20"
                    placeholder="Ask about this diagram..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendChatMessage()}
                  />
                  <button
                    className="h-8 w-8 rounded-xl bg-teal-600 hover:bg-teal-500 text-white flex items-center justify-center shadow"
                    onClick={handleSendChatMessage}
                  >
                    <Send size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Excalidraw Whiteboard Drawing Section at bottom */}
      <section className="mx-auto max-w-[1400px] px-4 py-3 sm:px-6 lg:px-8">
        <div className="border-t border-zinc-200/80 pt-6 dark:border-zinc-800/80">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-bold tracking-tight">Interactive Sketchboard</h2>
            <span className="text-xs bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-500">Draft Canvas</span>
          </div>
          <Suspense fallback={<div className="whiteboard-shell min-h-[300px] flex items-center justify-center text-zinc-400">Loading whiteboard...</div>}>
            <Whiteboard isDark={isDark} code={code} nodes={nodes} />
          </Suspense>
        </div>
      </section>
    </main>
  );
}

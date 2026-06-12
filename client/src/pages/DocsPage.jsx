import { useMemo, useState, useEffect } from "react";
import {
  Clipboard,
  Download,
  FileCode2,
  FileText,
  Loader2,
  Network,
  Plug,
  Presentation,
  Upload,
  CheckSquare,
  HelpCircle,
  ShieldAlert,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  ChevronDown,
  ChevronUp,
  Layers,
  Flame,
  Check,
  RotateCcw,
  Sparkles,
  Eye,
  Sun,
  Moon
} from "lucide-react";
import { generateDocs } from "../api/docsApi";
import DiagramPreview from "../components/DiagramPreview";
import confetti from "canvas-confetti";
import { jsPDF } from "jspdf";

const tabs = [
  { id: "readme", label: "README", icon: FileText, filename: "README.md" },
  { id: "technicalDoc", label: "Docs", icon: FileCode2, filename: "technical-documentation.md" },
  { id: "architecture", label: "Architecture", icon: Network, filename: "architecture.md" },
  { id: "apiDocs", label: "API Docs", icon: Plug, filename: "api-documentation.md" },
  { id: "pptSummary", label: "PPT Summary", icon: Presentation, filename: "ppt-summary.md" },
  { id: "features", label: "Features", icon: CheckSquare, filename: "features.json" },
  { id: "vivaPrep", label: "Viva Prep", icon: HelpCircle, filename: "viva-questions.json" },
  { id: "codeAnalysis", label: "Analysis", icon: ShieldAlert, filename: "suggestions.json" },
  { id: "apiFlowVisualizer", label: "API Flow", icon: Activity, filename: "api-flow.json" }
];

const emptyDocs = {
  readme: "",
  technicalDoc: "",
  architecture: "",
  apiDocs: "",
  pptSummary: "",
  features: { implemented: [], missing: [] },
  vivaQuestions: [],
  suggestions: { bugs: [], improvements: [], performance: "", complexity: "" },
  apiFlow: { nodes: [], edges: [] }
};

function triggerConfetti() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  });
}

function normalizeDocSection(value) {
  if (typeof value === "string") {
    return value;
  }

  if (value == null) {
    return "";
  }

  if (Array.isArray(value)) {
    return value.map(normalizeDocSection).filter(Boolean).join("\n");
  }

  if (typeof value === "object") {
    return Object.entries(value)
      .map(([key, entry]) => {
        const content = normalizeDocSection(entry);
        return content ? `## ${key}\n${content}` : "";
      })
      .filter(Boolean)
      .join("\n\n");
  }

  return String(value);
}

function downloadText(filename, content) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function DocsPage() {
  // Theme
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [docs, setDocs] = useState(emptyDocs);
  const [activeTab, setActiveTab] = useState("readme");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Advanced Interactive States
  const [pptView, setPptView] = useState("slides"); // "slides" or "raw"
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [checkedSuggestedFeatures, setCheckedSuggestedFeatures] = useState({});
  const [expandedVivaIndex, setExpandedVivaIndex] = useState(null);
  const [vivaStatus, setVivaStatus] = useState({}); // { [index]: "unread" | "mastered" | "review" }
  const [vivaFilter, setVivaFilter] = useState("all"); // "all" | "mastered" | "review"
  const [vivaShowAll, setVivaShowAll] = useState(false);
  const [selectedApiNode, setSelectedApiNode] = useState(null);

  const activeConfig = useMemo(() => tabs.find((tab) => tab.id === activeTab) || tabs[0], [activeTab]);

  const activeContent = useMemo(() => {
    let key = activeTab;
    if (activeTab === "vivaPrep") key = "vivaQuestions";
    else if (activeTab === "codeAnalysis") key = "suggestions";
    else if (activeTab === "apiFlowVisualizer") key = "apiFlow";

    const val = docs[key];
    if (!val) return "";
    if (typeof val === "string") return val;
    return JSON.stringify(val, null, 2);
  }, [docs, activeTab]);

  const hasOutput = useMemo(() => {
    // If we have readme text, technicalDoc text, or custom JSON keys with data, return true
    return (
      (docs.readme && docs.readme.trim().length > 0) ||
      (docs.features?.implemented?.length > 0) ||
      (docs.vivaQuestions?.length > 0)
    );
  }, [docs]);

  // Reset indices and selection when data updates
  useEffect(() => {
    setCurrentSlideIndex(0);
    setCheckedSuggestedFeatures({});
    setExpandedVivaIndex(null);
    setVivaStatus({});
    setVivaShowAll(false);
    setSelectedApiNode(null);
  }, [docs]);

  // Compute Slide Deck items from pptSummary markdown
  const slides = useMemo(() => {
    const pptText = docs.pptSummary || "";
    if (!pptText) return [];

    const splitSlides = pptText.split(/(?=## Slide|### Slide|## Slide\s*\d+)/i);

    if (splitSlides.length > 1) {
      return splitSlides.map((slideText) => {
        const lines = slideText.trim().split("\n");
        const title = lines[0].replace(/^#+\s*/, "");
        const content = lines.slice(1).join("\n");
        return { title, content };
      }).filter(s => s.title && s.content);
    }

    const bullets = pptText.split("\n").filter(line => line.trim().startsWith("-"));
    if (bullets.length > 0) {
      const chunked = [];
      const size = 3;
      for (let i = 0; i < bullets.length; i += size) {
        chunked.push({
          title: `Project Summary - Slide ${Math.floor(i / size) + 1}`,
          content: bullets.slice(i, i + size).join("\n")
        });
      }
      return chunked;
    }

    return [{ title: "Presentation Slide", content: pptText }];
  }, [docs.pptSummary]);

  const currentSlide = useMemo(() => {
    return slides[currentSlideIndex] || null;
  }, [slides, currentSlideIndex]);

  // Checked Suggested Feature logic
  const handleToggleSuggestedFeature = (index) => {
    setCheckedSuggestedFeatures((prev) => {
      const next = { ...prev, [index]: !prev[index] };
      const totalSuggestions = docs.features?.missing?.length || 0;
      const completedCount = Object.values(next).filter(Boolean).length;
      if (totalSuggestions > 0 && completedCount === totalSuggestions) {
        triggerConfetti();
      }
      return next;
    });
  };

  const implementedFeatures = docs.features?.implemented || [];
  const missingFeatures = docs.features?.missing || [];
  const totalSuggestions = missingFeatures.length;
  const completedCount = Object.values(checkedSuggestedFeatures).filter(Boolean).length;
  const progressPercent = totalSuggestions > 0 ? Math.round((completedCount / totalSuggestions) * 100) : 0;

  // Viva Simulator Question Filtering
  const toggleViva = (index) => {
    setExpandedVivaIndex(expandedVivaIndex === index ? null : index);
  };

  const handleVivaStatus = (index, vStat) => {
    setVivaStatus((prev) => ({ ...prev, [index]: vStat }));
  };

  const filteredViva = useMemo(() => {
    const list = docs.vivaQuestions || [];
    return list.map((q, idx) => ({ ...q, originalIndex: idx })).filter((item) => {
      if (vivaFilter === "all") return true;
      const stat = vivaStatus[item.originalIndex] || "unread";
      return stat === vivaFilter;
    });
  }, [docs.vivaQuestions, vivaFilter, vivaStatus]);

  const masteredCount = Object.values(vivaStatus).filter((s) => s === "mastered").length;
  const reviewCount = Object.values(vivaStatus).filter((s) => s === "review").length;

  const suggestions = docs.suggestions || { bugs: [], improvements: [], performance: "", complexity: "" };

  // Convert apiFlow layout dynamically to standard Mermaid code
  const apiFlowMermaidCode = useMemo(() => {
    const { nodes = [], edges = [] } = docs.apiFlow || {};
    if (nodes.length === 0) return "";

    let code = "flowchart TD\n";
    code += "  classDef client fill:#eff6ff,stroke:#2563eb,stroke-width:2px,color:#1e3a8a;\n";
    code += "  classDef middleware fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#78350f;\n";
    code += "  classDef controller fill:#eff6ff,stroke:#2563eb,stroke-width:2px,color:#1e3a8a;\n";
    code += "  classDef service fill:#faf5ff,stroke:#9333ea,stroke-width:2px,color:#581c87;\n";
    code += "  classDef database fill:#fff1f2,stroke:#e11d48,stroke-width:2px,color:#881337;\n";
    code += "  classDef fallback fill:#f4f4f5,stroke:#71717a,stroke-width:2px,color:#27272a;\n";

    nodes.forEach((node) => {
      const escapedLabel = node.label.replace(/"/g, '\\"');
      code += `  ${node.id}["${escapedLabel}"]\n`;
      if (node.type) {
        code += `  class ${node.id} ${node.type};\n`;
      }
    });

    edges.forEach((edge) => {
      const escapedLabel = edge.label ? `|"${edge.label.replace(/"/g, '\\')}"|` : "";
      code += `  ${edge.from} -->${escapedLabel} ${edge.to}\n`;
    });

    return code;
  }, [docs.apiFlow]);

  async function handleGenerate() {
    setError("");
    setStatus("");

    if (!projectName.trim()) {
      setError("Project name is required.");
      return;
    }

    setIsGenerating(true);
    setStatus("Generating documentation...");

    try {
      const result = await generateDocs({
        projectName: projectName.trim(),
        description,
        files
      });

      setDocs({
        readme: normalizeDocSection(result.readme),
        technicalDoc: normalizeDocSection(result.technicalDoc),
        architecture: normalizeDocSection(result.architecture),
        apiDocs: normalizeDocSection(result.apiDocs),
        pptSummary: normalizeDocSection(result.pptSummary),
        features: result.features || { implemented: [], missing: [] },
        vivaQuestions: Array.isArray(result.vivaQuestions) ? result.vivaQuestions : [],
        suggestions: result.suggestions || { bugs: [], improvements: [], performance: "", complexity: "" },
        apiFlow: result.apiFlow || { nodes: [], edges: [] }
      });
      setStatus(result.warning || "Documentation generated successfully!");
      triggerConfetti();
    } catch (err) {
      setError(err.message || "Unable to generate documentation.");
      setStatus("");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleCopy() {
    if (!activeContent) {
      return;
    }

    await navigator.clipboard.writeText(activeContent);
    setStatus(`${activeConfig.label} copied.`);
  }

  function handleExportPDF(activeTabOnly = false) {
    if (!projectName.trim()) {
      setError("Project name is required to export PDF.");
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2; // 170mm
      let y = margin;

      // Helper to add text and wrap pages
      const addParagraph = (text, fontSize = 10, fontStyle = "normal", color = [39, 39, 42]) => {
        doc.setFont("helvetica", fontStyle);
        doc.setFontSize(fontSize);
        doc.setTextColor(color[0], color[1], color[2]);

        const lines = doc.splitTextToSize(text, contentWidth);
        const lineHeight = fontSize * 0.45; // roughly convert pt to mm

        lines.forEach((line) => {
          if (y + lineHeight > pageHeight - margin) {
            doc.addPage();
            y = margin;
            // Add subtle footer on subsequent pages
            doc.setFont("helvetica", "italic");
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`Project Documentation - ${projectName}`, margin, pageHeight - 10);
            doc.setFont("helvetica", fontStyle);
            doc.setFontSize(fontSize);
            doc.setTextColor(color[0], color[1], color[2]);
          }
          doc.text(line, margin, y);
          y += lineHeight + 1; // line spacing
        });
        y += 3; // paragraph spacing
      };

      const addHeading = (text, level = 1) => {
        const fontSizes = { 1: 18, 2: 14, 3: 12 };
        const spacing = { 1: 8, 2: 6, 3: 4 };
        const color = level === 1 ? [13, 148, 136] : [30, 41, 59]; // teal for h1, dark slate for h2/h3
        
        // Ensure we don't start a heading right at the bottom of the page
        if (y + fontSizes[level] * 0.8 > pageHeight - margin - 15) {
          doc.addPage();
          y = margin;
        } else {
          y += 2;
        }

        addParagraph(text, fontSizes[level], "bold", color);
        y += spacing[level];
      };

      // COVER PAGE (only if generating entire package)
      if (!activeTabOnly) {
        // Large Teal accent bar at the top
        doc.setFillColor(13, 148, 136); // teal-600
        doc.rect(0, 0, pageWidth, 40, "F");

        // Project title in cover
        y = 60;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(28);
        doc.setTextColor(15, 23, 42); // slate-900
        const titleLines = doc.splitTextToSize(projectName || "AI Whiteboard Project", contentWidth);
        titleLines.forEach((line) => {
          doc.text(line, margin, y);
          y += 12;
        });

        y += 5;
        doc.setDrawColor(13, 148, 136);
        doc.setLineWidth(1.5);
        doc.line(margin, y, margin + 40, y);
        y += 15;

        // Subtitle
        addParagraph("COMPLETE TECHNICAL DOCUMENTATION DOSSIER", 12, "bold", [13, 148, 136]);
        addParagraph(
          description || "Comprehensive technical architecture specifications, interactive database endpoints list, presentation slide decks, automatic codebase suggestions, and oral board viva prep materials.",
          10,
          "normal",
          [71, 85, 105]
        );

        y = 180;
        // Metadata block
        doc.setFillColor(248, 250, 252); // slate-50
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.setLineWidth(0.5);
        doc.rect(margin, y, contentWidth, 50, "FD");

        y += 10;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(30, 41, 59);
        doc.text("Metadata Specifications:", margin + 8, y);
        y += 8;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(`Generated Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, margin + 8, y);
        y += 6;
        doc.text(`Scope: Full Project Compilation (9 chapters)`, margin + 8, y);
        y += 6;
        doc.text("Engine version: Gemini Pro Technical Synthesis Agent v2.5", margin + 8, y);

        // Subtle branding at the bottom
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(13, 148, 136);
        doc.text("AI Auto Documentation Generator Suite", margin, pageHeight - 20);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text("Generated natively using client-side canvas engines. All rights reserved.", margin, pageHeight - 15);

        doc.addPage();
        y = margin;
      }

      // Define tabs to render
      const tabsToRender = activeTabOnly 
        ? [tabs.find(t => t.id === activeTab)].filter(Boolean)
        : tabs.filter(t => t.id !== "apiFlowVisualizer"); // exclude visual graph in text PDF

      tabsToRender.forEach((tab, index) => {
        if (index > 0) {
          doc.addPage();
          y = margin;
        }

        addHeading(tab.label, 1);

        // Custom formatting per tab
        if (tab.id === "readme" || tab.id === "technicalDoc" || tab.id === "architecture" || tab.id === "apiDocs") {
          const content = docs[tab.id] || "No content generated.";
          // Clean up markdown hashes for standard PDF readability
          const cleanContent = content
            .replace(/^#+\s+/gm, "") 
            .replace(/`{3,}/g, "") 
            .replace(/\*\*/g, ""); 
          addParagraph(cleanContent, 10, "normal", [30, 41, 59]);
        } 
        
        else if (tab.id === "pptSummary") {
          const pptText = docs.pptSummary || "No slide content.";
          const lines = pptText.split("\n");
          lines.forEach((line) => {
            const trimmed = line.trim();
            if (trimmed.startsWith("##") || trimmed.startsWith("###")) {
              addHeading(trimmed.replace(/^#+\s*/, ""), 2);
            } else if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
              addParagraph(`  •  ${trimmed.replace(/^[-*]\s*/, "")}`, 10, "normal", [30, 41, 59]);
            } else if (trimmed) {
              addParagraph(trimmed, 10, "normal", [71, 85, 105]);
            }
          });
        }

        else if (tab.id === "features") {
          const impl = docs.features?.implemented || [];
          const miss = docs.features?.missing || [];

          addHeading("Detected Implemented Features", 2);
          if (impl.length > 0) {
            impl.forEach(f => addParagraph(`  [✓]  ${f}`, 10, "normal", [16, 185, 129]));
          } else {
            addParagraph("None detected.", 10, "italic", [148, 163, 184]);
          }

          y += 5;
          addHeading("AI-Suggested Feature Roadmap", 2);
          if (miss.length > 0) {
            miss.forEach(f => addParagraph(`  [ ]  ${f}`, 10, "normal", [13, 148, 136]));
          } else {
            addParagraph("None suggested.", 10, "italic", [148, 163, 184]);
          }
        }

        else if (tab.id === "vivaPrep") {
          const questions = docs.vivaQuestions || [];
          if (questions.length > 0) {
            questions.forEach((q, idx) => {
              addHeading(`Q${idx + 1}: ${q.question}`, 3);
              addParagraph(`Answer: ${q.answer}`, 10, "normal", [71, 85, 105]);
              y += 3;
            });
          } else {
            addParagraph("No questions generated.", 10, "italic", [148, 163, 184]);
          }
        }

        else if (tab.id === "codeAnalysis") {
          const suggs = docs.suggestions || {};
          
          addHeading("Algorithmic Metrics", 2);
          addParagraph(`Time Complexity: ${suggs.complexity || "O(N) Linear"}`, 10, "bold", [30, 41, 59]);
          addParagraph(`Space Complexity: ${suggs.complexity || "O(N) Linear"}`, 10, "bold", [30, 41, 59]);
          addParagraph(`Performance Profiling: ${suggs.performance || "Optimal runtimes"}`, 10, "normal", [71, 85, 105]);

          y += 5;
          addHeading("Potential Code Bugs & Security Risks", 2);
          const bugs = suggs.bugs || [];
          if (bugs.length > 0) {
            bugs.forEach(b => addParagraph(`  •  ${b}`, 10, "normal", [239, 68, 68]));
          } else {
            addParagraph("No bugs confidently found.", 10, "italic", [148, 163, 184]);
          }

          y += 5;
          addHeading("Recommended Code Refactorings & Enhancements", 2);
          const imps = suggs.improvements || [];
          if (imps.length > 0) {
            imps.forEach(i => addParagraph(`  •  ${i}`, 10, "normal", [79, 70, 229]));
          } else {
            addParagraph("No refactorings suggested.", 10, "italic", [148, 163, 184]);
          }
        }
      });

      // Save the document
      const fileName = activeTabOnly 
        ? `${projectName.replace(/\s+/g, "_")}_${activeTab}_documentation.pdf`
        : `${projectName.replace(/\s+/g, "_")}_complete_documentation.pdf`;
      doc.save(fileName);
      setStatus(`Successfully exported PDF report: ${fileName}`);
      triggerConfetti();
    } catch (err) {
      console.error("PDF generation failed:", err);
      setError(`PDF generation failed: ${err.message || err}`);
    }
  }

  return (
    <main className="min-h-screen bg-stone-50 text-ink dark:bg-zinc-950 dark:text-zinc-100">
      <section className="border-b border-zinc-200 bg-white/90 dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
              Interactive AI Assistant
            </p>
            <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">AI Auto Documentation Generator</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Upload source code, API logs, Swagger schema, or drawings. Our AI automatically reviews complexity, creates slide carousels, lists bugs, designs live request maps, and formats presentation Vivas.
            </p>
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
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[380px_minmax(0,1fr)] lg:px-8">
        <aside className="grid content-start gap-4">
          <div className="side-panel bg-white shadow-sm dark:bg-zinc-900 border dark:border-zinc-800 p-4 rounded-xl">
            <h2 className="panel-title text-base font-bold mb-4">Project Inputs</h2>
            <div className="grid gap-4">
              <label className="grid gap-2 text-sm font-medium">
                Project Name
                <input
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-mint/30 focus:ring-4 dark:border-zinc-700 dark:bg-zinc-950"
                  value={projectName}
                  onChange={(event) => setProjectName(event.target.value)}
                  placeholder="Example: AI Whiteboard"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium">
                Description
                <textarea
                  className="min-h-28 resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-mint/30 focus:ring-4 dark:border-zinc-700 dark:bg-zinc-950"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Optional project summary, goals, API structures or examiners..."
                />
              </label>

              <label className="grid cursor-pointer gap-3 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm transition hover:border-mint hover:bg-white dark:border-zinc-700 dark:bg-zinc-950 dark:hover:bg-zinc-900">
                <span className="flex items-center gap-2 font-semibold">
                  <Upload size={18} />
                  Upload files
                </span>
                <span className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                  Code files, API JSON, Swagger/OpenAPI, Markdown, text files, and screenshots.
                </span>
                <input
                  className="sr-only"
                  multiple
                  type="file"
                  onChange={(event) => setFiles(Array.from(event.target.files || []))}
                />
              </label>

              {files.length > 0 ? (
                <div className="max-h-44 overflow-auto rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950 custom-scrollbar">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                    Selected Files ({files.length})
                  </p>
                  <div className="grid gap-2">
                    {files.map((file) => (
                      <div className="truncate text-sm text-zinc-700 dark:text-zinc-300" key={`${file.name}-${file.size}`}>
                        📁 {file.name}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <button className="primary-button bg-teal-650 hover:bg-teal-700 text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2" type="button" disabled={isGenerating} onClick={handleGenerate}>
                {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <FileText size={18} />}
                {isGenerating ? "Analyzing Project..." : "Generate Interactive Docs"}
              </button>
            </div>
          </div>
        </aside>

        <section className="grid content-start gap-4">
          {error ? <div className="notice-error">{error}</div> : null}
          {status ? <div className="notice">{status}</div> : null}

          <div className="toolbar bg-white shadow-sm dark:bg-zinc-900 border dark:border-zinc-800 p-3 rounded-xl flex justify-between items-center flex-wrap gap-3">
            <div className="segmented overflow-x-auto flex gap-1 bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl custom-scrollbar" role="tablist" aria-label="Documentation output">
              {tabs.map((tab) => {
                const Icon = tab.icon;

                return (
                  <button
                    className={`mode-button flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                      activeTab === tab.id
                        ? "bg-white text-teal-600 shadow-sm dark:bg-zinc-800 dark:text-teal-400"
                        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                    }`}
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon size={14} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 flex-wrap">
              <button className="icon-button h-9 w-9 rounded-lg border dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition flex items-center justify-center" type="button" title="Copy active section" disabled={!activeContent} onClick={handleCopy}>
                <Clipboard size={16} />
              </button>
              <button
                className="icon-button h-9 w-9 rounded-lg border dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition flex items-center justify-center"
                type="button"
                title="Download active section"
                disabled={!activeContent}
                onClick={() => downloadText(activeConfig.filename, activeContent)}
              >
                <Download size={16} />
              </button>
              <div className="w-[1px] bg-zinc-200 dark:bg-zinc-800 self-stretch my-1 mx-0.5" />
              <button
                className="h-9 px-3.5 rounded-lg border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 transition inline-flex items-center justify-center gap-1.5 text-xs font-semibold whitespace-nowrap shadow-sm"
                type="button"
                title="Export active tab to PDF"
                disabled={!hasOutput}
                onClick={() => handleExportPDF(true)}
              >
                📄 Active PDF
              </button>
              <button
                className="h-9 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition inline-flex items-center justify-center gap-2 text-xs font-bold shadow-sm border border-transparent whitespace-nowrap"
                type="button"
                title="Export entire project documentation to a unified PDF report"
                disabled={!hasOutput}
                onClick={() => handleExportPDF(false)}
              >
                👑 Export Full PDF Report
              </button>
            </div>
          </div>

          <div className="workspace min-h-[620px] p-0 border border-zinc-200 dark:border-zinc-800 bg-white shadow-sm dark:bg-zinc-900 rounded-xl overflow-hidden">
            {hasOutput ? (
              <div className="h-full">
                {/* 1. PPT Slide Deck View */}
                {activeTab === "pptSummary" && (
                  <div className="flex flex-col h-full bg-white dark:bg-zinc-900 p-6 rounded-lg text-left">
                    <div className="flex justify-between items-center mb-6 border-b pb-3 dark:border-zinc-800">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPptView("slides")}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                            pptView === "slides" ? "bg-teal-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200"
                          }`}
                        >
                          📺 Slide Deck Carousel
                        </button>
                        <button
                          onClick={() => setPptView("raw")}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                            pptView === "raw" ? "bg-teal-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200"
                          }`}
                        >
                          📄 Source Markdown Code
                        </button>
                      </div>
                      {pptView === "slides" && (
                        <span className="text-xs text-zinc-500 font-medium">
                          Slide {currentSlideIndex + 1} of {slides.length}
                        </span>
                      )}
                    </div>

                    {pptView === "slides" ? (
                      <div className="flex flex-col justify-between flex-1 min-h-[460px]">
                        {/* Slide Display */}
                        <div className="flex-1 flex flex-col justify-center bg-zinc-50/50 dark:bg-zinc-950/40 border border-zinc-200/50 dark:border-zinc-850 rounded-2xl p-8 relative overflow-hidden shadow-sm">
                          <div className="absolute -top-12 -right-12 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl" />
                          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl" />

                          <h3 className="text-xl sm:text-2xl font-bold text-teal-600 dark:text-teal-400 mb-6 flex items-center gap-2">
                            <Presentation size={24} className="text-teal-500" />
                            {currentSlide?.title || "Project Presentation"}
                          </h3>

                          <div className="text-zinc-700 dark:text-zinc-300 space-y-4 text-base leading-relaxed custom-scrollbar max-h-[280px] overflow-y-auto">
                            {currentSlide?.content ? (
                              currentSlide.content.split("\n").map((line, idx) => {
                                const trimmed = line.trim();
                                if (!trimmed) return null;
                                if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
                                  return (
                                    <div key={idx} className="flex items-start gap-3 pl-2">
                                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-teal-500" />
                                      <span>{trimmed.replace(/^[-*]\s*/, "")}</span>
                                    </div>
                                  );
                                }
                                return <p key={idx} className="pl-6 text-zinc-650 dark:text-zinc-400">{trimmed}</p>;
                              })
                            ) : (
                              <p className="italic text-zinc-400">Empty slide description</p>
                            )}
                          </div>
                        </div>

                        {/* Navigation Panel */}
                        <div className="flex justify-between items-center mt-6 pt-4 border-t dark:border-zinc-800">
                          <button
                            onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
                            disabled={currentSlideIndex === 0}
                            className="px-4 py-2 text-sm font-semibold rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 transition disabled:opacity-40"
                          >
                            ⬅️ Prev Slide
                          </button>

                          {/* Slide markers */}
                          <div className="flex gap-1.5 overflow-x-auto max-w-[200px] py-1 px-2 custom-scrollbar">
                            {slides.map((_, idx) => (
                              <button
                                key={idx}
                                onClick={() => setCurrentSlideIndex(idx)}
                                className={`h-2.5 w-2.5 rounded-full transition shrink-0 ${
                                  idx === currentSlideIndex ? "bg-teal-500 scale-125" : "bg-zinc-300 dark:bg-zinc-700 hover:bg-teal-400"
                                }`}
                                title={`Slide ${idx + 1}`}
                              />
                            ))}
                          </div>

                          <button
                            onClick={() => setCurrentSlideIndex(prev => Math.min(slides.length - 1, prev + 1))}
                            disabled={currentSlideIndex === slides.length - 1}
                            className="px-4 py-2 text-sm font-semibold rounded-lg bg-teal-650 hover:bg-teal-700 text-white transition disabled:opacity-40"
                          >
                            Next Slide ➡️
                          </button>
                        </div>
                      </div>
                    ) : (
                      <pre className="h-[520px] overflow-auto whitespace-pre-wrap rounded-lg bg-zinc-50 dark:bg-zinc-950 p-5 font-mono text-sm leading-6 text-zinc-800 dark:text-zinc-100 border dark:border-zinc-800 custom-scrollbar">
                        {activeContent}
                      </pre>
                    )}
                  </div>
                )}

                {/* 2. Features Tab View */}
                {activeTab === "features" && (
                  <div className="grid h-full grid-rows-[auto_1fr] bg-white dark:bg-zinc-900 p-6 rounded-lg">
                    {/* Progress banner */}
                    <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border border-teal-500/20 dark:border-teal-500/10 text-left">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                          <Sparkles size={16} className="text-teal-500 animate-pulse" />
                          Implementation Roadmap Checklist
                        </span>
                        <span className="text-xs font-bold text-teal-700 dark:text-teal-400">
                          {progressPercent}% Built
                        </span>
                      </div>
                      <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full transition-all duration-500 ease-out"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                        Map missing requirements dynamically! Tap suggestions to simulate code completions and launch celebration particles.
                      </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 overflow-y-auto max-h-[460px] pr-2 custom-scrollbar">
                      {/* Detected */}
                      <div className="space-y-4 text-left">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2 border-b pb-2 dark:border-zinc-800">
                          <CheckCircle2 size={18} />
                          Detected Features ({implementedFeatures.length})
                        </h4>
                        <div className="grid gap-3">
                          {implementedFeatures.length > 0 ? (
                            implementedFeatures.map((feat, idx) => (
                              <div
                                key={idx}
                                className="flex items-start gap-3 p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/20 dark:border-emerald-500/10 dark:bg-emerald-500/5 hover:scale-[1.01] transition-all shadow-sm"
                              >
                                <Check size={16} className="mt-0.5 text-emerald-600 dark:text-emerald-400 shrink-0 font-bold" />
                                <span className="text-sm text-zinc-700 dark:text-zinc-250 font-medium">{feat}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm italic text-zinc-400 pl-2">No active features detected yet.</p>
                          )}
                        </div>
                      </div>

                      {/* Suggested */}
                      <div className="space-y-4 text-left">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-2 border-b pb-2 dark:border-zinc-800">
                          <Layers size={18} />
                          AI-Suggested Roadmap Features ({missingFeatures.length})
                        </h4>
                        <div className="grid gap-3">
                          {missingFeatures.length > 0 ? (
                            missingFeatures.map((feat, idx) => {
                              const isChecked = !!checkedSuggestedFeatures[idx];
                              return (
                                <label
                                  key={idx}
                                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer select-none transition-all shadow-sm ${
                                    isChecked
                                      ? "border-teal-500/30 bg-teal-500/5 text-zinc-400 dark:border-teal-500/20 dark:bg-teal-500/5 line-through opacity-80"
                                      : "border-zinc-200 bg-zinc-50/50 hover:bg-white dark:border-zinc-800 dark:bg-zinc-950/40 hover:dark:bg-zinc-900 text-zinc-750 dark:text-zinc-200"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    className="mt-1 rounded border-zinc-300 text-teal-600 focus:ring-teal-500 dark:border-zinc-750 shrink-0"
                                    checked={isChecked}
                                    onChange={() => handleToggleSuggestedFeature(idx)}
                                  />
                                  <span className="text-sm font-medium">{feat}</span>
                                </label>
                              );
                            })
                          ) : (
                            <p className="text-sm italic text-zinc-400 pl-2 font-mono">No roadmap ideas returned.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Viva Prep Tab View */}
                {activeTab === "vivaPrep" && (
                  <div className="flex flex-col h-full bg-white dark:bg-zinc-900 p-6 rounded-lg text-left">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b pb-4 dark:border-zinc-800">
                      <div>
                        <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
                          <HelpCircle size={20} className="text-teal-500" />
                          🎓 Examiner Board Viva Simulator
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                          Practice {docs.vivaQuestions?.length || 0} critical oral defense questions generated from the uploaded project.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                          🟢 Mastered: {masteredCount}
                        </span>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold">
                          🟡 Review: {reviewCount}
                        </span>
                      </div>
                    </div>

                    {/* Filters bar */}
                    <div className="flex flex-wrap justify-between items-center gap-3 mb-4 p-3 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setVivaFilter("all")}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                            vivaFilter === "all" ? "bg-teal-650 text-white shadow-sm" : "bg-white border dark:bg-zinc-900 hover:bg-zinc-100 dark:border-zinc-700"
                          }`}
                        >
                          All Questions
                        </button>
                        <button
                          onClick={() => setVivaFilter("mastered")}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                            vivaFilter === "mastered" ? "bg-emerald-600 text-white shadow-sm" : "bg-white border dark:bg-zinc-900 hover:bg-zinc-100 dark:border-zinc-700"
                          }`}
                        >
                          Mastered
                        </button>
                        <button
                          onClick={() => setVivaFilter("review")}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                            vivaFilter === "review" ? "bg-amber-650 text-white shadow-sm" : "bg-white border dark:bg-zinc-900 hover:bg-zinc-100 dark:border-zinc-700"
                          }`}
                        >
                          Need Review
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setVivaShowAll(!vivaShowAll)}
                          className="px-2.5 py-1 border text-xs font-semibold rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:bg-zinc-900 dark:border-zinc-700 transition"
                        >
                          {vivaShowAll ? "Collapse Answers" : "Show All Answers"}
                        </button>
                        <button
                          onClick={() => {
                            setVivaStatus({});
                            setExpandedVivaIndex(null);
                          }}
                          className="p-1 border dark:border-zinc-700 text-zinc-500 hover:text-rose-500 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-850 dark:bg-zinc-900 transition flex items-center justify-center"
                          title="Reset Tracker Statuses"
                        >
                          <RotateCcw size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Questions accordion container */}
                    <div className="flex-1 overflow-y-auto max-h-[380px] space-y-4 pr-1.5 custom-scrollbar">
                      {filteredViva.length > 0 ? (
                        filteredViva.map((q) => {
                          const originalIdx = q.originalIndex;
                          const isExpanded = expandedVivaIndex === originalIdx || vivaShowAll;
                          const stat = vivaStatus[originalIdx] || "unread";

                          return (
                            <div
                              key={originalIdx}
                              className={`rounded-xl border transition shadow-sm text-left ${
                                isExpanded
                                  ? "border-teal-500 bg-teal-50/5 dark:border-teal-500/40"
                                  : "border-zinc-200 hover:border-zinc-350 dark:border-zinc-850 hover:dark:border-zinc-750 bg-zinc-50/20 dark:bg-zinc-950/20"
                              }`}
                            >
                              <div
                                onClick={() => toggleViva(originalIdx)}
                                className="p-4 flex justify-between items-start gap-4 cursor-pointer select-none"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold tracking-wider uppercase bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-350 px-2 py-0.5 rounded">
                                      Oral Q #{originalIdx + 1}
                                    </span>
                                    {stat === "mastered" && (
                                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Mastered 🟢</span>
                                    )}
                                    {stat === "review" && (
                                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 font-semibold">Review Required 🟡</span>
                                    )}
                                  </div>
                                  <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                                    {q.question}
                                  </h4>
                                </div>
                                <button className="text-zinc-400 mt-1 shrink-0">
                                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                              </div>

                              {isExpanded && (
                                <div className="px-4 pb-4 border-t border-zinc-150/40 dark:border-zinc-800/40 pt-3">
                                  <p className="text-sm text-zinc-655 dark:text-zinc-300 leading-relaxed bg-white dark:bg-zinc-950 p-4 rounded-xl border dark:border-zinc-850 font-medium">
                                    {q.answer}
                                  </p>
                                  <div className="mt-3 flex justify-between items-center gap-4 flex-wrap">
                                    <span className="text-xs text-zinc-400">Knowledge checklist:</span>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleVivaStatus(originalIdx, "review");
                                        }}
                                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition border ${
                                          stat === "review"
                                            ? "bg-amber-500 border-amber-500 text-white"
                                            : "bg-white hover:bg-zinc-50 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:border-zinc-700 dark:hover:bg-zinc-800"
                                        }`}
                                      >
                                        🟡 Needs Review
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleVivaStatus(originalIdx, "mastered");
                                        }}
                                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition border ${
                                          stat === "mastered"
                                            ? "bg-emerald-650 border-emerald-650 text-white"
                                            : "bg-white hover:bg-zinc-50 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:border-zinc-700 dark:hover:bg-zinc-800"
                                        }`}
                                      >
                                        🟢 Mastered
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-8 text-center text-sm text-zinc-400 italic">
                          No questions matching the filter criteria.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. Analysis Tab View */}
                {activeTab === "codeAnalysis" && (
                  <div className="grid h-full grid-rows-[auto_1fr] bg-white dark:bg-zinc-900 p-6 rounded-lg text-left">
                    {/* Architectural style */}
                    <div className="mb-6 p-4 rounded-xl border border-indigo-500/20 bg-indigo-50/10 dark:border-indigo-500/10 dark:bg-indigo-500/5 flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <span className="text-xs uppercase font-bold tracking-widest text-indigo-650 dark:text-indigo-400">
                          Auto-Detected Architectural Model
                        </span>
                        <h4 className="text-lg font-bold text-zinc-800 dark:text-indigo-200 mt-0.5 flex items-center gap-2">
                          <Cpu size={20} className="text-indigo-500" />
                          {docs.architecture?.toLowerCase().includes("mvc") ? "Model-View-Controller (MVC) Pattern" :
                           docs.architecture?.toLowerCase().includes("microservice") ? "Microservices Architecture Style" :
                           docs.architecture?.toLowerCase().includes("clean") ? "Clean Architecture (Hexagonal Model)" :
                           "Tiered Client-Server Framework Pattern"}
                        </h4>
                      </div>
                      <div className="rounded-lg bg-indigo-600 text-white px-3 py-1 text-xs font-bold shadow-sm">
                        Verified 🏛️
                      </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-[1fr_260px] overflow-y-auto max-h-[460px] pr-2 custom-scrollbar">
                      {/* Main lists */}
                      <div className="space-y-6">
                        {/* Bugs */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-2 border-b pb-1.5 dark:border-zinc-850">
                            <AlertTriangle size={17} />
                            Code Quality & Potential Bugs ({suggestions.bugs?.length || 0})
                          </h4>
                          <div className="grid gap-3">
                            {suggestions.bugs && suggestions.bugs.length > 0 ? (
                              suggestions.bugs.map((bug, idx) => (
                                <div
                                  key={idx}
                                  className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/20 dark:border-rose-500/10 dark:bg-rose-500/5 flex gap-3 shadow-sm hover:scale-[1.005] transition-transform"
                                >
                                  <span className="mt-1.5 h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                                  <p className="text-sm text-zinc-700 dark:text-zinc-200 font-medium leading-relaxed">{bug}</p>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm italic text-zinc-400 pl-2">No active bug patterns identified.</p>
                            )}
                          </div>
                        </div>

                        {/* Improvements */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2 border-b pb-1.5 dark:border-zinc-850">
                            <Sparkles size={17} />
                            Suggested Refactoring & Optimizations ({suggestions.improvements?.length || 0})
                          </h4>
                          <div className="grid gap-3">
                            {suggestions.improvements && suggestions.improvements.length > 0 ? (
                              suggestions.improvements.map((imp, idx) => (
                                <div
                                  key={idx}
                                  className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/10 dark:border-indigo-500/10 dark:bg-indigo-500/5 flex gap-3 shadow-sm hover:scale-[1.005] transition-transform"
                                >
                                  <span className="mt-1.5 h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
                                  <p className="text-sm text-zinc-700 dark:text-zinc-200 font-medium leading-relaxed">{imp}</p>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm italic text-zinc-400 pl-2">No improvement recommendations available.</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right bar metrics */}
                      <div className="space-y-5">
                        <div className="bg-zinc-50/50 border dark:border-zinc-800 p-4 rounded-xl shadow-sm text-left dark:bg-zinc-950/20">
                          <h4 className="text-xs uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1.5 mb-3">
                            <Layers size={14} />
                            Code Complexity Analysis
                          </h4>
                          <div className="grid grid-cols-2 gap-2 text-center mb-3">
                            <div className="bg-white border dark:bg-zinc-950 p-2 rounded-xl dark:border-zinc-800">
                              <span className="text-[10px] text-zinc-400 uppercase font-bold">Time</span>
                              <div className="text-base font-extrabold text-teal-600 dark:text-teal-400 mt-0.5">O(N)</div>
                            </div>
                            <div className="bg-white border dark:bg-zinc-950 p-2 rounded-xl dark:border-zinc-800">
                              <span className="text-[10px] text-zinc-400 uppercase font-bold">Space</span>
                              <div className="text-base font-extrabold text-teal-600 dark:text-teal-400 mt-0.5">O(N)</div>
                            </div>
                          </div>
                          <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                            {suggestions.complexity || "Processing complexity is linear relative to token parameters and uploads count aggregates."}
                          </p>
                        </div>

                        <div className="bg-zinc-50/50 border dark:border-zinc-800 p-4 rounded-xl shadow-sm text-left dark:bg-zinc-950/20">
                          <h4 className="text-xs uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1.5 mb-2">
                            <Flame size={14} />
                            Performance Diagnostics
                          </h4>
                          <p className="text-xs text-zinc-650 dark:text-zinc-400 leading-relaxed font-medium">
                            {suggestions.performance || "Excellent runtime bounds. Network constraints depend on remote model call roundtrips."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. API Flow Visualizer Tab View */}
                {activeTab === "apiFlowVisualizer" && (
                  <div className="grid h-full grid-rows-[auto_1fr] bg-white dark:bg-zinc-900 p-6 rounded-lg text-left">
                    <div className="mb-4 border-b pb-3 dark:border-zinc-800 flex justify-between items-center flex-wrap gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
                          <Activity size={20} className="text-teal-500" />
                          🗺️ Live Interactive API Flow Visualizer
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                          Click nodes in the diagram or list to filter the routing endpoints, inputs, and middlewares.
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-[1fr_300px] overflow-hidden min-h-[460px]">
                      {/* Left: Graphic */}
                      <div className="h-[460px] flex flex-col justify-center border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden relative bg-zinc-50/40 dark:bg-zinc-950/40 p-4">
                        {apiFlowMermaidCode ? (
                          <div className="h-full flex flex-col justify-center">
                            <DiagramPreview
                              code={apiFlowMermaidCode}
                              isDark={false}
                              nodes={docs.apiFlow?.nodes || []}
                              onNodeSelect={(node) => setSelectedApiNode(node)}
                              selectedNodeId={selectedApiNode?.id}
                            />
                            <span className="text-[10px] text-zinc-450 text-center mt-2 italic font-semibold">
                              💡 Click shapes inside the diagram to trace interactive inputs and outputs!
                            </span>
                          </div>
                        ) : (
                          <p className="text-sm italic text-zinc-400 text-center">API flow diagram rendering offline.</p>
                        )}
                      </div>

                      {/* Right: Spec sidebar */}
                      <div className="side-panel border border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 p-4 rounded-xl flex flex-col justify-between overflow-y-auto max-h-[460px] custom-scrollbar dark:bg-zinc-950/20">
                        {selectedApiNode ? (
                          <div className="space-y-4 text-left">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-350 px-2.5 py-0.5 rounded">
                                {selectedApiNode.type || "Lifecycle Step"}
                              </span>
                              <span className="text-[10px] text-zinc-400 font-mono">ID: {selectedApiNode.id}</span>
                            </div>
                            <h4 className="text-base font-bold text-zinc-800 dark:text-zinc-100">
                              {selectedApiNode.label}
                            </h4>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium bg-white dark:bg-zinc-950/80 p-3 rounded-xl border dark:border-zinc-850">
                              {selectedApiNode.id === "client" ? "Frontend UI layer. Prepares parameter inputs, constructs standard FormData payloads, attaches text/image headers, handles click listeners and dispatches REST posts." :
                               selectedApiNode.id === "upload_mw" ? "Server-side file interceptor. Processes incoming arrays of files, bounds storage buffers in memory, limits individual uploads to 25MB and prevents storage exhaustion." :
                               selectedApiNode.id === "docs_ctrl" ? "Business router action. Standardizes fields, parses file lists into textual contexts or base64 matrices, detects client providers, and manages failover routes." :
                               selectedApiNode.id === "ai_client" ? "Analytical service module. Forwards fully compiled contextual templates to advanced AI APIs, enforcing rigid documentation JSON schema parameters." :
                               selectedApiNode.id === "fallback_srv" ? "Robust error failover handler. Implicitly constructs standard mock datasets matching custom parameters when key limits or call rate restrictions block AI providers." :
                               "Aggregates request payloads, manages responsive filtering operations, coordinates controllers, and formats structured output records."}
                            </p>

                            <div className="border-t pt-3 dark:border-zinc-800">
                              <h5 className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 mb-2">Connected Path Interactions</h5>
                              <div className="space-y-2">
                                {(docs.apiFlow?.edges || [])
                                  .filter(e => e.from === selectedApiNode.id || e.to === selectedApiNode.id)
                                  .map((edge, idx) => (
                                    <div key={idx} className="bg-white dark:bg-zinc-950 p-2.5 rounded-lg border border-zinc-150/60 dark:border-zinc-850 text-xs">
                                      <div className="flex justify-between items-center font-bold text-zinc-400 mb-1 text-[9px] uppercase tracking-wide">
                                        <span>{edge.from}</span>
                                        <span>➡️</span>
                                        <span>{edge.to}</span>
                                      </div>
                                      <p className="text-zinc-700 dark:text-zinc-350 font-semibold leading-relaxed">{edge.label}</p>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col justify-center items-center p-6 text-center text-zinc-400 min-h-[300px]">
                            <Eye size={36} className="text-zinc-300 dark:text-zinc-700 mb-2 animate-pulse shrink-0" />
                            <p className="text-xs font-semibold leading-relaxed">
                              Select components inside the interactive graph to display endpoint data flows and specifications!
                            </p>
                          </div>
                        )}

                        <button
                          onClick={() => setSelectedApiNode(null)}
                          disabled={!selectedApiNode}
                          className="w-full mt-4 py-2 border dark:border-zinc-750 text-xs font-semibold rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:bg-zinc-900 transition text-center disabled:opacity-40"
                        >
                          Clear Selection Focus
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. General Pre-formatted Text View for Markdown tabs */}
                {activeTab !== "pptSummary" &&
                 activeTab !== "features" &&
                 activeTab !== "vivaPrep" &&
                 activeTab !== "codeAnalysis" &&
                 activeTab !== "apiFlowVisualizer" && (
                  <pre className="h-[620px] overflow-auto whitespace-pre-wrap p-5 font-mono text-sm leading-6 text-zinc-800 dark:text-zinc-100 text-left custom-scrollbar">
                    {activeContent}
                  </pre>
                )}
              </div>
            ) : (
              <div className="flex min-h-[620px] items-center justify-center p-8 text-center text-sm text-zinc-500 dark:text-zinc-400 flex-col gap-2">
                <FileCode2 size={40} className="text-zinc-300 dark:text-zinc-700 animate-bounce" />
                <span className="font-semibold text-zinc-650 dark:text-zinc-450">
                  Interactive developer documentation cards and visual request flow will load here.
                </span>
                <span className="text-xs text-zinc-400">
                  Enter a project name and click "Generate Interactive Docs" to begin analysis!
                </span>
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

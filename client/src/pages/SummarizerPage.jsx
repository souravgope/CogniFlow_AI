import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  BookOpenText,
  Clipboard,
  Download,
  Image as ImageIcon,
  Layers3,
  Loader2,
  Mic,
  MonitorPlay,
  Network,
  Pause,
  Play,
  Sparkles,
  Square,
  Sun,
  Moon
} from "lucide-react";
import { jsPDF } from "jspdf";
import { generateExplanation } from "../api/explanationApi";
import { API_URL } from "../config";
import DiagramPreview from "../components/DiagramPreview";

function mermaidLabel(value, fallback = "Item") {
  return String(value || fallback)
    .replace(/["`\\[\]{}<>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60) || fallback;
}

function buildVisualMap(result, fallbackTopic) {
  if (!result) return "";

  const topic = mermaidLabel(fallbackTopic, "Topic");
  const scenes = (result.scenes || []).slice(0, 5);
  const slides = (result.slides || []).slice(0, 4);
  const visuals = (result.visual_suggestions || []).slice(0, 3);
  const lines = [
    "graph TD",
    `  Topic["${topic}"] --> Scenes["Scene Flow"]`,
    `  Topic --> Slides["Learning Slides"]`,
    `  Topic --> Visuals["Visual Ideas"]`
  ];

  scenes.forEach((scene, index) => {
    const id = `Scene${index}`;
    lines.push(`  ${id}["${mermaidLabel(scene, `Scene ${index + 1}`)}"]`);
    lines.push(index === 0 ? `  Scenes --> ${id}` : `  Scene${index - 1} --> ${id}`);
  });

  slides.forEach((slide, slideIndex) => {
    const slideId = `Slide${slideIndex}`;
    lines.push(`  Slides --> ${slideId}["${mermaidLabel(slide.title, `Slide ${slideIndex + 1}`)}"]`);
    (slide.points || []).slice(0, 2).forEach((point, pointIndex) => {
      lines.push(`  ${slideId} --> Point${slideIndex}_${pointIndex}["${mermaidLabel(point, "Point")}"]`);
    });
  });

  visuals.forEach((visual, index) => {
    lines.push(`  Visuals --> Visual${index}["${mermaidLabel(visual, `Visual ${index + 1}`)}"]`);
  });

  return lines.join("\n");
}

function shortText(value, fallback = "Concept", maxLength = 36) {
  return String(value || fallback)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength) || fallback;
}

function getPictureTerms(result, topic) {
  const slideTerms = (result?.slides || [])
    .flatMap((slide) => [slide.title, ...(slide.points || [])])
    .map((item) => shortText(item, "", 24))
    .filter(Boolean);

  return [shortText(topic, "Topic", 24), ...slideTerms].slice(0, 6);
}

function pdfFilename(topic) {
  const slug = String(topic || "ai-explanation")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return `${slug || "ai-explanation"}.pdf`;
}

function downloadExplanationPdf({ language, level, result, style, topic }) {
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  function ensureSpace(height = 24) {
    if (y + height > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
  }

  function addWrappedText(text, options = {}) {
    const {
      fontSize = 11,
      lineHeight = fontSize + 6,
      style: fontStyle = "normal",
      indent = 0
    } = options;
    pdf.setFont("helvetica", fontStyle);
    pdf.setFontSize(fontSize);

    const lines = pdf.splitTextToSize(String(text || ""), contentWidth - indent);
    lines.forEach((line) => {
      ensureSpace(lineHeight);
      pdf.text(line, margin + indent, y);
      y += lineHeight;
    });
  }

  function addSection(title) {
    y += 12;
    ensureSpace(30);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(15);
    pdf.text(title, margin, y);
    y += 22;
  }

  function addBullet(text) {
    addWrappedText(`- ${text}`, { indent: 12 });
  }

  pdf.setProperties({
    title: `${topic || "AI Explanation"} - AI Explanation Generator`,
    subject: "Generated learning content",
    creator: "AI Whiteboard"
  });

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  pdf.text("AI Explanation Generator", margin, y);
  y += 28;

  addWrappedText(`Topic: ${topic || "Untitled"}`, { fontSize: 12, style: "bold" });
  addWrappedText(`Level: ${level}   Language: ${language}   Style: ${style}`, { fontSize: 10 });

  addSection("Explanation");
  addWrappedText(result.explanation);

  addSection("Video Script");
  addWrappedText(result.video_script);

  addSection("Slides");
  (result.slides || []).forEach((slide, index) => {
    addWrappedText(`Slide ${index + 1}: ${slide.title}`, { style: "bold" });
    (slide.points || []).forEach(addBullet);
    y += 6;
  });

  addSection("Scenes");
  (result.scenes || []).forEach((scene, index) => addBullet(`${index + 1}. ${scene}`));

  addSection("Visual Suggestions");
  (result.visual_suggestions || []).forEach(addBullet);

  pdf.save(pdfFilename(topic));
}

const hotspotPositions = [
  { left: "22%", top: "28%" },
  { left: "70%", top: "24%" },
  { left: "28%", top: "70%" },
  { left: "76%", top: "68%" },
  { left: "50%", top: "48%" }
];

function fallbackImageSearch(topic) {
  return String(topic || "")
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function TopicPicture({ activeSlide, onSelectSlide, result, topic, topicImage, imageStatus, onRetry }) {
  const slides = result?.slides || [];
  const active = slides[activeSlide] || slides[0];
  const terms = getPictureTerms(result, topic);
  const visualSuggestion = result?.visual_suggestions?.[activeSlide % Math.max(result?.visual_suggestions?.length || 1, 1)];

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_340px]">
        <div className="relative min-h-[460px] overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950">
          {topicImage ? (
            <img
              alt={topicImage.title}
              className="absolute inset-0 h-full w-full object-contain p-5"
              src={topicImage.url}
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center bg-[linear-gradient(#e5e7eb_1px,transparent_1px),linear-gradient(90deg,#e5e7eb_1px,transparent_1px)] bg-[size:32px_32px] p-6 dark:bg-[linear-gradient(#27272a_1px,transparent_1px),linear-gradient(90deg,#27272a_1px,transparent_1px)]">
              <div className="grid max-w-md gap-4 rounded-lg border border-zinc-200 bg-white p-5 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-200">
                  <ImageIcon size={34} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{shortText(topic, "Topic", 32)}</h3>
                  {imageStatus === "loading" ? (
                    <div className="mt-3 flex flex-col items-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">Finding image...</p>
                    </div>
                  ) : (
                    <div className="mt-2 flex flex-col items-center gap-3">
                      <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                        No image found for this topic.
                      </p>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-teal-500/40 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 transition hover:bg-teal-100 dark:bg-teal-500/10 dark:text-teal-300 dark:hover:bg-teal-500/20"
                        onClick={onRetry}
                      >
                        ↻ Retry
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <div className="absolute left-4 top-4 max-w-[calc(100%-2rem)] rounded-lg bg-white/95 px-4 py-3 shadow-sm backdrop-blur dark:bg-zinc-950/90">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-300">
              Topic Picture
            </p>
            <h3 className="mt-1 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
              {topicImage?.title || shortText(topic, "Topic", 34)}
            </h3>
          </div>

          {slides.slice(0, 5).map((slide, index) => {
            const position = hotspotPositions[index] || hotspotPositions[0];

            return (
              <button
                className={`absolute grid h-10 w-10 place-items-center rounded-full border-2 text-sm font-bold shadow-lg transition hover:scale-105 ${activeSlide === index
                    ? "border-white bg-teal-600 text-white"
                    : "border-teal-600 bg-white text-teal-700"
                  }`}
                key={`${slide.title}-hotspot-${index}`}
                style={position}
                title={slide.title}
                type="button"
                onClick={() => onSelectSlide(index)}
              >
                {index + 1}
              </button>
            );
          })}

          {topicImage?.sourceUrl ? (
            <a
              className="absolute bottom-4 left-4 rounded-lg bg-white/95 px-3 py-2 text-xs font-medium text-zinc-700 shadow-sm hover:text-teal-700 dark:bg-zinc-950/90 dark:text-zinc-200"
              href={topicImage.sourceUrl}
              rel="noreferrer"
              target="_blank"
            >
              {topicImage.sourceUrl?.includes("commons") ? "Image: Wikimedia Commons" : "Image: Wikipedia"}
            </a>
          ) : null}
        </div>

        <aside className="grid content-start gap-3">
          <section className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-300">
              <ImageIcon size={16} />
              Active Focus
            </div>
            <h3 className="text-base font-semibold">{active?.title || "Select a marker"}</h3>
            <ul className="grid gap-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {(active?.points || []).map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </section>

          <section className="grid gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <h3 className="text-sm font-semibold">Slide Markers</h3>
            <div className="grid gap-2">
              {slides.map((slide, index) => (
                <button
                  className={`rounded-lg border px-3 py-2 text-left text-sm transition ${activeSlide === index
                      ? "border-teal-500 bg-teal-50 text-teal-950 dark:bg-teal-500/10 dark:text-teal-100"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-mint dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                    }`}
                  key={`${slide.title}-marker-${index}`}
                  type="button"
                  onClick={() => onSelectSlide(index)}
                >
                  <span className="mr-2 inline-grid h-6 w-6 place-items-center rounded-full bg-teal-600 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  {shortText(slide.title, `Slide ${index + 1}`, 30)}
                </button>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <section className="grid gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-300">
          <Sparkles size={16} />
          Related Visual Ideas
        </div>
        <div className="flex flex-wrap gap-2">
          {terms.map((term) => (
            <span className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300" key={term}>
              {term}
            </span>
          ))}
          {visualSuggestion ? (
            <span className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-900 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-100">
              {shortText(visualSuggestion, "Visual cue", 42)}
            </span>
          ) : null}
        </div>
        {topicImage?.description ? (
          <p className="line-clamp-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            {topicImage.description}
          </p>
        ) : null}
      </section>
    </div>
  );
}

export default function SummarizerPage() {
  const location = useLocation();
  const autoGeneratedRef = useRef(false);

  // Theme
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("Beginner");
  const [language, setLanguage] = useState("English");
  const [style, setStyle] = useState("Teacher");
  const [result, setResult] = useState(null);
  const [view, setView] = useState("content");
  const [activeSlide, setActiveSlide] = useState(0);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("idle");
  const [topicImage, setTopicImage] = useState(null);
  const [imageStatus, setImageStatus] = useState("idle");
  const [zoom, setZoom] = useState(1);
  const utteranceRef = useRef(null);
  const stopRequestedRef = useRef(false);

  useEffect(() => {
    if (location.state?.topic && !autoGeneratedRef.current) {
      autoGeneratedRef.current = true;
      const targetTopic = location.state.topic;
      setTopic(targetTopic);
      if (location.state?.autoGenerate) {
        const runAutoGenerate = async () => {
          setError("");
          setStatus("");
          setIsGenerating(true);
          if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
          }
          setVoiceStatus("idle");
          setStatus("Generating explanation...");

          try {
            const data = await generateExplanation({
              topic: targetTopic.trim(),
              level,
              language,
              style
            });
            
            setResult(data);
            setActiveSlide(0);
            setView("content");
            setVoiceStatus("idle");
            setStatus("Explanation generated.");
            fetchTopicImage(targetTopic.trim());
          } catch (err) {
            setError(err.message || "Unable to generate explanation.");
            setStatus("");
          } finally {
            setIsGenerating(false);
          }
        };
        runAutoGenerate();
      }
    }
  }, [location.state]);

  const speechText = useMemo(() => result?.video_script?.replaceAll("[pause]", ". ") || "", [result]);
  const visualMapCode = useMemo(() => buildVisualMap(result, topic), [result, topic]);
  const selectedSlide = result?.slides?.[activeSlide] || result?.slides?.[0];

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function stopVoicePlayback(nextStatus = "Voice playback stopped.") {
    if (!window.speechSynthesis) return;
    stopRequestedRef.current = true;
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setVoiceStatus("idle");
    setStatus(nextStatus);
  }

  // Pre-fetch image in background — called after every successful generation
  async function fetchTopicImage(query) {
    if (!query) { setTopicImage(null); setImageStatus("idle"); return; }
    setTopicImage(null);
    setImageStatus("loading");
    const searchQuery = fallbackImageSearch(query) || query;
    const baseUrl = API_URL || "";
    const url = `${baseUrl}/api/image-search?q=${encodeURIComponent(searchQuery)}`;

    try {
      const resp = await fetch(url);
      if (resp.ok) {
        const data = await resp.json();
        if (data?.url) {
          setTopicImage({
            description: `Image from ${data.source === "wikipedia" ? "Wikipedia" : "Wikimedia Commons"}`,
            sourceUrl: data.sourceUrl || "https://en.wikipedia.org",
            title: data.title || query,
            url: data.url
          });
          setImageStatus("ready");
          return;
        }
      }
    } catch {
      /* network error */
    }
    setImageStatus("empty");
  }

  async function handleGenerate() {
    setError("");
    setStatus("");

    if (!topic.trim()) {
      setError("Topic is required.");
      return;
    }

    setIsGenerating(true);
    stopVoicePlayback("");
    setStatus("Generating explanation...");
    setTopicImage(null);
    setImageStatus("idle");

    try {
      const data = await generateExplanation({
        topic: topic.trim(),
        level,
        language,
        style
      });
      
      setResult(data);
      setActiveSlide(0);
      setView("content");
      setVoiceStatus("idle");
      setStatus("Explanation generated.");
      fetchTopicImage(topic.trim());
    } catch (err) {
      setError(err.message || "Unable to generate explanation.");
      setStatus("");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleCopyScript() {
    if (!result?.video_script) return;
    await navigator.clipboard.writeText(result.video_script);
    setStatus("Video script copied.");
  }

  function handleDownloadPdf() {
    if (!result) return;

    try {
      downloadExplanationPdf({ language, level, result, style, topic });
      setStatus("PDF downloaded.");
    } catch (err) {
      setError(err.message || "Unable to download PDF.");
    }
  }

  function handlePlayVoice() {
    if (!speechText || !window.speechSynthesis) return;

    if (voiceStatus === "paused") {
      window.speechSynthesis.resume();
      setVoiceStatus("playing");
      setStatus("Voice playback resumed.");
      return;
    }

    stopRequestedRef.current = false;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = language === "Hindi" ? "hi-IN" : "en-IN";
    utterance.rate = 0.95;
    utterance.onend = () => {
      utteranceRef.current = null;
      setVoiceStatus("idle");
      if (stopRequestedRef.current) {
        stopRequestedRef.current = false;
        return;
      }
      setStatus("Voice playback finished.");
    };
    utterance.onerror = () => {
      utteranceRef.current = null;
      setVoiceStatus("idle");
      setError("Unable to play voice script.");
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setVoiceStatus("playing");
    setStatus("Voice playback started.");
  }

  function handlePauseVoice() {
    if (!window.speechSynthesis || voiceStatus !== "playing") return;
    window.speechSynthesis.pause();
    setVoiceStatus("paused");
    setStatus("Voice playback paused.");
  }

  function handleStopVoice() {
    stopVoicePlayback("Voice playback stopped.");
  }

  return (
    <main className="min-h-screen bg-stone-50 text-ink dark:bg-zinc-950 dark:text-zinc-100">
      <section className="border-b border-zinc-200 bg-white/90 dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
              AI Tool
            </p>
            <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">AI Explanation Generator</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Generate structured learning content for display, slide planning, scenes, and voice playback.
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
          <div className="side-panel">
            <h2 className="panel-title">Learning Inputs</h2>
            <div className="grid gap-4">
              <label className="grid gap-2 text-sm font-medium">
                Topic
                <input
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-mint/30 focus:ring-4 dark:border-zinc-700 dark:bg-zinc-950"
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                  placeholder="Example: Binary Search"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium">
                Difficulty Level
                <select
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-mint/30 focus:ring-4 dark:border-zinc-700 dark:bg-zinc-950"
                  value={level}
                  onChange={(event) => setLevel(event.target.value)}
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </label>

              <label className="grid gap-2 text-sm font-medium">
                Language
                <select
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-mint/30 focus:ring-4 dark:border-zinc-700 dark:bg-zinc-950"
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                >
                  <option>English</option>
                  <option>Hinglish</option>
                  <option>Hindi</option>
                </select>
              </label>

              <label className="grid gap-2 text-sm font-medium">
                Explanation Style
                <select
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-mint/30 focus:ring-4 dark:border-zinc-700 dark:bg-zinc-950"
                  value={style}
                  onChange={(event) => setStyle(event.target.value)}
                >
                  <option>Teacher</option>
                  <option>Friend</option>
                  <option>Interviewer</option>
                </select>
              </label>

              <button className="primary-button" type="button" disabled={isGenerating} onClick={handleGenerate}>
                {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                {isGenerating ? "Generating" : "Generate Explanation"}
              </button>
            </div>
          </div>
        </aside>

        <section className="grid content-start gap-4">
          {error ? <div className="notice-error">{error}</div> : null}
          {status ? <div className="notice">{status}</div> : null}

          <div className="toolbar">
            <div className="segmented overflow-x-auto" role="tablist" aria-label="Explanation output view">
              <button
                className={view === "content" ? "mode-button mode-button-active" : "mode-button"}
                type="button"
                role="tab"
                aria-selected={view === "content"}
                onClick={() => setView("content")}
              >
                <BookOpenText size={16} />
                Content
              </button>
              <button
                className={view === "visual" ? "mode-button mode-button-active" : "mode-button"}
                type="button"
                role="tab"
                aria-selected={view === "visual"}
                disabled={!result}
                onClick={() => setView("visual")}
              >
                <Network size={16} />
                Visual Map
              </button>
              <button
                className={view === "picture" ? "mode-button mode-button-active" : "mode-button"}
                type="button"
                role="tab"
                aria-selected={view === "picture"}
                disabled={!result}
                onClick={() => setView("picture")}
              >
                <ImageIcon size={16} />
                Picture
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="icon-button"
                type="button"
                title="Copy video script"
                disabled={!result?.video_script}
                onClick={handleCopyScript}
              >
                <Clipboard size={17} />
              </button>
              <button
                className="secondary-button min-h-10 px-3"
                type="button"
                title="Download explanation as PDF"
                disabled={!result}
                onClick={handleDownloadPdf}
              >
                <Download size={16} />
                PDF
              </button>
              <button
                className="secondary-button min-h-10 px-3"
                type="button"
                title="Play voice script"
                disabled={!speechText || voiceStatus === "playing"}
                onClick={handlePlayVoice}
              >
                <Play size={16} />
                Play
              </button>
              <button
                className="secondary-button min-h-10 px-3"
                type="button"
                title="Pause voice script"
                disabled={voiceStatus !== "playing"}
                onClick={handlePauseVoice}
              >
                <Pause size={16} />
                Pause
              </button>
              <button
                className="secondary-button min-h-10 px-3"
                type="button"
                title="Stop voice script"
                disabled={voiceStatus === "idle"}
                onClick={handleStopVoice}
              >
                <Square size={16} />
                Stop
              </button>
            </div>
          </div>

          <div className="workspace min-h-[620px] overflow-auto p-5">
            {result && view === "content" ? (
              <div className="grid gap-5">
                <section className="grid gap-2">
                  <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-300">
                    <BookOpenText size={16} />
                    Explanation
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-700 dark:text-zinc-300">
                    {result.explanation}
                  </p>
                </section>

                <section className="grid gap-2">
                  <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-300">
                    <Mic size={16} />
                    Video Script
                  </div>
                  <p className="whitespace-pre-wrap rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm leading-7 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                    {result.video_script}
                  </p>
                </section>

                <section className="grid gap-3">
                  <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-300">
                    <Layers3 size={16} />
                    Slides
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {(result.slides || []).map((slide, index) => (
                      <button
                        className={`rounded-lg border p-4 text-left transition ${activeSlide === index
                            ? "border-teal-400 bg-teal-50 dark:border-teal-500/70 dark:bg-teal-500/10"
                            : "border-zinc-200 bg-zinc-50 hover:border-mint dark:border-zinc-800 dark:bg-zinc-950"
                          }`}
                        key={`${slide.title}-${index}`}
                        type="button"
                        onClick={() => {
                          setActiveSlide(index);
                          setView("visual");
                        }}
                      >
                        <h3 className="text-sm font-semibold">{slide.title}</h3>
                        <ul className="mt-3 grid gap-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                          {(slide.points || []).map((point) => (
                            <li key={point}>{point}</li>
                          ))}
                        </ul>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-300">
                      <MonitorPlay size={16} />
                      Scenes
                    </div>
                    <ol className="mt-3 grid gap-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                      {(result.scenes || []).map((scene) => (
                        <li key={scene}>{scene}</li>
                      ))}
                    </ol>
                  </div>

                  <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-300">
                      <Sparkles size={16} />
                      Visual Suggestions
                    </div>
                    <ul className="mt-3 grid gap-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                      {(result.visual_suggestions || []).map((suggestion) => (
                        <li key={suggestion}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                </section>
              </div>
            ) : result && view === "visual" ? (
              <div className="grid gap-4">
                {isDark && (
                  <style>{`
                    .diagram-stage svg path.path,
                    .diagram-stage svg .edgePath .path,
                    .diagram-stage svg .edgePaths .path {
                      stroke: #cccccc !important;
                      stroke-width: 2px !important;
                    }
                    .diagram-stage svg .marker {
                      fill: #cccccc !important;
                      stroke: #cccccc !important;
                    }
                  `}</style>
                )}
                <style>{`
                  .diagram-stage svg {
                    width: ${zoom * 100}% !important;
                    max-width: none !important;
                    max-height: none !important;
                    transition: width 0.15s ease-out;
                  }
                `}</style>

                <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
                  {/* Zoom controls */}
                  <div className="absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-lg border border-zinc-200/80 bg-white/95 px-2 py-1.5 shadow-sm backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-900/95">
                    <button
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 text-sm font-bold text-zinc-700 hover:bg-zinc-100 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                      type="button"
                      onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
                      title="Zoom Out"
                    >
                      -
                    </button>
                    <span className="text-xs font-semibold font-mono min-w-[3rem] text-center text-zinc-700 dark:text-zinc-300">
                      {Math.round(zoom * 100)}%
                    </span>
                    <button
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 text-sm font-bold text-zinc-700 hover:bg-zinc-100 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                      type="button"
                      onClick={() => setZoom(z => Math.min(2.5, z + 0.1))}
                      title="Zoom In"
                    >
                      +
                    </button>
                    <button
                      className="ml-1 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                      type="button"
                      onClick={() => setZoom(1)}
                    >
                      Reset
                    </button>
                  </div>

                  <div className="pt-12">
                    <DiagramPreview code={visualMapCode} isDark={isDark} />
                  </div>
                </div>

                <section className="grid gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-300">
                    <Layers3 size={16} />
                    Focus Slide
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(result.slides || []).map((slide, index) => (
                      <button
                        className={activeSlide === index ? "mode-button mode-button-active" : "chip"}
                        key={`${slide.title}-focus-${index}`}
                        type="button"
                        onClick={() => setActiveSlide(index)}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                  {selectedSlide ? (
                    <div className="grid gap-2">
                      <h3 className="text-sm font-semibold">{selectedSlide.title}</h3>
                      <ul className="grid gap-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                        {(selectedSlide.points || []).map((point) => (
                          <li key={point}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </section>
              </div>
            ) : result && view === "picture" ? (
              <TopicPicture
                activeSlide={activeSlide}
                onSelectSlide={setActiveSlide}
                result={result}
                topic={topic}
                topicImage={topicImage}
                imageStatus={imageStatus}
                onRetry={() => fetchTopicImage(topic.trim())}
              />
            ) : (
              <div className="flex min-h-[560px] items-center justify-center p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                Generated educational content will appear here.
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

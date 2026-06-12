import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  Clipboard,
  Lightbulb,
  Loader2,
  Pause,
  Play,
  Square,
  Target,
  Sparkles,
  BookOpenText,
  GitFork,
  ArrowRight,
  Trash2,
  Sun,
  Moon
} from "lucide-react";
import { analyzeMistake } from "../api/mistakeApi";

function scoreValue(score) {
  const match = String(score || "").match(/\d+/);
  return Math.max(0, Math.min(100, Number(match?.[0] || 0)));
}

function ResultList({ icon: Icon, items, title }) {
  return (
    <section className="grid gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-300">
        <Icon size={16} />
        {title}
      </div>
      <ul className="grid gap-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        {(items || []).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export default function MistakeAnalyzerPage() {
  const navigate = useNavigate();
  
  // Theme
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  // Persistent states synced with sessionStorage
  const [topic, setTopic] = useState(() => sessionStorage.getItem("mistake_topic") || "");
  const [answer, setAnswer] = useState(() => sessionStorage.getItem("mistake_answer") || "");
  const [result, setResult] = useState(() => {
    try {
      const saved = sessionStorage.getItem("mistake_result");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("idle");
  const utteranceRef = useRef(null);

  // Sync to sessionStorage
  useEffect(() => {
    sessionStorage.setItem("mistake_topic", topic);
  }, [topic]);

  useEffect(() => {
    sessionStorage.setItem("mistake_answer", answer);
  }, [answer]);

  useEffect(() => {
    if (result) {
      sessionStorage.setItem("mistake_result", JSON.stringify(result));
    } else {
      sessionStorage.removeItem("mistake_result");
    }
  }, [result]);

  // Interactive Checklist & Feedback View states
  const [resolvedMistakes, setResolvedMistakes] = useState({});
  const [feedbackView, setFeedbackView] = useState("structured");

  function handleNavigateToExplanation(nextTopic) {
    if (!nextTopic) return;
    navigate("/summarizer", { state: { topic: nextTopic, autoGenerate: true } });
  }

  function handleNavigateToLearningPath(nextTopic) {
    if (!nextTopic) return;
    navigate("/learning", { state: { topic: nextTopic, autoGenerate: true } });
  }
  const stopRequestedRef = useRef(false);

  const score = useMemo(() => scoreValue(result?.score), [result]);
  const audioText = result?.audio_script?.replaceAll("[pause]", ". ") || "";

  // Display score count-up timer state for conic gradient score card animation
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    if (result) {
      const target = scoreValue(result.score);
      let start = 0;
      const duration = 750; // ms animation duration
      const stepTime = Math.max(Math.floor(duration / Math.max(target, 1)), 8);
      const timer = setInterval(() => {
        start += 1;
        if (start >= target) {
          setDisplayScore(target);
          clearInterval(timer);
        } else {
          setDisplayScore(start);
        }
      }, stepTime);
      return () => clearInterval(timer);
    } else {
      setDisplayScore(0);
      setResolvedMistakes({});
    }
  }, [result, score]);

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function stopVoice(nextStatus = "Audio feedback stopped.") {
    if (!window.speechSynthesis) return;
    stopRequestedRef.current = true;
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setVoiceStatus("idle");
    if (nextStatus) setStatus(nextStatus);
  }

  async function handleAnalyze() {
    setError("");
    setStatus("");

    if (!topic.trim()) {
      setError("Topic is required.");
      return;
    }

    if (!answer.trim()) {
      setError("User answer is required.");
      return;
    }

    setIsAnalyzing(true);
    stopVoice("");
    setStatus("Analyzing your answer...");

    try {
      const data = await analyzeMistake({
        topic: topic.trim(),
        answer: answer.trim()
      });
      setResult(data);
      setVoiceStatus("idle");
      setStatus("Mistake analysis generated.");
    } catch (err) {
      setError(err.message || "Unable to analyze this answer.");
      setStatus("");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    const content = [
      `Topic: ${topic}`,
      `Score: ${result.score}`,
      `Error Type: ${result.error_type}`,
      "",
      "Mistakes:",
      ...(result.mistakes || []).map((item) => `- ${item}`),
      "",
      "Explanation:",
      result.explanation,
      "",
      "Correct Answer:",
      result.correct_answer,
      "",
      "Improved Answer:",
      result.improved_answer,
      "",
      "Next Step Topic:",
      result.next_step_topic,
      "",
      "Improvement Tips:",
      ...(result.improvement_tips || []).map((item) => `- ${item}`)
    ].join("\n");

    await navigator.clipboard.writeText(content);
    setStatus("Feedback copied.");
  }

  function handlePlay() {
    if (!audioText || !window.speechSynthesis) return;

    if (voiceStatus === "paused") {
      window.speechSynthesis.resume();
      setVoiceStatus("playing");
      setStatus("Audio feedback resumed.");
      return;
    }

    stopRequestedRef.current = false;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(audioText);
    utterance.lang = "en-IN";
    utterance.rate = 0.95;
    utterance.onend = () => {
      utteranceRef.current = null;
      setVoiceStatus("idle");
      if (stopRequestedRef.current) {
        stopRequestedRef.current = false;
        return;
      }
      setStatus("Audio feedback finished.");
    };
    utterance.onerror = () => {
      utteranceRef.current = null;
      setVoiceStatus("idle");
      setError("Unable to play audio feedback.");
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setVoiceStatus("playing");
    setStatus("Audio feedback started.");
  }

  function handlePause() {
    if (!window.speechSynthesis || voiceStatus !== "playing") return;
    window.speechSynthesis.pause();
    setVoiceStatus("paused");
    setStatus("Audio feedback paused.");
  }

  return (
    <main className="min-h-screen bg-stone-50 text-ink dark:bg-zinc-950 dark:text-zinc-100">
      <section className="border-b border-zinc-200 bg-white/90 dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
              AI Tool
            </p>
            <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">AI Mistake Analyzer</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Analyze an answer, find weak areas, and get clear feedback for improvement.
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
            <h2 className="panel-title">Answer Inputs</h2>
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
                User Answer
                <textarea
                  className="min-h-56 resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-mint/30 focus:ring-4 dark:border-zinc-700 dark:bg-zinc-950"
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  placeholder="Paste or type the answer you want analyzed..."
                />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  className="primary-button bg-teal-600 hover:bg-teal-700 dark:bg-mint dark:text-zinc-950 dark:hover:bg-teal-300 border-0 flex items-center justify-center gap-1.5 min-h-11 rounded-lg text-sm font-semibold transition"
                  type="button"
                  disabled={isAnalyzing}
                  onClick={handleAnalyze}
                >
                  {isAnalyzing ? <Loader2 className="animate-spin" size={16} /> : <Brain size={16} />}
                  <span>{isAnalyzing ? "Analyzing" : "Analyze"}</span>
                </button>
                <button
                  className="secondary-button flex items-center justify-center gap-1.5 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-350 dark:hover:bg-rose-950/20 dark:hover:text-rose-455 dark:hover:border-rose-900 transition min-h-11 rounded-lg text-sm font-semibold"
                  type="button"
                  disabled={isAnalyzing}
                  onClick={() => {
                    setTopic("");
                    setAnswer("");
                    setResult(null);
                    setError("");
                    setStatus("");
                    sessionStorage.removeItem("mistake_topic");
                    sessionStorage.removeItem("mistake_answer");
                    sessionStorage.removeItem("mistake_result");
                    stopVoice("");
                  }}
                >
                  <Trash2 size={16} />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          </div>
        </aside>

        <section className="grid content-start gap-4">
          {error ? <div className="notice-error">{error}</div> : null}
          {status ? <div className="notice">{status}</div> : null}

          <div className="toolbar">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Brain size={18} />
                Personalized Feedback
              </div>
              {/* Sound visualizer wave */}
              {voiceStatus === "playing" && (
                <div className="flex items-center gap-0.5 h-6 px-2.5 bg-teal-50 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/40 rounded-full">
                  {[...Array(6)].map((_, i) => {
                    const delays = [0.1, 0.4, 0.2, 0.5, 0.3, 0.6];
                    return (
                      <span
                        key={i}
                        className="w-[2.5px] bg-teal-500 rounded-full"
                        style={{
                          height: "14px",
                          transformOrigin: "center",
                          animation: `soundWaveBar 0.8s ease-in-out infinite alternate`,
                          animationDelay: `${delays[i]}s`
                        }}
                      />
                    );
                  })}
                  <span className="text-[9px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider ml-1.5 animate-pulse">Playing Audio...</span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="icon-button" type="button" title="Copy feedback" disabled={!result} onClick={handleCopy}>
                <Clipboard size={17} />
              </button>
              <button className="secondary-button min-h-10 px-3" type="button" disabled={!audioText || voiceStatus === "playing"} onClick={handlePlay}>
                <Play size={16} />
                Play
              </button>
              <button className="secondary-button min-h-10 px-3" type="button" disabled={voiceStatus !== "playing"} onClick={handlePause}>
                <Pause size={16} />
                Pause
              </button>
              <button className="secondary-button min-h-10 px-3" type="button" disabled={voiceStatus === "idle"} onClick={() => stopVoice()}>
                <Square size={16} />
                Stop
              </button>
            </div>
          </div>

          <div className="workspace min-h-[620px] overflow-auto p-5">
            {result ? (
              <div className="grid gap-5">
                <section className="grid gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950 md:grid-cols-[180px_minmax(0,1fr)]">
                  <div className="grid place-items-center rounded-lg bg-white p-4 dark:bg-zinc-900">
                    <div className="relative grid h-28 w-28 place-items-center rounded-full border-[10px] border-zinc-200 dark:border-zinc-800">
                      <div
                        className="absolute inset-[-10px] rounded-full transition-all duration-75"
                        style={{
                          background: `conic-gradient(#14b8a6 ${displayScore * 3.6}deg, transparent 0deg)`
                        }}
                      />
                      <div className="relative grid h-24 w-24 place-items-center rounded-full bg-white text-center dark:bg-zinc-900">
                        <span className="text-2xl font-bold">{displayScore}</span>
                        <span className="-mt-6 text-xs text-zinc-500">/100</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid content-center gap-3">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-lg bg-teal-100 px-3 py-2 text-sm font-semibold text-teal-900 dark:bg-teal-500/20 dark:text-teal-100">
                        {result.error_type}
                      </span>
                      <span className="rounded-lg bg-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100">
                        {result.difficulty_level}
                      </span>
                    </div>
                    <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                      {result.explanation}
                    </p>
                  </div>
                </section>

                {/* Interactive Feedback Tabs */}
                <div className="flex border-b border-zinc-250 dark:border-zinc-800 pb-1 mt-3 mb-1">
                  <button
                    type="button"
                    onClick={() => setFeedbackView("structured")}
                    className={`pb-2.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition duration-205 ${
                      feedbackView === "structured"
                        ? "border-teal-555 text-teal-650 dark:text-teal-400"
                        : "border-transparent text-zinc-450 hover:text-zinc-650 dark:text-zinc-550 dark:hover:text-zinc-350"
                    }`}
                  >
                    📋 Structured Feedback
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackView("comparative")}
                    className={`pb-2.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition duration-205 ${
                      feedbackView === "comparative"
                        ? "border-teal-555 text-teal-650 dark:text-teal-400"
                        : "border-transparent text-zinc-450 hover:text-zinc-650 dark:text-zinc-550 dark:hover:text-zinc-350"
                    }`}
                  >
                    🔍 Side-by-Side Comparison
                  </button>
                </div>

                {feedbackView === "structured" ? (
                  <div className="grid gap-5 animate-fade-in">
                    {/* Mistakes Checklist */}
                    <section className="grid gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                      <div className="flex items-center justify-between border-b border-zinc-200/60 dark:border-zinc-800/60 pb-2">
                        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-300">
                          <AlertTriangle size={16} />
                          Mistakes Identified
                        </div>
                        {result.mistakes && result.mistakes.length > 0 && (
                          <span className="text-[10px] font-extrabold text-zinc-450 dark:text-zinc-555 bg-zinc-200/50 dark:bg-zinc-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {Object.values(resolvedMistakes).filter(Boolean).length} / {result.mistakes.length} Resolved
                          </span>
                        )}
                      </div>
                      
                      <ul className="grid gap-2.5 text-xs sm:text-sm leading-6">
                        {(result.mistakes || []).map((item, idx) => {
                          const isResolved = !!resolvedMistakes[idx];
                          return (
                            <li key={idx}>
                              <button
                                type="button"
                                onClick={() => setResolvedMistakes(prev => ({ ...prev, [idx]: !prev[idx] }))}
                                className="w-full flex items-start gap-2.5 text-left transition duration-150 hover:text-zinc-900 dark:hover:text-white group"
                              >
                                {isResolved ? (
                                  <CheckCircle2 size={16} className="text-teal-600 dark:text-teal-400 mt-0.5 flex-shrink-0 transition-transform group-hover:scale-110" />
                                ) : (
                                  <div className="h-4 w-4 rounded border border-zinc-300 dark:border-zinc-700 mt-0.5 flex-shrink-0 flex items-center justify-center group-hover:border-teal-500 transition duration-150">
                                    <div className="h-1.5 w-1.5 rounded-sm bg-transparent group-hover:bg-teal-500/50" />
                                  </div>
                                )}
                                <span className={isResolved ? "line-through text-zinc-450 dark:text-zinc-550 transition" : "text-zinc-655 dark:text-zinc-300 transition"}>
                                  {item}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </section>

                    <section className="grid gap-3 rounded-lg border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-500/25 dark:bg-emerald-950/15">
                      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 size={16} />
                        Correct Answer
                      </div>
                      <div className="rounded-md border border-emerald-200/70 bg-white dark:border-emerald-600/20 dark:bg-zinc-900/60 px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-500 mb-1.5">✅ The Correct Answer Is:</p>
                        <p className="text-sm leading-7 font-semibold text-zinc-800 dark:text-zinc-100">{result.correct_answer}</p>
                      </div>
                    </section>

                    <section className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm animate-fade-in">
                      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-300">
                        <Clipboard size={16} />
                        Improved Answer
                      </div>
                      <p className="text-sm leading-7 text-zinc-700 dark:text-zinc-300">{result.improved_answer}</p>
                    </section>

                    <div className="grid gap-4 md:grid-cols-2">
                      <ResultList icon={Target} items={result.weak_areas} title="Weak Areas" />
                      <ResultList icon={Lightbulb} items={result.improvement_tips} title="Improvement Tips" />
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-5 md:grid-cols-2 animate-fade-in">
                    {/* Left Column - Original Attempt */}
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden shadow-sm flex flex-col">
                      <div className="flex items-center justify-between bg-zinc-100 dark:bg-zinc-900 px-4 py-2.5 border-b border-zinc-200/80 dark:border-zinc-800">
                        <span className="text-xs font-bold text-zinc-650 dark:text-zinc-400">Your Original Attempt</span>
                        <span className="text-[10px] bg-zinc-250 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded font-extrabold uppercase tracking-wider">Original</span>
                      </div>
                      <div className="p-4 min-h-72 font-mono text-xs sm:text-sm text-zinc-750 dark:text-zinc-350 whitespace-pre-wrap leading-relaxed overflow-auto custom-scrollbar flex-1 bg-white dark:bg-zinc-950/40">
                        {answer || <span className="italic text-zinc-400">No answer entered.</span>}
                      </div>
                    </div>

                    {/* Right Column - Improved Answer */}
                    <div className="rounded-xl border border-teal-150 bg-teal-50/10 dark:border-teal-500/20 dark:bg-teal-950/5 overflow-hidden shadow-sm flex flex-col">
                      <div className="flex items-center justify-between bg-teal-50/50 dark:bg-teal-950/20 px-4 py-2.5 border-b border-teal-100/80 dark:border-teal-900/40">
                        <span className="text-xs font-bold text-teal-850 dark:text-teal-300">AI Polished Version</span>
                        <span className="text-[10px] bg-teal-100/80 dark:bg-teal-900/40 text-teal-700 dark:text-teal-450 px-2 py-0.5 rounded font-extrabold uppercase tracking-wider">Polished</span>
                      </div>
                      <div className="p-4 min-h-72 font-mono text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed overflow-auto custom-scrollbar flex-1 bg-white dark:bg-zinc-900/40">
                        {result.improved_answer}
                      </div>
                    </div>
                  </div>
                )}

                {result.next_step_topic ? (
                  <section className="relative overflow-hidden rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50 to-emerald-50 p-6 shadow-md dark:border-teal-500/30 dark:from-teal-950/20 dark:to-emerald-950/10">
                    {/* Decorative Background Blur Elements */}
                    <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-teal-400/10 blur-2xl dark:bg-teal-400/5" />
                    <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-emerald-400/10 blur-2xl dark:bg-emerald-400/5" />

                    <div className="relative">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300">
                        <Sparkles size={16} className="animate-pulse" />
                        AI Recommended Next Step
                      </div>

                      <div className="mt-3 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                          <h3 className="text-xl font-bold tracking-tight text-teal-950 dark:text-teal-50 sm:text-2xl">
                            {result.next_step_topic}
                          </h3>
                          <p className="mt-2 text-sm leading-relaxed text-teal-800/80 dark:text-teal-300/80 max-w-xl">
                            To bridge the conceptual gaps identified in your answer and accelerate your mastery, we highly recommend focusing on this topic next.
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-600/10 px-3 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-500/20 dark:text-teal-300">
                          🎯 Essential Focus
                        </span>
                      </div>

                      {/* Interactive Pathways Grid */}
                      <div className="mt-6 grid gap-4 sm:grid-cols-2">
                        {/* Pathway 1: AI Explanation Generator */}
                        <button
                          type="button"
                          onClick={() => handleNavigateToExplanation(result.next_step_topic)}
                          className="group relative flex flex-col rounded-xl border border-teal-200/60 bg-white/80 p-5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-teal-400 hover:bg-white hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-teal-500 dark:hover:bg-zinc-900"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 text-teal-700 transition group-hover:scale-110 dark:bg-teal-500/20 dark:text-teal-300">
                              <BookOpenText size={20} />
                            </div>
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                              ⚡ Auto-Explain
                            </span>
                          </div>
                          <h4 className="mt-4 font-bold text-zinc-900 dark:text-white flex items-center gap-1">
                            Master with Explanations
                            <ArrowRight size={14} className="opacity-0 -translate-x-2 transition duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
                          </h4>
                          <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                            Deep dive into structured lessons, flashcards, interactive visual maps, and AI audio guides.
                          </p>
                        </button>

                        {/* Pathway 2: AI Learning Path Generator */}
                        <button
                          type="button"
                          onClick={() => handleNavigateToLearningPath(result.next_step_topic)}
                          className="group relative flex flex-col rounded-xl border border-teal-200/60 bg-white/80 p-5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-teal-400 hover:bg-white hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-teal-500 dark:hover:bg-zinc-900"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 text-teal-700 transition group-hover:scale-110 dark:bg-teal-500/20 dark:text-teal-300">
                              <GitFork size={20} className="rotate-90" />
                            </div>
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-semibold text-blue-800 dark:bg-blue-500/20 dark:text-blue-300">
                              🗺️ 1-Click Path
                            </span>
                          </div>
                          <h4 className="mt-4 font-bold text-zinc-900 dark:text-white flex items-center gap-1">
                            Build Learning Roadmap
                            <ArrowRight size={14} className="opacity-0 -translate-x-2 transition duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
                          </h4>
                          <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                            Construct a step-by-step studying blueprint with milestones, practice projects, and references.
                          </p>
                        </button>
                      </div>
                    </div>
                  </section>
                ) : null}

                <section className="grid gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-300">
                    <Play size={16} />
                    Audio Script
                  </div>
                  <p className="text-sm leading-7 text-zinc-700 dark:text-zinc-300">{result.audio_script}</p>
                </section>
              </div>
            ) : (
              <div className="flex min-h-[560px] items-center justify-center p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                Mistake analysis feedback will appear here.
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

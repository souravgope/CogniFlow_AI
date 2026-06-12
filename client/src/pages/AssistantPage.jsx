import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Bot,
  Brain,
  Bug,
  Compass,
  CornerDownLeft,
  FileText,
  GitFork,
  HelpCircle,
  Loader2,
  MessageSquare,
  Mic,
  Send,
  Sparkles,
  User,
  Wifi,
  WifiOff
} from "lucide-react";
import { askAssistant } from "../api/assistantApi";

function formatResponseText(text) {
  if (!text) return "";
  
  // Clean HTML escaping
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Bold text: **text** -> <strong>text</strong>
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong class='text-teal-700 dark:text-teal-300 font-semibold'>$1</strong>");

  // Inline code: `code` -> <code>code</code>
  html = html.replace(/`(.*?)`/g, "<code class='px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-pink-600 dark:text-pink-400 font-mono text-xs'>$1</code>");

  // Format headers: ### text -> <h4 class='text-md font-bold text-teal-800 dark:text-teal-400 mt-4 mb-2'>text</h4>
  html = html.replace(/^###\s+(.*?)$/gm, "<h4 class='text-md font-bold text-teal-800 dark:text-teal-400 mt-4 mb-2'>$1</h4>");
  
  // Format bullet and numbered lists
  const lines = html.split("\n");
  let inList = false;
  let listType = ""; // "ul" or "ol"
  const processedLines = lines.map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const content = trimmed.substring(2);
      let listLine = "";
      if (!inList || listType !== "ul") {
        if (inList) listLine += `</${listType}>`;
        inList = true;
        listType = "ul";
        listLine += "<ul class='list-disc pl-5 my-2 space-y-1.5 text-sm sm:text-base text-zinc-700 dark:text-zinc-300'>";
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
        listLine += "<ol class='list-decimal pl-5 my-2 space-y-1.5 text-sm sm:text-base text-zinc-700 dark:text-zinc-300'>";
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
      return extra + (trimmed ? `<p class='my-2.5 leading-relaxed text-sm sm:text-base text-zinc-700 dark:text-zinc-300'>${trimmed}</p>` : "");
    }
  });

  let finalHtml = processedLines.filter(Boolean).join("\n");
  if (inList) {
    finalHtml += `</${listType}>`;
  }
  
  return finalHtml;
}

export default function AssistantPage() {
  const navigate = useNavigate();
  const chatEndRef = useRef(null);
  
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      sender: "assistant",
      text: "Hello! I am your AI Learning Assistant and Doubt Solver. Ask me any conceptual question, and I will explain it to you in detail.\n\nI can also connect you to our other AI features like the **Auto Documentation Generator**, **Explanation Generator**, and **Learning Path Generator**. You can explore a topic and then immediately jump to reading its complete roadmap or creating a visual diagram in one click!",
      timestamp: new Date(),
      suggestions: [
        "Explain Recursion",
        "View React Hooks learning path",
        "Practice CSS Layouts on whiteboard"
      ],
      next_step_topic: "Recursion",
      action_hint: "Try typing 'What is recursion?' or click a suggestion below.",
      type: "guidance"
    }
  ]);
  const [query, setQuery] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (e) => {
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
    setIsLoading(true);
    setError("");

    try {
      const chatHistory = messages.map((m) => ({
        sender: m.sender,
        text: m.text
      }));

      const data = await askAssistant({
        query: currentQuery,
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
        next_step_topic: data.next_step_topic || "",
        action_hint: data.action_hint || "",
        type: data.type || "general"
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to fetch response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion, nextStepTopic) => {
    const text = suggestion.toLowerCase();
    
    // Extrapolate topic from suggestion or nextStepTopic
    let topic = nextStepTopic || "";
    if (!topic) {
      // Try to remove standard command prefixes from suggestion
      topic = suggestion
        .replace(/^(explain|view|practice|read|learn|study)\s+/i, "")
        .replace(/\s+(on whiteboard|learning path|roadmap|path|basics)$/i, "")
        .trim();
    }

    if (text.includes("whiteboard") || text.includes("practice") || text.includes("diagram")) {
      navigate("/diagram", { state: { topic: topic, autoGenerate: true } });
    } else if (text.includes("learning path") || text.includes("roadmap") || text.includes("path")) {
      navigate("/learning", { state: { topic: topic, autoGenerate: true } });
    } else if (text.includes("explain") || text.includes("explanation") || text.includes("summarizer") || text.includes("read")) {
      navigate("/summarizer", { state: { topic: topic, autoGenerate: true } });
    } else {
      // Fallback: If it's a general topic query, post it to the assistant
      setQuery(suggestion);
      // We can trigger send by setting query and calling handleSend next tick
      setTimeout(() => {
        const sendBtn = document.getElementById("send-query-btn");
        if (sendBtn) sendBtn.click();
      }, 50);
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

  return (
    <main className="flex h-screen flex-col bg-[radial-gradient(circle_at_top_left,#e2fef9,transparent_36%),linear-gradient(135deg,#fcfcfc,#f3f4f6)] text-ink dark:bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.18),transparent_36%),linear-gradient(135deg,#09090b,#141416)] dark:text-zinc-100 overflow-hidden">
      {/* Header bar */}
      <header className="flex items-center justify-between border-b border-zinc-200/80 bg-white/70 px-4 py-3.5 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/70 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50 hover:text-ink active:scale-95 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-white"
            title="Back to Dashboard"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="flex items-center gap-2 text-lg font-bold sm:text-xl tracking-tight bg-gradient-to-r from-teal-700 to-emerald-600 bg-clip-text text-transparent dark:from-teal-400 dark:to-emerald-300">
              <Brain className="text-teal-600 dark:text-teal-400 animate-pulse" size={22} />
              AI Doubt Solver & Assistant
            </h1>
            <p className="hidden text-xs text-zinc-500 dark:text-zinc-400 sm:block">
              Learn, clarify concepts, and seamlessly trigger learning roadmaps & explanations.
            </p>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden text-xs font-semibold text-zinc-500 dark:text-zinc-400 md:inline">
            Mode:
          </span>
          <div className="flex rounded-xl border border-zinc-200/80 bg-zinc-100/60 p-1 dark:border-zinc-800 dark:bg-zinc-900/60">
            <button
              onClick={() => setIsOnline(true)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold tracking-wide transition duration-300 ${
                isOnline
                  ? "bg-white text-teal-700 shadow-sm dark:bg-zinc-800 dark:text-teal-300"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              <Wifi size={14} className={isOnline ? "animate-bounce" : ""} />
              Online
            </button>
            <button
              onClick={() => setIsOnline(false)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold tracking-wide transition duration-300 ${
                !isOnline
                  ? "bg-white text-amber-700 shadow-sm dark:bg-zinc-800 dark:text-amber-300"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              <WifiOff size={14} />
              Offline
            </button>
          </div>
        </div>
      </header>

      {/* Online/Offline Status Banners */}
      <div className="shrink-0">
        {isOnline ? (
          <div className="flex items-center justify-center gap-2 bg-teal-500/10 border-b border-teal-500/20 py-1.5 text-center text-xs font-semibold text-teal-800 dark:text-teal-300">
            <Sparkles size={13} className="text-teal-600 dark:text-teal-400" />
            <span>Gemini Intelligence active. Ready for deep-dive answers and live tool suggestions.</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 bg-amber-500/10 border-b border-amber-500/20 py-1.5 text-center text-xs font-semibold text-amber-800 dark:text-amber-300">
            <WifiOff size={13} className="text-amber-600 dark:text-amber-400" />
            <span>Offline mode active. Delivering lightning-fast static insights from local helper.</span>
          </div>
        )}
      </div>

      {/* Messages Stage */}
      <section className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {messages.map((msg) => {
            const isUser = msg.sender === "user";
            return (
              <div
                key={msg.id}
                className={`flex gap-3.5 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {/* Assistant Avatar */}
                {!isUser && (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-900 border border-teal-200 dark:bg-teal-950 dark:text-teal-100 dark:border-teal-800 shadow-sm">
                    <Bot size={18} />
                  </div>
                )}

                {/* Bubble Wrapper */}
                <div className="flex flex-col max-w-[85%] sm:max-w-[75%] gap-2.5">
                  {/* Bubble content */}
                  <div
                    className={`rounded-2xl px-4.5 py-3.5 shadow-sm text-sm sm:text-base leading-relaxed ${
                      isUser
                        ? "bg-gradient-to-br from-teal-600 to-emerald-600 text-white rounded-tr-none"
                        : "bg-white border border-zinc-200/80 text-ink dark:bg-zinc-900/90 dark:border-zinc-800/85 dark:text-zinc-100 rounded-tl-none backdrop-blur-md"
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    ) : (
                      <>
                        <div
                          className="prose dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200"
                          dangerouslySetInnerHTML={{ __html: formatResponseText(msg.text) }}
                        />
                        
                        {/* action_hint guide tip box */}
                        {msg.action_hint && (
                          <div className="mt-3.5 flex items-start gap-2 rounded-xl bg-teal-500/10 border border-teal-500/20 p-2.5 text-xs font-medium text-teal-855 dark:bg-teal-950/40 dark:text-teal-350 dark:border-teal-900/40 shadow-sm animate-pulse">
                            <span className="relative flex h-2.5 w-2.5 mt-1 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500" />
                            </span>
                            <div>
                              <strong className="text-teal-700 dark:text-teal-400">Guide Tip: </strong>
                              {msg.action_hint}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Mode and Type tags */}
                    {!isUser && (msg.mode || msg.type) && (
                      <div className="mt-3 flex items-center justify-end gap-2">
                        {msg.type && (
                          <span className="inline-flex items-center rounded bg-zinc-200/50 text-zinc-650 dark:bg-zinc-800/80 dark:text-zinc-400 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                            {msg.type}
                          </span>
                        )}
                        {msg.mode && (
                          <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            msg.mode === "Online"
                              ? "bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
                          }`}>
                            {msg.mode} Mode
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Recommendation / Link chips */}
                  {!isUser && (msg.suggestions?.length > 0 || msg.next_step_topic) && (
                    <div className="grid gap-2 border-t border-zinc-200/50 pt-2 dark:border-zinc-800/50">
                      {msg.next_step_topic && (
                        <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                          <Compass size={13} className="text-teal-500" />
                          Next concept: <strong className="text-teal-700 dark:text-teal-400 font-bold">{msg.next_step_topic}</strong>
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-1.5">
                        {msg.suggestions.map((suggestion) => {
                          const Icon = getSuggestionIcon(suggestion);
                          return (
                            <button
                              key={suggestion}
                              onClick={() => handleSuggestionClick(suggestion, msg.next_step_topic)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white/80 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-500 hover:text-teal-700 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:border-teal-400 dark:hover:text-teal-300 backdrop-blur-sm"
                            >
                              <Icon size={13} className="text-teal-600 dark:text-teal-400" />
                              {suggestion}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Avatar */}
                {isUser && (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-md">
                    <User size={18} />
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading Indicator bubble */}
          {isLoading && (
            <div className="flex gap-3.5 justify-start">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-900 border border-teal-200 dark:bg-teal-950 dark:text-teal-100 dark:border-teal-800 shadow-sm">
                <Bot size={18} className="animate-spin text-teal-600 dark:text-teal-400" />
              </div>
              <div className="flex flex-col max-w-[75%] gap-2.5">
                <div className="rounded-2xl px-5 py-4 bg-white border border-zinc-200/80 text-ink dark:bg-zinc-900/90 dark:border-zinc-800/85 dark:text-zinc-100 rounded-tl-none shadow-sm flex items-center gap-3">
                  <div className="flex space-x-1.5">
                    <div className="h-2 w-2 rounded-full bg-teal-500 dark:bg-teal-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="h-2 w-2 rounded-full bg-teal-500 dark:bg-teal-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="h-2 w-2 rounded-full bg-teal-500 dark:bg-teal-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider animate-pulse">
                    AI is thinking...
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300">
              <div className="flex gap-2">
                <Bug size={16} className="text-rose-600" />
                <div className="space-y-1">
                  <p className="font-semibold">Oops! Something went wrong.</p>
                  <p className="text-xs text-rose-700 dark:text-rose-400">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </section>

      {/* Input panel */}
      <footer className="border-t border-zinc-200/80 bg-white/70 p-4 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/70 shrink-0">
        <form onSubmit={handleSend} className="mx-auto max-w-4xl">
          <div className="relative flex items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                isOnline
                  ? "Ask any conceptual doubt (e.g. 'What is recursion?')"
                  : "Ask an offline question..."
              }
              disabled={isLoading}
              className="w-full rounded-2xl border border-zinc-300 bg-white py-3.5 pl-4 pr-14 text-sm sm:text-base outline-none ring-teal-500/20 transition-all focus:border-teal-500 focus:ring-4 dark:border-zinc-850 dark:bg-zinc-900 dark:focus:border-teal-400"
            />
            <button
              type="submit"
              id="send-query-btn"
              disabled={!query.trim() || isLoading}
              className="absolute right-2 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-md transition-all hover:bg-teal-700 hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-40 dark:bg-teal-500 dark:text-zinc-950 dark:hover:bg-teal-400"
              title="Send doubt"
            >
              <Send size={16} />
            </button>
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 px-1">
            <span className="flex items-center gap-1">
              <HelpCircle size={12} />
              Try typing <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">"What is a Promise?"</code>
            </span>
            <span className="hidden sm:inline">Press Enter to send</span>
          </div>
        </form>
      </footer>
    </main>
  );
}

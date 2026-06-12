import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  MessageSquare,
  Mic,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  Compass,
  ArrowRight,
  Wifi,
  WifiOff
} from "lucide-react";
import { askWebsiteChat } from "../api/websiteChatApi";

// Premium sound synthesizer
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
    // Avoid autoplay restriction blocks
  }
};

function formatResponseText(text) {
  if (!text) return "";

  // Clean escaping
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Bold text: **text** -> <strong>
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong class='text-indigo-600 dark:text-cyan-400 font-bold'>$1</strong>");

  // Inline code: `code` -> <code>
  html = html.replace(/`(.*?)`/g, "<code class='px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-slate-900 text-indigo-600 dark:text-cyan-300 font-mono text-xs'>$1</code>");

  // Format headers: ### text
  html = html.replace(/^###\s+(.*?)$/gm, "<h4 class='text-xs font-black text-indigo-900 dark:text-indigo-400 mt-3 mb-1 uppercase tracking-wide'>$1</h4>");

  // Format links: [text](url) -> custom class link
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "<a href='$2' class='website-chat-link text-indigo-650 dark:text-cyan-400 hover:underline font-bold inline-flex items-center gap-0.5'>$1</a>");

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
        listLine += "<ul class='list-disc pl-4 my-1 space-y-1 text-xs sm:text-sm text-indigo-950/80 dark:text-slate-200'>";
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
        listLine += "<ol class='list-decimal pl-4 my-1 space-y-1 text-xs sm:text-sm text-indigo-950/80 dark:text-slate-200'>";
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
      return extra + (trimmed ? `<p class='my-1.5 leading-relaxed text-xs sm:text-sm text-indigo-950/80 dark:text-slate-200'>${trimmed}</p>` : "");
    }
  });

  let finalHtml = processedLines.filter(Boolean).join("\n");
  if (inList) {
    finalHtml += `</${listType}>`;
  }

  return finalHtml;
}

export default function HomeChatbotWidget() {
  const navigate = useNavigate();
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
      text: "Hi there! I am **CogniBot**, your AI guide. Let me know if you want to know about our visual tools, roadmaps, features, or stack! Try checking out our [Diagram Generator](/diagram) or ask me anything.",
      timestamp: new Date(),
      suggestions: [
        "Tell me about the Diagram Generator",
        "How does the Mistake Analyzer work?",
        "What is the Learning Path?",
        "What stack do you use?"
      ]
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

  // TTS Voice Output Handler
  const speak = (text, msgId) => {
    if (!window.speechSynthesis) return;

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();

    // Strip tags and md formatting
    const cleanText = text
      .replace(/<[^>]*>/g, "")
      .replace(/\*\*|`|###|-|\*/g, "")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith("en") && v.name.includes("Google")) ||
      voices.find(v => v.lang.startsWith("en")) ||
      voices[0];

    if (voice) utterance.voice = voice;
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    utterance.onstart = () => setSpeakingMsgId(msgId);
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    window.speechSynthesis.speak(utterance);
  };

  // STT Voice Input Handler
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    window.speechSynthesis?.cancel();
    setSpeakingMsgId(null);
    playTechSound(880, "sine", 0.05, 0.02);

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
      playTechSound(440, "sine", 0.05, 0.02);
    }
  };

  // Auto-read TTS
  useEffect(() => {
    if (messages.length > 0 && isAutoRead) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender === "assistant" && lastMsg.id !== "welcome") {
        speak(lastMsg.text, lastMsg.id);
      }
    }
  }, [messages, isAutoRead]);

  // Query processing logic
  const processQuery = async (queryText) => {
    setIsLoading(true);
    setError("");

    try {
      const chatHistory = messages.map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const data = await askWebsiteChat({
        query: queryText,
        isOnline,
        chatHistory
      });

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        text: data.response || "I didn't receive a response. Let me know if I can help you with anything else!",
        timestamp: new Date(),
        suggestions: Array.isArray(data.suggestions) ? data.suggestions : []
      };

      setMessages(prev => [...prev, assistantMessage]);
      playTechSound(980, "triangle", 0.1, 0.015);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to contact CogniBot. Please try again.");
      playTechSound(300, "sawtooth", 0.2, 0.02);
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

    setMessages(prev => [...prev, userMessage]);
    const currentQuery = query.trim();
    setQuery("");
    playTechSound(650, "sine", 0.05, 0.015);
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

    setMessages(prev => [...prev, userMessage]);
    processQuery(transcriptText);
  };

  const handleSuggestionClick = (suggestion) => {
    playTechSound(600, "triangle", 0.05, 0.015);
    const userMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: suggestion,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    processQuery(suggestion);
  };

  // Intercept Markdown Links to Navigate inside React Router SPA
  const handleMessageClick = (e) => {
    const link = e.target.closest("a");
    if (link) {
      const href = link.getAttribute("href");
      if (href && href.startsWith("/")) {
        e.preventDefault();
        playTechSound(1050, "sine", 0.12, 0.02);
        navigate(href);
        setIsOpen(false); // Close widget upon navigation
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Listening Banner */}
      {isListening && (
        <div className="mb-2.5 flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-4 py-2 text-xs font-black text-white shadow-xl animate-bounce">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-100 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
          </span>
          <span>Listening... Ask your question</span>
        </div>
      )}

      {/* Online/Offline Floating Status Flag (Only when closed) */}
      {!isOpen && !isListening && (
        <div className="mb-2 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 shadow-md border border-indigo-100 dark:bg-slate-900/95 dark:border-slate-800 text-[9px] font-black uppercase tracking-wider transition-all duration-300 select-none">
          <span className="relative flex h-1.5 w-1.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOnline ? "bg-indigo-400" : "bg-amber-400"
              }`} />
            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isOnline ? "bg-indigo-500" : "bg-amber-500"
              }`} />
          </span>
          <span className={isOnline ? "text-indigo-600 dark:text-cyan-400" : "text-amber-700 dark:text-amber-400"}>
            {isOnline ? "CogniBot Active" : "CogniBot Offline"}
          </span>
        </div>
      )}

      {/* Chat Window Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="mb-4 flex w-[350px] sm:w-[380px] h-[520px] flex-col overflow-hidden rounded-2xl border border-indigo-100 bg-white/95 shadow-2xl backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/95"
          >
            {/* Header */}
            <header className="flex items-center justify-between border-b border-indigo-50 dark:border-slate-800/85 bg-gradient-to-r from-indigo-50/50 to-white dark:from-slate-900 dark:to-slate-950 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <span className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 text-white shadow-md">
                    <Bot size={16} className={isOnline && !isLoading ? "animate-pulse" : ""} />
                  </span>
                  <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-950 ${isOnline ? "bg-emerald-500" : "bg-amber-500"
                    }`} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-indigo-950 dark:text-white flex items-center gap-1">
                    CogniBot
                  </h2>
                  <p className="text-[10px] text-indigo-900/60 dark:text-slate-400 font-medium">
                    {isOnline ? "Official AI Guide" : "Static Backup Engine"}
                  </p>
                </div>
              </div>

              {/* Switches & Minimize buttons */}
              <div className="flex items-center gap-2">
                {/* Auto read aloud switch */}
                <button
                  onClick={() => {
                    setIsAutoRead(!isAutoRead);
                    playTechSound(600, "triangle", 0.05, 0.015);
                    if (isAutoRead) {
                      window.speechSynthesis?.cancel();
                      setSpeakingMsgId(null);
                    }
                  }}
                  className={`rounded-lg p-1.5 transition ${isAutoRead
                    ? "bg-indigo-50 text-indigo-600 dark:bg-slate-800 dark:text-cyan-400 border border-indigo-200 dark:border-slate-700"
                    : "text-slate-400 hover:bg-slate-100 hover:text-slate-650 dark:hover:bg-slate-900 dark:hover:text-white"
                    }`}
                  title={isAutoRead ? "Auto-Read Aloud: Active" : "Auto-Read Aloud: Muted"}
                >
                  <Volume2 size={15} className={isAutoRead ? "animate-pulse" : ""} />
                </button>

                {/* Online/Offline Toggle */}
                <button
                  onClick={() => {
                    setIsOnline(!isOnline);
                    playTechSound(700, "triangle", 0.05, 0.015);
                  }}
                  className={`flex h-5.5 w-10 items-center rounded-full p-0.5 transition duration-300 ${isOnline ? "bg-indigo-500" : "bg-slate-300 dark:bg-slate-700"
                    }`}
                  title="Toggle Mode (Online / Offline)"
                >
                  <div
                    className={`flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white text-slate-700 shadow transition-all duration-300 ${isOnline ? "translate-x-4.5" : "translate-x-0"
                      }`}
                  >
                    {isOnline ? (
                      <Wifi size={9} className="text-indigo-600" />
                    ) : (
                      <WifiOff size={9} className="text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Close X */}
                <button
                  onClick={() => {
                    playTechSound(400, "sine", 0.1, 0.02);
                    setIsOpen(false);
                    window.speechSynthesis?.cancel();
                    setSpeakingMsgId(null);
                  }}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-650 dark:hover:bg-slate-900 dark:hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
            </header>

            {/* Conversation Area */}
            <section
              className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
              onClick={handleMessageClick}
            >
              {messages.map((msg) => {
                const isUser = msg.sender === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    {!isUser && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 dark:bg-slate-900 dark:border-slate-800 dark:text-cyan-400 shadow-sm">
                        <Bot size={13} />
                      </div>
                    )}

                    <div className="flex flex-col max-w-[82%] gap-1.5">
                      {/* Bubble */}
                      <div
                        className={`relative rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed shadow-sm group/bubble ${isUser
                          ? "bg-gradient-to-br from-indigo-600 to-cyan-500 text-white rounded-tr-none"
                          : "bg-indigo-50/40 text-slate-900 dark:bg-slate-900/60 dark:text-slate-200 rounded-tl-none border border-indigo-100/50 dark:border-slate-800/50"
                          }`}
                      >
                        {isUser ? (
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        ) : (
                          <>
                            <div
                              className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 pr-4"
                              dangerouslySetInnerHTML={{ __html: formatResponseText(msg.text) }}
                            />

                            {/* TTS speaker trigger button */}
                            <button
                              onClick={() => speak(msg.text, msg.id)}
                              className={`absolute top-2.5 right-2 rounded p-0.5 opacity-0 group-hover/bubble:opacity-100 transition-opacity hover:bg-indigo-100 dark:hover:bg-slate-800 ${speakingMsgId === msg.id ? "opacity-100 text-indigo-600 dark:text-cyan-400" : "text-slate-400"
                                }`}
                              title="Read message aloud"
                            >
                              <Volume2 size={12} className={speakingMsgId === msg.id ? "animate-pulse" : ""} />
                            </button>
                          </>
                        )}
                      </div>

                      {/* Suggestions list */}
                      {!isUser && msg.suggestions?.length > 0 && (
                        <div className="flex flex-wrap gap-1 border-t border-indigo-50/20 pt-1.5 dark:border-slate-800/20">
                          {msg.suggestions.map((suggestion) => (
                            <button
                              key={suggestion}
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="inline-flex items-center gap-1 rounded bg-white px-2.5 py-1 text-[10px] font-bold text-indigo-900/80 shadow-sm border border-indigo-100 transition hover:-translate-y-0.5 hover:border-indigo-500 hover:text-indigo-650 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:text-cyan-300"
                            >
                              <Compass size={9} className="text-indigo-600 dark:text-cyan-400" />
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Typing Indicator */}
              {isLoading && (
                <div className="flex gap-2.5 justify-start">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 dark:bg-slate-900 dark:border-slate-800 dark:text-cyan-400 shadow-sm">
                    <Bot size={13} className="animate-bounce" />
                  </div>
                  <div className="rounded-2xl px-3.5 py-2.5 bg-indigo-50/30 dark:bg-slate-900/30 shadow-sm flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-[10px] font-black text-indigo-900/40 dark:text-slate-500 uppercase tracking-wider animate-pulse">
                      Typing...
                    </span>
                  </div>
                </div>
              )}

              {/* Error Notice */}
              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3 text-[11px] text-rose-800 dark:border-rose-950/20 dark:text-rose-300">
                  <p className="font-bold">Error encountered</p>
                  <p className="text-[10px] opacity-80 mt-0.5">{error}</p>
                </div>
              )}

              <div ref={chatEndRef} />
            </section>

            {/* Input Footer */}
            <footer className="border-t border-indigo-50 dark:border-slate-800/80 bg-indigo-50/35 p-3 dark:bg-slate-950/40">
              <form onSubmit={handleSend} className="relative flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={
                      isListening
                        ? "Speak clearly..."
                        : isOnline
                          ? "Ask about CogniFlow AI..."
                          : "Query CogniBot offline..."
                    }
                    disabled={isLoading || isListening}
                    className="w-full rounded-xl border border-indigo-200 dark:border-slate-800 bg-white py-2 pl-3.5 pr-10 text-xs sm:text-sm outline-none ring-indigo-500/10 focus:border-indigo-500 focus:ring-4 dark:bg-slate-900 dark:focus:border-indigo-400 font-bold dark:text-white"
                  />

                  {/* Voice Button */}
                  <button
                    type="button"
                    onClick={isListening ? stopListening : startListening}
                    className={`absolute right-1.5 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-lg transition ${isListening
                      ? "bg-rose-500 text-white animate-pulse"
                      : "text-slate-400 hover:bg-slate-100 hover:text-indigo-650 dark:hover:bg-slate-800 dark:text-slate-300"
                      }`}
                    title={isListening ? "Listening... click to stop" : "Start Voice Talk"}
                  >
                    <Mic size={14} />
                  </button>
                </div>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!query.trim() || isLoading || isListening}
                  className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition shadow-md disabled:opacity-50"
                  title="Send Message"
                >
                  <Send size={13} />
                </button>
              </form>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Trigger Button */}
      {!isListening && (
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            playTechSound(isOpen ? 400 : 1100, "sine", 0.15, 0.02);
            setIsOpen(!isOpen);
            if (isOpen) {
              window.speechSynthesis?.cancel();
              setSpeakingMsgId(null);
            }
          }}
          className={`flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-400 text-white shadow-lg cursor-pointer ${isOpen ? "border border-indigo-300" : "animate-pulse"
            }`}
          title={isOpen ? "Close CogniBot Chat" : "Open AI Website Guide"}
        >
          {isOpen ? <X size={20} /> : <MessageSquare size={20} />}
        </motion.button>
      )}
    </div>
  );
}

import { ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

// Web Audio synthesized soundscapes
const playTechSound = (frequency = 600, type = "sine", duration = 0.08, volume = 0.01) => {
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
    // Silently bypass context policies
  }
};

const colorMap = {
  "AI Whiteboard + Diagram Generator": {
    glow: "hover:shadow-[0_0_35px_-5px_rgba(20,184,166,0.35)]",
    border: "hover:border-teal-500/50 dark:hover:border-teal-500/40",
    bgIcon: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30",
    badge: "text-teal-600 dark:text-teal-400 bg-teal-500/10",
    category: "Creation",
    gradient: "from-teal-500/10 via-transparent to-transparent",
    status: "🔥 Popular",
    microcopy: "Best for design architectures",
    specs: "Mermaid JS • Excalidraw Canvas",
    borderGlow: "from-teal-500/30 via-cyan-500/30 to-emerald-500/30"
  },
  "AI Auto Documentation Generator": {
    glow: "hover:shadow-[0_0_35px_-5px_rgba(59,130,246,0.35)]",
    border: "hover:border-blue-500/50 dark:hover:border-blue-500/40",
    bgIcon: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
    badge: "text-blue-600 dark:text-blue-400 bg-blue-500/10",
    category: "Creation",
    gradient: "from-blue-500/10 via-transparent to-transparent",
    status: "⚡ Recommended",
    microcopy: "Best for code summaries & guides",
    specs: "Codebase Scan • Technical API Docs",
    borderGlow: "from-blue-500/30 via-indigo-500/30 to-cyan-500/30"
  },
  "AI Explanation Generator": {
    glow: "hover:shadow-[0_0_35px_-5px_rgba(217,70,239,0.35)]",
    border: "hover:border-fuchsia-500/50 dark:hover:border-fuchsia-500/40",
    bgIcon: "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/30",
    badge: "text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-500/10",
    category: "Creation",
    gradient: "from-fuchsia-500/10 via-transparent to-transparent",
    status: "💡 Hot",
    microcopy: "Best for voice scripts & summaries",
    specs: "Voice Scripting • Slide Blueprints",
    borderGlow: "from-fuchsia-500/30 via-pink-500/30 to-purple-500/30"
  },
  "AI Learning Path Generator": {
    glow: "hover:shadow-[0_0_35px_-5px_rgba(16,185,129,0.35)]",
    border: "hover:border-emerald-500/50 dark:hover:border-emerald-500/40",
    bgIcon: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    badge: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
    category: "Learning",
    gradient: "from-emerald-500/10 via-transparent to-transparent",
    status: "⭐ New",
    microcopy: "Best for roadmap milestones",
    specs: "Milestones • Practice Projects",
    borderGlow: "from-emerald-500/30 via-teal-500/30 to-green-500/30"
  },
  "AI Mistake Analyzer": {
    glow: "hover:shadow-[0_0_35px_-5px_rgba(244,63,94,0.35)]",
    border: "hover:border-rose-500/50 dark:hover:border-rose-500/40",
    bgIcon: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
    badge: "text-rose-600 dark:text-rose-400 bg-rose-50/70 dark:bg-rose-500/10",
    category: "Analytics",
    gradient: "from-rose-500/10 via-transparent to-transparent",
    status: "🛡️ Essential",
    microcopy: "Best for conceptual debug traces",
    specs: "Trace Debugging • Error Feedback",
    borderGlow: "from-rose-500/30 via-red-500/30 to-orange-500/30"
  }
};

const fallbackColor = {
  glow: "hover:shadow-[0_0_35px_-5px_rgba(20,184,166,0.25)]",
  border: "hover:border-teal-500/50",
  bgIcon: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30",
  badge: "text-teal-600 dark:text-teal-400 bg-teal-500/10",
  category: "AI Tool",
  gradient: "from-teal-500/10 via-transparent to-transparent",
  status: "🟢 Ready",
  microcopy: "Intelligent helper active",
  specs: "Interactive Helper Core",
  borderGlow: "from-teal-500/20 via-cyan-500/20 to-indigo-500/20"
};

// Animation variants for cascading loads
const cardItemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

export default function ToolCard({ title, description, route, icon: Icon }) {
  const navigate = useNavigate();
  const style = colorMap[title] || fallbackColor;

  const handleCardClick = () => {
    // Play sound chirp
    playTechSound(920, "sine", 0.1, 0.02);

    try {
      const recent = JSON.parse(localStorage.getItem("recent_tools") || "[]");
      const updated = [title, ...recent.filter((t) => t !== title)].slice(0, 3);
      localStorage.setItem("recent_tools", JSON.stringify(updated));
      window.dispatchEvent(new Event("recent_tools_updated"));
    } catch (e) {
      console.error(e);
    }
    
    setTimeout(() => {
      navigate(route);
    }, 150);
  };

  const handleMouseEnter = () => {
    playTechSound(480, "triangle", 0.04, 0.006);
  };

  return (
    <motion.button
      variants={cardItemVariants}
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.97 }}
      onMouseEnter={handleMouseEnter}
      onClick={handleCardClick}
      className={`group relative flex flex-col min-h-64 w-full cursor-pointer overflow-hidden rounded-3xl border border-zinc-200 bg-white/60 p-6 text-left shadow-sm transition-all duration-500 hover:bg-white dark:border-zinc-800/80 dark:bg-zinc-900/30 dark:hover:bg-zinc-900/50 backdrop-blur-md ${style.glow} ${style.border}`}
      type="button"
    >
      {/* 1. Dynamic border glowing gradient outline */}
      <div className={`absolute inset-0 -z-10 rounded-3xl border border-transparent bg-gradient-to-r ${style.borderGlow} opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`} />

      {/* 2. Glass Sweep light reflection sheen */}
      <div className="absolute top-0 -left-[120%] h-full w-[60%] -z-10 bg-gradient-to-r from-transparent via-white/15 dark:via-white/5 to-transparent skew-x-12 group-hover:left-[150%] transition-all duration-1000 ease-out pointer-events-none" />

      {/* 3. Layered grid pattern overlay */}
      <div className="absolute inset-0 -z-30 opacity-[0.03] dark:opacity-[0.04] pointer-events-none">
        <svg width="100%" height="100%">
          <defs>
            <pattern id={`grid-${title.replace(/\s+/g, "")}`} width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M 24 0 L 0 0 0 24" fill="none" stroke="currentColor" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#grid-${title.replace(/\s+/g, "")})`} />
        </svg>
      </div>

      {/* 4. Ambient spot glow in back */}
      <div className={`absolute inset-0 -z-20 bg-gradient-to-br ${style.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

      {/* Header Row */}
      <div className="flex items-start justify-between w-full mb-5">
        <span className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${style.bgIcon}`}>
          {Icon ? <Icon size={22} className="stroke-[1.8] animate-pulse" /> : <ArrowRight size={22} />}
        </span>

        {/* Dynamic Category Badges */}
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
              {style.status}
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${style.badge}`}>
              <Sparkles size={8} className="animate-spin-slow" />
              {style.category}
            </span>
          </div>
          
          {/* Real-time details info specs overlay */}
          <span className="text-[8px] font-bold text-zinc-400 dark:text-zinc-500 tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {style.specs}
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex flex-col gap-2 flex-grow">
        <h3 className="text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-50 group-hover:text-ink dark:group-hover:text-white transition-colors duration-300">
          {title}
        </h3>
        
        {/* Microcopy specifications */}
        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 opacity-80 group-hover:opacity-100 transition-opacity duration-300">
          {style.microcopy}
        </span>

        <p className="text-xs sm:text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-white transition-colors duration-300 mt-1.5">
          {description}
        </p>
      </div>

      {/* Click tap active overlay ring */}
      <motion.div className="absolute inset-0 bg-teal-500/5 rounded-3xl opacity-0 group-active:opacity-100 transition-opacity duration-300" />

      {/* Launch indicator */}
      <div className="mt-6 flex items-center gap-1.5 text-xs font-black text-teal-600 dark:text-teal-400 group-hover:text-teal-750 group-hover:shadow-teal-500/10 dark:group-hover:text-teal-300 tracking-widest transition-colors duration-300">
        <span className="relative">
          Initialize Module
          <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-teal-500 dark:bg-teal-400 group-hover:w-full transition-all duration-300" />
        </span>
        <ArrowRight className="transition-transform duration-500 group-hover:translate-x-1.5" size={14} />
      </div>
    </motion.button>
  );
}

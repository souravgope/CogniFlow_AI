import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";
import { Loader2, Mail, Lock, User, UserPlus, Sparkles, ArrowLeft, AlertCircle, Eye, EyeOff, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleLogin } from "@react-oauth/google";

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
  } catch (e) {}
};

export default function Signup() {
  const { signup, googleLogin, addToast, theme, toggleTheme } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const getPasswordStrength = (pass) => {
    if (!pass) return { label: "", color: "bg-indigo-100 dark:bg-zinc-800", width: "w-0", level: 0 };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    if (score <= 1) return { label: "Weak 🔴", color: "bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]", width: "w-1/3", level: 1 };
    if (score <= 3) return { label: "Moderate 🟡", color: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]", width: "w-2/3", level: 2 };
    return { label: "Strong 🟢", color: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]", width: "w-full", level: 3 };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Please fill in all fields.");
      addToast("Please fill in all profile fields.", "error");
      playTechSound(320, "sawtooth", 0.2, 0.03);
      return;
    }
    setLoading(true);
    setError("");
    playTechSound(880, "sine", 0.15, 0.02);
    try {
      await signup(name, email, password);
      playTechSound(1050, "sine", 0.25, 0.02);
      addToast("Workspace profile generated successfully.", "success");
      navigate("/");
    } catch (err) {
      setError(err.message || "Failed to register.");
      addToast(err.message || "Error creating workspace account.", "error");
      playTechSound(280, "triangle", 0.3, 0.03);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      playTechSound(980, "sine", 0.15, 0.02);
      await googleLogin(credentialResponse.credential);
      playTechSound(1150, "sine", 0.25, 0.02);
      addToast("Signed up via Google successfully.", "success");
      navigate("/");
    } catch (err) {
      setError(err.message || "Google signup failed.");
      addToast(err.message || "Google signup failure.", "error");
      playTechSound(280, "triangle", 0.3, 0.03);
    }
  };

  return (
    <main
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#f0f4ff] via-[#e6efff] to-[#f0f4ff] dark:from-[#030712] dark:via-[#091124] dark:to-[#030712] px-4 flex items-center justify-center text-indigo-950 dark:text-white sm:px-6 transition-colors duration-500"
    >
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,#33415510_1px,transparent_1px),linear-gradient(to_bottom,#33415510_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      <div className="absolute -z-10 h-[450px] w-[450px] rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none transition-all duration-300 ease-out" style={{ left: `${mousePos.x - 225}px`, top: `${mousePos.y - 225}px` }} />
      <div className="absolute left-1/4 top-1/4 -z-10 h-72 w-72 rounded-full bg-indigo-500/10 blur-[100px] animate-pulse" />
      <div className="absolute right-1/4 bottom-1/4 -z-10 h-72 w-72 rounded-full bg-cyan-500/5 blur-[100px] animate-pulse" style={{ animationDuration: "10s" }} />


      {/* Back to Home Button - top left */}
      <Link
        to="/"
        onClick={() => playTechSound(600, "triangle", 0.08, 0.015)}
        className="fixed top-5 left-5 z-50 inline-flex items-center gap-2 rounded-xl border border-indigo-100 dark:border-slate-800 bg-white/70 dark:bg-slate-950/60 px-4 py-2 text-xs font-black text-indigo-900 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:border-indigo-400/50 transition-all cursor-pointer shadow-sm backdrop-blur-md"
      >
        <ArrowLeft size={14} />
        <span>Home</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md border border-indigo-100 dark:border-slate-800 bg-white/80 dark:bg-slate-950/60 p-8 rounded-[32px] backdrop-blur-2xl shadow-2xl shadow-indigo-200/60 dark:shadow-indigo-950/20 space-y-6 overflow-hidden"
      >
        <div className="absolute inset-0 border border-transparent rounded-[32px] bg-gradient-to-r from-indigo-500/10 via-cyan-500/5 to-indigo-500/10 opacity-0 hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-3">
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400"
          >
            <Sparkles size={11} />
            <span>AI Workspace Secure Gateway</span>
          </motion.div>
          <h1 className="text-3xl font-black tracking-tight text-indigo-950 dark:text-white leading-none">Signup</h1>
          <p className="text-xs text-indigo-900/60 dark:text-slate-400 font-bold tracking-tight">Register your profile node to initialize secure whiteboard features.</p>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, x: [0, -10, 10, -8, 8, -5, 5, 0] }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl border border-rose-200 dark:border-rose-900/30 bg-rose-50 dark:bg-rose-950/20 p-4 text-xs text-rose-700 dark:text-rose-300 space-y-1"
            >
              <div className="flex items-center gap-1.5 font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
                <AlertCircle size={14} />
                <span>Registration Failure</span>
              </div>
              <p className="leading-relaxed font-semibold">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-indigo-900/60 dark:text-slate-400">Full Name</label>
            <div className="relative">
              <User className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${nameFocused ? "text-indigo-500 dark:text-indigo-400" : "text-indigo-900/40 dark:text-slate-500"}`} size={16} />
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => { setNameFocused(true); playTechSound(650, "sine", 0.04, 0.008); }}
                onBlur={() => setNameFocused(false)}
                required
                className="w-full rounded-2xl border border-indigo-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 py-3 pl-11 pr-4 text-xs sm:text-sm outline-none transition-all duration-300 focus:border-indigo-500/60 font-bold tracking-tight text-indigo-950 dark:text-white placeholder:text-indigo-300 dark:placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-indigo-900/60 dark:text-slate-400">Email Address</label>
            <div className="relative">
              <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${emailFocused ? "text-indigo-500 dark:text-indigo-400" : "text-indigo-900/40 dark:text-slate-500"}`} size={16} />
              <input
                type="email"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => { setEmailFocused(true); playTechSound(650, "sine", 0.04, 0.008); }}
                onBlur={() => setEmailFocused(false)}
                required
                className="w-full rounded-2xl border border-indigo-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 py-3 pl-11 pr-4 text-xs sm:text-sm outline-none transition-all duration-300 focus:border-indigo-500/60 font-bold tracking-tight text-indigo-950 dark:text-white placeholder:text-indigo-300 dark:placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-indigo-900/60 dark:text-slate-400">Password</label>
            <div className="relative">
              <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${passFocused ? "text-indigo-500 dark:text-indigo-400" : "text-indigo-900/40 dark:text-slate-500"}`} size={16} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => { setPassFocused(true); playTechSound(650, "sine", 0.04, 0.008); }}
                onBlur={() => setPassFocused(false)}
                required
                className="w-full rounded-2xl border border-indigo-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 py-3 pl-11 pr-11 text-xs sm:text-sm outline-none transition-all duration-300 focus:border-indigo-500/60 font-bold tracking-tight text-indigo-950 dark:text-white placeholder:text-indigo-300 dark:placeholder:text-slate-600"
              />
              <button
                type="button"
                onClick={() => { setShowPassword(!showPassword); playTechSound(showPassword ? 550 : 750, "sine", 0.06, 0.015); }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-indigo-900/40 dark:text-slate-500 hover:text-indigo-700 dark:hover:text-white transition cursor-pointer"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Password Strength */}
          <AnimatePresence>
            {password && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1.5 overflow-hidden"
              >
                <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-indigo-900/60 dark:text-slate-400">
                  <span>Workspace Security Check</span>
                  <span className="font-extrabold">{strength.label}</span>
                </div>
                <div className="h-1.5 w-full bg-indigo-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-500 rounded-full ${strength.width} ${strength.color}`} />
                </div>
                <p className="text-[9px] text-indigo-900/50 dark:text-slate-500 leading-normal font-bold">
                  Include uppercase letters, numbers, and symbols for a stronger workspace firewall protection.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500 cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <><UserPlus size={16} /><span>Signup</span></>}
          </motion.button>
        </form>

        {/* Divider */}
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-indigo-100 dark:border-slate-800"></div>
          <span className="flex-shrink mx-4 text-[9px] font-black text-indigo-900/50 dark:text-slate-500 uppercase tracking-widest">or continue with</span>
          <div className="flex-grow border-t border-indigo-100 dark:border-slate-800"></div>
        </div>

        <div className="w-full flex justify-center [&>div]:w-full [&_iframe]:w-full overflow-hidden rounded-2xl">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError("Google signup failed. Please ensure you have a valid Client ID.")}
            theme={theme === "dark" ? "filled_black" : "outline"}
            shape="rectangular"
            text="signup_with"
            width="100%"
          />
        </div>

        <p className="text-center text-xs text-indigo-900/60 dark:text-slate-400 font-semibold tracking-tight">
          Already registered?{" "}
          <Link to="/login" onClick={() => playTechSound(700, "triangle", 0.08, 0.015)} className="font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 underline underline-offset-4">
            Log In
          </Link>
        </p>
      </motion.div>
    </main>
  );
}

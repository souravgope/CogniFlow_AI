import { createContext, useContext, useState, useEffect } from "react";
import { X, CheckCircle, AlertTriangle, Info, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getCurrentUser, loginUser, signupUser, googleLoginUser } from "../api/authApi";

const AuthContext = createContext(null);

// Programmatic quick audio chirp oscillator
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
    // Autoplay block bypass
  }
};

// Patch global fetch to automatically inject Authorization headers
const originalFetch = window.fetch;
window.fetch = async function (url, options = {}) {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (token) {
    options.headers = {
      ...options.headers,
      "Authorization": `Bearer ${token}`
    };
  }
  return originalFetch(url, options);
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved) return saved;
    } catch (e) {
      console.warn(e);
    }
    return "dark"; // Default to dark mode
  });

  useEffect(() => {
    try {
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      localStorage.setItem("theme", theme);
    } catch (e) {
      console.warn(e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Toast trigger utility
  const addToast = (message, type = "success", duration = 4000) => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Play contextual feedback beep
    if (type === "success") playTechSound(880, "sine", 0.12, 0.015);
    else if (type === "error") playTechSound(280, "triangle", 0.15, 0.02);
    else playTechSound(580, "sine", 0.08, 0.01);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Initialize and load user sessions from storage nodes
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (token) {
        try {
          const profile = await getCurrentUser();
          setUser(profile);
        } catch (e) {
          console.warn("⚠️ Token expired or invalid, session cleared:", e.message);
          localStorage.removeItem("token");
          sessionStorage.removeItem("token");
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const saveSavedEmail = (name, email, profileImage = null) => {
    try {
      const saved = JSON.parse(localStorage.getItem("ai_workspace_saved_emails") || "[]");
      const filtered = saved.filter(acc => acc.email.toLowerCase() !== email.toLowerCase());
      filtered.unshift({
        name,
        email: email.toLowerCase(),
        profileImage,
        timestamp: Date.now()
      });
      localStorage.setItem("ai_workspace_saved_emails", JSON.stringify(filtered.slice(0, 5)));
    } catch (e) {
      console.warn("Failed to save registered account to browser memory", e);
    }
  };

  const login = async (email, password) => {
    const data = await loginUser(email, password);
    // Always persist in localStorage so the user stays logged in across refreshes
    localStorage.setItem("token", data.token);
    localStorage.setItem("has_account", "true");
    setUser(data.user);
    saveSavedEmail(data.user.name, data.user.email, data.user.profileImage);
    addToast(`Authenticated as ${data.user.name}`, "success");
    return data.user;
  };

  const signup = async (name, email, password) => {
    const data = await signupUser(name, email, password);
    // Persist in localStorage so session survives page refresh
    localStorage.setItem("token", data.token);
    localStorage.setItem("has_account", "true");
    setUser(data.user);
    saveSavedEmail(data.user.name, data.user.email, data.user.profileImage);
    addToast("Workspace Node Created Successfully!", "success");
    return data.user;
  };

  const googleLogin = async (token) => {
    const data = await googleLoginUser(token);
    // Persist in localStorage so Google auth session survives page refresh
    localStorage.setItem("token", data.token);
    localStorage.setItem("has_account", "true");
    setUser(data.user);
    saveSavedEmail(data.user.name, data.user.email, data.user.profileImage);
    addToast(`Google Authentication successful: Welcome ${data.user.name}`, "success");
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    setUser(null);
    addToast("Workspace node session terminated.", "info");
  };

  const value = {
    user,
    loading,
    toasts,
    theme,
    toggleTheme,
    login,
    signup,
    googleLogin,
    logout,
    addToast,
    removeToast
  };

  return (
    <AuthContext.Provider value={value}>
      {children}

      {/* Absolute Toast alert viewport float */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => {
            const isSuccess = toast.type === "success";
            const isError = toast.type === "error";
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className={`flex items-start justify-between gap-3 p-4 rounded-2xl border backdrop-blur-md shadow-lg pointer-events-auto ${
                  isSuccess
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300 shadow-emerald-500/5"
                    : isError
                    ? "bg-rose-500/10 border-rose-500/20 text-rose-800 dark:text-rose-300 shadow-rose-500/5"
                    : "bg-blue-500/10 border-blue-500/20 text-blue-800 dark:text-blue-300 shadow-blue-500/5"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0">
                    {isSuccess ? (
                      <CheckCircle size={16} className="text-emerald-500" />
                    ) : isError ? (
                      <AlertTriangle size={16} className="text-rose-500" />
                    ) : (
                      <Info size={16} className="text-blue-500" />
                    )}
                  </span>
                  <div>
                    <div className="text-xs font-black uppercase tracking-wider">
                      {isSuccess ? "Success Alert" : isError ? "System Error" : "System Notification"}
                    </div>
                    <div className="text-xs leading-relaxed opacity-90 mt-1 font-bold">{toast.message}</div>
                  </div>
                </div>

                <button
                  onClick={() => removeToast(toast.id)}
                  className="rounded-lg p-0.5 opacity-60 hover:opacity-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 transition cursor-pointer"
                >
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be nested within an AuthProvider");
  }
  return context;
}

import { useState, useEffect } from "react";
import { Loader2, Mail, UserPlus, X, ChevronRight, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Persist & load Google accounts from localStorage
const STORAGE_KEY = "ai_workspace_google_accounts";

function loadAccounts() {
  try {
    const googleAccounts = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const localAccounts = JSON.parse(localStorage.getItem("ai_workspace_saved_emails") || "[]");
    
    const combined = [...googleAccounts];
    localAccounts.forEach((local) => {
      if (!combined.some((a) => a.email.toLowerCase() === local.email.toLowerCase())) {
        combined.push({
          name: local.name,
          email: local.email,
          profileImage: local.profileImage,
          isLocal: true
        });
      }
    });
    return combined;
  } catch {
    return [];
  }
}

function saveAccount(account) {
  const accounts = loadAccounts();
  const exists = accounts.find((a) => a.email === account.email);
  if (!exists) {
    accounts.unshift(account); // newest first
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts.slice(0, 5)));
  }
}

function getInitials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// Deterministic avatar color based on email
const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-cyan-500",
  "bg-pink-500",
  "bg-indigo-500",
];
function avatarColor(email) {
  let hash = 0;
  for (const c of email) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function GoogleAuthModal({ isOpen, onClose, onSelect }) {
  const [accounts, setAccounts] = useState([]);
  const [mode, setMode] = useState("chooser"); // "chooser" | "add" | "loading"
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [emailStep, setEmailStep] = useState(true); // true = email, false = name
  const [emailError, setEmailError] = useState("");
  const [selectedAccount, setSelectedAccount] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setAccounts(loadAccounts());
      setMode(loadAccounts().length > 0 ? "chooser" : "add");
    }
  }, [isOpen]);

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setMode(loadAccounts().length > 0 ? "chooser" : "add");
      setNewEmail("");
      setNewName("");
      setEmailStep(true);
      setEmailError("");
      setSelectedAccount(null);
    }, 300);
  };

  const handleSelectAccount = (account) => {
    setSelectedAccount(account);
    setMode("loading");
    const avatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(account.name)}`;
    setTimeout(() => {
      onSelect(account.name, account.email, `google_${Date.now()}`, avatar);
      handleClose();
    }, 1300);
  };

  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleEmailNext = (e) => {
    e.preventDefault();
    if (!newEmail) { setEmailError("Enter an email address."); return; }
    if (!validateEmail(newEmail)) { setEmailError("Enter a valid email address."); return; }
    setEmailError("");
    setEmailStep(false);
  };

  const handleAddAccount = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const account = { name: newName.trim(), email: newEmail };
    saveAccount(account);
    setSelectedAccount(account);
    setMode("loading");
    const avatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(newName.trim())}`;
    setTimeout(() => {
      onSelect(account.name, account.email, `google_${Date.now()}`, avatar);
      handleClose();
    }, 1300);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ type: "spring", stiffness: 300, damping: 26 }}
          className="relative w-full max-w-[400px] rounded-2xl shadow-2xl overflow-hidden bg-white dark:bg-[#202124] text-zinc-900 dark:text-zinc-100"
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {/* ── Top Google bar ── */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              {/* Full-colour Google G */}
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Sign in with Google</span>
            </div>
            <button
              onClick={handleClose}
              className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>

          <div className="px-8 py-6">

            {/* ── LOADING ── */}
            {mode === "loading" && (
              <div className="flex flex-col items-center justify-center py-10 space-y-5">
                {selectedAccount && (
                  <div className={`flex h-14 w-14 items-center justify-center rounded-full text-white text-lg font-bold ${avatarColor(selectedAccount.email)}`}>
                    {getInitials(selectedAccount.name)}
                  </div>
                )}
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Signing in as {selectedAccount?.name}…</p>
                  <p className="text-xs text-zinc-500">{selectedAccount?.email}</p>
                </div>
                <Loader2 size={22} className="animate-spin text-blue-500" />
              </div>
            )}

            {/* ── CHOOSER ── */}
            {mode === "chooser" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <h2 className="text-[22px] font-normal text-zinc-800 dark:text-zinc-100">Choose an account</h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    to continue to{" "}
                    <span className="text-blue-600 dark:text-blue-400 font-medium">AI Workspace</span>
                  </p>
                </div>

                <div className="space-y-1">
                  {accounts.map((account) => (
                    <button
                      key={account.email}
                      onClick={() => handleSelectAccount(account)}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition cursor-pointer text-left group"
                    >
                      {/* Avatar */}
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white text-sm font-semibold ${avatarColor(account.email)}`}>
                        {getInitials(account.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{account.name}</span>
                          {account.isLocal && (
                            <span className="text-[8px] font-black uppercase tracking-wider bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-450 px-1.5 py-0.5 rounded-full border border-teal-500/10">Saved</span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{account.email}</div>
                      </div>
                      <ChevronRight size={14} className="text-zinc-300 group-hover:text-zinc-500 dark:text-zinc-600 dark:group-hover:text-zinc-400 transition shrink-0" />
                    </button>
                  ))}

                  {/* Use another account */}
                  <button
                    onClick={() => { setMode("add"); setEmailStep(true); setNewEmail(""); setNewName(""); }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition cursor-pointer text-left"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                      <UserPlus size={16} />
                    </div>
                    <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Use another account</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── ADD ACCOUNT — Email step ── */}
            {mode === "add" && emailStep && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <h2 className="text-[22px] font-normal text-zinc-800 dark:text-zinc-100">Sign in</h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    to continue to{" "}
                    <span className="text-blue-600 dark:text-blue-400 font-medium">AI Workspace</span>
                  </p>
                </div>

                <form onSubmit={handleEmailNext} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Email or phone</label>
                    <input
                      type="text"
                      autoFocus
                      placeholder="Enter your email"
                      value={newEmail}
                      onChange={(e) => { setNewEmail(e.target.value); setEmailError(""); }}
                      className={`w-full rounded-lg border ${emailError ? "border-red-400" : "border-zinc-300 dark:border-zinc-600 focus:border-blue-500"} bg-transparent py-2.5 px-3.5 text-sm outline-none transition dark:bg-zinc-800/50 placeholder:text-zinc-400`}
                    />
                    {emailError && <p className="text-xs text-red-500">{emailError}</p>}
                  </div>

                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Not your computer? Use Guest mode to sign in privately.{" "}
                    <span className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">Learn more</span>
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    {accounts.length > 0 ? (
                      <button type="button" onClick={() => setMode("chooser")} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                        Back
                      </button>
                    ) : (
                      <span />
                    )}
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-5 py-2 text-sm font-medium text-white shadow transition cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ── ADD ACCOUNT — Name step ── */}
            {mode === "add" && !emailStep && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="space-y-2">
                  <h2 className="text-[22px] font-normal text-zinc-800 dark:text-zinc-100">Welcome</h2>
                  <button
                    onClick={() => setEmailStep(true)}
                    className="inline-flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition cursor-pointer"
                  >
                    <Mail size={11} className="text-zinc-400" />
                    {newEmail}
                  </button>
                </div>

                <form onSubmit={handleAddAccount} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Your name</label>
                    <input
                      type="text"
                      autoFocus
                      required
                      placeholder="First and last name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-transparent py-2.5 px-3.5 text-sm outline-none focus:border-blue-500 transition dark:bg-zinc-800/50 placeholder:text-zinc-400"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button type="button" onClick={() => setEmailStep(true)} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                      Back
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-5 py-2 text-sm font-medium text-white shadow transition cursor-pointer"
                    >
                      <Check size={14} />
                      Continue
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          {mode !== "loading" && (
            <div className="border-t border-zinc-100 dark:border-zinc-800 px-6 py-3 flex items-center justify-between text-[11px] text-zinc-400">
              <span className="cursor-pointer hover:text-zinc-600 dark:hover:text-zinc-300 transition">English (United States)</span>
              <div className="flex items-center gap-4">
                <span className="cursor-pointer hover:text-zinc-600 dark:hover:text-zinc-300 transition">Help</span>
                <span className="cursor-pointer hover:text-zinc-600 dark:hover:text-zinc-300 transition">Privacy</span>
                <span className="cursor-pointer hover:text-zinc-600 dark:hover:text-zinc-300 transition">Terms</span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

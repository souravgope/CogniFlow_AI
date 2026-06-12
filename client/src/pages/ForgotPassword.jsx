import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPasswordRequest } from "../api/authApi";
import { useAuth } from "../utils/AuthContext";
import { Loader2, Mail, MailOpen, RefreshCw, ArrowLeft, AlertCircle } from "lucide-react";

export default function ForgotPassword() {
  const { addToast } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const data = await forgotPasswordRequest(email);
      setMessage(data.message || "Reset instruction token generated.");
      addToast("Password reset link sent to your email!", "success");
    } catch (err) {
      setError(err.message || "Failed to trigger password reset.");
      addToast(err.message || "Email address not found.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 dark:bg-zinc-950 px-4 flex items-center justify-center transition-colors duration-500 text-zinc-900 dark:text-zinc-100 sm:px-6">
      {/* Cyber layouts */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a15_1px,transparent_1px),linear-gradient(to_bottom,#0f172a15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] dark:bg-[linear-gradient(to_right,#33415518_1px,transparent_1px),linear-gradient(to_bottom,#33415518_1px,transparent_1px)] -z-10" />
      <div className="absolute left-1/3 top-1/4 -z-10 h-72 w-72 rounded-full bg-teal-400/15 blur-[90px] dark:bg-teal-500/5 animate-pulse" />
      <div className="absolute right-1/3 bottom-1/4 -z-10 h-72 w-72 rounded-full bg-indigo-400/15 blur-[90px] dark:bg-indigo-500/5 animate-pulse" style={{ animationDuration: "8s" }} />

      <div className="relative w-full max-w-md border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/30 p-8 rounded-3xl backdrop-blur-xl shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-teal-600 via-cyan-500 to-emerald-500 bg-clip-text text-transparent dark:from-teal-400 dark:via-cyan-400 dark:to-emerald-400 leading-none">
            Forgot Password
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Request secure password reset links for your workspace node.</p>
        </div>

        {/* Error Alert Banner */}
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-xs text-rose-800 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-350 space-y-1 animate-in fade-in duration-300">
            <div className="flex items-center gap-1.5 font-black uppercase tracking-wider text-rose-700 dark:text-rose-450">
              <AlertCircle size={14} className="animate-bounce" />
              <span>Recovery Error</span>
            </div>
            <p className="leading-relaxed font-semibold">{error}</p>
          </div>
        )}

        {/* Success message */}
        {message ? (
          <div className="text-center space-y-6 animate-in fade-in zoom-in duration-300">
            {/* Elegant Ring Mail Icon */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-teal-500/20 bg-teal-500/5 dark:bg-teal-500/10 text-teal-650 dark:text-teal-400">
              <MailOpen size={28} className="animate-pulse" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 uppercase tracking-wider leading-none">
                Check Your Email
              </h2>
              <p className="text-xs text-zinc-555 dark:text-zinc-400 font-bold leading-relaxed px-2">
                We've sent a secure password recovery link to your registered email address <span className="text-teal-600 dark:text-teal-400 font-extrabold">{email}</span>. Click the link inside to configure your new credentials.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white/40 p-4 text-[10px] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/20 dark:text-zinc-450 leading-relaxed font-bold tracking-tight">
              Did not receive the email? Check your spam folder, or click below to request another recovery link.
            </div>

            <button
              onClick={() => {
                setMessage("");
                setError("");
              }}
              className="w-full inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white/80 px-6 py-2.5 text-xs font-black uppercase tracking-wider text-zinc-700 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-300 dark:hover:bg-zinc-900 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <RefreshCw size={12} />
              <span>Request Another Link</span>
            </button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-555 dark:text-zinc-400">Node Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-450 dark:text-zinc-555" size={16} />
                <input
                  type="email"
                  placeholder="you@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-zinc-200 bg-white/70 py-2.5 pl-10 pr-4 text-xs sm:text-sm outline-none focus:border-teal-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/50 dark:focus:border-teal-500 font-bold tracking-tight"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-teal-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-teal-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] dark:bg-teal-50 dark:text-zinc-950 dark:hover:bg-teal-400 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <span>Request Recovery Link</span>
              )}
            </button>
          </form>
        )}

        <div className="flex justify-center pt-2">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-zinc-555 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white font-bold tracking-tight">
            <ArrowLeft size={14} />
            <span>Return to Log In</span>
          </Link>
        </div>
      </div>
    </main>
  );
}

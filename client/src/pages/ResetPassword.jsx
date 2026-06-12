import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { resetPasswordRequest } from "../api/authApi";
import { useAuth } from "../utils/AuthContext";
import { Loader2, Lock, ArrowLeft, CheckCircle, AlertCircle, Check, Circle } from "lucide-react";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { addToast } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Live complexity checks
  const rules = {
    length: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password)
  };

  const isPasswordStrong = rules.length && rules.hasUpper && rules.hasNumber && rules.hasSpecial;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) return;

    if (!isPasswordStrong) {
      setError("Please ensure your password meets all complexity requirements below.");
      addToast("Password does not meet complexity guidelines.", "error");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      addToast("Confirm password must match password.", "error");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const data = await resetPasswordRequest(token, password);
      setMessage(data.message || "Password updated successfully!");
      addToast("Password reset completed successfully!", "success");
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError(err.message || "Failed to update password. Reset token may have expired.");
      addToast(err.message || "Reset link invalid or expired.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 dark:bg-zinc-950 px-4 flex items-center justify-center transition-colors duration-500 text-zinc-900 dark:text-zinc-100 sm:px-6">
      {/* Cyber accents */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a15_1px,transparent_1px),linear-gradient(to_bottom,#0f172a15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] dark:bg-[linear-gradient(to_right,#33415518_1px,transparent_1px),linear-gradient(to_bottom,#33415518_1px,transparent_1px)] -z-10" />
      <div className="absolute left-1/3 top-1/4 -z-10 h-72 w-72 rounded-full bg-teal-400/15 blur-[90px] dark:bg-teal-500/5 animate-pulse" />
      <div className="absolute right-1/3 bottom-1/4 -z-10 h-72 w-72 rounded-full bg-indigo-400/15 blur-[90px] dark:bg-indigo-500/5 animate-pulse" style={{ animationDuration: "8s" }} />

      <div className="relative w-full max-w-md border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/30 p-8 rounded-3xl backdrop-blur-xl shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-teal-600 via-cyan-500 to-emerald-500 bg-clip-text text-transparent dark:from-teal-400 dark:via-cyan-400 dark:to-emerald-400 leading-none">
            Reset Password
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Configure new secure credentials for your workspace account.</p>
        </div>

        {/* Error Alert Banner */}
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-xs text-rose-800 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-350 space-y-1 animate-in fade-in duration-300">
            <div className="flex items-center gap-1.5 font-black uppercase tracking-wider text-rose-700 dark:text-rose-450">
              <AlertCircle size={14} className="animate-bounce" />
              <span>Reset Error</span>
            </div>
            <p className="leading-relaxed font-semibold">{error}</p>
          </div>
        )}

        {/* Success message */}
        {message ? (
          <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-4 text-xs text-teal-850 dark:border-teal-900/30 dark:bg-teal-950/20 dark:text-teal-355 space-y-2 animate-in fade-in duration-300">
            <div className="flex items-center gap-1.5 font-bold">
              <CheckCircle size={16} className="text-teal-600 dark:text-teal-400" />
              <span>Password Reset Complete</span>
            </div>
            <p className="leading-relaxed">{message} Redirecting to Log In shortly...</p>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-555 dark:text-zinc-400">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-450 dark:text-zinc-555" size={16} />
                <input
                  type="password"
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-zinc-200 bg-white/70 py-2.5 pl-10 pr-4 text-xs sm:text-sm outline-none focus:border-teal-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/50 dark:focus:border-teal-500 font-bold tracking-tight"
                />
              </div>
            </div>

            {/* Live Complexity Checklist */}
            {password && (
              <div className="space-y-1.5 p-3 rounded-2xl border border-zinc-200/50 bg-white/40 dark:border-zinc-800/50 dark:bg-zinc-900/20 animate-in fade-in duration-300">
                <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Complexity Checklist</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] font-bold">
                  <div className={`flex items-center gap-1.5 ${rules.length ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"}`}>
                    {rules.length ? <Check size={12} strokeWidth={3} /> : <Circle size={10} strokeWidth={3} />}
                    <span>Min 8 characters</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${rules.hasUpper ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"}`}>
                    {rules.hasUpper ? <Check size={12} strokeWidth={3} /> : <Circle size={10} strokeWidth={3} />}
                    <span>Capital letter (A-Z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${rules.hasNumber ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"}`}>
                    {rules.hasNumber ? <Check size={12} strokeWidth={3} /> : <Circle size={10} strokeWidth={3} />}
                    <span>Number (0-9)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${rules.hasSpecial ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"}`}>
                    {rules.hasSpecial ? <Check size={12} strokeWidth={3} /> : <Circle size={10} strokeWidth={3} />}
                    <span>Special character</span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-555 dark:text-zinc-400">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-450 dark:text-zinc-555" size={16} />
                <input
                  type="password"
                  placeholder="Retype password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                <span>Update Credentials</span>
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

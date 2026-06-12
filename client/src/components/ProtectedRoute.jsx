import { Navigate } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center text-zinc-900 dark:text-zinc-100">
        <div className="relative flex flex-col items-center gap-4 border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/30 p-10 rounded-3xl backdrop-blur-md shadow-2xl max-w-sm w-full text-center">
          <Loader2 size={36} className="animate-spin text-teal-600 dark:text-teal-400" />
          <h2 className="text-lg font-bold tracking-tight">Accessing Secure Workspace...</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Verifying session credentials and loading system configurations.</p>
        </div>
      </main>
    );
  }

  if (!user) {
    const hasAccount = localStorage.getItem("has_account") === "true";
    if (hasAccount) {
      return <Navigate to="/login" replace />;
    } else {
      return <Navigate to="/signup" replace />;
    }
  }

  return children;
}

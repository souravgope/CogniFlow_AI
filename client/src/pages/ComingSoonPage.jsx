import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ComingSoonPage({ title }) {
  const navigate = useNavigate();

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4 text-ink dark:bg-zinc-950 dark:text-zinc-100">
      <section className="w-full max-w-xl rounded-lg border border-zinc-200 bg-white p-8 text-center shadow-panel dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
          Coming Soon
        </p>
        <h1 className="mt-3 text-3xl font-semibold">{title}</h1>
        <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          This AI tool is planned for the dashboard and will be added in a future update.
        </p>
        <button className="secondary-button mx-auto mt-6" type="button" onClick={() => navigate("/")}>
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>
      </section>
    </main>
  );
}

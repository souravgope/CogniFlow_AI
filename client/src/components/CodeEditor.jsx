export default function CodeEditor({ code, onChange }) {
  return (
    <div className="h-full">
      <label className="sr-only" htmlFor="mermaid-code">
        Mermaid code
      </label>
      <textarea
        id="mermaid-code"
        className="h-full min-h-[520px] w-full resize-none rounded-lg border border-zinc-300 bg-zinc-950 p-4 font-mono text-sm leading-6 text-zinc-100 outline-none ring-mint/30 focus:ring-4"
        spellCheck="false"
        value={code}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

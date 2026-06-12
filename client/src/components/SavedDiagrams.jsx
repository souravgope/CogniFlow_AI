import { Clock3 } from "lucide-react";

export default function SavedDiagrams({ diagrams, onLoad }) {
  return (
    <div className="side-panel">
      <h2 className="panel-title">Saved Diagrams</h2>
      {diagrams.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Saved diagrams appear here.</p>
      ) : (
        <div className="grid gap-2">
          {diagrams.map((item) => (
            <button
              className="saved-item"
              key={item.id}
              type="button"
              onClick={() => onLoad(item)}
            >
              <span className="line-clamp-2 text-left text-sm font-medium">{item.prompt}</span>
              <span className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                <Clock3 size={13} />
                {new Date(item.createdAt).toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

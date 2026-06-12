const key = "ai-whiteboard-diagrams";

export function loadSavedDiagrams() {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

export function saveDiagram(diagram) {
  const current = loadSavedDiagrams();
  const next = [
    {
      ...diagram,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    },
    ...current
  ].slice(0, 12);

  localStorage.setItem(key, JSON.stringify(next));
  return next;
}

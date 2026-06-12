function escapeLabel(label) {
  return label.replace(/"/g, "'").trim();
}

function quoteFlowchartLabels(code) {
  const firstLine = code.trimStart().split(/\r?\n/)[0]?.toLowerCase() || "";

  if (!firstLine.startsWith("flowchart") && !firstLine.startsWith("graph")) {
    return code;
  }

  return code
    .replace(/;\s*$/gm, "")
    .replace(/\b([A-Za-z][A-Za-z0-9_-]*)\[([^\]"\n]+)\]/g, (_match, id, label) => {
      return `${id}["${escapeLabel(label)}"]`;
    })
    .replace(/\b([A-Za-z][A-Za-z0-9_-]*)\{([^}"\n]+)\}/g, (_match, id, label) => {
      return `${id}{"${escapeLabel(label)}"}`;
    });
}

export function cleanMermaidCode(value) {
  const code = String(value || "")
    .replace(/^```(?:mermaid)?/i, "")
    .replace(/```$/i, "")
    .trim();

  return quoteFlowchartLabels(code);
}

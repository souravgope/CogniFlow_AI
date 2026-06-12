export async function generateDiagram(prompt, interactive = true) {
  const response = await fetch("/generate-diagram", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ prompt, interactive })
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || "Diagram generation failed.");
  }

  return payload;
}

export async function syncDiagramMetadata(code, diagramType) {
  const response = await fetch("/sync-diagram-metadata", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ code, diagramType })
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || "Diagram sync failed.");
  }

  return payload;
}

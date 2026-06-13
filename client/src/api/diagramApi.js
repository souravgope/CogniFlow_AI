import { API_URL } from "../config";

export async function generateDiagram(prompt, interactive = true) {
  const baseUrl = API_URL?.replace(/\/$/, "") || "";
  const response = await fetch(`${baseUrl}/generate-diagram`, {
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
  const baseUrl = API_URL?.replace(/\/$/, "") || "";
  const response = await fetch(`${baseUrl}/sync-diagram-metadata`, {
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

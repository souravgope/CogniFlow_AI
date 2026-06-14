import { API_URL } from "../config";

export async function generateDocs({ projectName, description, files }) {
  const formData = new FormData();
  formData.append("projectName", projectName);
  formData.append("description", description || "");

  for (const file of files) {
    formData.append("files", file);
  }

  const baseUrl = API_URL?.replace(/\/$/, "") || "";
  const response = await fetch(`${baseUrl}/generate-docs`, {
    method: "POST",
    body: formData
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || "Documentation generation failed.");
  }

  return payload;
}

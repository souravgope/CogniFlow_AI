import { API_URL } from "../config";

export async function askAssistant(formData) {
  const response = await fetch(`${API_URL || ""}/api/assistant`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Unable to get response from AI Assistant.");
  }

  return data;
}

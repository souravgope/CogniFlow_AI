export async function analyzeMistake(formData) {
  const response = await fetch("/api/analyze-mistake", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Unable to analyze this answer.");
  }

  return data;
}

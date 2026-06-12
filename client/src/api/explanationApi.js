export async function generateExplanation(formData) {
  const response = await fetch("/api/generate-explanation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Unable to generate explanation.");
  }

  return data;
}

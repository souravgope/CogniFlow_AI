export async function askWebsiteChat(formData) {
  const response = await fetch("/api/website-chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Unable to get response from website chatbot.");
  }

  return data;
}

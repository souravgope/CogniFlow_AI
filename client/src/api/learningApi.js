export async function generateLearningPath(formData) {
  const response = await fetch("/api/generate-learning-path", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(formData)
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || "Learning path generation failed.");
  }

  return payload;
}

export async function generateQuiz(targetRole, skillLevel) {
  const response = await fetch("/api/generate-quiz", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ targetRole, skillLevel })
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || "Quiz generation failed.");
  }

  return payload;
}

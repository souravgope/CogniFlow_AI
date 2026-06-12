import { API_URL } from "../config";
export async function generateLearningPath(formData) {
  const response = await fetch(`${API_URL}/api/generate-learning-path`, {
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
  const response = await fetch(`${API_URL}/api/generate-quiz`, {
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

// Learning AI Client - Gemini Integration (auto-selects best available model)

const SYSTEM_PROMPT = `You are an expert career mentor and software industry trainer.

Create a personalized learning roadmap based on the user's input.

Generate a JSON response with the following structure:
{
  "roadmap": "Complete week-by-week roadmap with ## Phase headers and ### Week sub-headers, each with bullet topics",
  "dailyPlan": "Week-wise learning resources for this role. For each week, provide a specific, beginner-friendly list containing: 1. Recommended YouTube videos (real channels or video titles), 2. Official documentation links (real websites/documentation), 3. Practice platforms (real specific platforms like LeetCode, HackerRank, freeCodeCamp, Codewars, etc.), and 4. Tools to use (real tools like VS Code, Git, Postman, Chrome DevTools). Do NOT include generic study schedules, hours of study, or time allocations.",
  "practice": "Topic-wise practice questions as a numbered list",
  "projects": "Real-world project milestones as a numbered list",
  "progressTracking": "A 1-2 sentence summary of this learning journey"
}

Rules:
- roadmap MUST use markdown: ## for phases/sections, ### Week N: Title, then - bullet items
- dailyPlan MUST focus entirely on beginner-friendly week-wise learning resources (YouTube videos, docs, platforms, and tools), being highly specific and avoiding any generic study hours or schedules
- Make it practical and industry-relevant
- Include modern tools and technologies
- Align with the given duration
- Focus on actionable items
- Return ONLY valid JSON`;

const QUIZ_SYSTEM_PROMPT = `You are a technical interviewer and coding trainer.
Generate exactly 5 multiple choice questions to assess a user's skill gap.

Return a valid JSON array of 5 questions:
[
  {
    "question": "The question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "The exact correct option string",
    "explanation": "Why this answer is correct"
  }
]

Return ONLY valid JSON, no markdown, no backticks.`;

// Preferred models in order of preference
const PREFERRED_MODELS = [
  "gemini-2.5-flash-preview-05-20",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
];

async function getAvailableModel(apiKey) {
  // If user specifies a model, use it
  if (process.env.GEMINI_MODEL) {
    return process.env.GEMINI_MODEL;
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    if (!res.ok) return PREFERRED_MODELS[0];

    const data = await res.json();
    const available = (data.models || []).map((m) =>
      m.name.replace("models/", "")
    );

    for (const preferred of PREFERRED_MODELS) {
      if (available.some((a) => a.startsWith(preferred.split("-preview")[0]))) {
        const match = available.find((a) => a.startsWith(preferred.split("-preview")[0]));
        console.log(`✅ Auto-selected model: ${match}`);
        return match;
      }
    }

    // Return first generateContent-capable model
    const fallback = available.find(
      (a) => a.includes("flash") || a.includes("pro")
    );
    return fallback || PREFERRED_MODELS[1];
  } catch (err) {
    console.warn("⚠️ Could not fetch model list, using default:", PREFERRED_MODELS[1]);
    return PREFERRED_MODELS[1];
  }
}

async function generateWithGemini(prompt, systemInstruction = SYSTEM_PROMPT) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in .env file");
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const model = await getAvailableModel(apiKey);

  console.log(`🤖 Calling Gemini API with model: ${model}`);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, topK: 40, topP: 0.95 },
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const msg = data.error?.message || JSON.stringify(data.error) || "Unknown error";
    throw new Error(`Gemini API Error: ${msg}`);
  }

  let content = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  content = content.replace(/^```(?:json)?/im, "").replace(/```$/im, "").trim();

  console.log("✅ Gemini API response received");

  try {
    return JSON.parse(content);
  } catch (parseError) {
    console.error("❌ JSON parse failed:", content.substring(0, 300));
    throw new Error("Invalid JSON response from Gemini API");
  }
}

function getProvider() {
  return (process.env.AI_PROVIDER || "fallback").toLowerCase();
}

export async function generateLearningPath(input) {
  const { skillLevel, targetRole, duration, currentSkills, preferences } = input;

  const prompt = `Create a personalized ${duration} learning roadmap for someone to become a ${targetRole}.

Current Skill Level: ${skillLevel}
Current Skills / Technologies: ${currentSkills || "Not specified"}
Preferences: ${preferences || "Not specified"}

Structure the roadmap as:
## Phase 1: [Phase Title]
### Week 1: [Topic Title]
- Subtopic or resource
- Subtopic or resource

Continue for all weeks across the full ${duration} duration.
Also include specific week-wise learning resources (YouTube videos, official docs, practice platforms, tools), practice questions, projects and a brief progress summary.`;

  const provider = getProvider();
  if (provider === "gemini") return generateWithGemini(prompt, SYSTEM_PROMPT);
  throw new Error(`Unsupported AI provider: ${provider}. Set AI_PROVIDER=gemini in .env`);
}

export async function generateQuizPath(targetRole, skillLevel) {
  const prompt = `Generate a 5-question multiple choice quiz for a ${skillLevel} ${targetRole}. Questions must be directly relevant to common skills and tools needed in this role.`;
  const provider = getProvider();
  if (provider === "gemini") return generateWithGemini(prompt, QUIZ_SYSTEM_PROMPT);
  throw new Error(`Unsupported AI provider: ${provider}. Set AI_PROVIDER=gemini in .env`);
}

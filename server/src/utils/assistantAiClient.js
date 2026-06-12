import fetch from "node-fetch";

const ASSISTANT_SYSTEM_PROMPT = `You are an advanced AI assistant integrated into a MERN-based AI Whiteboard platform.

Your goal is to behave like a smart conversational assistant similar to modern AI chat systems.

Capabilities:
- Answer user queries clearly and intelligently
- Maintain conversation context across messages
- Provide structured explanations when needed
- Assist with coding, learning, and problem-solving
- Guide users to relevant platform features

Platform Features Available:
1. AI Whiteboard (for practice and visualization)
2. AI Explanation Generator
3. AI Learning Path Generator
4. AI Mistake Analyzer

Modes:
1. Online Mode:
- Provide detailed, accurate, and structured responses
- Use step-by-step explanations where needed

2. Offline Mode:
- Provide short, helpful responses
- Suggest using saved content or retrying online

Output format (STRICT JSON):
{
  "response": "Main conversational reply to the user",
  "type": "explanation / coding / general / guidance",
  "suggestions": [
    "Explain this topic",
    "Generate learning path",
    "Analyze my answer",
    "Practice on whiteboard"
  ],
  "next_step_topic": "Suggest a relevant topic if applicable",
  "action_hint": "Suggest which feature the user should use next"
}

Instructions:
- Maintain conversational tone (like a real assistant)
- Use previous context to give better answers
- Keep responses clear and structured
- Suggest platform features when helpful
- Do not break JSON format`;

const PREFERRED_MODELS = [
  "gemini-2.5-flash-preview-05-20",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro"
];

function getProvider() {
  return (process.env.AI_PROVIDER || "fallback").toLowerCase();
}

async function getAvailableModel(apiKey) {
  if (process.env.GEMINI_MODEL) return process.env.GEMINI_MODEL;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!response.ok) return PREFERRED_MODELS[0];

    const data = await response.json();
    const available = (data.models || []).map((model) => model.name.replace("models/", ""));

    for (const preferred of PREFERRED_MODELS) {
      const match = available.find((model) => model.startsWith(preferred.split("-preview")[0]));
      if (match) return match;
    }

    return available.find((model) => model.includes("flash") || model.includes("pro")) || PREFERRED_MODELS[1];
  } catch {
    return PREFERRED_MODELS[1];
  }
}

function stripJsonFence(content) {
  return content.replace(/^```(?:json)?/im, "").replace(/```$/im, "").trim();
}

function listFrom(value) {
  return Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : [];
}

function normalizePayload(payload) {
  return {
    response: String(payload?.response || "").trim(),
    type: String(payload?.type || "general").trim(),
    suggestions: listFrom(payload?.suggestions || [
      "Explain this topic",
      "Generate learning path",
      "Practice on whiteboard"
    ]),
    next_step_topic: String(payload?.next_step_topic || "General Concepts").trim(),
    action_hint: String(payload?.action_hint || "Use the AI Whiteboard to visualize this concept.").trim()
  };
}

function assertValidPayload(payload) {
  if (!payload.response || !payload.type || !payload.suggestions.length || !payload.next_step_topic || !payload.action_hint) {
    throw new Error("AI assistant response is missing required fields.");
  }
}

async function generateWithGemini(prompt) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in .env file");
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const model = await getAvailableModel(apiKey);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: ASSISTANT_SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.25,
          topK: 40,
          topP: 0.95,
          responseMimeType: "application/json"
        }
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const message = data.error?.message || JSON.stringify(data.error) || "Unknown error";
    throw new Error(`Gemini API Error: ${message}`);
  }

  const content = stripJsonFence(data.candidates?.[0]?.content?.parts?.[0]?.text || "{}");
  const normalized = normalizePayload(JSON.parse(content));
  assertValidPayload(normalized);
  return normalized;
}

export async function generateAssistantResponse(input) {
  const historyText = Array.isArray(input.chatHistory)
    ? input.chatHistory.map(h => `${h.sender === "user" ? "User" : "Assistant"}: ${h.text}`).join("\n")
    : "No previous context.";

  const prompt = `Input:
- Query: ${input.query}
- Selected Mode: ${input.isOnline ? "Online Mode" : "Offline Mode"}
- Previous Context (Chat History):
${historyText}

Please answer the user query clearly and return the strict JSON response now.`;

  const provider = getProvider();
  if (provider === "gemini") return generateWithGemini(prompt);
  throw new Error(`Unsupported AI provider: ${provider}. Set AI_PROVIDER=gemini in .env`);
}

const MISTAKE_SYSTEM_PROMPT = `You are an expert AI tutor. A student has submitted an answer to a topic. Analyze it and return ONLY a valid JSON object.

=== CRITICAL RULE FOR "correct_answer" ===

The "correct_answer" field must contain the REAL factual answer to the topic — written as a textbook or encyclopedia entry.

BAD (never generate this — these describe HOW to answer, not the answer itself):
- "Stack should be explained by defining the concept clearly..."
- "The answer needs to include the definition and important parts..."
- "A good answer would describe the key aspects of a stack..."
- "Binary search can be described by explaining the algorithm step by step..."

GOOD (write the actual content — define and explain the topic directly):
- Topic "Stack": "A stack is a linear data structure that follows the LIFO (Last In, First Out) principle. The last element added is the first one removed. It supports three main operations: push (insert at top), pop (remove from top), and peek (view top without removing). Stacks are used in recursion, undo operations, and expression evaluation."
- Topic "Binary Search": "Binary search is an efficient algorithm for finding an element in a sorted array. It works by repeatedly halving the search range — comparing the target to the middle element and eliminating the half that cannot contain the target. This continues until the element is found or the range is empty. Its time complexity is O(log n)."
- Topic "React Hooks": "React Hooks are functions that let you use state and other React features in functional components. useState manages local component state, useEffect handles side effects like API calls, and useContext accesses shared context. Hooks were introduced in React 16.8 to replace class component lifecycle methods."

The pattern is always: define what the topic IS, how it WORKS, and why it MATTERS — in 2–4 sentences.

=== OUTPUT FORMAT ===

Return ONLY this JSON with no markdown, no code fences, no extra text:

{
  "mistakes": ["List each specific mistake in the user's answer"],
  "explanation": "Explain clearly why the user's answer is wrong, in simple language.",
  "correct_answer": "Write the ACTUAL factual definition and explanation of the topic (2-4 sentences). Follow the GOOD examples above exactly.",
  "improved_answer": "Rewrite the user's answer fully and correctly.",
  "weak_areas": ["List specific concepts the user does not understand"],
  "error_type": "Conceptual Error or Logical Error or Factual Error or Incomplete Answer",
  "difficulty_level": "Beginner or Intermediate or Advanced",
  "score": "A number from 0 to 100",
  "improvement_tips": ["Give 2-4 specific actionable tips to improve understanding"],
  "audio_script": "A short voice-friendly summary. No symbols. Add [pause] for natural pauses.",
  "next_step_topic": "One topic name the user should study next. Example: Stack Data Structure"
}`;

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

function normalizeMistakePayload(payload) {
  return {
    mistakes: listFrom(payload?.mistakes),
    explanation: String(payload?.explanation || "").trim(),
    correct_answer: String(payload?.correct_answer || "").trim(),
    improved_answer: String(payload?.improved_answer || "").trim(),
    weak_areas: listFrom(payload?.weak_areas),
    error_type: String(payload?.error_type || "Conceptual Error").trim(),
    difficulty_level: String(payload?.difficulty_level || "Beginner").trim(),
    score: String(payload?.score || "0/100").trim(),
    improvement_tips: listFrom(payload?.improvement_tips),
    audio_script: String(payload?.audio_script || "").trim(),
    next_step_topic: String(payload?.next_step_topic || "").trim()
  };
}

function assertValidPayload(payload) {
  if (
    !payload.mistakes.length ||
    !payload.explanation ||
    !payload.correct_answer ||
    !payload.improved_answer ||
    !payload.weak_areas.length ||
    !payload.error_type ||
    !payload.difficulty_level ||
    !payload.score ||
    !payload.improvement_tips.length ||
    !payload.audio_script ||
    !payload.next_step_topic
  ) {
    throw new Error("Mistake analysis response is missing required fields.");
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
        systemInstruction: { parts: [{ text: MISTAKE_SYSTEM_PROMPT }] },
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
  const normalized = normalizeMistakePayload(JSON.parse(content));
  assertValidPayload(normalized);
  return normalized;
}

export async function generateMistakeAnalysis(input) {
  const prompt = `Topic: ${input.topic}
User's Answer: ${input.answer}

Analyze the answer above. For "correct_answer", write the actual factual definition and explanation of "${input.topic}" — not advice about how to answer. Follow the GOOD examples in your instructions exactly.`;

  const provider = getProvider();
  if (provider === "gemini") return generateWithGemini(prompt);
  throw new Error(`Unsupported AI provider: ${provider}. Set AI_PROVIDER=gemini in .env`);
}

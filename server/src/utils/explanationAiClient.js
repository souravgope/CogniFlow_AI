const EXPLANATION_SYSTEM_PROMPT = `You are an AI teaching assistant integrated into an AI Whiteboard platform.

When a user selects the "AI Explanation Generator" feature from the whiteboard, they are redirected here to generate structured learning content.

Your task is to generate detailed, topic-specific educational content that helps users understand the topic thoroughly.

The generated content should be informative, well-structured, beginner-friendly, and tailored specifically to the entered topic rather than generating generic summaries.

Content Structure Requirements:
1. "explanation":
   - Begin with a clear definition and introduction of the topic.
   - Provide an in-depth explanation of how it works.
   - Include prerequisites or requirements (e.g., sorted array for Binary Search).
   - Detail the step-by-step process or working principles.
   - Include a concrete, easy-to-follow example.
   - For technical, mathematical, or algorithmic topics, specify time and space complexity.
   - Include key concepts, use cases, advantages, and disadvantages.
   - Format with clean headings and bullet points where appropriate (use markdown inside the string).

2. "video_script":
   - Generate a voice-friendly, detailed script explaining the topic step-by-step.
   - Use simple, clear sentences.
   - Add natural pauses using [pause].
   - Avoid complex math symbols or raw code blocks so it plays smoothly with text-to-speech.

3. "slides":
   - Provide at least 4 detailed slides.
   - Slide 1: Introduction & Definition (with bullet points).
   - Slide 2: Core Concept / Working Principle / Prerequisites (with bullet points).
   - Slide 3: Step-by-Step Process / Example (with bullet points).
   - Slide 4: Complexity, Use Cases, Advantages & Disadvantages (with bullet points).

4. "scenes":
   - List the video scenes corresponding to the script (e.g., "Hook (5 sec)", "Introduction", "Core Concept", "Step-by-Step Example", "Complexity & Tradeoffs", "Summary").

5. "visual_suggestions":
   - Suggest relevant diagrams, flowcharts, or visual illustrations for each slide or scene.

Output format (STRICT JSON):
{
  "explanation": "Detailed Markdown string explaining the topic...",
  "video_script": "Voice script with [pause]...",
  "slides": [
    {
      "title": "Slide Title",
      "points": ["Point 1", "Point 2", "Point 3"]
    }
  ],
  "scenes": [
    "Scene 1",
    "Scene 2"
  ],
  "visual_suggestions": [
    "Suggestion 1",
    "Suggestion 2"
  ]
}

Important Instructions:
- Do not add extra fields outside the JSON.
- Keep response strictly in JSON format.
- Ensure the output is clean for frontend rendering after page navigation.
- Keep explanation readable for UI display.
- Keep video_script optimized for audio playback (text-to-speech friendly).
- Maintain consistency across explanation, script, and slides.
- Do not break or alter expected structure.`;

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
  if (process.env.GEMINI_MODEL) {
    return process.env.GEMINI_MODEL;
  }

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

function normalizeExplanationPayload(payload) {
  return {
    explanation: String(payload?.explanation || "").trim(),
    video_script: String(payload?.video_script || "").trim(),
    slides: Array.isArray(payload?.slides)
      ? payload.slides.map((slide, index) => ({
          title: String(slide?.title || `Slide ${index + 1}`).trim(),
          points: Array.isArray(slide?.points) ? slide.points.map((point) => String(point).trim()).filter(Boolean) : []
        }))
      : [],
    scenes: Array.isArray(payload?.scenes) ? payload.scenes.map((scene) => String(scene).trim()).filter(Boolean) : [],
    visual_suggestions: Array.isArray(payload?.visual_suggestions)
      ? payload.visual_suggestions.map((suggestion) => String(suggestion).trim()).filter(Boolean)
      : []
  };
}

function assertValidPayload(payload) {
  if (!payload.explanation || !payload.video_script) {
    throw new Error("Explanation response is missing required text.");
  }

  if (!payload.slides.length || !payload.scenes.length || !payload.visual_suggestions.length) {
    throw new Error("Explanation response is missing required structured sections.");
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
        systemInstruction: { parts: [{ text: EXPLANATION_SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.35,
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
  const normalized = normalizeExplanationPayload(JSON.parse(content));
  assertValidPayload(normalized);
  return normalized;
}

export async function generateExplanation(input) {
  const prompt = `Input:
- Topic: ${input.topic}
- Difficulty Level: ${input.level} (Beginner / Intermediate / Advanced)
- Language: ${input.language} (English / Hinglish / Hindi)
- Explanation Style: ${input.style} (Teacher / Friend / Interviewer)

Generate the structured educational content now.`;

  const provider = getProvider();
  if (provider === "gemini") return generateWithGemini(prompt);
  throw new Error(`Unsupported AI provider: ${provider}. Set AI_PROVIDER=gemini in .env`);
}

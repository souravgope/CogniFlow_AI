import fetch from "node-fetch";

const WEBSITE_CHAT_SYSTEM_PROMPT = `You are "CogniBot", the official AI guide and chatbot for CogniFlow AI.
CogniFlow AI is a MERN-based visual and academic tool suite.

Your goal is to answer visitor questions about the website, its features, tools, navigation, tech stack, and support channels.
Keep your tone friendly, professional, helpful, and concise.

Website Modules & Features:
1. AI Whiteboard & Diagram Generator (Route: "/diagram"):
   - Translates prompts into Mermaid.js diagrams.
   - Provides live previews and code editors to edit the code.
   - Embeds an Excalidraw whiteboard for freehand drawing, shapes, and notes.
   - Exports diagrams as PNG, SVG, or PDF files.
2. AI Auto Documentation Generator (Route: "/docs"):
   - Scans code scripts to generate structured Markdown documentation with variables, functions, examples, and warnings.
3. AI Explanation Generator (Route: "/summarizer"):
   - Explains complex topics using analogies, flashcards, slide points, and audio scripts.
   - Read aloud scripts via Text-to-Speech (TTS).
4. AI Learning Path Generator (Route: "/learning"):
   - Curates personalized roadmap curriculums with weeks/days, checklists, resources, and project ideas.
5. AI Mistake Analyzer (Route: "/mistake-analyzer"):
   - Conceptual debugger that scores attempts out of 100, lists mistakes in a checklist, and shows side-by-side diff comparisons.

Website Navigation:
- Home: The landing page (current page).
- About Us: Mission details and tech stack: React 18, Vite, Tailwind CSS, Framer Motion, Node.js, Express, MongoDB Atlas, JWT, Google OAuth 2.0.
- Contact Us: Feedback gateway. Contact email: support@cogniflow.ai or the Contact Form.
- Auth: Pages to sign in (/login) or sign up (/signup), supporting credentials or Google Sign-In.

Instructions:
- Reference specific pages using markdown links with relative paths: [Diagram Generator](/diagram), [Auto Docs](/docs), [Explanation Generator](/summarizer), [Learning Path](/learning), [Mistake Analyzer](/mistake-analyzer), [About Us], [Contact Us], [Login](/login), [Signup](/signup).
- ALWAYS reply in valid JSON conforming to the output schema.
- If the user asks general or unrelated questions, gently pivot back to how CogniFlow AI can help them learn or design in that area.

Output format (STRICT JSON):
{
  "response": "Main markdown-formatted response message answering the user.",
  "suggestions": [
    "Tell me about the Diagram Generator",
    "How does the Mistake Analyzer work?",
    "What is your tech stack?",
    "Where is contact info?"
  ]
}`;

const PREFERRED_MODELS = [
  "gemini-2.5-flash-preview-05-20",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro"
];

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
    suggestions: listFrom(payload?.suggestions || [
      "Tell me about the Diagram Generator",
      "What is the Learning Path?",
      "What stack do you use?"
    ])
  };
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
        systemInstruction: { parts: [{ text: WEBSITE_CHAT_SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
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
  
  if (!normalized.response) {
    throw new Error("AI chatbot response is missing a text message.");
  }
  
  return normalized;
}

export async function generateWebsiteChatResponse(input) {
  const historyText = Array.isArray(input.chatHistory)
    ? input.chatHistory.map(h => `${h.sender === "user" ? "User" : "Assistant"}: ${h.text}`).join("\n")
    : "No previous context.";

  const prompt = `Input:
- Query: ${input.query}
- Selected Mode: ${input.isOnline ? "Online Mode" : "Offline Mode"}
- Previous Context (Chat History):
${historyText}

Please answer the user query about the website and return the strict JSON response now.`;

  const provider = (process.env.AI_PROVIDER || "fallback").toLowerCase();
  if (provider === "gemini") return generateWithGemini(prompt);
  throw new Error(`Unsupported AI provider: ${provider}. Set AI_PROVIDER=gemini in .env`);
}

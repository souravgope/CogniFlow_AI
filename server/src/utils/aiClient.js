import OpenAI from "openai";

const SYSTEM_PROMPT = `You are a diagram generator AI. Convert user queries into Mermaid.js diagrams.
Always return only valid Mermaid.js code.
Choose diagram type intelligently:
- Use 'flowchart' for processes
- Use 'graph TD' for architecture
- Use 'erDiagram' for databases
Rules for valid Mermaid:
- Do not include explanations, markdown fences, or comments.
- Do not use semicolons at the end of lines.
- Use simple node IDs like A, B, C, D or service_api.
- Put every human-readable flowchart or graph node label in double quotes, for example A["User Login"].
- Avoid raw parentheses in unquoted labels.`;

function getProvider() {
  return (process.env.AI_PROVIDER || "fallback").toLowerCase();
}

async function generateWithOpenAI(prompt) {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt }
    ]
  });

  return completion.choices[0]?.message?.content || "";
}

async function generateWithGemini(prompt) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is required when AI_PROVIDER=gemini.");
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }]
        },
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.2
        }
      })
    }
  );

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error?.message || "Gemini request failed.");
  }

  return payload.candidates?.[0]?.content?.parts?.map((part) => part.text).join("") || "";
}

async function generateWithOllama(prompt) {
  const host = process.env.OLLAMA_HOST || "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL || "qwen2.5-coder:7b";
  const response = await fetch(`${host}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: prompt
        }
      ],
      options: {
        temperature: 0.2
      }
    })
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Ollama request failed. Is Ollama running?");
  }

  return payload.message?.content || payload.response || "";
}

export async function generateDiagram(prompt) {
  const provider = getProvider();

  if (provider === "gemini") {
    return generateWithGemini(prompt);
  }

  if (provider === "ollama") {
    return generateWithOllama(prompt);
  }

  if (provider === "openai") {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is required when AI_PROVIDER=openai.");
    }

    return generateWithOpenAI(prompt);
  }

  throw new Error(`Unsupported AI_PROVIDER "${provider}". Use gemini, ollama, openai, or fallback.`);
}

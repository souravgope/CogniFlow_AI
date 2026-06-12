import OpenAI from "openai";
import { buildFallbackDocs } from "./docsFallback.js";

const DOCS_SYSTEM_PROMPT = `You are a senior software architect and technical writer.

Analyze the provided project files, code snippets, API data, and screenshots.

Generate structured documentation including:

1. Technical Documentation
- architecture overview
- module explanation
- tech stack used

2. README.md (with installation steps, usage, features)
3. System Architecture Explanation (automatically detect and explicitly name the architecture style like MVC, Client-Server, Microservices, Clean Architecture)
4. API Documentation (endpoints, request/response, and visual-flow structured nodes)
5. PPT Summary (structured presentation slide content. Each slide must start with a heading formatted as "## Slide: [Slide Title]" followed by bullet point lists (- item). Generate 4 to 7 slides.)

Rules:
- Keep output structured and clean
- Use headings and bullet points
- Be concise but informative
- Do not include unnecessary explanations
- Return only valid JSON with these exact keys: readme, technicalDoc, architecture, apiDocs, pptSummary, features, vivaQuestions, suggestions, apiFlow

The JSON schema must strictly conform to:
{
  "readme": "README markdown text...",
  "technicalDoc": "Technical Doc markdown text...",
  "architecture": "Architecture overview markdown text with automatically detected architecture pattern details...",
  "apiDocs": "API Endpoint specifications markdown text...",
  "pptSummary": "Slide-by-slide presentation summary in markdown. Every slide MUST start with the line '## Slide: [Slide Title]' followed by bullet points. For example:\n## Slide: Slide Title Here\n- Bullet item 1\n- Bullet item 2",
  "features": {
    "implemented": ["feature description 1", "feature description 2"],
    "missing": ["suggested missing feature 1", "suggested missing feature 2"]
  },
  "vivaQuestions": [
    {
      "question": "Viva Q1",
      "answer": "Viva A1"
    }
  ],
  "suggestions": {
    "bugs": ["potential bug/vulnerability 1", "potential bug/vulnerability 2"],
    "improvements": ["improvement 1", "improvement 2"],
    "performance": "description of performance profiling, latency concerns, optimizations...",
    "complexity": "time complexity and space complexity overview..."
  },
  "apiFlow": {
    "nodes": [
      { "id": "unique_node_id", "label": "Node Label (2-4 words)", "type": "client|middleware|controller|service|database|external" }
    ],
    "edges": [
      { "from": "unique_node_id_1", "to": "unique_node_id_2", "label": "request flow label" }
    ]
  }
}`;

function provider() {
  return (process.env.AI_PROVIDER || "fallback").toLowerCase();
}

function buildTextInput(context) {
  const textFiles = context.textFiles
    .map((file) => {
      return `## File: ${file.filename}
Type: ${file.mimetype}
Size: ${file.size} bytes

\`\`\`
${file.content}
\`\`\``;
    })
    .join("\n\n");

  const images = context.imageFiles
    .map((file) => `- ${file.filename} (${file.mimetype}, ${file.size} bytes)`)
    .join("\n");

  return `Project Name: ${context.projectName}
Description: ${context.description}

Uploaded Images:
${images || "No image files uploaded."}

Uploaded Text / Code / API Files:
${textFiles || "No readable text files uploaded."}`;
}

function cleanJsonResponse(value) {
  return String(value || "")
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
}

function normalizeDocSection(value) {
  if (typeof value === "string") {
    return value;
  }

  if (value == null) {
    return "";
  }

  if (Array.isArray(value)) {
    return value.map(normalizeDocSection).filter(Boolean).join("\n");
  }

  if (typeof value === "object") {
    return Object.entries(value)
      .map(([key, entry]) => {
        const content = normalizeDocSection(entry);
        return content ? `## ${key}\n${content}` : "";
      })
      .filter(Boolean)
      .join("\n\n");
  }

  return String(value);
}

function parseDocsJson(value, context) {
  try {
    const parsed = JSON.parse(cleanJsonResponse(value));
    return {
      readme: normalizeDocSection(parsed.readme),
      technicalDoc: normalizeDocSection(parsed.technicalDoc),
      architecture: normalizeDocSection(parsed.architecture),
      apiDocs: normalizeDocSection(parsed.apiDocs),
      pptSummary: normalizeDocSection(parsed.pptSummary),
      features: parsed.features || { implemented: [], missing: [] },
      vivaQuestions: Array.isArray(parsed.vivaQuestions) ? parsed.vivaQuestions : [],
      suggestions: parsed.suggestions || { bugs: [], improvements: [], performance: "", complexity: "" },
      apiFlow: parsed.apiFlow || { nodes: [], edges: [] }
    };
  } catch (err) {
    console.error("Error parsing AI docs JSON, falling back:", err);
    const fallback = buildFallbackDocs(context);
    return {
      ...fallback,
      technicalDoc: `${fallback.technicalDoc}\n\n## Raw AI Output\n${value}`
    };
  }
}

async function generateWithGemini(context) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is required when AI_PROVIDER=gemini.");
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
  const parts = [{ text: buildTextInput(context) }];

  for (const image of context.imageFiles.slice(0, 4)) {
    parts.push({
      inlineData: {
        mimeType: image.mimetype,
        data: image.base64
      }
    });
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: DOCS_SYSTEM_PROMPT }]
        },
        contents: [
          {
            role: "user",
            parts
          }
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json"
        }
      })
    }
  );

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error?.message || "Gemini documentation request failed.");
  }

  return parseDocsJson(payload.candidates?.[0]?.content?.parts?.map((part) => part.text).join("") || "", context);
}

async function generateWithOllama(context) {
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
          content: DOCS_SYSTEM_PROMPT
        },
        {
          role: "user",
          content: buildTextInput(context)
        }
      ],
      options: {
        temperature: 0.2
      }
    })
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Ollama documentation request failed. Is Ollama running?");
  }

  return parseDocsJson(payload.message?.content || payload.response || "", context);
}

async function generateWithOpenAI(context) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required when AI_PROVIDER=openai.");
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: DOCS_SYSTEM_PROMPT },
      { role: "user", content: buildTextInput(context) }
    ]
  });

  return parseDocsJson(completion.choices[0]?.message?.content || "", context);
}

export async function generateDocumentation(context) {
  const selectedProvider = provider();

  if (selectedProvider === "gemini") {
    return generateWithGemini(context);
  }

  if (selectedProvider === "ollama") {
    return generateWithOllama(context);
  }

  if (selectedProvider === "openai") {
    return generateWithOpenAI(context);
  }

  throw new Error(`Unsupported AI_PROVIDER "${selectedProvider}". Use gemini, ollama, openai, or fallback.`);
}

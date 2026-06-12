import OpenAI from "openai";

const RICH_DIAGRAM_SYSTEM_PROMPT = `You are an expert system architect and technical educator integrated into an AI Whiteboard and Diagram Workspace.

Your task is to generate or analyze systems, rendering them as structured technical diagrams accompanied by deep learning assets.

You support 4 diagram types:
- "architecture" (Represented as graph TD or graph LR. Focuses on system service layouts, data storage, and client flows).
- "flowchart" (Represented as flowchart TD or flowchart LR. Focuses on algorithm logic, business workflows, and decision trees).
- "er" (Represented as erDiagram. Focuses on database entity schemas, relational cardinality, and field definitions).
- "sequence" (Represented as sequenceDiagram. Focuses on temporal message-passing, actor-service handshakes, and API calls).

Rules for Mermaid Code Generation:
- Synthesize valid, compile-ready Mermaid syntax.
- Wrap human-readable labels in double quotes inside brackets: e.g., A["User Portal"] or entity USER { string email }.
- Keep node IDs simple (e.g. A, B, C, or db_gateway, auth_service).
- Keep node labels short and clear (strictly 2–4 words).
- Limit the total number of nodes to between 8 and 12 for architectural clarity.
- Maintain a logical visual structure (use top-down TD or left-right LR flow).
- Ensure all nodes are connectable and connected (each node must have at least one input or output edge).
- Do not use semicolons at the end of lines.
- Do not wrap the code field in markdown blocks. Return it as a plain string inside the JSON property.

Output Format (STRICT JSON):
Your output must be a single, valid JSON object containing:
{
  "code": "Valid Mermaid code string here. Include autonumber for sequence diagrams. Make it clean and professional.",
  "diagramType": "architecture | flowchart | er | sequence",
  "nodes": [
    {
      "id": "Simple node ID matching the ID used in the Mermaid code (e.g. Client, Auth, USER, or A)",
      "label": "The clean, human-readable node name used in the diagram (e.g., 'React frontend UI')",
      "explanation": "A concise (2-3 sentences) user-friendly description of what this component is and its primary job.",
      "details": "A deep technical analysis (1-2 paragraphs) of this component's specific operational roles, security guidelines, and scaling properties.",
      "techStack": "List of recommended technologies for this component (e.g., 'React, Tailwind, Lucide, WebSockets')",
      "codeSnippet": "A fully functional, high-quality, copy-pasteable code snippet simulating this component's interface, route, query, or logic (e.g., a React component, an Express routing handler, SQL table definition, or axios request). Write clean production-like code.",
      "subComponents": ["List of 2-3 logical subcomponents or subsystems within this node"]
    }
  ],
  "documentation": {
    "summary": "A comprehensive system-wide summary explaining the architecture flow and technical highlights.",
    "notes": "Rich, formatted markdown guide including engineering best practices, security notes, database keys, and performance considerations.",
    "vivaQuestions": [
      {
        "question": "What is an important technical question a viva examiner or system reviewer would ask about this system?",
        "answer": "A detailed, expert-level response to prep students or developers on this architecture."
      }
    ]
  },
  "learningRoadmap": {
    "title": "Roadmap to Master these Technologies",
    "milestones": [
      {
        "title": "Phase 1: Basic foundations",
        "description": "Short explanation of the core skills needed.",
        "resources": ["Resource 1", "Resource 2"],
        "project": "A small practice project to solidify learning."
      }
    ]
  }
}

Ensure the JSON is fully parseable. Escape quotes inside code snippets properly.
Return ONLY valid JSON content. No markdown fences like \`\`\`json.`;

const RICH_DIAGRAM_SYNC_SYSTEM_PROMPT = `${RICH_DIAGRAM_SYSTEM_PROMPT}

CRITICAL SYNC DIRECTIVE:
You are analyzing an EXISTING Mermaid code string supplied by the user.
Do NOT generate a new diagram. Use the EXACT Mermaid code supplied in the prompt as the "code" field in your JSON.
Do NOT modify the structure of the Mermaid code. Your job is exclusively to analyze the code, identify all its nodes (by their exact node IDs and labels in the Mermaid code), and populate the "nodes", "documentation", and "learningRoadmap" structures exactly based on this user code. Ensure you provide high-quality mock code snippets and explanations matching the nodes in their diagram.`;

const PREFERRED_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash-preview-05-20",
  "gemini-2.0-flash",
  "gemini-1.5-flash"
];

function getProvider() {
  return (process.env.AI_PROVIDER || "fallback").toLowerCase();
}

async function getAvailableModel(apiKey) {
  if (process.env.GEMINI_MODEL) {
    return process.env.GEMINI_MODEL;
  }
  return PREFERRED_MODELS[0];
}

function stripJsonFence(content) {
  if (!content) return "{}";
  
  // 1. Remove markdown fences
  let cleaned = content.replace(/^```(?:json)?/im, "").replace(/```$/im, "").trim();
  
  // 2. Extract content strictly from the first '{' to the last '}'
  const firstOpen = cleaned.indexOf("{");
  const lastClose = cleaned.lastIndexOf("}");
  if (firstOpen !== -1 && lastClose !== -1 && firstOpen < lastClose) {
    cleaned = cleaned.substring(firstOpen, lastClose + 1);
  }
  
  return cleaned;
}

function normalizePayload(payload, originalCode = null) {
  return {
    code: originalCode || String(payload?.code || "").trim(),
    diagramType: String(payload?.diagramType || "architecture").trim(),
    nodes: Array.isArray(payload?.nodes)
      ? payload.nodes.map((node) => ({
          id: String(node?.id || "").trim(),
          label: String(node?.label || node?.id || "Component").trim(),
          explanation: String(node?.explanation || "A service component in the system.").trim(),
          details: String(node?.details || "No additional technical analysis available.").trim(),
          techStack: String(node?.techStack || "General Software Stack").trim(),
          codeSnippet: String(node?.codeSnippet || "// Sample interface code").trim(),
          subComponents: Array.isArray(node?.subComponents)
            ? node.subComponents.map((sub) => String(sub).trim())
            : []
        }))
      : [],
    documentation: {
      summary: String(payload?.documentation?.summary || "System Architecture Summary").trim(),
      notes: String(payload?.documentation?.notes || "### Documentation Notes\nDetailed notes are pending AI analysis.").trim(),
      vivaQuestions: Array.isArray(payload?.documentation?.vivaQuestions)
        ? payload.documentation.vivaQuestions.map((viva) => ({
            question: String(viva?.question || "What is a core benefit of this design?").trim(),
            answer: String(viva?.answer || "It isolates concerns and ensures system scalability.").trim()
          }))
        : []
    },
    learningRoadmap: {
      title: String(payload?.learningRoadmap?.title || "Mastery Roadmap").trim(),
      milestones: Array.isArray(payload?.learningRoadmap?.milestones)
        ? payload.learningRoadmap.milestones.map((m) => ({
            title: String(m?.title || "Milestone Step").trim(),
            description: String(m?.description || "Master the foundational skills.").trim(),
            resources: Array.isArray(m?.resources) ? m.resources.map(String) : [],
            project: String(m?.project || "Build a sample prototype.").trim()
          }))
        : []
    }
  };
}

async function generateWithGemini(prompt, isSync = false, originalCode = null) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in .env file");
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const model = await getAvailableModel(apiKey);
  const sysPrompt = isSync ? RICH_DIAGRAM_SYNC_SYSTEM_PROMPT : RICH_DIAGRAM_SYSTEM_PROMPT;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: sysPrompt }] },
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
  return normalizePayload(JSON.parse(content), originalCode);
}

async function generateWithOpenAI(prompt, isSync = false, originalCode = null) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required when AI_PROVIDER=openai.");
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  const sysPrompt = isSync ? RICH_DIAGRAM_SYNC_SYSTEM_PROMPT : RICH_DIAGRAM_SYSTEM_PROMPT;

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: 0.25,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: sysPrompt },
      { role: "user", content: prompt }
    ]
  });

  const content = stripJsonFence(completion.choices[0]?.message?.content || "{}");
  return normalizePayload(JSON.parse(content), originalCode);
}

export async function generateRichDiagram(prompt, diagramType) {
  const provider = getProvider();
  const fullPrompt = `Please generate an interactive ${diagramType} diagram structure for this topic: "${prompt}". Make sure it is detailed and contains robust explanations, viva prep questions, and simulated code snippets for all primary nodes.`;

  if (provider === "gemini") {
    return generateWithGemini(fullPrompt, false);
  }
  if (provider === "openai") {
    return generateWithOpenAI(fullPrompt, false);
  }
  throw new Error(`Unsupported AI provider: ${provider}. Set AI_PROVIDER=gemini in .env`);
}

export async function syncRichDiagramMetadata(code, diagramType) {
  const provider = getProvider();
  const fullPrompt = `The current user-edited Mermaid.js diagram is:
\`\`\`mermaid
${code}
\`\`\`

The diagram type is "${diagramType}".
Analyze this Mermaid code, extract its nodes and relationships, and generate the full set of structured metadata. Return the code property exactly as provided in this prompt.`;

  if (provider === "gemini") {
    return generateWithGemini(fullPrompt, true, code);
  }
  if (provider === "openai") {
    return generateWithOpenAI(fullPrompt, true, code);
  }
  throw new Error(`Unsupported AI provider: ${provider}. Set AI_PROVIDER=gemini in .env`);
}

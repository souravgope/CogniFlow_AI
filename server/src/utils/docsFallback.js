function fileList(context) {
  const files = [...context.textFiles, ...context.imageFiles];

  if (files.length === 0) {
    return "- No files were uploaded.";
  }

  return files.map((file) => `- ${file.filename} (${file.mimetype || "unknown"}, ${file.size} bytes)`).join("\n");
}

function detectTechnologies(context) {
  const names = context.textFiles.map((file) => file.filename.toLowerCase()).join(" ");
  const tech = [];

  if (names.includes(".jsx") || names.includes(".tsx")) tech.push("React");
  if (names.includes("package.json")) tech.push("Node.js");
  if (names.includes(".py")) tech.push("Python");
  if (names.includes(".java")) tech.push("Java");
  if (names.includes(".cpp")) tech.push("C++");
  if (names.includes("swagger") || names.includes("openapi")) tech.push("OpenAPI/Swagger");

  return tech.length ? tech.join(", ") : "Not enough uploaded code to infer confidently.";
}

export function buildFallbackDocs(context) {
  const technologies = detectTechnologies(context);
  const files = fileList(context);

  return {
    technicalDoc: `# Technical Documentation\n\n## Project\n${context.projectName}\n\n## Description\n${context.description}\n\n## Uploaded Inputs\n${files}\n\n## Technology Signals\n${technologies}\n\n## Notes\n- This fallback document was generated without an AI provider response.\n- Upload source files, API JSON, or screenshots for richer documentation.\n- Enable Gemini or Ollama in server/.env for AI-generated analysis.`,
    readme: `# ${context.projectName}\n\n${context.description}\n\n## Features\n- Project documentation generation\n- Uploaded file analysis\n- README, technical, architecture, API, and PPT-style outputs\n\n## Installation\n\`\`\`bash\nnpm install\n\`\`\`\n\n## Usage\n\`\`\`bash\nnpm run dev\n\`\`\`\n\n## Uploaded Files\n${files}`,
    architecture: `# Architecture Documentation\n\n## Overview\n${context.projectName} is documented from the uploaded project assets.\n\n## Inferred Technologies\n${technologies}\n\n## Suggested Architecture Sections\n- Frontend layer\n- Backend/API layer\n- Data and integration layer\n- Deployment and operations notes`,
    apiDocs: `# API Documentation\n\nNo API endpoints were confidently extracted in fallback mode.\n\nUpload an OpenAPI/Swagger JSON file or backend route files for endpoint-level documentation.`,
    pptSummary: `# PPT Summary\n\n- Project: ${context.projectName}\n- Purpose: ${context.description}\n- Uploaded assets reviewed: ${context.textFiles.length + context.imageFiles.length}\n- Technology signals: ${technologies}\n- Next step: Enable AI provider for deeper generated documentation`,
    
    // Advanced features
    features: {
      implemented: [
        "Interactive AI Diagram Generator with live node inspector",
        "Two-way Mermaid code syncing controller",
        "Context-linked AI Design Assistant",
        "Web Speech audio description playback engine",
        "Excalidraw infinite-canvas whiteboard module"
      ],
      missing: [
        "Real-time multi-user web-socket editing sessions",
        "Automatic database model migrations and auto-export definitions",
        "Local offline AI generation running on client WebLLM model runtime",
        "Comprehensive project build/run script generation CLI tool"
      ]
    },
    vivaQuestions: [
      {
        question: "What is the primary architectural style of this system design whiteboard application?",
        answer: "This application operates on a modern client-server architectural model. The client UI is powered by React with Vite using CSS and Excalidraw/Mermaid.js for interactive rendering. The backend is built as a Node.js/Express REST server which communicates with advanced AI engines to perform system analysis and generate responsive visualizations."
      },
      {
        question: "How does the two-way syncing mechanism between the whiteboard and the AI diagram work?",
        answer: "When the user edits the diagram in the editor, the client updates the Mermaid markup. The client can trigger a synchronization request to `/sync-diagram-metadata`. The backend uses an AI prompt containing the new diagram structure to regenerate the component nodes, explanations, code templates, and roadmap timelines, keeping visualization and analytical data strictly aligned."
      },
      {
        question: "What security constraints are enforced for file uploads in the document generator?",
        answer: "File uploads are intercepted on the route by a Multer upload middleware configuring memory storage. A strict limit of 25MB per file and a maximum cap of 20 files per request is active. This bounds RAM usage, blocks potential Denial of Service (DoS) attacks, and maintains quick response times."
      },
      {
        question: "How is the dynamic interactivity (hover/click) injected into the standard static Mermaid SVG rendering?",
        answer: "When the client receives the SVG string from the Mermaid library, it mounts the SVG inside a container ref. React attaches event listeners targeting groups matching selector classes such as `g.node` or `g.actor`. It queries these groups, reads their labels, connects them to the cached JSON metadata, and coordinates styling triggers (neon stroke highlights, opacity fading on sibling nodes, and mouseover tooltip popups)."
      }
    ],
    suggestions: {
      bugs: [
        "Dynamic SVG re-renders might leak event listeners if not explicitly cancelled or fully unmounted.",
        "Browser Web Speech API might fail or halt mid-sentence on older versions of Safari if text blocks are too large."
      ],
      improvements: [
        "Integrate folder-directory tree uploads using webkitdirectory for automated codebase-wide parsing.",
        "Add a local offline LLM fallback layer using WebLLM for complete user privacy.",
        "Implement real-time collaboration using standard socket.io connections."
      ],
      performance: "AI inference and context aggregation requires 3 to 5 seconds of backend processing. Response speeds can be improved by caching common system prompts and using incremental visual streaming during output generation.",
      complexity: "Backend operations operate in linear O(N) time with respect to the uploaded file sizes, making them highly efficient. The primary complexity lies in standardizing multi-file structures for LLM token ingestion, managed via size slicing and structured JSON constraints."
    },
    apiFlow: {
      nodes: [
        { id: "client", label: "Client Application (React/Vite)", type: "client" },
        { id: "upload_mw", label: "Multer Upload Middleware", type: "middleware" },
        { id: "docs_ctrl", label: "Docs Controller (generateDocs)", type: "controller" },
        { id: "ai_client", label: "AI Provider (Gemini/OpenAI/Ollama)", type: "service" },
        { id: "fallback_srv", label: "Fallback Generation Service", type: "fallback" }
      ],
      edges: [
        { from: "client", to: "upload_mw", label: "POST /generate-docs (Project inputs & files)" },
        { from: "upload_mw", to: "docs_ctrl", label: "Validates files, passes parsed files buffer" },
        { from: "docs_ctrl", to: "ai_client", label: "Triggers AI generation with prompt and files context" },
        { from: "docs_ctrl", to: "fallback_srv", label: "Invokes backup mock generation if AI fails" },
        { from: "ai_client", to: "client", label: "Returns detailed structural JSON documentation" },
        { from: "fallback_srv", to: "client", label: "Returns structured backup documentation" }
      ]
    }
  };
}

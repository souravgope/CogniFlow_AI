function titleCase(text) {
  return text
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function buildRichFallbackDiagram(prompt, diagramType) {
  const label = titleCase(prompt) || "Generated System";

  if (diagramType === "sequence") {
    const code = `sequenceDiagram
  autonumber
  actor User as End User
  participant Client as React SPA
  participant Gateway as API Gateway
  participant Auth as Auth Service

  User->>Client: Clicks Login Button
  Client->>Gateway: POST /api/auth/login
  Gateway->>Auth: Validate Credentials
  Auth-->>Gateway: Return JWT Token
  Gateway-->>Client: 200 OK + JWT
  Client-->>User: Show Dashboard`;

    return {
      code,
      diagramType: "sequence",
      nodes: [
        {
          id: "User",
          label: "End User",
          explanation: "The human user interacting with the application frontend.",
          details: "Initiates interactions like clicking login, typing prompts, or viewing dashboards.",
          techStack: "Browser UI",
          codeSnippet: "<!-- User action triggers event -->\n<button onClick={handleLogin}>Login</button>",
          subComponents: ["Mouse Clicks", "Form Inputs"]
        },
        {
          id: "Client",
          label: "React SPA",
          explanation: "The client-side single page application built with React.",
          details: "Handles rendering, local state management, and sends AJAX HTTP calls to the API Gateway.",
          techStack: "React, Tailwind CSS, Vite",
          codeSnippet: "async function handleLogin() {\n  const res = await fetch('/api/auth/login', {\n    method: 'POST',\n    body: JSON.stringify({ email, password })\n  });\n  const data = await res.json();\n}",
          subComponents: ["Login Page", "Auth Provider"]
        },
        {
          id: "Gateway",
          label: "API Gateway",
          explanation: "Single entry point that proxies and routes incoming client requests to downstream microservices.",
          details: "Applies cors, security policies, rate-limiting, and routes authentication calls to the Auth Service.",
          techStack: "Node.js, Express, Express-Gateway",
          codeSnippet: "app.post('/api/auth/*', (req, res) => {\n  // Proxy request to Auth Service\n  authProxy.web(req, res, { target: 'http://auth-service:5002' });\n});",
          subComponents: ["CORS Middleware", "Proxy Routing Layer"]
        },
        {
          id: "Auth",
          label: "Auth Service",
          explanation: "Dedicated backend microservice responsible for verifying credentials and issuing cryptographically signed JWTs.",
          details: "Compares passwords using bcrypt hashes and signs tokens using RS256 private keys.",
          techStack: "Node.js, Express, JSONWebToken, Bcrypt",
          codeSnippet: "const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1d' });\nres.json({ token });",
          subComponents: ["Password Validator", "Token Signer"]
        }
      ],
      documentation: {
        summary: `Standard API Login sequence diagram for: ${label}.`,
        notes: `### Security Flow & Best Practices\n1. **Autonumbering**: This diagram details the sequential message-passing numbers.\n2. **Stateless Tokens**: The React SPA stores the token in memory or cookies to authenticate subsequent API calls.\n3. **HTTPS Transit**: All communications must run over encrypted HTTPS channels to prevent man-in-the-middle exploits.`,
        vivaQuestions: [
          {
            question: "Why do we use an API Gateway in this sequence instead of direct client-to-auth calls?",
            answer: "An API gateway decouples the client from service endpoints, enables central rate-limiting/CORS, and hides inner-network IP details."
          },
          {
            question: "What security risk is reduced by using HttpOnly cookies for JWTs rather than localStorage?",
            answer: "HttpOnly cookies mitigate Cross-Site Scripting (XSS) attacks by preventing malicious JavaScript from reading the authentication token."
          }
        ]
      },
      learningRoadmap: {
        title: "Mastering Sequence Flows & Stateless Auth",
        milestones: [
          {
            title: "Understand HTTP Basics & CORS",
            description: "Study HTTP methods, headers, status codes, and cross-origin resource sharing.",
            resources: ["MDN HTTP Documentation", "Academind CORS Guide"],
            project: "Build a basic Express backend with custom CORS headers."
          },
          {
            title: "Implement Token-Based Authentication",
            description: "Learn signing, verifying, and decoding JWTs using bcrypt for password security.",
            resources: ["JWT.io Intro", "Auth0 Security Principles"],
            project: "Develop a secure signup/login REST API with Express and MongoDB."
          }
        ]
      }
    };
  }

  if (diagramType === "er") {
    const code = `erDiagram
  USER ||--o{ PROJECT : owns
  PROJECT ||--o{ DIAGRAM : contains
  DIAGRAM ||--o{ VERSION : tracks
  USER {
    string id PK
    string name
    string email
  }
  PROJECT {
    string id PK
    string title
    string owner_id FK
  }
  DIAGRAM {
    string id PK
    string project_id FK
    string mermaid_code
    string diagram_type
  }
  VERSION {
    string id PK
    string diagram_id FK
    datetime created_at
  }`;

    return {
      code,
      diagramType: "er",
      nodes: [
        {
          id: "USER",
          label: "USER Table",
          explanation: "Represents registered system users who own projects.",
          details: "Contains basic profile attributes and authentication links.",
          techStack: "PostgreSQL / MySQL",
          codeSnippet: "CREATE TABLE users (\n  id VARCHAR(255) PRIMARY KEY,\n  name VARCHAR(100),\n  email VARCHAR(100) UNIQUE NOT NULL\n);",
          subComponents: ["Primary Key: id", "Field: name", "Field: email"]
        },
        {
          id: "PROJECT",
          label: "PROJECT Table",
          explanation: "Groups together multiple whiteboard canvases and diagrams.",
          details: "Maintains a foreign key reference pointing to the owner user.",
          techStack: "PostgreSQL / MySQL",
          codeSnippet: "CREATE TABLE projects (\n  id VARCHAR(255) PRIMARY KEY,\n  title VARCHAR(150),\n  owner_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE\n);",
          subComponents: ["Primary Key: id", "Foreign Key: owner_id"]
        },
        {
          id: "DIAGRAM",
          label: "DIAGRAM Table",
          explanation: "Stores individual diagram structures, including the generated Mermaid code.",
          details: "Links to the parent Project, and tracks the type (flowchart, ER, sequence, etc.).",
          techStack: "PostgreSQL / MySQL",
          codeSnippet: "CREATE TABLE diagrams (\n  id VARCHAR(255) PRIMARY KEY,\n  project_id VARCHAR(255) REFERENCES projects(id) ON DELETE CASCADE,\n  mermaid_code TEXT NOT NULL,\n  diagram_type VARCHAR(50)\n);",
          subComponents: ["Primary Key: id", "Foreign Key: project_id"]
        },
        {
          id: "VERSION",
          label: "VERSION Table",
          explanation: "Tracks the revision history of diagrams for easy restore points.",
          details: "Points back to the active diagram and timestamps changes.",
          techStack: "PostgreSQL / MySQL",
          codeSnippet: "CREATE TABLE versions (\n  id VARCHAR(255) PRIMARY KEY,\n  diagram_id VARCHAR(255) REFERENCES diagrams(id) ON DELETE CASCADE,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);",
          subComponents: ["Primary Key: id", "Foreign Key: diagram_id"]
        }
      ],
      documentation: {
        summary: `Relational database schema for the system: ${label}.`,
        notes: `### Database Normalization & Relationships\n1. **One-to-Many Relationships**: A User can own zero or more Projects. A Project can hold multiple Diagrams.\n2. **Referential Integrity**: Cascading deletes are configured on foreign keys so deleting a project automatically cleans up its diagrams.\n3. **History Tracking**: The Version entity supports infinite undo/redo states.`,
        vivaQuestions: [
          {
            question: "What does the double line || vs the crows foot o{ represent in this ER schema?",
            answer: "The double line represents 'exactly one' mandatory cardinality, and the crows foot represents 'zero or many' optional cardinality."
          },
          {
            question: "Why should we enforce 'ON DELETE CASCADE' on project foreign keys?",
            answer: "Enforcing cascade deletes avoids orphan diagram records in our database, keeping storage optimized and relational integrity clean."
          }
        ]
      },
      learningRoadmap: {
        title: "Mastering Database Schemas & Normalization",
        milestones: [
          {
            title: "Database Normalization Principles",
            description: "Study 1NF, 2NF, and 3NF to avoid data anomalies and duplication.",
            resources: ["GeeksforGeeks DBMS Guide", "SQLBolt Tutorials"],
            project: "Refactor a bloated single flat-file database into a normalized 3NF schema."
          },
          {
            title: "SQL Joins and Transactions",
            description: "Learn INNER, LEFT, RIGHT, and FULL joins alongside transactional consistency (ACID).",
            resources: ["W3Schools SQL Joins", "PostgreSQL Official Documentation"],
            project: "Build a multi-table library search query with advanced filtering and grouping."
          }
        ]
      }
    };
  }

  if (diagramType === "flowchart") {
    const code = `flowchart TD
  A[Receive: ${label}] --> B[Analyze prompt intent]
  B --> C{Is Diagram Type Clear?}
  C -- Yes --> D[Generate Mermaid Code]
  C -- No --> E[Infer best type]
  E --> D
  D --> F[Render Interactive View]
  F --> G[Sync Metadata & Export]`;

    return {
      code,
      diagramType: "flowchart",
      nodes: [
        {
          id: "A",
          label: "Receive prompt",
          explanation: "The initial pipeline stage where user queries are captured and cleaned.",
          details: "Sanitizes user input to remove script tags and ensures strings are non-empty.",
          techStack: "Express.js Request Handler",
          codeSnippet: "app.post('/api/generate', (req, res) => {\n  const prompt = req.body.prompt.trim();\n  if(!prompt) return res.status(400).send();\n});",
          subComponents: ["Input Sanitizer", "Payload Validator"]
        },
        {
          id: "B",
          label: "Analyze prompt intent",
          explanation: "Analyzes semantic content to detect which diagram style matches best.",
          details: "Runs heuristic regex checks and matches keywords against ER, sequence, and flowchart vocabularies.",
          techStack: "Custom Parser / LLM Analyzer",
          codeSnippet: "const type = detectDiagramType(prompt);\nconsole.log('Detected Type:', type);",
          subComponents: ["Regex Scanner", "Heuristic Logic"]
        },
        {
          id: "C",
          label: "Is Diagram Type Clear?",
          explanation: "Conditional routing branch to handle clear requests vs. ambiguous requests.",
          details: "If type is found, bypasses inference. Otherwise, defaults to system design or flowchart.",
          techStack: "JavaScript Conditional Switch",
          codeSnippet: "if (diagramType !== 'unknown') {\n  return routeDirect(diagramType);\n} else {\n  return runInference(prompt);\n}",
          subComponents: ["Conditional Branch"]
        },
        {
          id: "D",
          label: "Generate Mermaid Code",
          explanation: "Synthesizes the valid, parseable Mermaid syntax representing nodes and connections.",
          details: "Instructs AI to output strict graph TD, erDiagram, sequenceDiagram, etc.",
          techStack: "Gemini AI API / OpenAI API",
          codeSnippet: "const aiResponse = await generateMermaidFromAI(prompt, diagramType);\nconst sanitizedCode = cleanMermaid(aiResponse);",
          subComponents: ["LLM Client", "Mermaid Sanitizer"]
        },
        {
          id: "E",
          label: "Infer best type",
          explanation: "Heuristically maps prompts lacking distinct words to system flow diagrams.",
          details: "Injects context tips instructing the AI to output an architecture flow.",
          techStack: "System Prompt Context Injection",
          codeSnippet: "const modifiedPrompt = `No type selected. Recommend system architecture flowchart: ${prompt}`;",
          subComponents: ["Prompt Decorator"]
        },
        {
          id: "F",
          label: "Render Interactive View",
          explanation: "Renders the raw Mermaid string visually on screen with click and hover bindings.",
          details: "Uses mermaid.render to inject SVG, then registers event hooks onto child nodes.",
          techStack: "mermaid-js, React DOM Hooks",
          codeSnippet: "mermaid.initialize({ startOnLoad: false });\nconst { svg } = await mermaid.render('preview', code);\ncontainer.innerHTML = svg;",
          subComponents: ["Mermaid Renderer", "DOM Event Injector"]
        },
        {
          id: "G",
          label: "Sync Metadata & Export",
          explanation: "Enables exporting diagram files and syncing documentation sidebars.",
          details: "Supports downloading SVG, PNG, or PDF, and generates notes & interview QA.",
          techStack: "jsPDF, Web Canvas API, SpeechSynthesis",
          codeSnippet: "export function downloadSvg(code) {\n  const blob = new Blob([svgCode], { type: 'image/svg+xml' });\n  saveAs(blob, 'diagram.svg');\n}",
          subComponents: ["Export Module", "Voice Synthesizer"]
        }
      ],
      documentation: {
        summary: `Pipeline Flowchart for processing user query: ${label}.`,
        notes: `### Flow Execution & Branching\n1. **Dynamic Routing**: Demonstrates conditional branching paths based on query clarity.\n2. **Safe Fallbacks**: Ensures that even ambiguous user inputs lead to successful visualizations.\n3. **Event Subscriptions**: React binds handlers to the dynamic nodes inside SVG at the final stage.`,
        vivaQuestions: [
          {
            question: "What is a flowchart diagram best used for in system design documentation?",
            answer: "Flowcharts are ideal for mapping linear processes, operational workflows, decision-making branches, and step-by-step algorithms."
          },
          {
            question: "How do we handle exceptions if the Mermaid compiler encounters a syntax error during render?",
            answer: "We catch compilation errors using try/catch, output a readable warning banner to the user, and maintain the last valid rendered SVG canvas."
          }
        ]
      },
      learningRoadmap: {
        title: "Mastering Algorithmic Flows & State Logic",
        milestones: [
          {
            title: "Core Programming Logic & Flowcharts",
            description: "Study structured code workflows, flow charts, state machines, and branches.",
            resources: ["CS50 Computer Science Introduction", "Draw.io Process Standards"],
            project: "Draw and program a comprehensive vending machine operational flow chart."
          },
          {
            title: "Heuristics and Text Parsers",
            description: "Learn text tokenization, regular expressions, and semantic parsing techniques.",
            resources: ["RegexOne Tutorial", "Eloquent JavaScript RegEx Chapters"],
            project: "Develop a CLI compiler that parses standard pseudo-code and executes it in JavaScript."
          }
        ]
      }
    };
  }

  // Default: architecture diagram fallback
  const code = `graph TD
  Client[Client SPA] --> Gateway[API Gateway]
  Gateway --> Auth[Auth Service]
  Gateway --> Diagram[Diagram Engine]
  Diagram --> LLM[LLM Provider]
  Diagram --> Store[(Metadata Store)]
  Store --> Export[Export Service]
  Export --> Files[(PNG SVG PDF)]
  LLM --> Diagram
  Diagram --> Client`;

  return {
    code,
    diagramType: "architecture",
    nodes: [
      {
        id: "Client",
        label: "Client SPA",
        explanation: "Dynamic frontend web application built using React and Tailwind CSS.",
        details: "Renders the dashboard workspace, receives user inputs, displays live interactive Mermaid canvasses, and manages user selections.",
        techStack: "React, Tailwind CSS, Lucide Icons, Mermaid.js",
        codeSnippet: "export default function WhiteboardApp() {\n  return (\n    <div className='flex min-h-screen bg-zinc-900'>\n      <Sidebar />\n      <Canvas />\n    </div>\n  );\n}",
        subComponents: ["Canvas Component", "Control Dashboard", "Whiteboard Canvas"]
      },
      {
        id: "Gateway",
        label: "API Gateway",
        explanation: "Central gateway managing access, authorization routing, and incoming client payloads.",
        details: "Distributes client calls to upstream auth or generation services while protecting internal microservice topologies.",
        techStack: "Node.js, Express, Cors, Helmet",
        codeSnippet: "const app = express();\napp.use(cors());\napp.use(helmet());\napp.use('/api/diagram', diagramRouter);\napp.use('/api/auth', authRouter);",
        subComponents: ["Rate Limiter", "Router Middleware"]
      },
      {
        id: "Auth",
        label: "Auth Service",
        explanation: "Verifies user access and manages secure JWT authorization tokens.",
        details: "Performs credential validation and issues signed payloads defining workspace permissions.",
        techStack: "Express.js, JSONWebToken, Bcrypt",
        codeSnippet: "const token = jwt.sign({ userId: req.user.id }, SECRET_KEY);\nres.json({ token });",
        subComponents: ["Login Route", "JWT Validator"]
      },
      {
        id: "Diagram",
        label: "Diagram Engine",
        explanation: "Core backend business controller managing Mermaid compilation and metadata parsing.",
        details: "Orchestrates prompt optimization, initiates LLM generator streams, and synchronizes updated layouts.",
        techStack: "Express.js Controllers",
        codeSnippet: "export async function generateController(req, res) {\n  const metadata = await richDiagramAiClient(req.body.prompt);\n  res.json(metadata);\n}",
        subComponents: ["Generation Coordinator", "Heuristic Matcher"]
      },
      {
        id: "LLM",
        label: "LLM Provider",
        explanation: "External generative intelligence layer generating Mermaid syntax and context descriptions.",
        details: "Accepts optimized system instructions and outputs clean, structured JSON payloads describing architecture, logic, and code snippets.",
        techStack: "Google Gemini 2.5 Flash API",
        codeSnippet: "const response = await fetch(`https://generativelanguage.googleapis.com/...key=\${KEY}`, {\n  method: 'POST',\n  body: JSON.stringify({ systemInstruction, contents, generationConfig: { responseMimeType: 'application/json' } })\n});",
        subComponents: ["Gemini Client", "Structured Parser"]
      },
      {
        id: "Store",
        label: "Metadata Store",
        explanation: "Database storing active diagrams, revision versions, and custom nodes.",
        details: "Handles fast JSON fetches and stores schema structures.",
        techStack: "MongoDB / PostgreSQL",
        codeSnippet: "const diagramSchema = new Schema({\n  code: String,\n  diagramType: String,\n  nodes: Array,\n  documentation: Object\n});",
        subComponents: ["Mongoose Model", "Connection Pooler"]
      },
      {
        id: "Export",
        label: "Export Service",
        explanation: "Generates high fidelity vector or raster output files representing diagram canvases.",
        details: "Transforms HTML SVGs into canvas objects, generating download triggers for PNG and PDF files.",
        techStack: "jsPDF, HTML5 Canvas API",
        codeSnippet: "const pdf = new jsPDF();\npdf.addImage(canvasData, 'PNG', 0, 0);\npdf.save('architecture.pdf');",
        subComponents: ["PDF Compiler", "PNG Rasterizer"]
      },
      {
        id: "Files",
        label: "Files System",
        explanation: "Downloads directory where exported SVG, PNG, and PDF files are saved locally.",
        details: "Stores final high-quality output documentation.",
        techStack: "Local File System",
        codeSnippet: "<!-- Trigger user browser download -->\n<a href={fileUrl} download='diagram.png'>Download</a>",
        subComponents: ["Local Assets"]
      }
    ],
    documentation: {
      summary: `System Architecture diagram for: ${label}.`,
      notes: `### Structural Summary\nThis architecture uses a classic Microservice Gateway design.\n- **Decoupled Engine**: The Diagram Engine runs independently from the LLM provider, facilitating fast fallbacks if the model endpoint experience outages.\n- **Stateless Session Control**: Gateways manage rate limits, while authorization tokens verify identity.`,
      vivaQuestions: [
        {
          question: "How does the Client SPA render the Mermaid.js graph dynamically?",
          answer: "The Client compiles raw text into standard vectors using the 'mermaid' library, injecting interactive SVG components directly into the DOM."
        },
        {
          question: "What is the primary architectural advantage of using an API Gateway downstream?",
          answer: "It creates a single gateway entry point, unifying routing, aggregating logging, decoupling system details, and reducing client resource usage."
        }
      ]
    },
    learningRoadmap: {
      title: "Mastering Microservice Architectures & Gateways",
      milestones: [
        {
          title: "Learn Express & Middleware routing",
          description: "Understand REST routing, CORS, custom filters, and error handlers in Express.",
          resources: ["Express.js Guide", "The Net Ninja Express Tutorials"],
          project: "Build a modular REST API featuring rate limiting and JSON validators."
        },
        {
          title: "Gateway Proxies & Gateway design patterns",
          description: "Learn how proxy rules operate, rewrite pathways, and handle security tokens centrally.",
          resources: ["Microservice Architecture Patterns", "Nginx Gateway Config Guide"],
          project: "Deploy an Express API gateway routing traffic to two backend mock microservices."
        }
      ]
    }
  };
}

function titleCase(text) {
  return text
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function fallbackDiagram(prompt, diagramType) {
  const label = titleCase(prompt) || "Generated System";

  if (diagramType === "er") {
    return `erDiagram
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
  }

  if (diagramType === "flowchart") {
    return `flowchart TD
  A[Receive request: ${label}] --> B[Analyze intent]
  B --> C{Diagram type clear?}
  C -- Yes --> D[Generate Mermaid structure]
  C -- No --> E[Infer best diagram style]
  E --> D
  D --> F[Render preview]
  F --> G[Export or edit on whiteboard]`;
  }

  return `graph TD
  Client[Client App] --> Gateway[API Gateway]
  Gateway --> Auth[Auth Service]
  Gateway --> Diagram[Diagram Service]
  Diagram --> LLM[LLM Provider]
  Diagram --> Store[(Diagram Store)]
  Store --> Export[Export Worker]
  Export --> Files[(PNG SVG PDF)]
  LLM --> Diagram
  Diagram --> Client`;
}

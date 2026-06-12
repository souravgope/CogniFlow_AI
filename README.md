# AI Whiteboard and Diagram Generator

A full-stack app that turns natural language prompts into Mermaid diagrams, renders them visually, and gives you a whiteboard area for manual sketching.

## Features

- Natural language to Mermaid diagrams
- Automatic flowchart, architecture, and ER diagram selection
- Mermaid code and visual preview modes
- PNG, SVG, and PDF export
- Excalidraw whiteboard for manual shapes, text, pan, zoom, and editing
- Dark and light mode
- Local diagram saves
- Shareable links
- Express API with OpenAI support and a local fallback

## Project Structure

```text
client/
  src/
    api/
    components/
    utils/
server/
  src/
    api/
    utils/
```

## Setup

Install dependencies:

```bash
npm run install:all
```

Create `server/.env`:

```bash
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4o-mini
PORT=5000
```

Run both apps:

```bash
npm run dev
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:5000`

## API

`POST /generate-diagram`

```json
{
  "prompt": "Create ER diagram for student management system"
}
```

Response:

```json
{
  "code": "erDiagram\n  STUDENT ||--o{ ENROLLMENT : has\n  COURSE ||--o{ ENROLLMENT : includes",
  "diagramType": "er"
}
```

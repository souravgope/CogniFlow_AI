import { Excalidraw } from "@excalidraw/excalidraw";
import { useMemo } from "react";

// Client-side parser to convert Mermaid diagram and rich nodes into whiteboard structured JSON (Requirement 1, 2)
export function parseMermaidToWhiteboardJSON(code, nodes) {
  if (!nodes || nodes.length === 0) {
    return { nodes: [], edges: [] };
  }

  const whiteboardNodes = [];
  const whiteboardEdges = [];

  // 1. Arrange nodes in a beautiful 3-column flowchart layout
  const cols = 3;
  const spacingX = 260;
  const spacingY = 160;
  const startX = 100;
  const startY = 100;

  nodes.forEach((node, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    whiteboardNodes.push({
      id: node.id,
      label: node.label,
      position: {
        x: startX + col * spacingX,
        y: startY + row * spacingY
      }
    });
  });

  // 2. Parse connection edges from Mermaid lines
  const lines = code.split("\n");
  lines.forEach((line) => {
    let match;

    // Heuristic 1: Flowchart/Graph edges (A --> B, Client ==> Gateway, etc.)
    if (line.includes("-->") || line.includes("==>")) {
      const parts = line.split(/--+>|==+>/);
      if (parts.length >= 2) {
        const fromRaw = parts[0].trim();
        const toRaw = parts[1].trim();

        // Extract first alphanumeric ID token
        const fromId = fromRaw.split(/\[|\(|\{/)[0].trim().replace(/['"\[\(\{]/g, "");
        const toId = toRaw.split(/\[|\(|\{/)[0].trim().replace(/['"\[\(\{]/g, "");

        const fromNode = nodes.find(n => n.id.toLowerCase() === fromId.toLowerCase());
        const toNode = nodes.find(n => n.id.toLowerCase() === toId.toLowerCase());

        if (fromNode && toNode) {
          let label = "connects";
          const labelMatch = line.match(/\|(.*?)\|/);
          if (labelMatch) {
            label = labelMatch[1].trim();
          }
          whiteboardEdges.push({
            from: fromNode.id,
            to: toNode.id,
            label
          });
        }
      }
    }
    // Heuristic 2: Sequence diagram lines (A->>B: message)
    else if (line.includes("->>")) {
      const parts = line.split("->>");
      if (parts.length >= 2) {
        const fromId = parts[0].trim();
        const rest = parts[1].split(":");
        const toId = rest[0].trim();
        const label = rest[1] ? rest[1].trim() : "calls";

        const fromNode = nodes.find(n => n.id.toLowerCase() === fromId.toLowerCase());
        const toNode = nodes.find(n => n.id.toLowerCase() === toId.toLowerCase());

        if (fromNode && toNode) {
          whiteboardEdges.push({
            from: fromNode.id,
            to: toNode.id,
            label
          });
        }
      }
    }
    // Heuristic 3: ER Database schemas (USER ||--o{ PROJECT : owns)
    else if (line.includes("||--o{") || line.includes("||--|{") || line.includes("}|--||") || line.includes("||--||")) {
      const parts = line.split(":");
      const relation = parts[0].trim();
      const label = parts[1] ? parts[1].trim().replace(/['"]/g, "") : "relates";

      // Match entity IDs before/after join symbols
      const entityParts = relation.split(/\|\|--o\{|\|\|--\|\{|\}\|--\|\||\|\|--\|\|/);
      if (entityParts.length >= 2) {
        const fromId = entityParts[0].trim();
        const toId = entityParts[1].trim();

        const fromNode = nodes.find(n => n.id.toLowerCase() === fromId.toLowerCase());
        const toNode = nodes.find(n => n.id.toLowerCase() === toId.toLowerCase());

        if (fromNode && toNode) {
          whiteboardEdges.push({
            from: fromNode.id,
            to: toNode.id,
            label
          });
        }
      }
    }
  });

  return {
    nodes: whiteboardNodes,
    edges: whiteboardEdges
  };
}

// Converts whiteboard JSON payload to standard editable Excalidraw shape elements (Requirement 1, 2)
export function convertToExcalidrawElements({ nodes = [], edges = [] }, isDark) {
  const elements = [];
  const nodeWidth = 180;
  const nodeHeight = 60;

  // 1. Compile nodes into boxes with text labels inside
  nodes.forEach((node) => {
    const rectId = `rect-${node.id}`;
    const textId = `text-${node.id}`;

    // Add Rectangle Element
    elements.push({
      type: "rectangle",
      version: 2,
      versionNonce: Math.floor(Math.random() * 1000000),
      isDeleted: false,
      id: rectId,
      fillStyle: "solid",
      strokeWidth: 2,
      strokeStyle: "solid",
      roughness: 1, // Nice hand-drawn effect
      opacity: 100,
      strokeColor: "#14b8a6", // Beautiful teal border
      backgroundColor: isDark ? "#27272a" : "#f4f4f5", // Light/Dark responsive nodes
      x: node.position.x,
      y: node.position.y,
      width: nodeWidth,
      height: nodeHeight,
      seed: Math.floor(Math.random() * 1000000),
      strokeSharpness: "round",
      boundElements: [{ id: textId, type: "text" }]
    });

    // Add Text Element centered inside the box
    elements.push({
      type: "text",
      version: 2,
      versionNonce: Math.floor(Math.random() * 1000000),
      isDeleted: false,
      id: textId,
      strokeColor: isDark ? "#ffffff" : "#18181b",
      backgroundColor: "transparent",
      x: node.position.x + 10,
      y: node.position.y + 20,
      width: nodeWidth - 20,
      height: nodeHeight - 40,
      seed: Math.floor(Math.random() * 1000000),
      text: node.label,
      fontSize: 14,
      fontFamily: 1, // Hand-drawn/standard typography style
      textAlign: "center",
      verticalAlign: "middle"
    });
  });

  // 2. Compile edges into Excalidraw Arrows connecting elements
  edges.forEach((edge, index) => {
    const fromNode = nodes.find((n) => n.id === edge.from);
    const toNode = nodes.find((n) => n.id === edge.to);

    if (fromNode && toNode) {
      // Find connecting centers of node elements
      const fromCenterX = fromNode.position.x + nodeWidth / 2;
      const fromCenterY = fromNode.position.y + nodeHeight / 2;
      const toCenterX = toNode.position.x + nodeWidth / 2;
      const toCenterY = toNode.position.y + nodeHeight / 2;

      const dx = toCenterX - fromCenterX;
      const dy = toCenterY - fromCenterY;

      let startX = fromCenterX;
      let startY = fromCenterY;
      let endX = toCenterX;
      let endY = toCenterY;

      if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
        // Calculate boundary intersection factor for fromNode (with 5px gap)
        const tX_from = Math.abs(dx) > 0.0001 ? (nodeWidth / 2 + 5) / Math.abs(dx) : Infinity;
        const tY_from = Math.abs(dy) > 0.0001 ? (nodeHeight / 2 + 5) / Math.abs(dy) : Infinity;
        const t_from = Math.min(tX_from, tY_from);

        startX = fromCenterX + dx * t_from;
        startY = fromCenterY + dy * t_from;

        // Calculate boundary intersection factor for toNode (with 8px gap for arrowhead)
        const tX_to = Math.abs(dx) > 0.0001 ? (nodeWidth / 2 + 8) / Math.abs(dx) : Infinity;
        const tY_to = Math.abs(dy) > 0.0001 ? (nodeHeight / 2 + 8) / Math.abs(dy) : Infinity;
        const t_to = Math.min(tX_to, tY_to);

        endX = toCenterX - dx * t_to;
        endY = toCenterY - dy * t_to;
      }

      elements.push({
        type: "arrow",
        version: 2,
        versionNonce: Math.floor(Math.random() * 1000000),
        isDeleted: false,
        id: `arrow-${edge.from}-${edge.to}-${index}`,
        strokeColor: "#94a3b8", // Modern slate gray arrows
        backgroundColor: "transparent",
        strokeWidth: 1.5,
        x: startX,
        y: startY,
        width: endX - startX,
        height: endY - startY,
        seed: Math.floor(Math.random() * 1000000),
        points: [
          [0, 0],
          [endX - startX, endY - startY]
        ]
      });
    }
  });

  return elements;
}

export default function Whiteboard({ isDark, code = "", nodes = [] }) {
  // Translate nodes and edges from diagram code dynamically (Requirement 1, 2)
  const excalidrawElements = useMemo(() => {
    if (!code || !nodes || nodes.length === 0) return [];
    
    const whiteboardJson = parseMermaidToWhiteboardJSON(code, nodes);
    return convertToExcalidrawElements(whiteboardJson, isDark);
  }, [code, nodes, isDark]);

  return (
    <section className="whiteboard-shell bg-white/70 backdrop-blur border border-zinc-200/80 rounded-xl p-4 dark:border-zinc-800/80 dark:bg-zinc-950/70 shadow-sm animate-fade-in">
      <div className="mb-3 flex items-center justify-between gap-3 border-b border-zinc-100 pb-2 dark:border-zinc-800">
        <div>
          <h2 className="text-base font-bold flex items-center gap-1.5">
            🎨 Editable Whiteboard Playground
          </h2>
          <p className="text-[10px] text-zinc-400">Your AI-generated diagram loaded directly onto Excalidraw. Drag boxes, edit text, or add shapes!</p>
        </div>
        <span className="text-xs bg-teal-500/10 text-teal-600 dark:text-teal-400 px-2 py-0.5 rounded-full font-mono font-bold">
          Excalidraw Active
        </span>
      </div>
      
      <div className="whiteboard-canvas overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-inner">
        <Excalidraw
          key={code} // Rerenders and mounts the Excalidraw workspace elements when diagram code changes
          theme={isDark ? "dark" : "light"}
          initialData={{
            elements: excalidrawElements,
            appState: {
              viewBackgroundColor: isDark ? "#18181b" : "#ffffff",
              zenModeEnabled: false,
              gridSize: 20
            }
          }}
        />
      </div>
    </section>
  );
}

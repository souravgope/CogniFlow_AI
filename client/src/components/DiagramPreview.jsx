import mermaid from "mermaid";
import { useEffect, useId, useRef, useState } from "react";

export default function DiagramPreview({
  code,
  isDark,
  nodes = [],
  onNodeSelect = () => {},
  selectedNodeId = null
}) {
  const id = useId().replace(/:/g, "");
  const containerRef = useRef(null);
  const [error, setError] = useState("");
  const [hoveredNode, setHoveredNode] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let cancelled = false;

    async function renderDiagram() {
      setError("");
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "loose",
        theme: isDark ? "dark" : "default",
        flowchart: {
          htmlLabels: true,
          curve: "basis"
        },
        sequence: {
          showSequenceNumbers: true,
          actorMargin: 50
        }
      });

      try {
        const { svg } = await mermaid.render(`diagram-${id}`, code);
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          attachEventHandlers();
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Mermaid could not render this diagram.");
          if (containerRef.current) {
            containerRef.current.innerHTML = "";
          }
        }
      }
    }

    function attachEventHandlers() {
      const svgElement = containerRef.current?.querySelector("svg");
      if (!svgElement) return;

      // Make SVG responsive and scalable
      svgElement.style.width = "100%";
      svgElement.style.height = "auto";
      svgElement.style.maxHeight = "550px";

      // Find all potential node/actor/entity groupings in Mermaid SVG
      const groups = svgElement.querySelectorAll("g.node, g.actor, g.entity, g.classNode, g.subgraph");

      groups.forEach((group) => {
        // Set cursor to pointer
        group.style.cursor = "pointer";
        group.style.transition = "all 0.25s ease-in-out";

        // Find match in our rich nodes list
        const matchedNode = findMatchingNode(group);

        if (matchedNode) {
          // Store matched node ID in the element dataset for easy class management
          group.setAttribute("data-node-id", matchedNode.id);

          // Add hover listeners
          group.addEventListener("mouseenter", (e) => {
            setHoveredNode(matchedNode);
            updateTooltipPosition(e);
            group.style.filter = "brightness(1.15) drop-shadow(0 4px 8px rgba(20,184,166,0.3))";
          });

          group.addEventListener("mousemove", (e) => {
            updateTooltipPosition(e);
          });

          group.addEventListener("mouseleave", () => {
            setHoveredNode(null);
            group.style.filter = "";
          });

          // Add click listener
          group.addEventListener("click", (e) => {
            e.stopPropagation();
            onNodeSelect(matchedNode);
          });
        }
      });
    }

    function findMatchingNode(group) {
      if (!nodes || nodes.length === 0) return null;

      // Heuristic 1: Match by classes like id-Client
      const classList = Array.from(group.classList);
      for (const className of classList) {
        if (className.startsWith("id-")) {
          const idCandidate = className.replace("id-", "");
          const match = nodes.find((n) => n.id.toLowerCase() === idCandidate.toLowerCase());
          if (match) return match;
        }
      }

      // Heuristic 2: Check ID attribute
      const elementId = group.getAttribute("id") || "";
      const idMatch = nodes.find((n) => elementId.includes(`-${n.id}-`) || elementId.endsWith(`-${n.id}`));
      if (idMatch) return idMatch;

      // Heuristic 3: Check innerText / text content
      const textContent = (group.textContent || "").trim().toLowerCase();
      const textMatch = nodes.find((n) => {
        const labelLower = n.label.toLowerCase();
        const idLower = n.id.toLowerCase();
        return (
          textContent === labelLower ||
          textContent.includes(labelLower) ||
          textContent === idLower ||
          textContent.includes(idLower)
        );
      });

      return textMatch || null;
    }

    function updateTooltipPosition(e) {
      if (containerRef.current) {
        const bounds = containerRef.current.getBoundingClientRect();
        setTooltipPos({
          x: e.clientX - bounds.left + 15,
          y: e.clientY - bounds.top + 15
        });
      }
    }

    if (code.trim()) {
      renderDiagram();
    }

    return () => {
      cancelled = true;
    };
  }, [code, id, isDark, nodes]);

  // Apply visual highlighting when selectedNodeId changes
  useEffect(() => {
    const svgElement = containerRef.current?.querySelector("svg");
    if (!svgElement) return;

    const groups = svgElement.querySelectorAll("g.node, g.actor, g.entity, g.classNode");
    groups.forEach((group) => {
      const nodeId = group.getAttribute("data-node-id");

      if (selectedNodeId) {
        if (nodeId === selectedNodeId) {
          // Highlight selected
          group.style.opacity = "1";
          group.style.filter = "brightness(1.1) drop-shadow(0 0 12px rgba(20,184,166,0.65))";
          
          // Style the nested rect or polygon to have a premium neon border
          const shapes = group.querySelectorAll("rect, polygon, circle, path.outer");
          shapes.forEach((shape) => {
            shape.style.stroke = "#14b8a6";
            shape.style.strokeWidth = "3px";
          });
        } else {
          // Spotlight effect: Dim other nodes
          group.style.opacity = "0.35";
          group.style.filter = "grayscale(40%)";
          
          const shapes = group.querySelectorAll("rect, polygon, circle, path.outer");
          shapes.forEach((shape) => {
            shape.style.stroke = "";
            shape.style.strokeWidth = "";
          });
        }
      } else {
        // Reset all
        group.style.opacity = "1";
        group.style.filter = "";
        
        const shapes = group.querySelectorAll("rect, polygon, circle, path.outer");
        shapes.forEach((shape) => {
          shape.style.stroke = "";
          shape.style.strokeWidth = "";
        });
      }
    });
  }, [selectedNodeId]);

  return (
    <div className="diagram-stage relative overflow-visible rounded-xl border border-zinc-200/80 bg-white/70 p-4 backdrop-blur shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/70">
      {error ? <div className="notice-error">{error}</div> : null}
      <div className="diagram-scroll overflow-auto">
        <div ref={containerRef} className="diagram-output flex justify-center py-2" />
      </div>

      {/* Premium floating glassmorphic tooltip */}
      {hoveredNode && (
        <div
          className="absolute z-[9999] pointer-events-none max-w-xs rounded-xl border border-zinc-200/60 bg-white/90 p-3 shadow-xl backdrop-blur-md transition-all duration-100 ease-out dark:border-zinc-800/60 dark:bg-zinc-900/90 text-left animate-fade-in"
          style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
        >
          <div className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-1.5 dark:border-zinc-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              {hoveredNode.techStack?.split(",")?.[0] || hoveredNode.type || "Component"}
            </span>
            <span className="text-[10px] rounded bg-zinc-100 px-1 py-0.5 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 font-mono">
              ID: {hoveredNode.id}
            </span>
          </div>
          <h4 className="mt-1 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            {hoveredNode.label}
          </h4>
          <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
            {hoveredNode.explanation || `Type: ${hoveredNode.type || 'System module'}`}
          </p>
          <div className="mt-2 text-[10px] text-teal-600/80 dark:text-teal-400/80 font-medium">
            ⚡ Click node to see code & full specs
          </div>
        </div>
      )}
    </div>
  );
}

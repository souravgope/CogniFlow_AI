import { Router } from "express";
import { generateDiagram } from "../utils/aiClient.js";
import { detectDiagramType } from "../utils/detectDiagramType.js";
import { fallbackDiagram } from "../utils/fallbackDiagram.js";
import { cleanMermaidCode } from "../utils/mermaid.js";
import { generateRichDiagram, syncRichDiagramMetadata } from "../utils/richDiagramAiClient.js";
import { buildRichFallbackDiagram } from "../utils/richDiagramFallback.js";

const router = Router();

router.post("/generate-diagram", async (req, res, next) => {
  try {
    const prompt = String(req.body?.prompt || "").trim();
    const isInteractive = !!req.body?.interactive;

    if (!prompt) {
      return res.status(400).json({ message: "Prompt is required." });
    }

    const diagramType = detectDiagramType(prompt);
    const provider = (process.env.AI_PROVIDER || "fallback").toLowerCase();
    let activeProvider = provider;
    let warning = "";

    if (isInteractive) {
      if (provider !== "fallback") {
        try {
          const result = await generateRichDiagram(prompt, diagramType);
          result.code = cleanMermaidCode(result.code);
          return res.json({
            ...result,
            provider: activeProvider,
            warning
          });
        } catch (error) {
          activeProvider = "fallback";
          warning = `${provider} failed: ${error.message}. Showing a fallback interactive diagram instead.`;
          console.warn(warning);
        }
      }
      
      // Interactive Fallback
      const fallbackResult = buildRichFallbackDiagram(prompt, diagramType);
      return res.json({
        ...fallbackResult,
        provider: "fallback",
        warning
      });
    }

    // Default Non-Interactive Flow
    let rawCode = fallbackDiagram(prompt, diagramType);
    if (provider !== "fallback") {
      try {
        rawCode = await generateDiagram(prompt);
      } catch (error) {
        activeProvider = "fallback";
        warning = `${provider} failed: ${error.message}. Showing a fallback diagram instead.`;
        console.warn(warning);
      }
    }

    const code = cleanMermaidCode(rawCode);

    res.json({
      code,
      diagramType,
      provider: activeProvider,
      warning
    });
  } catch (error) {
    next(error);
  }
});

router.post("/sync-diagram-metadata", async (req, res, next) => {
  try {
    const code = String(req.body?.code || "").trim();
    const diagramType = String(req.body?.diagramType || "architecture").trim();

    if (!code) {
      return res.status(400).json({ message: "Diagram code is required." });
    }

    const provider = (process.env.AI_PROVIDER || "fallback").toLowerCase();
    
    if (provider !== "fallback") {
      try {
        const result = await syncRichDiagramMetadata(code, diagramType);
        return res.json(result);
      } catch (error) {
        console.warn("AI metadata sync failed:", error.message);
      }
    }

    // Heuristic Local Sync Fallback
    const fallbackResult = buildRichFallbackDiagram("System Recovery Sync", diagramType);
    fallbackResult.code = code; // Keep original user code
    return res.json(fallbackResult);
  } catch (error) {
    next(error);
  }
});

export default router;

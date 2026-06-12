import { generateMistakeAnalysis } from "../utils/mistakeAiClient.js";
import { buildFallbackMistakeAnalysis } from "../utils/mistakeFallback.js";

export async function analyzeMistake(req, res, next) {
  try {
    const topic = String(req.body?.topic || "").trim();
    const answer = String(req.body?.answer || "").trim();

    if (!topic) {
      return res.status(400).json({ message: "Topic is required." });
    }

    if (!answer) {
      return res.status(400).json({ message: "User answer is required." });
    }

    const input = { topic, answer };
    const provider = (process.env.AI_PROVIDER || "fallback").toLowerCase();

    if (provider === "fallback") {
      return res.json(buildFallbackMistakeAnalysis(input));
    }

    try {
      const analysis = await generateMistakeAnalysis(input);
      return res.json(analysis);
    } catch (error) {
      console.error("AI mistake analysis failed:", error.message);
      return res.json(buildFallbackMistakeAnalysis(input));
    }
  } catch (error) {
    next(error);
  }
}

import { generateExplanation } from "../utils/explanationAiClient.js";
import { buildFallbackExplanation } from "../utils/explanationFallback.js";

const levels = new Set(["Beginner", "Intermediate", "Advanced"]);
const languages = new Set(["English", "Hinglish", "Hindi"]);
const styles = new Set(["Teacher", "Friend", "Interviewer"]);

function pickAllowed(value, allowed, fallback) {
  const normalized = String(value || "").trim();
  return allowed.has(normalized) ? normalized : fallback;
}

export async function generateStructuredExplanation(req, res, next) {
  try {
    const topic = String(req.body?.topic || "").trim();
    const level = pickAllowed(req.body?.level, levels, "Beginner");
    const language = pickAllowed(req.body?.language, languages, "English");
    const style = pickAllowed(req.body?.style, styles, "Teacher");

    if (!topic) {
      return res.status(400).json({ message: "Topic is required." });
    }

    const input = { topic, level, language, style };
    const provider = (process.env.AI_PROVIDER || "fallback").toLowerCase();

    if (provider === "fallback") {
      return res.json(await buildFallbackExplanation(input));
    }

    try {
      const explanation = await generateExplanation(input);
      return res.json(explanation);
    } catch (error) {
      console.error("AI explanation generation failed:", error.message);
      return res.json(await buildFallbackExplanation(input));
    }
  } catch (error) {
    next(error);
  }
}

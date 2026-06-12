import { generateLearningPath, generateQuizPath } from "../utils/learningAiClient.js";
import { buildFallbackLearningPath } from "../utils/learningFallback.js";
import { buildFallbackQuiz } from "../utils/quizFallback.js";

export async function generateLearning(req, res, next) {
  try {
    const skillLevel = String(req.body?.skillLevel || "").trim();
    const targetRole = String(req.body?.targetRole || "").trim();
    const duration = String(req.body?.duration || "").trim();
    const currentSkills = String(req.body?.currentSkills || "").trim();
    const preferences = String(req.body?.preferences || "").trim();

    console.log("Learning Path Request:", { skillLevel, targetRole, duration });

    if (!skillLevel) {
      return res.status(400).json({ message: "Skill level is required." });
    }

    if (!targetRole) {
      return res.status(400).json({ message: "Target role is required." });
    }

    if (!duration) {
      return res.status(400).json({ message: "Duration is required." });
    }

    const input = {
      skillLevel,
      targetRole,
      duration,
      currentSkills,
      preferences
    };

    const provider = (process.env.AI_PROVIDER || "fallback").toLowerCase();
    console.log("Using provider:", provider);

    let learningPath;
    let activeProvider = provider;
    let warning = "";

    if (provider === "fallback") {
      learningPath = buildFallbackLearningPath(input);
    } else {
      try {
        console.log("Calling AI provider:", provider);
        learningPath = await generateLearningPath(input);
        console.log("AI provider succeeded");
      } catch (error) {
        console.error("AI provider failed:", error.message);
        warning = `${provider} failed: ${error.message}. Falling back to template.`;
        learningPath = buildFallbackLearningPath(input);
        activeProvider = "fallback";
      }
    }

    console.log("Learning path generated successfully");
    res.json({
      ...learningPath,
      provider: activeProvider,
      warning
    });
  } catch (error) {
    console.error("Error generating learning path:", error.message);
    next(error);
  }
}

export async function generateQuiz(req, res, next) {
  try {
    const targetRole = String(req.body?.targetRole || "").trim();
    const skillLevel = String(req.body?.skillLevel || "").trim();

    console.log("Quiz Generation Request:", { targetRole, skillLevel });

    if (!targetRole) {
      return res.status(400).json({ message: "Target role is required." });
    }

    const provider = (process.env.AI_PROVIDER || "fallback").toLowerCase();
    let quiz;
    let activeProvider = provider;
    let warning = "";

    if (provider === "fallback") {
      quiz = buildFallbackQuiz(targetRole, skillLevel);
    } else {
      try {
        quiz = await generateQuizPath(targetRole, skillLevel);
      } catch (error) {
        console.error("AI Quiz generation failed:", error.message);
        warning = `${provider} failed: ${error.message}. Falling back to default quiz.`;
        quiz = buildFallbackQuiz(targetRole, skillLevel);
        activeProvider = "fallback";
      }
    }

    res.json({
      quiz,
      provider: activeProvider,
      warning
    });
  } catch (error) {
    console.error("Error generating quiz:", error.message);
    next(error);
  }
}

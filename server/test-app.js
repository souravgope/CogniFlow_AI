// Quick test - verify the learning route is working
// Run from browser: http://localhost:5001/generate-learning-path (it will error but show if route exists)

import { buildFallbackLearningPath } from "./src/utils/learningFallback.js";
import { createApp } from "./src/app.js";

console.log("Testing app creation...");
const app = createApp();
console.log("✅ App created successfully");

console.log("\nTesting fallback...");
try {
  const result = buildFallbackLearningPath({
    skillLevel: "Beginner",
    targetRole: "Developer",
    duration: "6 months",
    currentSkills: "",
    preferences: ""
  });
  console.log("✅ Fallback works - keys:", Object.keys(result));
} catch (error) {
  console.error("❌ Fallback error:", error.message);
}

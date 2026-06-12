// Test file - to verify the backend works
// Run from backend directory: node test-learning.js

import { buildFallbackLearningPath } from "./src/utils/learningFallback.js";

try {
  console.log("Testing fallback learning path...");
  
  const result = buildFallbackLearningPath({
    skillLevel: "Beginner",
    targetRole: "Frontend Developer",
    duration: "6 months",
    currentSkills: "HTML, CSS",
    preferences: "MERN Stack"
  });

  console.log("\n✅ SUCCESS! Generated learning path:");
  console.log("─".repeat(50));
  console.log("Keys:", Object.keys(result));
  console.log("\nRoadmap preview:", result.roadmap.substring(0, 200) + "...");
  console.log("\nDaily Plan preview:", result.dailyPlan.substring(0, 200) + "...");
  console.log("\n✅ All sections working correctly!");
} catch (error) {
  console.error("❌ ERROR:", error.message);
  console.error(error);
}

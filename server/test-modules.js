// Quick test to see if modules load without syntax errors
console.log("Testing module imports...");

try {
  console.log("✓ Importing learningFallback...");
  const { buildFallbackLearningPath } = await import("./src/utils/learningFallback.js");
  console.log("✓ learningFallback imported successfully");
  
  console.log("✓ Importing learningAiClient...");
  const { generateLearningPath } = await import("./src/utils/learningAiClient.js");
  console.log("✓ learningAiClient imported successfully");
  
  console.log("✓ Importing learningController...");
  const { generateLearning } = await import("./src/controllers/learningController.js");
  console.log("✓ learningController imported successfully");
  
  console.log("✓ Importing learningRoutes...");
  const learningRoutes = (await import("./src/routes/learningRoutes.js")).default;
  console.log("✓ learningRoutes imported successfully");
  
  console.log("\n✅ All modules loaded successfully!");
  
  // Test fallback function
  const testInput = {
    skillLevel: "Beginner",
    targetRole: "Developer",
    duration: "3 months",
    currentSkills: "HTML, CSS",
    preferences: "Web Dev"
  };
  
  const result = buildFallbackLearningPath(testInput);
  console.log("\n📚 Fallback output test:");
  console.log("Keys:", Object.keys(result));
  console.log("Sample roadmap:", result.roadmap.substring(0, 100) + "...");
  
} catch (error) {
  console.error("❌ Module loading failed:", error.message);
  console.error(error);
  process.exit(1);
}

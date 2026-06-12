export function buildFallbackAssistantResponse({ query, isOnline }) {
  const cleanQuery = String(query || "").trim().toLowerCase();
  let topic = "General Concepts";
  
  // Basic topic matching to provide intelligent-looking fallback responses
  if (cleanQuery.includes("recursion")) topic = "Recursion";
  else if (cleanQuery.includes("react")) topic = "React.js";
  else if (cleanQuery.includes("state")) topic = "React State Management";
  else if (cleanQuery.includes("hooks")) topic = "React Hooks";
  else if (cleanQuery.includes("array")) topic = "Arrays & Array Methods";
  else if (cleanQuery.includes("object")) topic = "JavaScript Objects";
  else if (cleanQuery.includes("function")) topic = "Functions & Scope";
  else if (cleanQuery.includes("promise") || cleanQuery.includes("async")) topic = "Asynchronous JavaScript";
  else if (cleanQuery.includes("css") || cleanQuery.includes("flexbox") || cleanQuery.includes("grid")) topic = "CSS Layouts";
  else if (cleanQuery.includes("database") || cleanQuery.includes("sql")) topic = "Database Design";
  else if (cleanQuery.includes("binary search") || cleanQuery.includes("sort")) topic = "Algorithms";
  else if (cleanQuery.includes("html")) topic = "HTML Semantic Elements";
  else if (cleanQuery.includes("whiteboard") || cleanQuery.includes("diagram")) topic = "System Architecture";
  else if (cleanQuery.length > 3) {
    const words = cleanQuery.split(/\s+/).slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    topic = words;
  }

  if (!isOnline) {
    return {
      response: `[Offline Mode] Here is a quick tip about your query "${query}": This relates directly to "${topic}". Since you are offline, we've loaded a short response based on basic offline knowledge. I highly recommend practicing drawing this concept on the AI Whiteboard, or reviewing your saved notes. Swap to Online mode to get a complete detailed answer!`,
      type: "general",
      suggestions: [
        `Explain ${topic}`,
        `Generate ${topic} learning path`,
        "Practice on whiteboard"
      ],
      next_step_topic: topic,
      action_hint: `Practice drawing ${topic} on the AI Whiteboard, or test your code with the AI Mistake Analyzer.`
    };
  }

  // Online Mode Fallback (When API fails or AI_PROVIDER=fallback)
  return {
    response: `### Quick Guide: ${topic}
Here is a structured explanation of the concept (Backup Mode):

1. **Overview**: **${topic}** is a fundamental technical concept.
2. **Core Idea**: Master this to write clean, optimized, and maintainable applications.
3. **Recommendation**: Explore a complete study pathway or get interactive slides below!`,
    type: "explanation",
    suggestions: [
      `Explain ${topic}`,
      `Generate ${topic} learning path`,
      "Practice on whiteboard"
    ],
    next_step_topic: topic,
    action_hint: `Generate a custom learning path to plan your milestones, or study the visual slides in AI Explanation.`
  };
}

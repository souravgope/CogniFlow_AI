function estimateScore(answer) {
  const length = answer.trim().length;
  if (length < 20) return "25/100";
  if (length < 80) return "45/100";
  if (length < 180) return "60/100";
  return "70/100";
}

function estimateDifficulty(answer) {
  const length = answer.trim().length;
  if (length < 80) return "Beginner";
  if (length < 220) return "Intermediate";
  return "Advanced";
}

export function buildFallbackMistakeAnalysis({ topic, answer }) {
  const shortAnswer = answer.trim() || "No answer provided";

  return {
    mistakes: [
      "The answer does not clearly define the main concept.",
      "Important supporting details are missing or incomplete.",
      "The explanation needs a clearer step-by-step structure."
    ],
    explanation: `Your answer for ${topic} shows an attempt, but it needs more clarity. A strong answer should first explain the main idea, then add the key points, and finally connect them with a simple example. The current answer, "${shortAnswer.slice(0, 140)}${shortAnswer.length > 140 ? "..." : ""}", does not fully show how the concept works.`,
    correct_answer: `${topic} should be explained by defining the concept clearly, describing the important parts, and showing how those parts work together with an example.`,
    improved_answer: `${topic} is an important concept that can be understood by first learning its basic meaning, then identifying its main parts, and finally applying it to a simple example. A complete answer should be clear, logically ordered, and focused on why the concept matters.`,
    weak_areas: [
      "Basic definition",
      "Conceptual clarity",
      "Answer structure",
      "Use of examples"
    ],
    error_type: "Conceptual Error",
    difficulty_level: estimateDifficulty(answer),
    score: estimateScore(answer),
    improvement_tips: [
      "Start your answer with a one-line definition.",
      "Break the topic into two or three important points.",
      "Add one simple example to prove you understand it.",
      "Revise the answer once to remove vague or repeated lines."
    ],
    audio_script: `Your answer has a good starting point. [pause] But it needs more clarity and structure. [pause] First, define ${topic} in simple words. [pause] Then explain the key parts. [pause] Finally, add one example. [pause] This will make your answer stronger.`,
    next_step_topic: `${topic} Basics`
  };
}

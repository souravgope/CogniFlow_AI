/**
 * Generates high-quality fallback multiple-choice questions for the dynamic quiz feature.
 */
export function buildFallbackQuiz(targetRole, skillLevel) {
  const role = targetRole || "Software Developer";
  const level = skillLevel || "Beginner";
  
  return [
    {
      question: `What is the most critical starting practice for a ${level} ${role}?`,
      options: [
        "Memorizing all standard libraries by heart",
        "Building solid understanding of fundamental syntax and concepts",
        "Writing huge production applications without unit testing",
        "Copying code from other projects without understanding"
      ],
      answer: "Building solid understanding of fundamental syntax and concepts",
      explanation: "A strong grasp of the fundamentals is the foundation of senior-level engineering and problem-solving."
    },
    {
      question: `Which tool is the industry standard for code version control and collaborative coding?`,
      options: [
        "File Transfer Protocol (FTP)",
        "Git & GitHub",
        "Cloud Storage (Dropbox/Google Drive)",
        "Local USB backups"
      ],
      answer: "Git & GitHub",
      explanation: "Git is standard across almost all software teams worldwide, allowing robust version tracking, branching, and safe merges."
    },
    {
      question: `How should a production application handle unexpected runtime failures?`,
      options: [
        "Ignore the error and let the app freeze",
        "Expose raw database queries and server stacks to the client",
        "Gracefully catch exceptions and display a friendly fallback interface while logging details",
        "Terminate the entire server instantly without feedback"
      ],
      answer: "Gracefully catch exceptions and display a friendly fallback interface while logging details",
      explanation: "Graceful error boundaries improve reliability, protect security (by hiding system traces), and maintain user trust."
    },
    {
      question: `Which technique is highly recommended to improve the visual load speed of a modern web dashboard?`,
      options: [
        "Loading all assets and animations synchronously in the header",
        "Implementing lazy-loading, code-splitting, and asset minification",
        "Embedding huge uncompressed images directly in inline tags",
        "Disabling stylesheets completely"
      ],
      answer: "Implementing lazy-loading, code-splitting, and asset minification",
      explanation: "Lazy-loading and minification reduce the initial bundle weight, allowing the page to render instantly for users."
    },
    {
      question: `What is the purpose of practicing 'Test-Driven Development' (TDD)?`,
      options: [
        "Writing tests after shipping to production to satisfy metrics",
        "Writing a failing test first to define requirements, making it pass, and then refactoring",
        "Running random manual checks in the browser console",
        "Preventing the implementation of advanced features"
      ],
      answer: "Writing a failing test first to define requirements, making it pass, and then refactoring",
      explanation: "TDD uses the red-green-refactor loop to ensure code meets specifications, has high coverage, and remains easy to refactor safely."
    }
  ];
}

export function buildWebsiteChatFallbackResponse({ query }) {
  const cleanQuery = String(query || "").trim().toLowerCase();
  
  // 1. Diagram Generator
  if (
    cleanQuery.includes("diagram") ||
    cleanQuery.includes("whiteboard") ||
    cleanQuery.includes("draw") ||
    cleanQuery.includes("mermaid") ||
    cleanQuery.includes("flowchart") ||
    cleanQuery.includes("canvas") ||
    cleanQuery.includes("excalidraw")
  ) {
    return {
      response: `### AI Whiteboard & Diagram Generator
The **AI Whiteboard & Diagram Generator** transforms natural language prompts into structural visual models. 

**Key Capabilities:**
- **Mermaid rendering**: Automatically converts descriptions into flowcharts, sequence diagrams, ER diagrams, or class architectures.
- **Embedded Whiteboard**: Integrates an infinite Excalidraw canvas for manual annotations, drawing shapes, and adding free-form notes.
- **Exporting**: Supports instant downloads in high-quality PNG, SVG, or PDF formats.

To try it out, head over to the [Diagram Generator](/diagram)!`,
      suggestions: [
        "How do I write docs?",
        "Tell me about the Learning Path",
        "How does the Mistake Analyzer work?"
      ]
    };
  }

  // 2. Documentation Generator
  if (
    cleanQuery.includes("doc") ||
    cleanQuery.includes("write docs") ||
    cleanQuery.includes("documentation") ||
    cleanQuery.includes("api guide") ||
    cleanQuery.includes("code description")
  ) {
    return {
      response: `### AI Auto Documentation Generator
The **AI Auto Documentation Generator** automates writing technical READMEs, API setup guides, and code explanations.

**Key Capabilities:**
- **Code Scanning**: Paste raw snippets and the AI identifies variables, functions, and workflows.
- **Structured Markdown**: Outputs documentation complete with heading hierarchies, parameter tables, and formatted examples.
- **Edge-Case Highlighting**: Auto-detects potential errors or business logic warnings.

Start automating your docs by visiting the [Auto Docs Generator](/docs)!`,
      suggestions: [
        "Tell me about the Diagram Generator",
        "How to explain complex topics?",
        "Where to contact support?"
      ]
    };
  }

  // 3. Explanation Generator
  if (
    cleanQuery.includes("explain") ||
    cleanQuery.includes("audio") ||
    cleanQuery.includes("summarize") ||
    cleanQuery.includes("flashcard") ||
    cleanQuery.includes("voice") ||
    cleanQuery.includes("analogy") ||
    cleanQuery.includes("metaphor")
  ) {
    return {
      response: `### AI Explanation Generator
The **AI Explanation Generator** breaks down complex technical or academic topics into digestible multi-format components.

**Key Capabilities:**
- **Creative Analogies**: Compares abstract concepts (e.g. quantum states) to everyday things (e.g. rotating coins).
- **Study Flashcards & Slide Bullets**: Generates quick question-answer pairs and slide structures for presentations.
- **Voice Playback**: Auto-generates audio voiceover scripts read aloud via native Text-to-Speech (TTS).

Break down your first topic at the [AI Explanation Generator](/summarizer)!`,
      suggestions: [
        "Tell me about the Learning Path",
        "What is the Mistake Analyzer?",
        "Tell me about the Diagram Generator"
      ]
    };
  }

  // 4. Learning Path Generator
  if (
    cleanQuery.includes("roadmap") ||
    cleanQuery.includes("path") ||
    cleanQuery.includes("learn") ||
    cleanQuery.includes("milestone") ||
    cleanQuery.includes("curriculum") ||
    cleanQuery.includes("study")
  ) {
    return {
      response: `### AI Learning Path Generator
The **AI Learning Path Generator** is an automated curriculum designer that curates structured study plans for any skill.

**Key Capabilities:**
- **Dynamic Milestones**: Groups learning topics into daily or weekly milestones.
- **Prerequisite Check**: Arranges paths so you learn fundamental concepts first.
- **Resource Recommendations**: Suggests mini-projects to build, documentation links, and essential readings.
- **Progress Stepper**: Lets you check off milestones to track completion progress.

Build your curriculum at the [Learning Path Generator](/learning)!`,
      suggestions: [
        "What is the Mistake Analyzer?",
        "Tell me about the Diagram Generator",
        "How do I write docs?"
      ]
    };
  }

  // 5. Mistake Analyzer
  if (
    cleanQuery.includes("mistake") ||
    cleanQuery.includes("score") ||
    cleanQuery.includes("grade") ||
    cleanQuery.includes("error") ||
    cleanQuery.includes("debug") ||
    cleanQuery.includes("check code")
  ) {
    return {
      response: `### AI Mistake Analyzer
The **AI Mistake Analyzer** acts as a conceptual debugger to review your answers, essays, or code blocks.

**Key Capabilities:**
- **Objective Grading**: Assigns an accuracy score out of 100.
- **Error Checklist**: Identifies specific logic or syntax errors and creates a checklist so you can track your review.
- **Side-by-Side Diff**: Compares your attempt directly with a polished, corrected AI version.

Grade and improve your work at the [AI Mistake Analyzer](/mistake-analyzer)!`,
      suggestions: [
        "Tell me about the Diagram Generator",
        "How do I write docs?",
        "Tell me about the Learning Path"
      ]
    };
  }

  // 6. About Us
  if (
    cleanQuery.includes("about") ||
    cleanQuery.includes("mission") ||
    cleanQuery.includes("stack") ||
    cleanQuery.includes("technologies") ||
    cleanQuery.includes("team") ||
    cleanQuery.includes("who") ||
    cleanQuery.includes("website") ||
    cleanQuery.includes("cogniflow")
  ) {
    return {
      response: `### About CogniFlow AI
**CogniFlow AI** (originally the AI Whiteboard and Intelligent Academic Tool Suite) is a unified productivity hub built using the MERN stack.

Our mission is to bridge developer/academic imagination with highly optimized structured canvases and generation suites.

**Tech Architecture:**
- **Frontend**: React.js with Vite, Tailwind CSS, Framer Motion, and Excalidraw SDK.
- **Backend**: Node.js, Express.js API Gateway, Mongoose ODM.
- **Database**: MongoDB Atlas.
- **Security**: JWT token-based authentication and Google OAuth 2.0 gates.
- **AI Integrations**: Gemini API (for advanced prompt translation) with local fallback options.`,
      suggestions: [
        "Where can I contact support?",
        "Tell me about the Diagram Generator",
        "How to explain complex topics?"
      ]
    };
  }

  // 7. Contact Us / Support
  if (
    cleanQuery.includes("contact") ||
    cleanQuery.includes("email") ||
    cleanQuery.includes("support") ||
    cleanQuery.includes("help") ||
    cleanQuery.includes("address") ||
    cleanQuery.includes("phone") ||
    cleanQuery.includes("social")
  ) {
    return {
      response: `### Contact Gateway
For partnerships, support inquiries, or feedback regarding our AI models, you can connect with our support node:

- **Email**: [support@cogniflow.ai](mailto:support@cogniflow.ai)
- **Social Portals**: GitHub, Twitter, and LinkedIn links are available in our footer.
- **Contact Form**: You can also use the contact form at the bottom of our Home page!`,
      suggestions: [
        "Tell me about the Diagram Generator",
        "How to get started?",
        "What is the Mistake Analyzer?"
      ]
    };
  }

  // 8. Auth / Login / Signup
  if (
    cleanQuery.includes("login") ||
    cleanQuery.includes("signup") ||
    cleanQuery.includes("register") ||
    cleanQuery.includes("auth") ||
    cleanQuery.includes("signin") ||
    cleanQuery.includes("sign up") ||
    cleanQuery.includes("account")
  ) {
    return {
      response: `### Authentication Gates
To save your diagrams, documentation, study paths, and mistake history, you must be logged in.

- Access the [Login Page](/login) to sign back in.
- Access the [Signup Page](/signup) to create a new secure account.
- We support traditional credentials (email/password) as well as passwordless **Google Sign-In**!`,
      suggestions: [
        "Tell me about the Diagram Generator",
        "How to get started?",
        "What stack do you use?"
      ]
    };
  }

  // 9. Default Welcome Response
  return {
    response: `### Welcome to CogniFlow AI!
I am **CogniBot**, your navigation assistant. I can answer questions about the site, explain our tools, or help you find features.

**Here is what you can do on CogniFlow AI:**
1. **[Diagram Generator](/diagram)**: Generate Mermaid diagrams and sketch on Excalidraw.
2. **[Auto Docs](/docs)**: Write developer and API documentation from code.
3. **[Explanation Generator](/summarizer)**: Generate topic summaries, analogies, scripts, and TTS audio.
4. **[Learning Path](/learning)**: Build structured roadmaps with checkpoints.
5. **[Mistake Analyzer](/mistake-analyzer)**: Review and grade notes/code side-by-side.

*Ask me about any tool, navigate to a page, or speak your question via the microphone button!*`,
    suggestions: [
      "Tell me about the Diagram Generator",
      "How does the Mistake Analyzer work?",
      "What is the Learning Path?",
      "What stack do you use?"
    ]
  };
}

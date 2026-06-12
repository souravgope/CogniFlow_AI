import { generateDocumentation } from "../utils/docsAiClient.js";
import { buildFallbackDocs } from "../utils/docsFallback.js";

const textExtensions = new Set([
  ".c",
  ".cpp",
  ".cs",
  ".css",
  ".go",
  ".html",
  ".java",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".php",
  ".py",
  ".rb",
  ".sql",
  ".ts",
  ".tsx",
  ".txt",
  ".xml",
  ".yaml",
  ".yml"
]);

function getExtension(filename) {
  const index = filename.lastIndexOf(".");
  return index >= 0 ? filename.slice(index).toLowerCase() : "";
}

function isTextFile(file) {
  return file.mimetype.startsWith("text/") || textExtensions.has(getExtension(file.originalname));
}

function buildProjectContext({ projectName, description, files }) {
  const textFiles = [];
  const imageFiles = [];

  for (const file of files || []) {
    if (file.mimetype.startsWith("image/")) {
      imageFiles.push({
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        base64: file.buffer.toString("base64")
      });
      continue;
    }

    if (isTextFile(file)) {
      textFiles.push({
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        content: file.buffer.toString("utf8").slice(0, 25000)
      });
    }
  }

  return {
    projectName: projectName || "Untitled Project",
    description: description || "No description provided.",
    textFiles,
    imageFiles
  };
}

export async function generateDocs(req, res, next) {
  try {
    const projectName = String(req.body?.projectName || "").trim();
    const description = String(req.body?.description || "").trim();

    if (!projectName) {
      return res.status(400).json({ message: "Project name is required." });
    }

    const context = buildProjectContext({
      projectName,
      description,
      files: req.files || []
    });

    const provider = (process.env.AI_PROVIDER || "fallback").toLowerCase();
    let docs = buildFallbackDocs(context);
    let activeProvider = "fallback";
    let warning = "";

    if (provider !== "fallback") {
      try {
        docs = await generateDocumentation(context);
        activeProvider = provider;
      } catch (error) {
        warning = `${provider} failed: ${error.message}. Showing fallback documentation instead.`;
        console.warn(warning);
      }
    }

    res.json({
      ...docs,
      provider: activeProvider,
      warning
    });
  } catch (error) {
    next(error);
  }
}

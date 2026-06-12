import { generateWebsiteChatResponse } from "../utils/websiteChatAiClient.js";
import { buildWebsiteChatFallbackResponse } from "../utils/websiteChatFallback.js";

export async function askWebsiteChat(req, res, next) {
  try {
    const query = String(req.body?.query || "").trim();
    const isOnline = req.body?.isOnline !== false; // Default to true unless explicitly false
    const chatHistory = Array.isArray(req.body?.chatHistory || req.body?.chat_history)
      ? (req.body?.chatHistory || req.body?.chat_history)
      : [];

    if (!query) {
      return res.status(400).json({ message: "Query is required." });
    }

    const input = { query, isOnline, chatHistory };
    const provider = (process.env.AI_PROVIDER || "fallback").toLowerCase();

    // If Offline mode is requested, or if the provider is fallback, serve the local helper immediately.
    if (!isOnline || provider === "fallback") {
      return res.json(buildWebsiteChatFallbackResponse(input));
    }

    try {
      const response = await generateWebsiteChatResponse(input);
      return res.json(response);
    } catch (error) {
      console.error("Website AI assistant query failed:", error.message);
      return res.json(buildWebsiteChatFallbackResponse(input));
    }
  } catch (error) {
    next(error);
  }
}

import cors from "cors";
import express from "express";
import helmet from "helmet";
import diagramRoutes from "./api/diagramRoutes.js";
import docsRoutes from "./routes/docsRoutes.js";
import explanationRoutes from "./routes/explanationRoutes.js";
import learningRoutes from "./routes/learningRoutes.js";
import mistakeRoutes from "./routes/mistakeRoutes.js";
import assistantRoutes from "./routes/assistantRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import websiteChatRoutes from "./routes/websiteChatRoutes.js";
import { protect } from "./middleware/authMiddleware.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: (process.env.CLIENT_ORIGIN || "http://localhost:5173")
        .split(",")
        .map((o) => o.trim()),
      credentials: true
    })
  );
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  // Test endpoint to verify routes are loading
  app.get("/test-learning", (_req, res) => {
    res.json({ message: "Test endpoint working - routes are registered" });
  });

  // Debug: log all requests
  app.use((req, res, next) => {
    if (process.env.NODE_ENV !== "production") {
    console.log(`📨 ${req.method} ${req.path}`);
}
    next();
  });

  // Public authentication routes
  app.use("/api/auth", authRoutes);

  // Public website chat routes
  app.use("/", websiteChatRoutes);
  app.use("/api", websiteChatRoutes);

  // ── Public image-search endpoint (no auth required) ──────────────────────
  // Server-side fetch avoids all browser CORS issues. Free & unlimited.
  app.get("/api/image-search", async (req, res) => {
    const query = String(req.query.q || "").trim();
    if (!query) return res.status(400).json({ message: "Query is required." });

    const UA = "AI-Whiteboard/1.0 (educational-app; contact@localhost)";

    // Stage 1 – Wikipedia REST summary (fast direct lookup)
    try {
      const slug = query.replace(/\s+/g, "_");
      const resp = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(slug)}`,
        { headers: { "User-Agent": UA } }
      );
      if (resp.ok) {
        const d = await resp.json();
        if (d?.thumbnail?.source) {
          return res.json({
            url: d.thumbnail.source,
            title: d.title,
            sourceUrl: d.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${slug}`,
            source: "wikipedia"
          });
        }
      }
    } catch { /* fallthrough */ }

    // Stage 2 – Wikipedia Action API search (broader, finds related articles)
    try {
      const params = new URLSearchParams({
        action: "query", generator: "search",
        gsrsearch: query, gsrlimit: "8",
        prop: "pageimages|info", pithumbsize: "1200",
        inprop: "url", format: "json", origin: "*"
      });
      const resp = await fetch(`https://en.wikipedia.org/w/api.php?${params}`, { headers: { "User-Agent": UA } });
      if (resp.ok) {
        const d = await resp.json();
        const page = Object.values(d?.query?.pages || {}).find(p => p?.thumbnail?.source);
        if (page?.thumbnail?.source) {
          return res.json({
            url: page.thumbnail.source,
            title: page.title,
            sourceUrl: page.fullurl || `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
            source: "wikipedia"
          });
        }
      }
    } catch { /* fallthrough */ }

    // Stage 3 – Wikimedia Commons file search (millions of educational images)
    try {
      const params = new URLSearchParams({
        action: "query", generator: "search",
        gsrsearch: query, gsrnamespace: "6", gsrlimit: "15",
        prop: "imageinfo", iiprop: "url|size|mime", iiurlwidth: "1200",
        format: "json", origin: "*"
      });
      const resp = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, { headers: { "User-Agent": UA } });
      if (resp.ok) {
        const d = await resp.json();
        const files = Object.values(d?.query?.pages || {});
        const file =
          files.find(f => {
            const mime = f?.imageinfo?.[0]?.mime || "";
            return f?.imageinfo?.[0]?.thumburl &&
              (mime.includes("jpeg") || mime.includes("png") || mime.includes("svg"));
          }) || files.find(f => f?.imageinfo?.[0]?.thumburl);
        const imgUrl = file?.imageinfo?.[0]?.thumburl;
        if (imgUrl) {
          return res.json({
            url: imgUrl,
            title: query,
            sourceUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(file.title || "")}`,
            source: "wikimedia-commons"
          });
        }
      }
    } catch { /* fallthrough */ }

    return res.status(404).json({ message: "No image found for this topic." });
  });

  // Authenticate all subsequent workspace tool routes
  app.use((req, res, next) => {
    if (req.path === "/health" || req.path === "/test-learning") {
      return next();
    }
    protect(req, res, next);
  });


  app.use("/", diagramRoutes);
  app.use("/", docsRoutes);
  app.use("/", explanationRoutes);
  app.use("/", learningRoutes);
  app.use("/", mistakeRoutes);
  app.use("/", assistantRoutes);
  app.use("/api", diagramRoutes);
  app.use("/api", docsRoutes);
  app.use("/api", explanationRoutes);
  app.use("/api", learningRoutes);
  app.use("/api", mistakeRoutes);
  app.use("/api", assistantRoutes);

  app.use((err, _req, res, _next) => {
    console.error("❌ Error occurred:", err);
    res.status(err.status || 500).json({
      message: err.message || "Something went wrong while processing the request."
    });
  });

  return app;
}
